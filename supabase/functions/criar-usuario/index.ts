// supabase/functions/criar-usuario/index.ts

import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    // Só aceita POST
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Método não permitido." }), { status: 405 });
    }

    // Cliente com service_role para usar a Admin API
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verifica se quem está chamando é um admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado." }), { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Token inválido." }), { status: 401 });
    }

    const { data: callerProfile } = await supabase
      .from("usuario")
      .select("is_admin")
      .eq("id", caller.id)
      .single();

    if (!callerProfile?.is_admin) {
      return new Response(JSON.stringify({ error: "Apenas administradores podem criar usuários." }), { status: 403 });
    }

    // Parâmetros do body
    const { p_email, p_password, p_nome, p_is_admin, p_localizacao_id, p_cargos_ids, p_deve_trocar_senha } = await req.json();

    if (!p_email || !p_password || !p_nome) {
      return new Response(JSON.stringify({ error: "E-mail, senha e nome são obrigatórios." }), { status: 400 });
    }

    // Cria o usuário via Admin API (funciona corretamente, sem INSERT direto)
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: p_email,
      password: p_password,
      email_confirm: true,
      user_metadata: { nome: p_nome },
    });

    if (createError) {
      if (createError.message.includes("already been registered") || createError.code === "email_exists") {
        return new Response(JSON.stringify({ error: "O e-mail fornecido já está em uso." }), { status: 409 });
      }
      throw createError;
    }

    const userId = newUser.user.id;

    // Corrige campos que a Admin API deixa como NULL em algumas versões do Supabase,
    // causando erro "converting NULL to string is unsupported" no login.
    await supabase.rpc("fix_new_user_fields", { p_user_id: userId });

    // Cria o perfil em public.usuario
    const { error: profileError } = await supabase
      .from("usuario")
      .insert({
        id: userId,
        email: p_email,
        nome: p_nome,
        is_admin: p_is_admin ?? false,
        localizacao_id: p_localizacao_id ?? null,
        deve_trocar_senha: p_deve_trocar_senha ?? true,
      });

    if (profileError) {
      // Rollback: remove o usuário do auth se o perfil falhar
      await supabase.auth.admin.deleteUser(userId);
      throw profileError;
    }

    // Associa os cargos
    if (p_cargos_ids && p_cargos_ids.length > 0) {
      const { error: cargosError } = await supabase
        .from("usuario_cargos")
        .insert(p_cargos_ids.map((cargoId: string) => ({
          usuario_id: userId,
          cargo_id: cargoId,
        })));

      if (cargosError) {
        // Rollback completo
        await supabase.from("usuario").delete().eq("id", userId);
        await supabase.auth.admin.deleteUser(userId);
        throw cargosError;
      }
    }

    return new Response(JSON.stringify({ message: "Usuário criado com sucesso.", id: userId }), { status: 201 });

  } catch (error) {
    console.error("Erro na Edge Function criar-usuario:", error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
});
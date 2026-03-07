import { createClient } from "jsr:@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const agora = new Date();

    // Busca alertas pendentes cujo horário de envio já passou
    const { data: alertas, error: alertaError } = await supabase
      .from("evento_alerta")
      .select(`
        id,
        horas_antes,
        evento:evento_id (
          id,
          titulo,
          tipo,
          data_inicio,
          localizacao_id,
          cargos_visiveis
        )
      `)
      .eq("enviado", false);

    if (alertaError) throw alertaError;
    if (!alertas || alertas.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhum alerta pendente." }), { status: 200 });
    }

    let totalEnviados = 0;

    for (const alerta of alertas) {
      const evento = alerta.evento as any;
      if (!evento) continue;

      const dataEvento = new Date(evento.data_inicio);
      const horaEnvio = new Date(dataEvento.getTime() - alerta.horas_antes * 60 * 60 * 1000);

      // Só envia se já passou o horário de envio
      if (agora < horaEnvio) continue;

      // Busca todas as localizações filhas da localização do evento
      const localizacaoIds = await getLocalizacoesFilhas(supabase, evento.localizacao_id);

      // Busca tokens de usuários que têm cargo visível E pertencem à localização correta
      // 1. Busca usuários das localizações corretas
      const { data: usuarios } = await supabase
        .from("usuario")
        .select("id, nome, usuario_cargos(cargo_id)")
        .in("localizacao_id", localizacaoIds);

      if (!usuarios || usuarios.length === 0) continue;

      // 2. Filtra por cargo visível
      const cargosVisiveis: string[] = evento.cargos_visiveis ?? [];
      const usuariosFiltrados = usuarios.filter((u: any) => {
        const cargosUsuario = (u.usuario_cargos ?? []).map((c: any) => c.cargo_id);
        return cargosUsuario.some((c: string) => cargosVisiveis.includes(c));
      });

      if (usuariosFiltrados.length === 0) continue;

      const usuarioIds = usuariosFiltrados.map((u: any) => u.id);

      // 3. Busca tokens desses usuários
      const { data: tokens } = await supabase
        .from("usuario_tokens")
        .select("token, usuario_id, usuario:usuario_id(nome)")
        .in("usuario_id", usuarioIds);

      if (!tokens || tokens.length === 0) continue;

      const tokensFiltrados = (tokens ?? []).map((t: any) => ({
        token: t.token,
        nome: usuariosFiltrados.find((u: any) => u.id === t.usuario_id)?.nome ?? "Irmão(ã)",
      }));

      if (tokensFiltrados.length === 0) continue;

      // Envia push via Expo Push API
      const messages = tokensFiltrados.map(({ token, nome }: { token: string, nome: string }) => ({
        to: token,
        title: evento.titulo,
        body: `A Paz de Deus, irmão ${nome}! Passando para lembrar do nosso compromisso: ${evento.tipo} ${formatarData(dataEvento)}. Contamos com sua presença!`,
        data: { evento_id: evento.id },
      }));

      console.log("Enviando push para tokens:", tokensFiltrados.map((t: any) => t.token));

      const pushResponse = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messages),
      });

      const pushResult = await pushResponse.json();
      console.log("Resposta do Expo Push:", JSON.stringify(pushResult));

      // Marca alerta como enviado
      await supabase
        .from("evento_alerta")
        .update({ enviado: true, enviado_em: new Date().toISOString() })
        .eq("id", alerta.id);

      totalEnviados += tokensFiltrados.length;
    }

    return new Response(
      JSON.stringify({ message: `Alertas processados. ${totalEnviados} notificações enviadas.` }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro na Edge Function:", error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
});

// Retorna o ID da localização + todos os IDs filhos recursivamente
async function getLocalizacoesFilhas(supabase: any, localizacaoId: string | null): Promise<string[]> {
  if (!localizacaoId) return [];

  const ids: string[] = [localizacaoId];
  const fila = [localizacaoId];

  while (fila.length > 0) {
    const atual = fila.shift()!;
    const { data: filhos } = await supabase
      .from("localizacao")
      .select("id")
      .eq("parent_id", atual);

    for (const filho of filhos ?? []) {
      ids.push(filho.id);
      fila.push(filho.id);
    }
  }

  return ids;
}

function formatarData(data: Date): string {
  const hoje = new Date();
  const amanha = new Date();
  amanha.setDate(hoje.getDate() + 1);

  const mesmodia = (a: Date, b: Date) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  const hora = data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  if (mesmodia(data, hoje)) {
    return `hoje às ${hora}`;
  } else if (mesmodia(data, amanha)) {
    return `amanhã às ${hora}`;
  }

  return `em ${data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })} às ${data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}
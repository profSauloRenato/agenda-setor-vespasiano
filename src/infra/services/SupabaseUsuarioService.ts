// src/infra/services/SupabaseUsuarioService.ts

import { SupabaseClient } from "@supabase/supabase-js";
import { UserNotFoundError } from "../../domain/errors/DomainError";
import { ICargo } from "../../domain/models/ICargo";
import { IUsuario } from "../../domain/models/IUsuario";
import { IUsuarioService } from "../../domain/services/IUsuarioService";
import { CreateUsuarioParams } from "../../domain/use_cases/usuarios/CreateUsuario";

interface UsuarioCargoRow {
  usuario_id: string;
  cargo_id: string;
}

// ─── Utilitário exportado (usado também no UsuarioCreateModal) ────────────────
// Gera senha provisória: 4 primeiras letras do nome (sem acento) + ano atual
// Ex: "Saulo Renato" → "saul2026"
export function gerarSenhaProvisoria(nome: string): string {
  const ano = new Date().getFullYear();
  const prefixo = nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // remove acentos
    .replace(/[^a-zA-Z]/g, "")        // só letras
    .substring(0, 4)
    .toLowerCase();
  return `${prefixo}${ano}`;
}

export class SupabaseUsuarioService implements IUsuarioService {
  private readonly DB_TABLE = "usuario";
  private readonly JUNCTION_TABLE = "usuario_cargos";

  constructor(private supabase: SupabaseClient) {}

  async createUsuario(executor: IUsuario, data: CreateUsuarioParams): Promise<void> {
    console.log(`SupabaseUsuarioService: Criando usuário via Edge Function, executado por: ${executor.id}`);

    const { error } = await this.supabase.functions.invoke("criar-usuario", {
      body: {
        p_email: data.email,
        p_password: data.senha,
        p_nome: data.nome,
        p_is_admin: data.is_admin,
        p_localizacao_id: data.localizacao_id,
        p_cargos_ids: data.cargosIds,
        p_deve_trocar_senha: true,   // sempre provisória ao criar
      },
    });

    if (error) {
      console.error("SupabaseUsuarioService: Erro ao criar usuário:", error);
      const msg = (error as any)?.context?.json?.error ?? error.message;
      if (msg?.includes("já está em uso") || msg?.includes("email_exists")) {
        throw new Error("O e-mail fornecido já está em uso.");
      }
      throw new Error(`Falha ao criar o novo usuário: ${msg}`);
    }

    console.log(`Usuário ${data.email} criado com sucesso.`);
  }

  async getUsuarioLogado(userId: string): Promise<IUsuario> {
    const { data, error } = await this.supabase.rpc("get_user_profile");

    if (error) {
      console.error("SupabaseUsuarioService: Erro ao buscar perfil:", error);
      throw new Error(`Falha ao carregar perfil: ${error.message}`);
    }

    if (!data) {
      throw new UserNotFoundError("O perfil do usuário não foi encontrado no banco de dados.");
    }

    return {
      id: data.id,
      email: data.email,
      nome: data.nome,
      localizacao_id: data.localizacao_id,
      nome_localizacao: data.nome_localizacao ?? undefined,
      is_admin: data.is_admin ?? false,
      device_token: data.device_token ?? null,
      deve_trocar_senha: data.deve_trocar_senha ?? false,
      cargos: data.cargos ?? [],
    } as IUsuario;
  }

  async getUsuarios(): Promise<IUsuario[]> {
    const { data, error } = await this.supabase
      .from(this.DB_TABLE)
      .select(`
        id,
        nome,
        email,
        is_admin,
        localizacao_id,
        deve_trocar_senha,
        localizacao:localizacao_id(nome),
        cargos_link:${this.JUNCTION_TABLE}(
          cargo:cargo_id(id, nome, descricao)
        )
      `);

    if (error) {
      console.error("SupabaseUsuarioService: Erro ao listar usuários:", error);
      throw new Error(`Falha ao listar usuários. ${error.message}`);
    }

    return (data || []).map((rawUser: any) => ({
      id: rawUser.id,
      nome: rawUser.nome,
      email: rawUser.email,
      is_admin: rawUser.is_admin,
      localizacao_id: rawUser.localizacao_id,
      nome_localizacao: rawUser.localizacao?.nome || "Não definido",
      cargos: (rawUser.cargos_link || []).map((l: any) => l.cargo).filter(Boolean) as ICargo[],
      device_token: null,
      deve_trocar_senha: rawUser.deve_trocar_senha ?? false,
    } as IUsuario)).sort((a, b) => a.nome.localeCompare(b.nome));
  }

  async updateUsuarioBasico(usuario: IUsuario): Promise<IUsuario> {
    const { id, nome, localizacao_id, is_admin } = usuario;

    const { data, error } = await this.supabase
      .from(this.DB_TABLE)
      .update({ nome, localizacao_id, is_admin })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("SupabaseUsuarioService: Erro ao atualizar usuário:", error);
      throw new Error(`Falha ao atualizar dados do usuário. ${error.message}`);
    }

    return data as IUsuario;
  }

  // ─── Troca de senha pelo próprio usuário ─────────────────────────────────────
  // Usa supabase.auth.updateUser — só funciona para o usuário autenticado atual.
  async updateSenha(novaSenha: string): Promise<void> {
    const { error } = await this.supabase.auth.updateUser({ password: novaSenha });

    if (error) {
      console.error("SupabaseUsuarioService: Erro ao atualizar senha:", error);
      throw new Error(`Falha ao atualizar a senha: ${error.message}`);
    }
  }

  // Chamado após troca bem-sucedida: desliga o flag de senha provisória
  async marcarSenhaTrocada(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.DB_TABLE)
      .update({ deve_trocar_senha: false })
      .eq("id", userId);

    if (error) {
      throw new Error(`Falha ao atualizar status da senha: ${error.message}`);
    }
  }

  // ─── Reset de senha pelo admin ───────────────────────────────────────────────
  // Usa a RPC update_user_password (SECURITY DEFINER) pois o admin
  // está trocando a senha de outro usuário, não a própria.
  async adminResetSenha(userId: string, novaSenha: string): Promise<void> {
    const { error: senhaError } = await this.supabase.rpc("update_user_password", {
      p_user_id: userId,
      p_new_password: novaSenha,
    });

    if (senhaError) {
      throw new Error(`Falha ao redefinir a senha: ${senhaError.message}`);
    }

    const { error: flagError } = await this.supabase
      .from(this.DB_TABLE)
      .update({ deve_trocar_senha: true })
      .eq("id", userId);

    if (flagError) {
      throw new Error(`Senha redefinida, mas falha ao marcar troca obrigatória: ${flagError.message}`);
    }

    console.log(`Senha do usuário ${userId} redefinida pelo admin.`);
  }

  // ─── Cargos ──────────────────────────────────────────────────────────────────
  async updateCargos(userId: string, novosCargosIds: string[]): Promise<void> {
    const { error: deleteError } = await this.supabase
      .from(this.JUNCTION_TABLE)
      .delete()
      .eq("usuario_id", userId);

    if (deleteError) throw new Error("Falha ao limpar cargos antigos do usuário.");

    if (novosCargosIds.length > 0) {
      const rows: UsuarioCargoRow[] = novosCargosIds.map((cargoId) => ({
        usuario_id: userId,
        cargo_id: cargoId,
      }));

      const { error: insertError } = await this.supabase
        .from(this.JUNCTION_TABLE)
        .insert(rows);

      if (insertError) throw new Error("Falha ao atribuir novos cargos ao usuário.");
    }

    console.log(`Cargos do usuário ${userId} atualizados.`);
  }

  // ─── Exclusão ────────────────────────────────────────────────────────────────
  async deleteUsuario(executor: IUsuario, userId: string): Promise<void> {
    const { error } = await this.supabase.rpc("delete_user_complete", {
      p_user_id: userId,
    });

    if (error) {
      console.error("SupabaseUsuarioService: Erro ao deletar usuário:", error);
      throw new Error(`Falha ao remover o usuário: ${error.message}`);
    }

    console.log(`Usuário ${userId} deletado.`);
  }
}
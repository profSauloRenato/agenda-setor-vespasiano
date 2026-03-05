// src/infra/services/SupabaseMensagemAdminService.ts

import { SupabaseClient } from "@supabase/supabase-js";
import { IMensagemAdmin } from "../../domain/models/IMensagemAdmin";

export class SupabaseMensagemAdminService {
  constructor(private supabase: SupabaseClient) {}

  async getMensagensAtivas(
    cargosDoUsuario: string[],
  ): Promise<IMensagemAdmin[]> {
    const { data, error } = await this.supabase
      .from("mensagem_admin")
      .select("*")
      .eq("ativa", true)
      .order("criado_em", { ascending: false });

    if (error) throw error;

    const result = (data ?? []).filter((m) => {
      if (!m.cargos_visiveis || m.cargos_visiveis.length === 0) return true;
      return m.cargos_visiveis.some((c: string) => cargosDoUsuario.includes(c));
    });

    return result;

    // Filtra no cliente: mensagem sem cargos = todos veem
    // mensagem com cargos = apenas quem tem o cargo vê
    return (data ?? []).filter((m) => {
      if (!m.cargos_visiveis || m.cargos_visiveis.length === 0) return true;
      return m.cargos_visiveis.some((c: string) => cargosDoUsuario.includes(c));
    });
  }

  async getMensagens(): Promise<IMensagemAdmin[]> {
    const { data, error } = await this.supabase
      .from("mensagem_admin")
      .select("*")
      .order("criado_em", { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  async createMensagem(
    mensagem: Omit<IMensagemAdmin, "id" | "criado_em">,
    criadoPorId: string,
  ): Promise<IMensagemAdmin> {
    const { data, error } = await this.supabase
      .from("mensagem_admin")
      .insert({
        titulo: mensagem.titulo,
        texto: mensagem.texto,
        ativa: mensagem.ativa,
        criado_por: criadoPorId,
        localizacao_id: mensagem.localizacao_id,
        cargos_visiveis: mensagem.cargos_visiveis,
      })
      .select()
      .single();

    if (error) {
      // Se o erro for de RLS no select após insert, ignora e retorna objeto local
      if (
        error.code === "PGRST116" ||
        error.message.includes("row-level security")
      ) {
        return {
          id: "",
          titulo: mensagem.titulo,
          texto: mensagem.texto,
          ativa: mensagem.ativa,
          localizacao_id: mensagem.localizacao_id,
          cargos_visiveis: mensagem.cargos_visiveis,
          criado_por: criadoPorId,
          criado_em: new Date().toISOString(),
        };
      }
      throw error;
    }
    return data;
  }

  async updateMensagem(
    id: string,
    mensagem: Partial<IMensagemAdmin>,
  ): Promise<IMensagemAdmin> {
    const { error } = await this.supabase
      .from("mensagem_admin")
      .update({
        titulo: mensagem.titulo,
        texto: mensagem.texto,
        ativa: mensagem.ativa,
        localizacao_id: mensagem.localizacao_id,
        cargos_visiveis: mensagem.cargos_visiveis,
      })
      .eq("id", id);

    if (error) throw error;
    return { ...mensagem, id } as IMensagemAdmin;
  }

  async deleteMensagem(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("mensagem_admin")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }
}

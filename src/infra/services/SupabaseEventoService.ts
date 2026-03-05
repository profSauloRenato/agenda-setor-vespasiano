// src/infra/services/SupabaseEventoService.ts

import { SupabaseClient } from "@supabase/supabase-js";
import { IEvento } from "../../domain/models/IEvento";
import { IEventoService } from "../../domain/services/IEventoService";
import {
  CreateEventoParams,
  UpdateEventoParams,
} from "../../domain/use_cases/eventos/types";

export class SupabaseEventoService implements IEventoService {
  private readonly DB_TABLE = "evento";

  constructor(private readonly supabase: SupabaseClient) {}

  private mapToIEvento(row: any): IEvento {
    return {
      id: row.id,
      titulo: row.titulo,
      tipo: row.tipo,
      descricao: row.descricao ?? null,
      localizacao_id: row.localizacao_id ?? null,
      responsavel_id: row.responsavel_id ?? null,
      cargos_visiveis: row.cargos_visiveis ?? [],
      rsvp_habilitado: row.rsvp_habilitado ?? false,
      data_inicio: row.data_inicio,
      data_fim: row.data_fim ?? null,
      recorrente: row.recorrente ?? false,
      recorrencia_tipo: row.recorrencia_tipo ?? null,
      recorrencia_dia_semana: row.recorrencia_dia_semana ?? null,
      recorrencia_fim: row.recorrencia_fim ?? null,
      recorrencia_total: row.recorrencia_total ?? null,
      recorrencia_intervalo: row.recorrencia_intervalo ?? null,
      recorrencia_semana_do_mes: row.recorrencia_semana_do_mes ?? null,
      evento_referencia_id: row.evento_referencia_id ?? null,
      dias_antes_referencia: row.dias_antes_referencia ?? null,
      criado_por: row.criado_por ?? null,
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
      nome_localizacao: row.localizacao?.nome ?? null,
      nome_responsavel: row.responsavel?.nome ?? null,
      endereco_rua: row.localizacao?.endereco_rua ?? null,
      endereco_numero: row.localizacao?.endereco_numero ?? null,
      endereco_bairro: row.localizacao?.endereco_bairro ?? null,
      endereco_cidade: row.localizacao?.endereco_cidade ?? null,
      endereco_estado: row.localizacao?.endereco_estado ?? null,
      endereco_cep: row.localizacao?.endereco_cep ?? null,
      nomes_cargos: row.cargos_nomes ?? [],
    };
  }

  async getAllEventos(
    startDate?: string,
    endDate?: string,
  ): Promise<IEvento[]> {
    console.log("SupabaseEventoService: Buscando eventos.");

    let query = this.supabase
      .from(this.DB_TABLE)
      .select(
        `
        *,
        localizacao:localizacao_id (nome, endereco_rua, endereco_numero, endereco_bairro, endereco_cidade, endereco_estado, endereco_cep),
        responsavel:responsavel_id (nome)
      `,
      )
      .order("data_inicio", { ascending: true });

    if (startDate) {
      query = query.gte("data_inicio", startDate);
    }
    if (endDate) {
      query = query.lte("data_inicio", endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error("SupabaseEventoService: Erro ao buscar eventos:", error);
      throw new Error(`Falha ao buscar eventos: ${error.message}`);
    }

    return (data ?? []).map(this.mapToIEvento);
  }

  async getEventoById(id: string): Promise<IEvento> {
    const { data, error } = await this.supabase
      .from(this.DB_TABLE)
      .select(
        `
        *,
        localizacao:localizacao_id (nome, endereco_rua, endereco_numero, endereco_bairro, endereco_cidade, endereco_estado, endereco_cep),
        responsavel:responsavel_id (nome)
      `,
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("SupabaseEventoService: Erro ao buscar evento:", error);
      throw new Error(`Falha ao buscar evento: ${error.message}`);
    }

    return this.mapToIEvento(data);
  }

  async createEvento(
    data: CreateEventoParams,
    criadoPorId: string,
  ): Promise<IEvento> {
    console.log("SupabaseEventoService: Criando evento:", data.titulo);

    const { data: created, error } = await this.supabase
      .from(this.DB_TABLE)
      .insert({
        titulo: data.titulo,
        tipo: data.tipo,
        descricao: data.descricao,
        localizacao_id: data.localizacao_id,
        responsavel_id: data.responsavel_id,
        cargos_visiveis: data.cargos_visiveis,
        rsvp_habilitado: data.rsvp_habilitado,
        data_inicio: data.data_inicio,
        data_fim: data.data_fim,
        recorrente: data.recorrente,
        recorrencia_tipo: data.recorrencia_tipo,
        recorrencia_dia_semana: data.recorrencia_dia_semana,
        recorrencia_fim: data.recorrencia_fim,
        recorrencia_total: data.recorrencia_total,
        recorrencia_intervalo: data.recorrencia_intervalo,
        recorrencia_semana_do_mes: data.recorrencia_semana_do_mes,
        evento_referencia_id: data.evento_referencia_id,
        dias_antes_referencia: data.dias_antes_referencia,
        criado_por: criadoPorId,
      })
      .select(
        `
        *,
        localizacao:localizacao_id (nome, endereco_rua, endereco_numero, endereco_bairro, endereco_cidade, endereco_estado, endereco_cep),
        responsavel:responsavel_id (nome)
      `,
      )
      .single();

    if (error) {
      console.error("SupabaseEventoService: Erro ao criar evento:", error);
      throw new Error(`Falha ao criar evento: ${error.message}`);
    }

    return this.mapToIEvento(created);
  }

  async updateEvento(data: UpdateEventoParams): Promise<IEvento> {
    console.log("SupabaseEventoService: Atualizando evento:", data.id);

    const { data: updated, error } = await this.supabase
      .from(this.DB_TABLE)
      .update({
        titulo: data.titulo,
        tipo: data.tipo,
        descricao: data.descricao,
        localizacao_id: data.localizacao_id,
        responsavel_id: data.responsavel_id,
        cargos_visiveis: data.cargos_visiveis,
        rsvp_habilitado: data.rsvp_habilitado,
        data_inicio: data.data_inicio,
        data_fim: data.data_fim,
        recorrente: data.recorrente,
        recorrencia_tipo: data.recorrencia_tipo,
        recorrencia_dia_semana: data.recorrencia_dia_semana,
        recorrencia_fim: data.recorrencia_fim,
        recorrencia_total: data.recorrencia_total,
        recorrencia_intervalo: data.recorrencia_intervalo,
        recorrencia_semana_do_mes: data.recorrencia_semana_do_mes,
        evento_referencia_id: data.evento_referencia_id,
        dias_antes_referencia: data.dias_antes_referencia,
      })
      .eq("id", data.id)
      .select(
        `
        *,
        localizacao:localizacao_id (nome, endereco_rua, endereco_numero, endereco_bairro, endereco_cidade, endereco_estado, endereco_cep),
        responsavel:responsavel_id (nome)
      `,
      )
      .single();

    if (error) {
      console.error("SupabaseEventoService: Erro ao atualizar evento:", error);
      throw new Error(`Falha ao atualizar evento: ${error.message}`);
    }

    return this.mapToIEvento(updated);
  }

  async deleteEvento(id: string): Promise<void> {
    console.log("SupabaseEventoService: Deletando evento:", id);

    const { error } = await this.supabase
      .from(this.DB_TABLE)
      .delete()
      .eq("id", id);

    if (error) {
      console.error("SupabaseEventoService: Erro ao deletar evento:", error);
      throw new Error(`Falha ao deletar evento: ${error.message}`);
    }
  }
}

// src/infra/services/SupabaseEventoService.ts

import { SupabaseClient } from "@supabase/supabase-js";
import { IEvento, IEventoAlerta } from "../../domain/models/IEvento";
import { IEventoService } from "../../domain/services/IEventoService";
import {
  CreateEventoParams,
  UpdateEventoParams,
} from "../../domain/use_cases/eventos/types";

export class SupabaseEventoService implements IEventoService {
  private readonly DB_TABLE = "evento";
  private readonly ALERTA_TABLE = "evento_alerta";

  constructor(private readonly supabase: SupabaseClient) {}

  private mapToIEvento(row: any): IEvento {
    return {
      id: row.id,
      titulo: row.titulo,
      tipo: row.tipo,
      descricao: row.descricao ?? null,
      localizacao_id: row.localizacao_id ?? null,
      abrangencia_id: row.abrangencia_id ?? null,
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
      modelo_id: row.modelo_id ?? null,
      nome_modelo: row.evento_modelo?.nome ?? null,
      categoria_modelo: row.evento_modelo?.categoria ?? null,
      nome_localizacao: row.localizacao?.nome ?? null,
      nome_responsavel: row.responsavel?.nome ?? null,
      tipo_abrangencia: row.abrangencia?.tipo ?? null,
      nome_abrangencia: row.abrangencia?.nome ?? null,
      endereco_rua: row.localizacao?.endereco_rua ?? null,
      endereco_numero: row.localizacao?.endereco_numero ?? null,
      endereco_bairro: row.localizacao?.endereco_bairro ?? null,
      endereco_cidade: row.localizacao?.endereco_cidade ?? null,
      endereco_estado: row.localizacao?.endereco_estado ?? null,
      endereco_cep: row.localizacao?.endereco_cep ?? null,
      nomes_cargos: [], // preenchido por enriquecerNomesCargos
      alertas: (row.evento_alerta ?? []).map(
        (a: any): IEventoAlerta => ({
          id: a.id,
          evento_id: a.evento_id,
          horas_antes: a.horas_antes,
          enviado: a.enviado,
          enviado_em: a.enviado_em ?? null,
        }),
      ),
    };
  }

  private readonly SELECT_QUERY = `
    *,
    evento_modelo:modelo_id (id, nome, categoria),
    localizacao:localizacao_id (nome, endereco_rua, endereco_numero, endereco_bairro, endereco_cidade, endereco_estado, endereco_cep),
    abrangencia:abrangencia_id (tipo, nome),
    responsavel:responsavel_id (nome),
    evento_alerta (id, evento_id, horas_antes, enviado, enviado_em)
  `;

  private async enriquecerNomesCargos(eventos: IEvento[]): Promise<IEvento[]> {
    const todosIds = [...new Set(eventos.flatMap(e => e.cargos_visiveis))];
    if (todosIds.length === 0) return eventos;

    const { data: cargos } = await this.supabase
      .from("cargo")
      .select("id, nome")
      .in("id", todosIds);

    const mapaId: Record<string, string> = {};
    (cargos ?? []).forEach((c: any) => { mapaId[c.id] = c.nome; });

    return eventos.map(e => ({
      ...e,
      nomes_cargos: e.cargos_visiveis.map(id => mapaId[id]).filter(Boolean),
    }));
  }

  async getAllEventos(startDate?: string, endDate?: string): Promise<IEvento[]> {
    let query = this.supabase
      .from(this.DB_TABLE)
      .select(this.SELECT_QUERY)
      .order("data_inicio", { ascending: true });

    if (startDate) query = query.gte("data_inicio", startDate);
    if (endDate) query = query.lte("data_inicio", endDate);

    const { data, error } = await query;
    if (error) throw new Error(`Falha ao buscar eventos: ${error.message}`);

    const mapped = (data ?? []).map(this.mapToIEvento.bind(this));
    return this.enriquecerNomesCargos(mapped);
  }

  async getEventoById(id: string): Promise<IEvento> {
    const { data, error } = await this.supabase
      .from(this.DB_TABLE)
      .select(this.SELECT_QUERY)
      .eq("id", id)
      .single();

    if (error) throw new Error(`Falha ao buscar evento: ${error.message}`);
    const mapped = this.mapToIEvento(data);
    return (await this.enriquecerNomesCargos([mapped]))[0];
  }

  async buscarEventos(params: {
    dataInicio?: string;
    dataFim?: string;
    localizacaoId?: string;
    localizacaoIds?: string[];
    cargoIds?: string[];
    modeloIds?: string[];
    cargosVisiveis?: string[];
    categoriaModelo?: string;
  }): Promise<IEvento[]> {

    if (params.localizacaoId && params.cargoIds && params.cargoIds.length > 0) {
      const { data, error } = await this.supabase.rpc("get_eventos_para_usuario", {
        p_localizacao_id: params.localizacaoId,
        p_cargo_ids: params.cargoIds,
        p_data_inicio: params.dataInicio ?? new Date(0).toISOString(),
        p_data_fim: params.dataFim ?? new Date("2100-01-01").toISOString(),
      });

      if (error) throw new Error(`Falha ao buscar eventos: ${error.message}`);

      const ids = (data ?? []).map((e: any) => e.id);
      if (ids.length === 0) return [];

      const { data: detalhes, error: errDetalhes } = await this.supabase
        .from(this.DB_TABLE)
        .select(this.SELECT_QUERY)
        .in("id", ids)
        .order("data_inicio", { ascending: true });

      if (errDetalhes) throw new Error(`Falha ao buscar detalhes: ${errDetalhes.message}`);

      let eventos = (detalhes ?? []).map(this.mapToIEvento.bind(this));
      if (params.categoriaModelo) {
        eventos = eventos.filter((e) => e.categoria_modelo === params.categoriaModelo);
      }
      return this.enriquecerNomesCargos(eventos);
    }

    let query = this.supabase
      .from(this.DB_TABLE)
      .select(this.SELECT_QUERY)
      .order("data_inicio", { ascending: true });

    if (params.dataInicio) query = query.gte("data_inicio", params.dataInicio);
    if (params.dataFim) query = query.lte("data_inicio", params.dataFim);
    if (params.localizacaoIds && params.localizacaoIds.length > 0)
      query = query.in("localizacao_id", params.localizacaoIds);
    if (params.modeloIds && params.modeloIds.length > 0)
      query = query.in("modelo_id", params.modeloIds);
    if (params.cargosVisiveis && params.cargosVisiveis.length > 0)
      query = query.overlaps("cargos_visiveis", params.cargosVisiveis);

    const { data, error } = await query;
    if (error) throw new Error(`Falha ao buscar eventos: ${error.message}`);

    let eventos = (data ?? []).map(this.mapToIEvento.bind(this));
    if (params.categoriaModelo) {
      eventos = eventos.filter((e) => e.categoria_modelo === params.categoriaModelo);
    }
    return this.enriquecerNomesCargos(eventos);
  }

  async createEvento(data: CreateEventoParams, criadoPorId: string): Promise<IEvento> {
    const { data: created, error } = await this.supabase
      .from(this.DB_TABLE)
      .insert({
        titulo: data.titulo,
        tipo: data.tipo,
        descricao: data.descricao,
        localizacao_id: data.localizacao_id,
        abrangencia_id: data.abrangencia_id ?? null,
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
        modelo_id: data.modelo_id ?? null,
        criado_por: criadoPorId,
      })
      .select(this.SELECT_QUERY)
      .single();

    if (error) throw new Error(`Falha ao criar evento: ${error.message}`);

    if (data.alertas && data.alertas.length > 0) {
      await this.saveAlertas(created.id, data.alertas);
    }

    const mapped = this.mapToIEvento(created);
    return (await this.enriquecerNomesCargos([mapped]))[0];
  }

  async updateEvento(data: UpdateEventoParams): Promise<IEvento> {
    const { data: updated, error } = await this.supabase
      .from(this.DB_TABLE)
      .update({
        titulo: data.titulo,
        tipo: data.tipo,
        descricao: data.descricao,
        localizacao_id: data.localizacao_id,
        abrangencia_id: data.abrangencia_id ?? null,
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
        modelo_id: data.modelo_id ?? null,
      })
      .eq("id", data.id)
      .select(this.SELECT_QUERY)
      .single();

    if (error) throw new Error(`Falha ao atualizar evento: ${error.message}`);

    if (data.alertas !== undefined) {
      await this.supabase
        .from(this.ALERTA_TABLE)
        .delete()
        .eq("evento_id", data.id);

      if (data.alertas.length > 0) {
        await this.saveAlertas(data.id, data.alertas);
      }
    }

    const mapped = this.mapToIEvento(updated);
    return (await this.enriquecerNomesCargos([mapped]))[0];
  }

  async deleteEvento(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.DB_TABLE)
      .delete()
      .eq("id", id);

    if (error) throw new Error(`Falha ao deletar evento: ${error.message}`);
  }

  private async saveAlertas(eventoId: string, alertas: IEventoAlerta[]): Promise<void> {
    const rows = alertas.map((a) => ({
      evento_id: eventoId,
      horas_antes: a.horas_antes,
    }));

    const { error } = await this.supabase.from(this.ALERTA_TABLE).insert(rows);
    if (error) {
      console.error("Erro ao salvar alertas:", error);
    }
  }
}
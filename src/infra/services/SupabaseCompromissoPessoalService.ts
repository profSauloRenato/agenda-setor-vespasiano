import { SupabaseClient } from '@supabase/supabase-js';
import { ICompromissoPessoal, ICompromissoAlerta } from '../../domain/models/ICompromissoPessoal';
import { ICompromissoPessoalService } from '../../domain/services/ICompromissoPessoalService';
import { CreateCompromissoParams, UpdateCompromissoParams } from '../../domain/use_cases/compromissos/types';

export class SupabaseCompromissoPessoalService implements ICompromissoPessoalService {
  private readonly TABLE = 'compromisso_pessoal';
  private readonly ALERTA_TABLE = 'compromisso_alerta';

  constructor(private readonly supabase: SupabaseClient) {}

  private readonly SELECT_QUERY = `
    *,
    compromisso_alerta (id, compromisso_id, minutos_antes, enviado, enviado_em)
  `;

  private mapToModel(row: any): ICompromissoPessoal {
    return {
      id: row.id,
      usuario_id: row.usuario_id,
      titulo: row.titulo,
      descricao: row.descricao ?? null,
      data_inicio: row.data_inicio,
      data_fim: row.data_fim ?? null,
      recorrente: row.recorrente ?? false,
      recorrencia_tipo: row.recorrencia_tipo ?? null,
      recorrencia_fim: row.recorrencia_fim ?? null,
      recorrencia_semana_do_mes: row.recorrencia_semana_do_mes ?? null,
      recorrencia_dia_semana: row.recorrencia_dia_semana ?? null,
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
      alertas: (row.compromisso_alerta ?? []).map(
        (a: any): ICompromissoAlerta => ({
          id: a.id,
          compromisso_id: a.compromisso_id,
          horas_antes: a.minutos_antes / 60,
          enviado: a.enviado,
          enviado_em: a.enviado_em ?? null,
        }),
      ),
    };
  }

  async getAll(
    usuarioId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<ICompromissoPessoal[]> {
    let query = this.supabase
      .from(this.TABLE)
      .select(this.SELECT_QUERY)
      .eq('usuario_id', usuarioId)
      .order('data_inicio', { ascending: true });

    if (startDate) query = query.gte('data_inicio', startDate);
    if (endDate) query = query.lte('data_inicio', endDate);

    const { data, error } = await query;
    if (error) throw new Error(`Falha ao buscar compromissos: ${error.message}`);
    return (data ?? []).map(this.mapToModel.bind(this));
  }

  async getById(id: string): Promise<ICompromissoPessoal> {
    const { data, error } = await this.supabase
      .from(this.TABLE)
      .select(this.SELECT_QUERY)
      .eq('id', id)
      .single();

    if (error) throw new Error(`Falha ao buscar compromisso: ${error.message}`);
    return this.mapToModel(data);
  }

  async create(
    data: CreateCompromissoParams,
    usuarioId: string,
  ): Promise<ICompromissoPessoal> {
    const { data: created, error } = await this.supabase
      .from(this.TABLE)
      .insert({
        usuario_id: usuarioId,
        titulo: data.titulo,
        descricao: data.descricao ?? null,
        data_inicio: data.data_inicio,
        data_fim: data.data_fim ?? null,
        recorrente: data.recorrente,
        recorrencia_tipo: data.recorrencia_tipo ?? null,
        recorrencia_fim: data.recorrencia_fim ?? null,
        recorrencia_semana_do_mes: data.recorrencia_semana_do_mes ?? null,
        recorrencia_dia_semana: data.recorrencia_dia_semana ?? null,
      })
      .select(this.SELECT_QUERY)
      .single();

    if (error) throw new Error(`Falha ao criar compromisso: ${error.message}`);

    if (data.alertas && data.alertas.length > 0) {
      await this.saveAlertas(created.id, data.alertas);
    }

    return this.getById(created.id);
  }

  async update(data: UpdateCompromissoParams): Promise<ICompromissoPessoal> {
    const { error } = await this.supabase
      .from(this.TABLE)
      .update({
        titulo: data.titulo,
        descricao: data.descricao ?? null,
        data_inicio: data.data_inicio,
        data_fim: data.data_fim ?? null,
        recorrente: data.recorrente,
        recorrencia_tipo: data.recorrencia_tipo ?? null,
        recorrencia_fim: data.recorrencia_fim ?? null,
        recorrencia_semana_do_mes: data.recorrencia_semana_do_mes ?? null,
        recorrencia_dia_semana: data.recorrencia_dia_semana ?? null,
      })
      .eq('id', data.id);

    if (error) throw new Error(`Falha ao atualizar compromisso: ${error.message}`);

    await this.supabase
      .from(this.ALERTA_TABLE)
      .delete()
      .eq('compromisso_id', data.id);

    if (data.alertas && data.alertas.length > 0) {
      await this.saveAlertas(data.id, data.alertas);
    }

    return this.getById(data.id);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.TABLE)
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Falha ao deletar compromisso: ${error.message}`);
  }

  private async saveAlertas(
    compromissoId: string,
    alertas: Pick<ICompromissoAlerta, 'horas_antes'>[],
  ): Promise<void> {
    const rows = alertas.map((a) => ({
      compromisso_id: compromissoId,
      minutos_antes: Math.round(a.horas_antes * 60),
    }));

    const { error } = await this.supabase.from(this.ALERTA_TABLE).insert(rows);
    if (error) console.error('Erro ao salvar alertas do compromisso:', error);
  }
}
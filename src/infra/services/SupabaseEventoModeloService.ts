import { SupabaseClient } from '@supabase/supabase-js';
import { IEventoModelo } from '../../domain/models/IEventoModelo';
import {
  IEventoModeloService,
  CreateEventoModeloParams,
  UpdateEventoModeloParams,
} from '../../domain/services/IEventoModeloService';

export class SupabaseEventoModeloService implements IEventoModeloService {
  private readonly TABLE = 'evento_modelo';

  constructor(private readonly supabase: SupabaseClient) {}

  private mapToModel(row: any): IEventoModelo {
    return {
      id: row.id,
      nome: row.nome,
      categoria: row.categoria,
      ativo: row.ativo,
      criado_em: row.criado_em,
    };
  }

  async getAll(apenasAtivos = true): Promise<IEventoModelo[]> {
    let query = this.supabase
      .from(this.TABLE)
      .select('*')
      .order('categoria', { ascending: true })
      .order('nome', { ascending: true });

    if (apenasAtivos) query = query.eq('ativo', true);

    const { data, error } = await query;
    if (error) throw new Error(`Falha ao buscar modelos: ${error.message}`);
    return (data ?? []).map(this.mapToModel);
  }

  async create(data: CreateEventoModeloParams): Promise<IEventoModelo> {
    const { data: created, error } = await this.supabase
      .from(this.TABLE)
      .insert({
        nome: data.nome.trim(),
        categoria: data.categoria,
        ativo: true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new Error('Já existe um modelo com esse nome.');
      throw new Error(`Falha ao criar modelo: ${error.message}`);
    }
    return this.mapToModel(created);
  }

  async update(data: UpdateEventoModeloParams): Promise<IEventoModelo> {
    const { data: updated, error } = await this.supabase
      .from(this.TABLE)
      .update({
        nome: data.nome.trim(),
        categoria: data.categoria,
        ativo: data.ativo,
      })
      .eq('id', data.id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new Error('Já existe um modelo com esse nome.');
      throw new Error(`Falha ao atualizar modelo: ${error.message}`);
    }
    return this.mapToModel(updated);
  }

  async delete(id: string): Promise<void> {
    // Verifica se há eventos vinculados antes de deletar
    const { count, error: countError } = await this.supabase
      .from('evento')
      .select('id', { count: 'exact', head: true })
      .eq('modelo_id', id);

    if (countError) throw new Error(`Falha ao verificar vínculos: ${countError.message}`);

    if (count && count > 0) {
      throw new Error(
        `Não é possível excluir: existem ${count} evento(s) vinculado(s) a este modelo. Desative-o em vez de excluir.`
      );
    }

    const { error } = await this.supabase.from(this.TABLE).delete().eq('id', id);
    if (error) throw new Error(`Falha ao excluir modelo: ${error.message}`);
  }
}
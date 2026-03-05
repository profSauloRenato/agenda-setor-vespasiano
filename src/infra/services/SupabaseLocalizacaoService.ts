// src/infra/services/SupabaseLocalizacaoService.ts

import { SupabaseClient } from "@supabase/supabase-js";
import {
  ILocalizacao,
  LocalizacaoTipo,
} from "../../domain/models/ILocalizacao";
import { ILocalizacaoService } from "../../domain/services/ILocalizacaoService";

/**
 * Interface de dados brutos do Supabase (Row Level)
 */
interface LocalizacaoRow {
  // Todos os campos que mapeiam DIRETAMENTE para a tabela 'localizacao'
  nome: string;
  tipo: LocalizacaoTipo;
  parent_id: string | null;
  // 🎯 CAMPO NOVO: Incluído após alteração do schema do DB
  sede_congregacao_id: string | null;
  endereco_rua: string | null;
  endereco_numero: string | null;
  endereco_bairro: string | null;
  endereco_cidade: string | null;
  endereco_cep: string | null;
  endereco_estado: string | null;
}

/**
 * Implementação do serviço de dados para a entidade ILocalizacao usando o Supabase.
 */
export class SupabaseLocalizacaoService implements ILocalizacaoService {
  private readonly DB_TABLE = "localizacao";

  constructor(private supabase: SupabaseClient) {}

  // -----------------------------------------------------
  // ✅ getAllLocalizacoes (Mantido)
  // -----------------------------------------------------

  /**
   * Busca TODAS as localizações. O select('*') agora inclui 'sede_congregacao_id'.
   */
  async getAllLocalizacoes(): Promise<ILocalizacao[]> {
    console.log(
      "SupabaseLocalizacaoService: Buscando TODAS as localizações (Admin Use Case)."
    );

    const { data, error } = await this.supabase
      .from(this.DB_TABLE)
      .select("*")
      .order("nome", { ascending: true });

    if (error) {
      console.error(
        "SupabaseLocalizacaoService: Erro ao buscar todas localizações:",
        error
      );
      throw new Error(
        `Falha ao carregar todas as localizações: ${error.message}`
      );
    }

    return (data || []) as ILocalizacao[];
  }

  // -----------------------------------------------------
  // 🛠️ createLocalizacao (Ajustado)
  // -----------------------------------------------------

  /**
   * Cria uma nova localização no banco de dados.
   */
  async createLocalizacao(
    localizacaoData: Omit<
      ILocalizacao,
      "id" | "nome_pai" | "filhas" | "nome_completo" | "nome_congregacao_sede"
    >
  ): Promise<ILocalizacao> {
    console.log(
      "SupabaseLocalizacaoService: Criando localização:",
      localizacaoData.nome
    );

    // Mapeia TODOS os campos de banco de dados para inserção
    const dataToInsert: LocalizacaoRow = {
      nome: localizacaoData.nome,
      tipo: localizacaoData.tipo,
      parent_id: localizacaoData.parent_id || null,
      // 🎯 CAMPO NOVO: Mapeamento para o campo sede_congregacao_id
      sede_congregacao_id: localizacaoData.sede_congregacao_id || null,
      endereco_rua: localizacaoData.endereco_rua || null,
      endereco_numero: localizacaoData.endereco_numero || null,
      endereco_bairro: localizacaoData.endereco_bairro || null,
      endereco_cidade: localizacaoData.endereco_cidade || null,
      endereco_cep: localizacaoData.endereco_cep || null,
      endereco_estado: localizacaoData.endereco_estado || null,
    };

    const { data, error } = await this.supabase
      .from(this.DB_TABLE)
      .insert(dataToInsert)
      .select()
      .single();

    if (error) {
      console.error(
        "SupabaseLocalizacaoService: Erro ao criar localização:",
        error
      );
      throw new Error(`Falha ao criar localização. ${error.message}`);
    }
    return data as ILocalizacao;
  }

  // -----------------------------------------------------
  // 🛠️ updateLocalizacao (Ajustado)
  // -----------------------------------------------------

  /**
   * Atualiza uma localização existente.
   */
  async updateLocalizacao(localizacao: ILocalizacao): Promise<ILocalizacao> {
    console.log(
      "SupabaseLocalizacaoService: Atualizando localização ID:",
      localizacao.id
    );

    // Mapeia TODOS os campos que podem ser atualizados
    const dataToUpdate: LocalizacaoRow = {
      nome: localizacao.nome,
      tipo: localizacao.tipo,
      parent_id: localizacao.parent_id || null,
      // 🎯 CAMPO NOVO: Mapeamento para o campo sede_congregacao_id
      sede_congregacao_id: localizacao.sede_congregacao_id || null,
      endereco_rua: localizacao.endereco_rua || null,
      endereco_numero: localizacao.endereco_numero || null,
      endereco_bairro: localizacao.endereco_bairro || null,
      endereco_cidade: localizacao.endereco_cidade || null,
      endereco_cep: localizacao.endereco_cep || null,
      endereco_estado: localizacao.endereco_estado || null,
    };

    const { data, error } = await this.supabase
      .from(this.DB_TABLE)
      .update(dataToUpdate)
      .eq("id", localizacao.id)
      .select()
      .single();

    if (error) {
      console.error(
        "SupabaseLocalizacaoService: Erro ao atualizar localização:",
        error
      );
      throw new Error(`Falha ao atualizar localização. ${error.message}`);
    }
    return data as ILocalizacao;
  }

  // -----------------------------------------------------
  // ✅ deleteLocalizacao (Mantido)
  // -----------------------------------------------------

  /**
   * Deleta uma localização.
   */
  async deleteLocalizacao(id: string): Promise<void> {
    console.log(
      `SupabaseLocalizacaoService: Tentando deletar localização ID: ${id}`
    );

    const { error } = await this.supabase
      .from(this.DB_TABLE)
      .delete()
      .eq("id", id);

    if (error) {
      console.error(
        "SupabaseLocalizacaoService: Erro ao deletar localização:",
        error
      );

      // Tratamento específico para erro de Chave Estrangeira (localização em uso por usuário)
      if (error.code === "23503") {
        throw new Error(
          "Não é possível excluir a localização: ela ainda está atribuída a um ou mais usuários."
        );
      }

      throw new Error(`Falha ao remover a localização. ${error.message}`);
    }
  }
}

// src/infra/services/SupabaseCargoService.ts

import { SupabaseClient } from "@supabase/supabase-js";
import { ICargo } from "../../domain/models/ICargo";
// Assumindo que esta interface foi criada/atualizada
import { ICargoService } from "../../domain/services/ICargoService";

/**
 * Interface de dados brutos do Supabase para criação e atualização de cargo.
 * Assume que o ID é gerado no banco.
 */
interface CargoRow {
  id?: string;
  nome: string;
  descricao: string;
  pode_enviar_push: boolean;
}

/**
 * Implementação do serviço de dados para a entidade ICargo usando o Supabase.
 */
export class SupabaseCargoService implements ICargoService {
  private readonly DB_TABLE = "cargo";

  constructor(private supabase: SupabaseClient) {}

  // -----------------------------------------------------
  // 💡 MÉTODO FALTANTE: createCargo
  // -----------------------------------------------------

  /**
   * Cria um novo cargo no banco de dados.
   */
  async createCargo(cargoData: ICargo): Promise<ICargo> {
    console.log("SupabaseCargoService: Criando novo cargo:", cargoData.nome);

    // O Supabase gera o ID automaticamente
    const dataToInsert: CargoRow = {
      nome: cargoData.nome,
      descricao: cargoData.descricao ?? "",
      pode_enviar_push: cargoData.pode_enviar_push,
    };

    const { data, error } = await this.supabase
      .from(this.DB_TABLE)
      .insert(dataToInsert)
      .select() // Retorna a linha recém-criada (com o ID gerado)
      .single();

    if (error) {
      console.error("SupabaseCargoService: Erro ao criar cargo:", error);
      throw new Error(`Falha ao criar o cargo. ${error.message}`);
    }

    return data as ICargo;
  }

  // -----------------------------------------------------
  // 💡 MÉTODO FALTANTE: updateCargo
  // -----------------------------------------------------

  /**
   * Atualiza um cargo existente no banco de dados.
   */
  async updateCargo(cargo: ICargo): Promise<ICargo> {
    console.log("SupabaseCargoService: Atualizando cargo ID:", cargo.id);

    const dataToUpdate: CargoRow = {
      nome: cargo.nome,
      descricao: cargo.descricao ?? "",
      pode_enviar_push: cargo.pode_enviar_push,
    };

    const { data, error } = await this.supabase
      .from(this.DB_TABLE)
      .update(dataToUpdate)
      .eq("id", cargo.id)
      .select() // Retorna a linha atualizada
      .single();

    if (error) {
      console.error("SupabaseCargoService: Erro ao atualizar cargo:", error);
      throw new Error(`Falha ao atualizar o cargo. ${error.message}`);
    }

    return data as ICargo;
  }

  // -----------------------------------------------------
  // ✅ MÉTODO EXISTENTE: getAllCargos
  // -----------------------------------------------------

  /**
   * Busca todos os cargos na tabela 'cargo'.
   * @returns Promise<ICargo[]> - Lista de todos os cargos.
   */
  async getAllCargos(): Promise<ICargo[]> {
    console.log("SupabaseCargoService: Buscando todos os cargos.");

    const { data, error } = await this.supabase
      .from(this.DB_TABLE)
      .select(
        `
                id,
                nome,
                descricao,
                pode_enviar_push
            `,
      )
      .order("nome", { ascending: true });

    if (error) {
      console.error(
        "SupabaseCargoService: Erro ao buscar todos os cargos:",
        error,
      );
      throw new Error(
        `Falha no banco de dados ao listar cargos. ${error.message}`,
      );
    }

    return (data || []) as ICargo[];
  }

  // -----------------------------------------------------
  // ✅ MÉTODO EXISTENTE: deleteCargo
  // -----------------------------------------------------

  /**
   * Deleta um cargo do banco de dados.
   */
  async deleteCargo(id: string): Promise<void> {
    console.log(`SupabaseCargoService: Tentando deletar cargo ID: ${id}`);

    const { error } = await this.supabase
      .from(this.DB_TABLE)
      .delete()
      .eq("id", id);

    if (error) {
      console.error("SupabaseCargoService: Erro ao deletar cargo:", error);

      // Tratamento específico para erro de Chave Estrangeira (cargo em uso)
      if (error.code === "23503") {
        // PostgreSQL Foreign Key Violation
        throw new Error(
          "Não é possível excluir o cargo: ele ainda está atribuído a um ou mais usuários.",
        );
      }

      throw new Error(`Falha ao remover o cargo. ${error.message}`);
    }
  }
}

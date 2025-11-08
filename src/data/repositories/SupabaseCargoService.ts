// src/data/repositories/SupabaseCargoService.ts

import { supabase } from '../../config/supabaseClient';
import { ICargo } from '../../domain/models/ICargo';
import { ICargoService } from '../protocols/ICargoService';

// O nome da tabela no PostgreSQL
const CARGO_TABLE = 'cargo';

/**
 * Implementação concreta do ICargoService utilizando a API do Supabase.
 * Responsável por traduzir as chamadas do contrato para operações SQL via Supabase.
 */
export class SupabaseCargoService implements ICargoService {
  
  /**
   * Obtém todos os cargos do banco de dados.
   */
  async getAllCargos(): Promise<ICargo[]> {
    console.log("SupabaseCargoService: Buscando todos os cargos.");
    
    // A consulta usa a função .select('*') para mapear todos os campos para ICargo
    const { data, error } = await supabase
      .from(CARGO_TABLE)
      .select('*') 
      .order('nome', { ascending: true }); // Ordena pelo nome para UI

    if (error) {
      console.error("Erro ao buscar todos os cargos:", error);
      // Aqui, poderíamos lançar um erro de infraestrutura padronizado, mas por enquanto lançamos o genérico
      throw new Error(`Falha ao carregar cargos: ${error.message}`);
    }

    // O retorno do Supabase é um array de objetos que deve ser compatível com ICargo
    return data as ICargo[];
  }

  /**
   * Cria um novo cargo.
   */
  async createCargo(cargoData: Omit<ICargo, 'id'>): Promise<ICargo> {
    console.log("SupabaseCargoService: Criando novo cargo:", cargoData.nome);
    
    const { data, error } = await supabase
      .from(CARGO_TABLE)
      .insert(cargoData)
      .select() // Pede o retorno do objeto inserido, incluindo o ID gerado (UUID)
      .single(); // Espera um único objeto

    if (error) {
      console.error("Erro ao criar cargo:", error);
      
      // TRATAMENTO DE ERRO DE RESTRIÇÃO SQL (DUPLICIDADE)
      // Código '23505' é o código SQL para unique_violation (nome de cargo já existe)
      if (error.code === '23505') { 
          throw new Error("Já existe um cargo cadastrado com este nome.");
      }
      
      throw new Error(`Falha ao criar cargo: ${error.message}`);
    }
    
    // Retorna o objeto completo com o ID gerado
    return data as ICargo;
  }

  /**
   * Atualiza um cargo existente.
   */
  async updateCargo(cargo: ICargo): Promise<ICargo> {
    console.log("SupabaseCargoService: Atualizando cargo:", cargo.id);
    
    // Separa o ID das demais propriedades que serão atualizadas
    const { id, ...updates } = cargo;
    
    const { data, error } = await supabase
      .from(CARGO_TABLE)
      .update(updates) // Atualiza o corpo do objeto (sem o ID)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar cargo:", error);
      
      // TRATAMENTO DE ERRO DE RESTRIÇÃO SQL (DUPLICIDADE no update)
      if (error.code === '23505') { 
          throw new Error("Já existe outro cargo com este nome. O nome deve ser único.");
      }
      
      throw new Error(`Falha ao atualizar cargo: ${error.message}`);
    }
    
    // Confirma se o cargo foi realmente encontrado e atualizado
    if (!data) {
        throw new Error("Cargo não encontrado ou nenhuma alteração aplicada.");
    }

    return data as ICargo;
  }

  /**
   * Exclui um cargo.
   */
  async deleteCargo(id: string): Promise<void> {
    console.log("SupabaseCargoService: Excluindo cargo com ID:", id);
    
    const { error } = await supabase
      .from(CARGO_TABLE)
      .delete()
      .eq('id', id);

    if (error) {
      // TRATAMENTO DE ERRO DE RESTRIÇÃO SQL (FOREIGN KEY)
      // O código '23503' é o código SQL para foreign_key_violation
      if (error.code === '23503') { 
          throw new Error("Não é possível excluir: Este cargo está atualmente vinculado a um ou mais usuários.");
      }
      console.error("Erro ao excluir cargo:", error);
      throw new Error(`Falha ao excluir cargo: ${error.message}`);
    }
    
    // Não retorna nada (void)
  }
}
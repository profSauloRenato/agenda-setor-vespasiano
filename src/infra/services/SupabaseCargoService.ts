// src/infra/services/SupabaseCargoService.ts

import { SupabaseClient } from "@supabase/supabase-js";
import { ICargo } from "../../domain/models/ICargo";
import { ICargoService } from "../../domain/services/ICargoService";

interface CargoRow {
  id?: string;
  nome: string;
  descricao: string;
}

export class SupabaseCargoService implements ICargoService {
  private readonly DB_TABLE = "cargo";

  constructor(private supabase: SupabaseClient) {}

  async createCargo(cargoData: ICargo): Promise<ICargo> {
    const { data, error } = await this.supabase
      .from(this.DB_TABLE)
      .insert({ nome: cargoData.nome, descricao: cargoData.descricao ?? "" })
      .select()
      .single();

    if (error) throw new Error(`Falha ao criar o cargo. ${error.message}`);
    return data as ICargo;
  }

  async updateCargo(cargo: ICargo): Promise<ICargo> {
    const { data, error } = await this.supabase
      .from(this.DB_TABLE)
      .update({ nome: cargo.nome, descricao: cargo.descricao ?? "" })
      .eq("id", cargo.id)
      .select()
      .single();

    if (error) throw new Error(`Falha ao atualizar o cargo. ${error.message}`);
    return data as ICargo;
  }

  async getAllCargos(): Promise<ICargo[]> {
    const { data, error } = await this.supabase
      .from(this.DB_TABLE)
      .select("id, nome, descricao")
      .order("nome", { ascending: true });

    if (error) throw new Error(`Falha no banco de dados ao listar cargos. ${error.message}`);
    return (data || []) as ICargo[];
  }

  async deleteCargo(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.DB_TABLE)
      .delete()
      .eq("id", id);

    if (error) {
      if (error.code === "23503") {
        throw new Error("Não é possível excluir o cargo: ele ainda está atribuído a um ou mais usuários.");
      }
      throw new Error(`Falha ao remover o cargo. ${error.message}`);
    }
  }
}
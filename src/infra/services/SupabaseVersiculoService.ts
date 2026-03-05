// src/infra/services/SupabaseVersiculoService.ts

import { SupabaseClient } from "@supabase/supabase-js";
import { IVersiculo } from "../../domain/models/IVersiculo";

export class SupabaseVersiculoService {
  constructor(private supabase: SupabaseClient) {}

  async getVersiculoHoje(): Promise<IVersiculo | null> {
    const hoje = new Date().toISOString().split("T")[0];
    const { data, error } = await this.supabase
      .from("versiculo")
      .select("*")
      .eq("data", hoje)
      .maybeSingle();

    if (error) throw error;
    return data ?? null;
  }

  async createVersiculo(
    versiculo: Omit<IVersiculo, "id" | "criado_em">,
    criadoPorId: string,
  ): Promise<IVersiculo> {
    const { data, error } = await this.supabase
      .from("versiculo")
      .insert({
        texto: versiculo.texto,
        referencia: versiculo.referencia,
        data: versiculo.data,
        criado_por: criadoPorId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateVersiculo(
    id: string,
    versiculo: Partial<IVersiculo>,
  ): Promise<IVersiculo> {
    const { data, error } = await this.supabase
      .from("versiculo")
      .update({
        texto: versiculo.texto,
        referencia: versiculo.referencia,
        data: versiculo.data,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteVersiculo(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("versiculo")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }

  async getVersiculos(): Promise<IVersiculo[]> {
    const { data, error } = await this.supabase
      .from("versiculo")
      .select("*")
      .order("data", { ascending: false });

    if (error) throw error;
    return data ?? [];
  }
}

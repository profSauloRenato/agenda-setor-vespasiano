// src/infra/services/SupabaseVersiculoService.ts

import { SupabaseClient } from "@supabase/supabase-js";
import { IVersiculo } from "../../domain/models/IVersiculo";

export class SupabaseVersiculoService {
  constructor(private supabase: SupabaseClient) {}

  async getVersiculoHoje(): Promise<IVersiculo | null> {
    const agora = new Date();
    const hoje = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}-${String(agora.getDate()).padStart(2, "0")}`;
    
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

    if (error) {
      console.log("SERVICE ERROR CODE:", error.code, typeof error);
      if (error.code === "23505") {
        const msg = "Já existe um versículo cadastrado para esta data. Cada dia pode ter apenas um versículo.";
        console.log("THROWING:", msg);
        throw new Error(msg);
      }
      throw new Error(error.message);
    }
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

    if (error) {
      if (error.code === "23505") {
        throw new Error("Já existe um versículo cadastrado para esta data. Cada dia pode ter apenas um versículo.");
      }
      throw new Error(error.message);
    }
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

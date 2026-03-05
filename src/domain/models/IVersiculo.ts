// src/domain/models/IVersiculo.ts

export interface IVersiculo {
  id: string;
  texto: string;
  referencia: string;
  data: string; // ISO date YYYY-MM-DD
  criado_por: string | null;
  criado_em: string;
}

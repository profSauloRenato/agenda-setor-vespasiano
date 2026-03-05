// src/domain/models/IUsuario.ts

import { ICargo } from "./ICargo";

export interface IUsuario {
  // Dados diretos da tabela 'usuario'
  id: string;
  email: string;
  nome: string;
  localizacao_id: string | null;
  is_admin: boolean;
  pode_cadastrar_eventos: boolean;
  device_token?: string | null;

  // Dados estendidos (vindos de joins/funções)
  cargos: ICargo[];
  nome_localizacao?: string;

  // Token de sessão (usado na camada de infra)
  access_token?: string;
}

// src/data/protocols/IAuthService.ts

import { IUsuario } from "../../domain/models/IUsuario"; // Importa o modelo de usuário que criamos

// Define o contrato de serviço para todas as funcionalidades de Autenticação.
// A camada de 'domain' (Use Cases) usará APENAS este contrato.
export interface IAuthService {
  /**
   * Realiza o login de um usuário com e-mail e senha.
   * @param email - O e-mail do usuário.
   * @param password - A senha do usuário.
   * @returns Uma promessa que resolve para o objeto IUsuario logado ou null em caso de falha.
   */
  login(email: string, password: string): Promise<IUsuario | null>;

  /**
   * Registra um novo usuário (cria uma conta).
   * @param nome - O nome completo do usuário.
   * @param email - O e-mail para registro.
   * @param password - A senha.
   * @returns Uma promessa que resolve para o IUsuario criado.
   */
  register(nome: string, email: string, password: string): Promise<IUsuario>;

  /**
   * Carrega a sessão do usuário atualmente logado.
   * @returns Uma promessa que resolve para o IUsuario logado ou null.
   */
  getLoggedUser(): Promise<IUsuario | null>;

  /**
   * Encerra a sessão atual (logout).
   * @returns Uma promessa vazia.
   */
  logout(): Promise<void>;
}
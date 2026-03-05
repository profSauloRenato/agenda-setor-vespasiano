// src/domain/services/IUsuarioService.ts

import { IUsuario } from "../models/IUsuario";
import { CreateUsuarioParams } from "../use_cases/usuarios/CreateUsuario";

export interface IUsuarioService {
  /**
   * Busca o perfil completo do usuário atualmente autenticado,
   * incluindo seus cargos. Usado no login e na verificação de sessão.
   */
  getUsuarioLogado(userId: string): Promise<IUsuario>;

  /**
   * Persiste um novo usuário na fonte de dados.
   * @param executor O usuário logado (Admin) que executa a criação.
   * @param data Os dados do novo usuário (nome, email, senha, cargosIds, etc.).
   */
  createUsuario(executor: IUsuario, data: CreateUsuarioParams): Promise<void>;

  /**
   * Busca a lista completa de usuários do sistema,
   * incluindo seus cargos e localização.
   */
  getUsuarios(): Promise<IUsuario[]>;

  /**
   * Atualiza os dados básicos de um usuário (nome, localizacao, is_admin,
   * pode_cadastrar_eventos).
   */
  updateUsuarioBasico(usuario: IUsuario): Promise<IUsuario>;

  /**
   * Substitui todos os cargos de um usuário pelos novos informados.
   * @param userId - O ID do usuário.
   * @param novosCargosIds - Array com os IDs dos novos cargos.
   */
  updateCargos(userId: string, novosCargosIds: string[]): Promise<void>;

  /**
   * Deleta um usuário do sistema.
   * @param executor - O admin que está executando a operação.
   * @param userId - O ID do usuário a ser excluído.
   */
  deleteUsuario(executor: IUsuario, userId: string): Promise<void>;
}

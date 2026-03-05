// src/domain/use_cases/usuarios/CreateUsuario.ts

import { IUsuario } from "../../models/IUsuario";
import { IUsuarioService } from "../../services/IUsuarioService";

/**
 * Define o formato dos dados de entrada para a criação de um usuário.
 */
export type CreateUsuarioParams = {
  nome: string;
  email: string;
  senha: string; // Senha é obrigatória na criação
  localizacao_id: string | null;
  is_admin: boolean;
  cargosIds: string[]; // Lista de IDs de cargos
};

/**
 * Interface que define o contrato do Use Case para criar um novo usuário.
 */
export interface ICreateUsuario {
  /**
   * Cria um novo registro de usuário no sistema.
   * @param executor O usuário que está executando a ação (deve ser um Admin).
   * @param data Os dados necessários para a criação do novo usuário, incluindo senha e cargos.
   * @returns Uma Promise vazia (void) se a operação for bem-sucedida.
   */
  execute(executor: IUsuario, data: CreateUsuarioParams): Promise<void>;
}

/**
 * Use Case para criar um novo usuário no sistema.
 * REGRA DE NEGÓCIO: Somente administradores podem executar esta operação.
 */
export class CreateUsuario implements ICreateUsuario {
  // O Use Case depende da Interface do Serviço (IUsuarioService)
  constructor(private readonly usuarioService: IUsuarioService) {}

  async execute(executor: IUsuario, data: CreateUsuarioParams): Promise<void> {
    // 1. REGRA DE NEGÓCIO: Verificação de Segurança
    if (!executor.is_admin) {
      throw new Error(
        "Acesso negado. Apenas administradores podem criar novos usuários."
      );
    }

    // 2. VALIDAÇÕES BÁSICAS
    if (!data.nome || !data.email || !data.senha) {
      throw new Error("Nome, e-mail e senha são obrigatórios.");
    }

    // 3. DELEGAÇÃO PARA O SERVIÇO DE DADOS
    try {
      await this.usuarioService.createUsuario(executor, {
        nome: data.nome,
        email: data.email,
        senha: data.senha,
        is_admin: data.is_admin,
        localizacao_id: data.localizacao_id,
        cargosIds: data.cargosIds,
      });
    } catch (error) {
      console.error("Erro no Use Case CreateUsuario:", error);
      // Re-lança o erro com uma mensagem amigável (ou passa a mensagem do serviço)
      throw new Error(
        "Falha ao criar o novo usuário. Verifique se o e-mail já está cadastrado."
      );
    }
  }
}

// src/domain/use_cases/usuarios/DeleteUsuario.ts

import { IUsuario } from "../../models/IUsuario";
import { IUsuarioService } from "../../services/IUsuarioService";
// Importa o erro de domínio para a verificação de Admin
import { UserNotAuthorizedError } from "../../errors/DomainError";

/**
 * Interface que define o contrato do Use Case para excluir um usuário.
 */
export interface IDeleteUsuario {
  /**
   * Executa a exclusão de um usuário.
   * @param currentUser O usuário logado que está executando a operação (para verificação de permissão).
   * @param id O UUID do usuário a ser excluído.
   * @returns Uma Promise vazia após a exclusão bem-sucedida.
   */
  execute(currentUser: IUsuario, id: string): Promise<void>;
}

/**
 * Use Case para excluir um usuário do sistema.
 * REGRA DE NEGÓCIO: Somente usuários com status de administrador podem executar esta operação.
 * REGRA DE NEGÓCIO: Um usuário não pode excluir a si próprio.
 */
export class DeleteUsuario implements IDeleteUsuario {
  constructor(private readonly usuarioService: IUsuarioService) {}

  /**
   * @param executor O usuário com permissão de administrador que executa a ação.
   * @param userId O ID do usuário a ser deletado.
   */
  async execute(executor: IUsuario, userId: string): Promise<void> {
    // 1. REGRA DE NEGÓCIO: Verificação de Segurança (RBAC Core)
    if (!executor.is_admin) {
      // Usa o erro de domínio específico
      throw new UserNotAuthorizedError(
        "Você não tem permissão para excluir usuários."
      );
    }

    // 2. REGRA DE NEGÓCIO: Auto-Exclusão
    if (executor.id === userId) {
      throw new Error(
        "Você não pode excluir sua própria conta através desta interface de administrador."
      );
    }

    // 3. Validação de Entrada
    if (!userId) {
      throw new Error("ID do usuário é obrigatório para a exclusão.");
    }

    try {
      // 4. Chama a camada de dados para realizar a exclusão.
      // Mantendo a passagem do executor, pois o serviço pode precisar dele.
      await this.usuarioService.deleteUsuario(executor, userId);
    } catch (error) {
      console.error("Erro no Use Case DeleteUsuario:", error);
      // O erro é re-lançado para ser tratado na camada de apresentação.
      throw error;
    }
  }
}

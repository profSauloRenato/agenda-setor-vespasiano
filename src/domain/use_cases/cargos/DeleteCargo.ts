// src/domain/use_cases/cargos/DeleteCargo.ts

import { ICargoService } from '../../../data/protocols/ICargoService';
import { UserNotAuthorizedError } from '../../errors/DomainError';
import { IUsuario } from '../../models/IUsuario';

/**
 * Interface que define o contrato do Use Case para excluir um cargo.
 */
export interface IDeleteCargo {
  /**
   * Executa a exclusão do cargo.
   * @param currentUser O usuário logado que está executando a operação (para verificação de permissão).
   * @param id O UUID do cargo a ser excluído.
   * @returns Uma Promise vazia após a exclusão bem-sucedida.
   */
  execute(currentUser: IUsuario, id: string): Promise<void>;
}

/**
 * Use Case para excluir um cargo do sistema.
 * REGRA DE NEGÓCIO: Somente usuários com status de administrador podem executar esta operação.
 * REGRA DE NEGÓCIO: O serviço de dados deve tratar a falha de chave estrangeira (cargo em uso)
 * e lançar um erro informativo.
 */
export class DeleteCargo implements IDeleteCargo {
  
  constructor(private readonly cargoService: ICargoService) {}

  async execute(currentUser: IUsuario, id: string): Promise<void> {
    
    // 1. REGRA DE NEGÓCIO: Verificação de Segurança (RBAC Core)
    if (!currentUser.is_admin) {
      throw new UserNotAuthorizedError("Você não tem permissão para excluir cargos.");
    }
    
    // 2. Validação de Entrada
    if (!id) {
        throw new Error("ID do cargo é obrigatório para a exclusão.");
    }

    try {
      // 3. Chama a camada de dados para realizar a exclusão.
      // O SupabaseCargoService já trata a exceção de Chave Estrangeira (cargo vinculado a usuário).
      await this.cargoService.deleteCargo(id);

    } catch (error) {
      console.error("Erro no Use Case DeleteCargo:", error);
      // O erro é re-lançado para ser tratado na camada de apresentação.
      throw error;
    }
  }
}
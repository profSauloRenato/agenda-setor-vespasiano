// src/domain/use_cases/cargos/CreateCargo.ts

import { ICargoService } from '../../../data/protocols/ICargoService';
import { UserNotAuthorizedError } from '../../errors/DomainError';
import { ICargo } from '../../models/ICargo';
import { IUsuario } from '../../models/IUsuario';

/**
 * Define o formato dos dados de entrada para a criação de um cargo.
 * Exclui o ID, que é gerado pelo banco de dados.
 */
export type CreateCargoParams = Omit<ICargo, 'id'>;

/**
 * Interface que define o contrato do Use Case para criar um novo cargo.
 */
export interface ICreateCargo {
  execute(currentUser: IUsuario, cargoData: CreateCargoParams): Promise<ICargo>;
}

/**
 * Use Case para criar um novo cargo no sistema.
 * REGRA DE NEGÓCIO: Somente usuários com status de administrador podem executar esta operação.
 */
export class CreateCargo implements ICreateCargo {
  
  constructor(private readonly cargoService: ICargoService) {}

  async execute(currentUser: IUsuario, cargoData: CreateCargoParams): Promise<ICargo> {
    
    // 1. REGRA DE NEGÓCIO: Verificação de Segurança (RBAC Core)
    if (!currentUser.is_admin) {
      throw new UserNotAuthorizedError("Você não tem permissão para criar novos cargos.");
    }
    
    // TODO: Adicionar Regra de Negócio: O nome do cargo não pode ser duplicado (unique check)
    // TODO: Adicionar Regra de Negócio: O nome do cargo não pode ser vazio.

    try {
      // 2. Chama a camada de dados para criar o cargo.
      const novoCargo = await this.cargoService.createCargo(cargoData);

      // 3. Retorna o objeto criado (com o ID).
      return novoCargo;
    } catch (error) {
      console.error("Erro no Use Case CreateCargo:", error);
      throw error;
    }
  }
}
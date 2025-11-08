// src/domain/use_cases/cargos/UpdateCargo.ts

import { ICargoService } from '../../../data/protocols/ICargoService';
import { UserNotAuthorizedError } from '../../errors/DomainError';
import { ICargo } from '../../models/ICargo';
import { IUsuario } from '../../models/IUsuario';

/**
 * Interface que define o contrato do Use Case para atualizar um cargo existente.
 */
export interface IUpdateCargo {
  /**
   * Executa a atualização do cargo.
   * @param currentUser O usuário logado que está executando a operação (para verificação de permissão).
   * @param cargoData O objeto ICargo completo com as novas informações, incluindo o ID.
   * @returns O cargo atualizado.
   */
  execute(currentUser: IUsuario, cargoData: ICargo): Promise<ICargo>;
}

/**
 * Use Case para atualizar um cargo no sistema.
 * REGRA DE NEGÓCIO: Somente usuários com status de administrador podem executar esta operação.
 */
export class UpdateCargo implements IUpdateCargo {
  
  constructor(private readonly cargoService: ICargoService) {}

  async execute(currentUser: IUsuario, cargoData: ICargo): Promise<ICargo> {
    
    // 1. REGRA DE NEGÓCIO: Verificação de Segurança (RBAC Core)
    if (!currentUser.is_admin) {
      throw new UserNotAuthorizedError("Você não tem permissão para atualizar cargos.");
    }
    
    // TODO: Adicionar Regra de Negócio: O nome do cargo não pode ser duplicado.
    // (A lógica de dados já lança um erro, que deve ser mapeado para um DomainError amigável)

    // TODO: Adicionar Validação de Entrada: Garantir que o ID e o nome não estejam vazios.
    if (!cargoData.id) {
        throw new Error("ID do cargo é obrigatório para a atualização.");
    }

    try {
      // 2. Chama a camada de dados para realizar a atualização.
      const cargoAtualizado = await this.cargoService.updateCargo(cargoData);

      // 3. Retorna o objeto atualizado.
      return cargoAtualizado;
    } catch (error) {
      console.error("Erro no Use Case UpdateCargo:", error);
      // O Use Case de dados já deve ter tratado erros comuns (duplicidade, not found)
      throw error;
    }
  }
}
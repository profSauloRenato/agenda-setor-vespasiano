// src/domain/use_cases/cargos/GetCargos.ts

import { ICargoService } from '../../../data/protocols/ICargoService';
import { UserNotAuthorizedError } from '../../errors/DomainError';
import { ICargo } from '../../models/ICargo';
import { IUsuario } from '../../models/IUsuario';

/**
 * Interface que define o contrato do Use Case para obter a lista de cargos.
 */
export interface IGetCargos {
  execute(currentUser: IUsuario): Promise<ICargo[]>;
}

/**
 * Use Case para buscar todos os cargos no sistema.
 * REGRA DE NEGÓCIO: Somente usuários com status de administrador podem executar esta operação.
 */
export class GetCargos implements IGetCargos {
  
  // O Use Case recebe o protocolo (interface) do serviço de dados (Inversão de Dependência)
  constructor(private readonly cargoService: ICargoService) {}

  async execute(currentUser: IUsuario): Promise<ICargo[]> {
    
    // 1. REGRA DE NEGÓCIO: Verificação de Segurança (RBAC Core)
    if (!currentUser.is_admin) {
      // Lançamos um erro de domínio específico para falta de autorização
      throw new UserNotAuthorizedError("Você não tem permissão para visualizar a lista de cargos.");
    }

    try {
      // 2. Chama a camada de dados
      const cargos = await this.cargoService.getAllCargos();

      // 3. Retorna os dados
      return cargos;
    } catch (error) {
      // Propaga o erro (seja ele de infraestrutura ou de domínio)
      console.error("Erro no Use Case GetCargos:", error);
      throw error;
    }
  }
}
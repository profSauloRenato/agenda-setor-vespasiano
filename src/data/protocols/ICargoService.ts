// src/data/protocols/ICargoService.ts

import { ICargo } from '../../domain/models/ICargo';

/**
 * Interface que define o contrato de um Serviço de Dados para a entidade Cargo.
 * Esta interface é o que a camada de Domínio irá conhecer, garantindo a Inversão de Dependência (DIP).
 */
export interface ICargoService {
  /**
   * Obtém a lista completa de todos os cargos cadastrados no sistema.
   * @returns Uma Promise que resolve para um array de objetos ICargo.
   */
  getAllCargos(): Promise<ICargo[]>;

  /**
   * Cria um novo cargo no banco de dados.
   * @param cargoData - Dados do novo cargo (sem o ID, que é gerado).
   * @returns Uma Promise que resolve para o ICargo criado com o ID.
   */
  createCargo(cargoData: Omit<ICargo, 'id'>): Promise<ICargo>;

  /**
   * Atualiza as informações de um cargo existente.
   * @param cargo - O objeto ICargo completo a ser atualizado.
   * @returns Uma Promise que resolve para o ICargo atualizado.
   */
  updateCargo(cargo: ICargo): Promise<ICargo>;

  /**
   * Exclui um cargo do banco de dados pelo seu ID.
   * @param id - O UUID do cargo a ser excluído.
   * @returns Uma Promise que resolve para void (sucesso na exclusão).
   */
  deleteCargo(id: string): Promise<void>;
}
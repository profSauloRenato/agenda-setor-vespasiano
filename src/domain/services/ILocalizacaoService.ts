// src/domain/services/ILocalizacaoService.ts

import { ILocalizacao } from "../models/ILocalizacao";

/**
 * Interface que define o contrato de um Serviço de Dados para a entidade Localização.
 * Esta interface é o que a camada de Domínio/Use Cases irá conhecer para
 * realizar operações CRUD no banco de dados.
 */
export interface ILocalizacaoService {
  /**
   * Obtém a lista completa de todas as localizações cadastradas no sistema.
   * * NOTA: O método 'getLocalizacoes(executor: IUsuario)' foi removido e
   * a lógica de filtragem/RLS será implementada no Use Case correspondente.
   * * @returns Uma Promise que resolve para um array de objetos ILocalizacao.
   */
  getAllLocalizacoes(): Promise<ILocalizacao[]>;

  /**
   * Cria uma nova localização no banco de dados.
   * @param localizacaoData - Dados da nova localização (sem o ID, que é gerado).
   * @returns Uma Promise que resolve para a ILocalizacao criada com o ID.
   */
  createLocalizacao(
    localizacaoData: Omit<
      ILocalizacao,
      "id" | "nome_pai" | "filhas" | "nome_completo" | "sede_congregacao_id"
    >
  ): Promise<ILocalizacao>;

  /**
   * Atualiza as informações de uma localização existente.
   * @param localizacao - O objeto ILocalizacao completo a ser atualizado.
   * @returns Uma Promise que resolve para a ILocalizacao atualizada.
   */
  updateLocalizacao(localizacao: ILocalizacao): Promise<ILocalizacao>;

  /**
   * Exclui uma localização do banco de dados pelo seu ID.
   * @param id - O UUID da localização a ser excluída.
   * @returns Uma Promise que resolve para void (sucesso na exclusão).
   */
  deleteLocalizacao(id: string): Promise<void>;
}

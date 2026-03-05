// src/domain/useCases/localizacao/UpdateLocalizacao.ts

import {
  UserNotAuthorizedError,
  ValidationError,
} from "../../errors/DomainError";
import { ILocalizacao } from "../../models/ILocalizacao";
import { IUsuario } from "../../models/IUsuario";
import { ILocalizacaoService } from "../../services/ILocalizacaoService";

/**
 * Interface que define o contrato do Use Case para atualizar uma localização existente.
 */
export interface IUpdateLocalizacao {
  /**
   * Atualiza uma localização no sistema após validações e checagem de permissão.
   * @param localizacao O objeto ILocalizacao com os dados a serem atualizados (deve conter o 'id').
   * @param currentUser O usuário logado que está executando a operação (deve ser Admin).
   * @returns Uma Promise que resolve para a ILocalizacao atualizada.
   */
  execute(
    localizacao: ILocalizacao,
    currentUser: IUsuario
  ): Promise<ILocalizacao>;
}

/**
 * Use Case para a atualização de uma Localização.
 * REGRA DE NEGÓCIO: Somente usuários com status de administrador podem executar esta operação.
 */
export class UpdateLocalizacao implements IUpdateLocalizacao {
  constructor(private readonly localizacaoService: ILocalizacaoService) {}

  private validateData(localizacao: ILocalizacao): void {
    if (!localizacao.id) {
      throw new ValidationError(
        "O ID da localização é obrigatório para a atualização."
      );
    }
    if (!localizacao.nome || localizacao.nome.length < 3) {
      throw new ValidationError(
        "O nome da localização deve ter no mínimo 3 caracteres."
      );
    }
    if (!localizacao.tipo) {
      throw new ValidationError("O tipo da localização é obrigatório.");
    }

    // Lógica de validação da hierarquia (similar ao Create):
    const isRootType = localizacao.tipo === "Regional";

    // Se for tipo raiz, o parent_id deve ser null.
    if (isRootType && localizacao.parent_id !== null) {
      throw new ValidationError(
        `${localizacao.tipo} deve ter 'parent_id' nulo.`
      );
    }

    // Se NÃO for tipo raiz, o parent_id não pode ser nulo.
    if (!isRootType && localizacao.parent_id === null) {
      throw new ValidationError(
        `${localizacao.tipo} deve ter um 'parent_id' válido.`
      );
    }

    // NOTA: A regra crucial de evitar que uma localização seja seu próprio parent_id
    // e evitar loops infinitos (ex: A pai de B, B pai de A) deve ser tratada
    // na camada de infraestrutura/database trigger para máxima segurança,
    // mas é uma boa prática adicionar uma checagem básica aqui:
    if (localizacao.id === localizacao.parent_id) {
      throw new ValidationError(
        "Uma localização não pode ser sua própria localização 'mãe'."
      );
    }
  }

  async execute(
    localizacao: ILocalizacao,
    currentUser: IUsuario
  ): Promise<ILocalizacao> {
    // 1. REGRA DE NEGÓCIO: Verificação de Segurança (RBAC)
    if (!currentUser.is_admin) {
      throw new UserNotAuthorizedError(
        "Você não tem permissão para atualizar localizações."
      );
    }

    try {
      // 2. Validação dos dados de entrada
      this.validateData(localizacao);

      console.log(
        `Use Case UpdateLocalizacao: Atualizando localização ID: ${localizacao.id} - ${localizacao.nome}`
      );

      // 3. Chamada à camada de dados
      // O serviço de infraestrutura irá atualizar apenas os campos da tabela,
      // ignorando as propriedades de UI (nome_pai, filhas, nome_completo).
      const localizacaoAtualizada =
        await this.localizacaoService.updateLocalizacao(localizacao);

      return localizacaoAtualizada;
    } catch (error) {
      console.error("Erro no Use Case UpdateLocalizacao:", error);
      throw error;
    }
  }
}

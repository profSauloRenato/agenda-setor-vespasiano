// src/domain/useCases/localizacao/DeleteLocalizacao.ts

import {
  UserNotAuthorizedError,
  ValidationError,
} from "../../errors/DomainError";
import { IUsuario } from "../../models/IUsuario";
import { ILocalizacaoService } from "../../services/ILocalizacaoService";

/**
 * Interface que define o contrato do Use Case para excluir uma localização.
 */
export interface IDeleteLocalizacao {
  /**
   * Exclui uma localização do sistema, se o usuário tiver permissão e a localização
   * não estiver em uso.
   * @param id O UUID da localização a ser excluída.
   * @param currentUser O usuário logado que está executando a operação (deve ser Admin).
   * @returns Uma Promise que resolve para void (sucesso na exclusão).
   */
  execute(id: string, currentUser: IUsuario): Promise<void>;
}

/**
 * Use Case para a exclusão de uma Localização.
 * REGRA DE NEGÓCIO: Somente usuários com status de administrador podem executar esta operação.
 */
export class DeleteLocalizacao implements IDeleteLocalizacao {
  constructor(private readonly localizacaoService: ILocalizacaoService) {}

  async execute(id: string, currentUser: IUsuario): Promise<void> {
    // 1. REGRA DE NEGÓCIO: Verificação de Segurança (RBAC)
    if (!currentUser.is_admin) {
      throw new UserNotAuthorizedError(
        "Você não tem permissão para excluir localizações."
      );
    }

    // 2. Validação básica
    if (!id) {
      throw new ValidationError(
        "O ID da localização é obrigatório para a exclusão."
      );
    }

    try {
      console.log(
        `Use Case DeleteLocalizacao: Deletando localização ID: ${id}`
      );

      // 3. Chamada à camada de dados
      // O SupabaseLocalizacaoService está configurado para capturar
      // o erro de Foreign Key (código 23503) e lançar uma mensagem amigável,
      // que será propagada até o Controller.
      await this.localizacaoService.deleteLocalizacao(id);
    } catch (error) {
      console.error("Erro no Use Case DeleteLocalizacao:", error);
      // Re-throw
      throw error;
    }
  }
}

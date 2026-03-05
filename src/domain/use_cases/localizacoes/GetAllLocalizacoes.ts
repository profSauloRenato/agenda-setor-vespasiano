// src/domain/useCases/localizacao/GetAllLocalizacoes.ts

import { ILocalizacao } from "../../models/ILocalizacao";
import { IUsuario } from "../../models/IUsuario"; // Mantido, pois é usado no parâmetro 'execute'
import { ILocalizacaoService } from "../../services/ILocalizacaoService";
// Importa o erro de domínio para a verificação de Admin
import { UserNotAuthorizedError } from "../../errors/DomainError";

/**
 * Interface que define o contrato do Use Case para buscar todas as localizações.
 */
export interface IGetAllLocalizacoes {
  /**
   * Executa a busca de todas as localizações.
   * @param currentUser O usuário logado que está executando a operação (para verificação de permissão).
   * @returns Uma Promise com um array de todas as localizações (ILocalizacao[]).
   */
  execute(user: IUsuario): Promise<ILocalizacao[]>;
}

/**
 * Use Case para obter a lista completa de localizações no sistema.
 * REGRA DE NEGÓCIO: Somente usuários com status de administrador podem executar esta operação.
 */
export class GetAllLocalizacoes implements IGetAllLocalizacoes {
  constructor(private readonly localizacaoService: ILocalizacaoService) {}

  async execute(currentUser: IUsuario): Promise<ILocalizacao[]> {
    // 1. REGRA DE NEGÓCIO: Verificação de Segurança (RBAC Core)
    if (!currentUser.is_admin) {
      throw new UserNotAuthorizedError(
        "Você não tem permissão para listar todas as localizações."
      );
    }

    try {
      // 2. Chamada à camada de dados.
      // O Use Case garante que o executor é Admin, então o Service retorna todos os dados.
      const localizacoes = await this.localizacaoService.getAllLocalizacoes();

      // 3. Lógica de Domínio Opcional: Hierarquização
      // Embora a hierarquização seja mais complexa e possa ir para um Use Case separado
      // (ex: BuildLocalizacaoTree), aqui apenas retornamos a lista plana,
      // que é o que o 'getAllLocalizacoes' do serviço faz.
      return localizacoes;
    } catch (error) {
      console.error("Erro no Use Case GetAllLocalizacoes:", error);
      // Re-throw para que o Controller possa capturar e retornar um erro 500 ou equivalente
      throw error;
    }
  }
}

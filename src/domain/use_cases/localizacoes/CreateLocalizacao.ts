// src/domain/useCases/localizacao/CreateLocalizacao.ts

import {
  UserNotAuthorizedError,
  ValidationError,
} from "../../errors/DomainError";
import { ILocalizacao } from "../../models/ILocalizacao";
import { IUsuario } from "../../models/IUsuario";
import { ILocalizacaoService } from "../../services/ILocalizacaoService";

// Define os dados obrigatórios para criação.
export type CreateLocalizacaoData = Omit<
  ILocalizacao,
  "id" | "nome_pai" | "filhas" | "nome_completo"
> &
  Partial<Pick<ILocalizacao, "sede_congregacao_id">>;

/**
 * Interface que define o contrato do Use Case para criar uma nova localização.
 */
export interface ICreateLocalizacao {
  /**
   * Cria uma nova localização no sistema após validações e checagem de permissão.
   * @param data Dados da nova localização.
   * @param currentUser O usuário logado que está executando a operação (deve ser Admin).
   * @returns Uma Promise que resolve para a ILocalizacao criada.
   */
  execute(
    data: CreateLocalizacaoData,
    currentUser: IUsuario,
  ): Promise<ILocalizacao>;
}

/**
 * Use Case para a criação de uma Localização (Regional, Setor, Congregação, Administração).
 * REGRA DE NEGÓCIO: Somente usuários com status de administrador podem executar esta operação.
 */
export class CreateLocalizacao implements ICreateLocalizacao {
  constructor(private readonly localizacaoService: ILocalizacaoService) {}

  private validateData(data: CreateLocalizacaoData): void {
    if (!data.nome || data.nome.length < 3) {
      throw new ValidationError(
        "O nome da localização deve ter no mínimo 3 caracteres.",
      );
    }
    if (!data.tipo) {
      throw new ValidationError(
        "O tipo da localização é obrigatório ('Regional', 'Setor', 'Congregacao' ou 'Administracao').",
      );
    }

    // Normaliza strings vazias de parent_id e sede_congregacao_id para null,
    // pois o banco de dados espera null, não vazio.
    if (data.parent_id === "") {
      data.parent_id = null;
    }
    if (data.sede_congregacao_id === "") {
      data.sede_congregacao_id = null;
    }

    // Lógica de validação da hierarquia e Congregação Sede.
    const isRegional = data.tipo === "Regional";
    const isCongregacao = data.tipo === "Congregação";

    // --- 1. Validação do PARENT_ID (Pai Hierárquico) ---
    if (isRegional) {
      // Regional deve ser o nó raiz.
      if (data.parent_id !== null) {
        throw new ValidationError(
          "Regional deve ser a raiz da hierarquia, portanto, 'parent_id' deve ser nulo.",
        );
      }
    } else if (isCongregacao) {
      // Congregação: Permitimos parent_id nulo na criação inicial para quebrar a dependência.
      // Se parent_id for fornecido, ele é obrigatório. Se não, é uma Congregação "temporariamente raiz".
      // Não precisamos de erro aqui, pois a regra é: parent_id PODE ser nulo.

      // Congregações não devem ter sede_congregacao_id.
      if (data.sede_congregacao_id) {
        throw new ValidationError(
          "Congregações não devem referenciar a si próprias ou outras como 'sede_congregacao_id'.",
        );
      }
    } else {
      // Administração e Setor: parent_id é obrigatório.
      if (data.parent_id === null) {
        throw new ValidationError(
          `${data.tipo} deve ter um 'parent_id' válido.`,
        );
      }
    }

    // --- 2. Validação do SEDE_CONGREGACAO_ID ---
    // sede_congregacao_id é opcional na criação para permitir o cadastro
    // hierárquico progressivo (Regional → Administração → Setor → Congregação).
    // A sede pode ser definida posteriormente via edição.

    // NOTA: A validação de UNICIDADE do 'nome' e a verificação da existência
    // do 'parent_id' serão tratadas pelo banco de dados (Infraestrutura) e
    // convertidas em erro de domínio no Service, se ocorrerem.
  }

  async execute(
    data: CreateLocalizacaoData,
    currentUser: IUsuario,
  ): Promise<ILocalizacao> {
    // 1. REGRA DE NEGÓCIO: Verificação de Segurança (RBAC)
    if (!currentUser.is_admin) {
      throw new UserNotAuthorizedError(
        "Você não tem permissão para criar novas localizações.",
      );
    }

    try {
      // 2. Validação dos dados de entrada
      this.validateData(data);

      console.log(
        `Use Case CreateLocalizacao: Criando localização do tipo ${data.tipo} - ${data.nome}`,
      );

      // 3. Chamada à camada de dados
      // Se sede_congregacao_id for null, o service deve enviar null para o DB.
      const novaLocalizacao = await this.localizacaoService.createLocalizacao(
        data as any, // Usamos 'as any' ou ajustamos o service para aceitar os campos opcionais se a tipagem não foi sincronizada.
      );

      return novaLocalizacao;
    } catch (error) {
      console.error("Erro no Use Case CreateLocalizacao:", error);
      // Re-throw para que o Controller possa capturar o erro tratado (ValidationError)
      // ou o erro da infraestrutura.
      throw error;
    }
  }
}

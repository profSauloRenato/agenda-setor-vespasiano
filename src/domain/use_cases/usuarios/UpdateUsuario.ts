import { UserNotAuthorizedError } from "../../errors/DomainError";
import { IUsuario } from "../../models/IUsuario";
import { IUsuarioService } from "../../services/IUsuarioService";

/**
 * Define o formato dos dados recebidos para a atualização do usuário.
 * Usamos um 'Partial' (parcial) para a atualização dos dados básicos,
 * mas exigimos o array completo dos IDs dos cargos (o novo estado M:N).
 */
export interface UpdateUsuarioParams {
  usuario: Partial<IUsuario>;
  novosCargosIds: string[];
}

/**
 * Contrato de interface para o Use Case de atualização de usuário.
 */
export interface IUpdateUsuario {
  execute(
    usuarioLogado: IUsuario,
    params: UpdateUsuarioParams
  ): Promise<IUsuario>;
}

/**
 * Use Case: Atualiza os dados de um usuário (membro), incluindo a atribuição de cargos.
 * Restrito apenas a Administradores (RBAC).
 */
export class UpdateUsuario implements IUpdateUsuario {
  constructor(private usuarioService: IUsuarioService) {}

  async execute(
    usuarioLogado: IUsuario,
    params: UpdateUsuarioParams
  ): Promise<IUsuario> {
    const { usuario, novosCargosIds } = params;
    if (!usuario.id) {
      throw new Error("ID do usuário é obrigatório para a atualização.");
    } // 1. RBAC: Verifica se o usuário logado tem permissão

    if (!usuarioLogado.is_admin) {
      throw new UserNotAuthorizedError(
        "Apenas administradores podem atualizar usuários e cargos."
      );
    }
    try {
      // 2. ATUALIZAÇÃO DOS DADOS BÁSICOS
      // Atualiza nome, localizacao_id, is_admin etc.
      // O resultado não tem cargos e nome_localizacao, mas garante que os dados foram persistidos.
      await this.usuarioService.updateUsuarioBasico(usuario as IUsuario); // 3. ATUALIZAÇÃO DOS CARGOS (Relação M:N) // Deleta os antigos e insere os novos cargos.

      await this.usuarioService.updateCargos(usuario.id, novosCargosIds); // 4. RECARREGA O USUÁRIO COMPLETO E HIDRATADO (Passo crucial para consistência) // Usamos o método getUsuarioLogado/getUsuarioById (assumindo que o serviço tem um,
      // ou adaptando o getUsuarioLogado para receber um ID).
      // NOTA: Para este Use Case Admin, é mais adequado buscar o usuário completo pela nova listagem.

      // Re-utilizando a lógica de busca otimizada:
      // Buscamos o usuário no contexto da listagem para obter os dados completos (localização e cargos).
      const usuariosAtualizados = await this.usuarioService.getUsuarios();

      const usuarioRecarregado = usuariosAtualizados.find(
        (u) => u.id === usuario.id
      );

      if (!usuarioRecarregado) {
        // Isso pode acontecer se o RLS impedir a leitura, o que não deveria ocorrer para o admin.
        throw new Error(
          "Falha ao recarregar o perfil do usuário após a atualização."
        );
      }

      return usuarioRecarregado;
    } catch (error) {
      console.error("Erro no Use Case UpdateUsuario:", error);
      if (error instanceof UserNotAuthorizedError) {
        throw error;
      } // Lança um novo erro genérico para o ViewModel
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro desconhecido durante a atualização.";
      throw new Error(`Falha ao atualizar o usuário: ${errorMessage}`);
    }
  }
}

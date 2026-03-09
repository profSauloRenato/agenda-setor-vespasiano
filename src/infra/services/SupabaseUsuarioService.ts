// src/infra/services/SupabaseUsuarioService.ts

import { SupabaseClient } from "@supabase/supabase-js";
import { UserNotFoundError } from "../../domain/errors/DomainError";
import { ICargo } from "../../domain/models/ICargo";
import { IUsuario } from "../../domain/models/IUsuario";
import { IUsuarioService } from "../../domain/services/IUsuarioService";
import { CreateUsuarioParams } from "../../domain/use_cases/usuarios/CreateUsuario";

/**
 * Tabela de junção para a relação M:N.
 * Nome confirmado: 'usuario_cargos'
 */
interface UsuarioCargoRow {
  usuario_id: string;
  cargo_id: string;
}

/**
 * Implementação do serviço de dados para a entidade IUsuario usando o Supabase.
 */
export class SupabaseUsuarioService implements IUsuarioService {
  private readonly DB_TABLE = "usuario";
  private readonly JUNCTION_TABLE = "usuario_cargos"; // Nome corrigido
  private readonly CARGO_TABLE = "cargo";
  private readonly LOCATION_TABLE = "localizacao";

  constructor(private supabase: SupabaseClient) {}
  // Implementação: createUsuario
  /**
   * Persiste um novo usuário na fonte de dados usando uma função RPC (create_user_and_profile).
   * @param executor — O usuário logado (Admin) que executa a criação.
   * @param data — Os dados do novo usuário (nome, email, senha, cargosIds, etc.).
   */

  async createUsuario(
    executor: IUsuario,
    data: CreateUsuarioParams,
  ): Promise<void> {
    console.log(
      `SupabaseUsuarioService: Tentando criar novo usuário via RPC, executado por: ${executor.id}`,
    );

    const { error } = await this.supabase.rpc("create_user_and_profile", {
      // Parâmetros que a função RPC espera
      p_email: data.email,
      p_password: data.senha,
      p_nome: data.nome,
      p_is_admin: data.is_admin,
      p_localizacao_id: data.localizacao_id, // Pode ser null
      p_cargos_ids: data.cargosIds, // Array de strings
    });

    if (error) {
      console.error(
        "SupabaseUsuarioService: Erro RPC ao criar usuário:",
        error,
      ); // Mapeamento de erros comuns do banco (ex: email duplicado)

      if (error.code === "23505" || error.message.includes("duplicate key")) {
        throw new Error("O e-mail fornecido já está em uso.");
      }
      throw new Error(`Falha ao criar o novo usuário: ${error.message}`);
    }

    console.log(`Usuário ${data.email} criado com sucesso.`);
    return;
  }
  // Implementação: getUsuarioLogado
  /**
   * Busca o perfil do usuário logado usando a função RPC 'get_user_profile()', que ignora RLS.
   */

  async getUsuarioLogado(userId: string): Promise<IUsuario> {
    const { data, error } = await this.supabase.rpc("get_user_profile");

    if (error) {
      console.error(
        "SupabaseUsuarioService: Erro ao buscar perfil com RPC:",
        error,
      );
      throw new Error(`Falha ao carregar perfil: ${error.message}`);
    }

    if (!data) {
      throw new UserNotFoundError(
        "O perfil do usuário não foi encontrado no banco de dados.",
      );
    }

    // get_user_profile agora retorna jsonb com os cargos incluídos
    return {
      id: data.id,
      email: data.email,
      nome: data.nome,
      localizacao_id: data.localizacao_id,
      nome_localizacao: data.nome_localizacao ?? undefined,
      is_admin: data.is_admin ?? false,
      device_token: data.device_token ?? null,
      cargos: data.cargos ?? [],
    } as IUsuario;
  }
  // Implementação: getUsuarios (Listagem Admin)
  /**
   * BUSCA OTIMIZADA: Busca todos os usuários e carrega detalhes aninhados (cargos, localização)
   * em uma única consulta otimizada (PostgREST JOINs).
   * @returns Promise<IUsuario[]> - Lista de usuários com detalhes aninhados.
   */

  async getUsuarios(): Promise<IUsuario[]> {
    console.log(
      "SupabaseUsuarioService: Buscando todos os usuários (Query Otimizada).",
    );
    // 1. Query única com JOINs implícitos (PostgREST) // Assume-se que o RLS da tabela 'usuario' permite que o Admin execute esta busca.

    const { data, error } = await this.supabase.from(this.DB_TABLE) // 'usuario'
      .select(`
        id,
        nome,
        email,
        is_admin,
        localizacao_id,
        localizacao:localizacao_id(nome),
        cargos_link:${this.JUNCTION_TABLE}(
            cargo:cargo_id(id, nome, descricao)
        )
      `);

    if (error) {
      console.error(
        "SupabaseUsuarioService: Erro ao buscar todos usuários (Otimizado):",
        error,
      );
      throw new Error(
        `Falha no banco de dados ao listar usuários. ${error.message}`,
      );
    } 
    
    // 2. Mapeamento dos resultados para o formato IUsuario

    const usersWithDetails: IUsuario[] = (data || []).map((rawUser: any) => {
      // Obtém o nome da localização (rawUser.localizacao é o objeto retornado pelo JOIN)
      const nome_localizacao = rawUser.localizacao?.nome || "Não definido"; // Acha o array de cargos: [{ cargos_link: { cargo: {...} } }] -> [{...}, {...}]

      const cargos: ICargo[] = (rawUser.cargos_link || [])
        .map((link: any) => link.cargo)
        .filter((c: any) => c);

      return {
        id: rawUser.id,
        nome: rawUser.nome,
        email: rawUser.email,
        is_admin: rawUser.is_admin,
        localizacao_id: rawUser.localizacao_id,
        nome_localizacao: nome_localizacao,
        cargos: cargos,
        device_token: null,
      } as IUsuario;
    }); // Ordenação final

    return usersWithDetails.sort((a, b) => a.nome.localeCompare(b.nome));
  }
  // Implementação: updateUsuarioBasico
  /**
   * Atualiza os dados básicos de um usuário (nome, localizacao, is_admin).
   */

  async updateUsuarioBasico(usuario: IUsuario): Promise<IUsuario> {
    const { id, nome, localizacao_id, is_admin } = usuario;

    const { data, error } = await this.supabase
      .from(this.DB_TABLE)
      .update({
        nome: nome,
        localizacao_id: localizacao_id,
        is_admin: is_admin,
      })
      .eq("id", id)
      .select() // Pede o retorno da linha atualizada
      .single();

    if (error) {
      console.error(
        "SupabaseUsuarioService: Erro ao atualizar usuário:",
        error,
      );
      throw new Error(
        `Falha ao atualizar dados básicos do usuário. ${error.message}`,
      );
    } // NOTA: Esta função não retorna a lista de cargos, apenas o básico.

    return data as IUsuario;
  }
  // Implementação: updateCargos
  /**
   * Lógica de atribuição M:N: Substitui todos os cargos de um usuário.
   */

  async updateCargos(userId: string, novosCargosIds: string[]): Promise<void> {
    const existingClient = this.supabase; // 1. DELETA todos os cargos antigos do usuário na tabela de junção

    const { error: deleteError } = await existingClient
      .from(this.JUNCTION_TABLE)
      .delete()
      .eq("usuario_id", userId);

    if (deleteError) {
      console.error(
        "SupabaseUsuarioService: Erro ao deletar cargos antigos:",
        deleteError,
      );
      throw new Error(`Falha ao limpar cargos antigos do usuário.`);
    } // 2. INSERE os novos cargos

    if (novosCargosIds.length > 0) {
      const dataToInsert: UsuarioCargoRow[] = novosCargosIds.map((cargoId) => ({
        usuario_id: userId,
        cargo_id: cargoId,
      }));

      const { error: insertError } = await existingClient
        .from(this.JUNCTION_TABLE)
        .insert(dataToInsert);

      if (insertError) {
        console.error(
          "SupabaseUsuarioService: Erro ao inserir novos cargos:",
          insertError,
        );
        throw new Error(`Falha ao atribuir novos cargos ao usuário.`);
      }
    } // 3. RETORNA SUCESSO

    console.log(`Cargos do usuário ${userId} atualizados com sucesso.`);
  }
  // Implementação: deleteUsuario
  /**
   * Deleta um usuário do banco de dados (tabela 'usuario').
   * NOTA: A exclusão da entrada em 'auth.users' deve ser tratada por um trigger no banco.
   */

  async deleteUsuario(executor: IUsuario, userId: string): Promise<void> {
    console.log(
      `SupabaseUsuarioService: Tentando deletar usuário ID: ${userId}`,
    );

    const { error } = await this.supabase.rpc("delete_user_complete", {
      p_user_id: userId,
    });

    if (error) {
      console.error("Erro ao deletar usuário:", error);
      throw new Error(`Falha ao remover o usuário: ${error.message}`);
    }

    console.log(`Usuário ID: ${userId} deletado com sucesso.`);
  }
}

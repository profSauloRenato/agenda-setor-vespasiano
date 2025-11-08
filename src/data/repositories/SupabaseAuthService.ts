// src/data/repositories/SupabaseAuthService.ts

import { supabase } from "../../config/supabaseClient";
import { InvalidCredentialsError, UserNotAuthorizedError, UserNotFoundError } from "../../domain/errors/DomainError";
import { IUsuario } from "../../domain/models/IUsuario";
import { IAuthService } from "../protocols/IAuthService";

type DBSchemaUsuario = Omit<IUsuario, 'is_admin' | 'cargos' | 'device_token' | 'nome_localizacao'>;

// Esta classe é a implementação concreta da interface IAuthService,
// usando a biblioteca do Supabase para realizar as operações.
export class SupabaseAuthService implements IAuthService {

  // O método de login usa a API de autenticação do Supabase.
  async login(email: string, password: string): Promise<IUsuario | null> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // --- NOVO TRATAMENTO DE ERROS DO SUPABASE ---
        // O Supabase usa um código de status 400 ou 401 para credenciais inválidas.
        // O erro geralmente vem com a mensagem 'Invalid login credentials'.
        if (error.status === 400 || error.message.includes('Invalid login credentials')) {
            throw new InvalidCredentialsError();
        }
        // Para qualquer outro erro de rede/servidor, lançamos o erro genérico
        throw new Error(`Erro desconhecido no Login: ${error.message}`); 
      }

      const user = await this.loadExtendedUserData(data.user?.id);
      
      if (!user) {
         throw new UserNotFoundError(); // Lança o erro de que o perfil não existe
      }
      
      return user;

    } catch (error) {
      console.error("Erro no SupabaseAuthService.login:", error);
      throw error;
    }
  }

  // O registro é mais complexo, pois exige a criação na tabela 'auth.users' 
  // E a inserção de dados estendidos na tabela 'public.usuario'.
  async register(nome: string, email: string, password: string): Promise<IUsuario> {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      throw new Error(`Erro ao Registrar Usuário (Auth): ${authError?.message || 'Usuário não retornado.'}`);
    }

    const userId = authData.user.id;
    
    // ATENÇÃO: Após criar a conta de autenticação (auth.users),
    // é necessário criar a entrada correspondente na tabela 'public.usuario'
    // com os dados iniciais.
    const { data: userData, error: userError } = await supabase
      .from('usuario')
      .insert({ 
        id: userId, // Garante que o ID do usuário é o mesmo do auth.users
        nome: nome,
        email: email,
        localizacao_id: 'ID_LOCALIZACAO_PADRAO' // <--- PONTO CRÍTICO: Definir um ID padrão ou solicitar na UI
      })
      .select()
      .single();

    if (userError) {
      // Se a inserção falhar, você deve reverter a criação do auth.user (desafios do BaaS)
      // Por enquanto, vamos logar o erro e seguir.
      console.error("Erro ao inserir na tabela 'usuario':", userError);
      throw new Error(`Erro ao finalizar o registro: ${userError.message}`);
    }

    // Retorna o objeto IUsuario com dados base
    return {
      id: userId,
      email: email,
      nome: nome,
      localizacao_id: 'ID_LOCALIZACAO_PADRAO', // Temporário
      is_admin: false, // Por padrão, não é admin
    } as IUsuario;
  }

  async getLoggedUser(): Promise<IUsuario | null> {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return null; // Nenhuma sessão ativa
    }
    
    // Se houver sessão, carrega os dados estendidos do usuário
    return this.loadExtendedUserData(session.user.id);
  }

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(`Erro ao fazer Logout: ${error.message}`);
    }
  }

  // Função auxiliar para obter dados do usuário E seus cargos/status de admin
  // **CRÍTICO:** Este método será o principal ponto de segurança.
  // No Supabase, você usaria uma View ou Function SQL para buscar:
  // 1. Dados da tabela 'usuario'.
  // 2. Os cargos relacionados a este ID.
  // 3. O resultado da função 'is_admin()'.
  private async loadExtendedUserData(userId: string | undefined): Promise<IUsuario | null> {
    if (!userId) return null;

    // ATENÇÃO: No futuro, a consulta abaixo será uma chamada a uma View 
    // ou Stored Procedure que retorna **TODOS** os dados do IUsuario, 
    // incluindo se ele é admin e quais são seus cargos.
    
    const { data, error } = await supabase
        .from('usuario')
        .select(`
          id,
          nome,
          email,
          localizacao_id,
          usuario_cargos (
            cargo (
              nome
            )
          )
          `)
        .eq('id', userId)
        .single();

    if (error) {
        // Se houver erro de Supabase na consulta, o console.error mostrará o erro SQL real.
        console.error("ERRO CRÍTICO SUPABASE NA CONSULTA:", error);
        throw new UserNotFoundError();
    }

    if (!data) {
        console.error("ERRO CRÍTICO: Dados de usuário nulos após a consulta.");
        throw new UserNotFoundError();
    }

    // 1. EXTRAÇÃO DOS CARGOS: O Supabase retorna os cargos aninhados
    const cargosUsuario = data.usuario_cargos.map((link: any) => link.cargo.nome);

    // String de referência
    const adminStringEsperada = 'administrador do sistema';
    
    // 2. CÁLCULO DA PROPRIEDADE is_admin (MÉTODO DEFINITIVO: Normalização Unicode)
    // Aplica normalize('NFC'), trim() e toLowerCase() para máxima robustez na checagem.
    const isAdmin = cargosUsuario.some(cargoNome => {
        
        // Usamos 'as string' para garantir que o TypeScript saiba que é uma string.
        const cargoNormalizado = (cargoNome as string)
            .normalize('NFC') // Normalização Unicode para resolver caracteres invisíveis
            .trim()          // Remove espaços de borda
            .toLowerCase();  // Garante que a capitalização seja ignorada
        
        return cargoNormalizado === adminStringEsperada;
    });

    // TRATAMENTO DA FALHA REAL
    if (!isAdmin) {
        // Se o cálculo falhar, lançamos o erro que você está vendo
        throw new UserNotAuthorizedError("Você não tem permissão para visualizar a lista de cargos.");
    }

    // 3. Mapeamento final para o modelo de Domínio (IUsuario)
    return {
      id: data.id,
      nome: data.nome,
      email: data.email,
      localizacao_id: data.localizacao_id,
      cargos: cargosUsuario,
      is_admin: isAdmin,     // <--- PROPRIEDADE CALCULADA
    } as IUsuario;
  }
}
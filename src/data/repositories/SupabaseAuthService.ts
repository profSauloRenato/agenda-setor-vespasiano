// src/data/repositories/SupabaseAuthService.ts

import { supabase } from "../../config/supabaseClient";
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
        // Lança o erro para ser tratado na camada de apresentação (View-Model/Tela)
        throw new Error(`Erro de Login: ${error.message}`); 
      }

      // Após o login bem-sucedido, carrega os dados estendidos do usuário
      // (como nome, cargos, e status de admin)
      return this.loadExtendedUserData(data.user?.id);

    } catch (error) {
      console.error("Erro no SupabaseAuthService.login:", error);
      return null;
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
        .select(`id, nome, email, localizacao_id`)
        .eq('id', userId)
        .single();
    
    if (error || !data) {
        console.error("Erro ao carregar dados estendidos:", error);
        return null;
    }

    const rawData = data as DBSchemaUsuario;
    
    // Por enquanto, retorna uma versão básica. Isso será refatorado na Fase 2
    // após a criação da view/funções SQL no Supabase.
    return {
        ...rawData,
        is_admin: false, // MOCK: Será true ou false baseado na função SQL real
        cargos: [],      // MOCK: Será a lista de IDs de cargos reais
    } as IUsuario;
  }
}
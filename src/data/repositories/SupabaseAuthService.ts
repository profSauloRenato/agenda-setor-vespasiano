// src/data/repositories/SupabaseAuthService.ts

import { supabase } from "../../config/supabaseClient";
import {
  InvalidCredentialsError,
  UserNotFoundError,
} from "../../domain/errors/DomainError";
import { IUsuario } from "../../domain/models/IUsuario";
import { IAuthService } from "../../domain/services/IAuthService";
import { SupabaseUsuarioService } from "../../infra/services/SupabaseUsuarioService";

export class SupabaseAuthService implements IAuthService {
  private usuarioService: SupabaseUsuarioService;

  constructor() {
    this.usuarioService = new SupabaseUsuarioService(supabase);
  }

  async login(email: string, password: string): Promise<IUsuario | null> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("AUTH RESULT:", JSON.stringify({ data, error }));

      if (error) {
        if (
          error.status === 400 ||
          error.message.includes("Invalid login credentials")
        ) {
          throw new InvalidCredentialsError();
        }
        throw new Error(`Erro desconhecido no Login: ${error.message}`);
      }

      const user = await this.usuarioService.getUsuarioLogado(data.user!.id);

      if (!user) {
        throw new UserNotFoundError();
      }

      return user;
    } catch (error) {
      console.error("Erro no SupabaseAuthService.login:", error);
      throw error;
    }
  }

  // Cadastro de usuários é feito exclusivamente pelo Admin
  // via create_user_and_profile (RPC). Este método não é utilizado.
  async register(
    nome: string,
    email: string,
    password: string,
  ): Promise<IUsuario> {
    throw new Error(
      "Cadastro direto não permitido. Utilize o painel administrativo para criar usuários.",
    );
  }

  async getLoggedUser(): Promise<IUsuario | null> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return null;
    }

    try {
      return await this.usuarioService.getUsuarioLogado(session.user.id);
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        return null;
      }
      throw error;
    }
  }

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(`Erro ao fazer Logout: ${error.message}`);
    }
  }
}

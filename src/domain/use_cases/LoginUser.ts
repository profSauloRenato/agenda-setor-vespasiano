// src/domain/use_cases/LoginUser.ts

import { IAuthService } from "../../data/protocols/IAuthService";
import { IUsuario } from "../models/IUsuario";

// Define a interface do Use Case (Contrato para o Login)
export interface ILoginUser {
  /**
   * Executa a operação de login, recebendo credenciais e retornando o usuário logado.
   * @param email - Email do usuário.
   * @param password - Senha do usuário.
   * @returns Uma Promise que resolve para o IUsuario logado ou null em caso de falha.
   */
  execute(email: string, password: string): Promise<IUsuario | null>;
}

// Implementação Concreta do Use Case
export class LoginUser implements ILoginUser {
  // O Use Case DEPENDE do contrato IAuthService, não da implementação SupabaseAuthService.
  // Isso é o PRINCÍPIO da Inversão de Dependência (Dependency Inversion Principle - DIP).
  constructor(private authService: IAuthService) {}

  /**
   * Regra de Negócio:
   * 1. Valida se email e senha não estão vazios (validação básica).
   * 2. Chama o serviço de autenticação para processar o login.
   * 3. Retorna o objeto IUsuario ou nulo.
   */
  async execute(email: string, password: string): Promise<IUsuario | null> {
    
    // #1 Validação de Negócio (Exemplo)
    if (!email || !password) {
      // Poderíamos lançar uma exceção de domínio (DomainException) aqui.
      console.error("LoginUser: Email e senha são obrigatórios.");
      return null;
    }
    
    // #2 Executa a operação de login. Se o authService lançar uma InvalidCredentialsError,
    // ela será propagada para quem chamou (o View-Model).
    try {
        const user = await this.authService.login(email, password);
        return user;
    } catch (error) {
        // Propaga o erro (InvalidCredentialsError, UserNotFoundError, etc.)
        throw error;
    }
  }
}
// src/domain/errors/DomainError.ts

// 1. Erros de Credenciais (Autenticação)
export class InvalidCredentialsError extends Error {
  constructor() {
    super("As credenciais fornecidas são inválidas.");
    this.name = 'InvalidCredentialsError';
  }
}

export class UserNotFoundError extends Error {
  constructor() {
    super("O perfil do usuário não foi encontrado no banco de dados.");
    this.name = 'UserNotFoundError';
  }
}

// 2. Erros de Autorização (RBAC)
export class UserNotAuthorizedError extends Error {
  constructor(message: string = "Usuário não autorizado para realizar esta operação.") {
    super(message);
    this.name = 'UserNotAuthorizedError';
  }
}

// Você pode adicionar outros erros de domínio aqui, como EntityNotFoundError, etc.
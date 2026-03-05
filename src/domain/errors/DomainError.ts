// src/domain/errors/DomainError.ts

/**
 * 💥 CLASSE BASE: Define a base para todos os erros de Domínio (Regra de Negócio).
 * Isso permite que a camada de Controller (API) capture erros de negócio de forma unificada.
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

// 1. Erros de Credenciais (Autenticação)

export class InvalidCredentialsError extends DomainError {
  constructor(message: string = "As credenciais fornecidas são inválidas.") {
    super(message);
    this.name = "InvalidCredentialsError";
  }
}

// 2. Erros de Entidade (Busca)

export class UserNotFoundError extends DomainError {
  constructor(
    message: string = "O perfil do usuário não foi encontrado no banco de dados."
  ) {
    super(message);
    this.name = "UserNotFoundError";
  }
}

// 3. Erros de Autorização (RBAC)

export class UserNotAuthorizedError extends DomainError {
  constructor(
    message: string = "Usuário não autorizado para realizar esta operação."
  ) {
    super(message);
    this.name = "UserNotAuthorizedError";
  }
}

// 4. Erros de Validação de Dados (Necessário para o CRUD de Localização)

/**
 * Erro lançado quando os dados de entrada para um Use Case são inválidos
 * (Ex: campo obrigatório vazio, nome muito curto, regra de hierarquia violada).
 */
export class ValidationError extends DomainError {
  constructor(message: string) {
    // A mensagem é obrigatória para este erro, indicando o campo inválido.
    super(message);
    this.name = "ValidationError";
  }
}

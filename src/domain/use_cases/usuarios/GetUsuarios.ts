// src/domain/use_cases/usuarios/GetUsuarios.ts

import { UserNotAuthorizedError } from '../../errors/DomainError';
import { IUsuario } from '../../models/IUsuario';
import { IUsuarioService } from '../../services/IUsuarioService';

/**
 * Contrato de interface para o Use Case de listagem de usuários.
 */
export interface IGetUsuarios {
    execute(usuarioLogado: IUsuario): Promise<IUsuario[]>;
}

/**
 * Use Case: Obtém a lista de todos os usuários do sistema.
 * Restrito apenas a Administradores (RBAC).
 */
export class GetUsuarios implements IGetUsuarios {
    constructor(private usuarioService: IUsuarioService) {}

    async execute(usuarioLogado: IUsuario): Promise<IUsuario[]> {
        // 1. RBAC: Verifica se o usuário autenticado tem permissão de Administrador.
        // NOTA: O Use Case DEVE confiar que o IUsuarioService
        // fará a verificação de 'is_admin' ao buscar o usuário no banco de dados.
        
        // Simulação de verificação rápida (pode ser refinada mais tarde)
        if (!usuarioLogado.is_admin) { // Use um método mais seguro/genérico depois
             // Lança um erro de domínio se não for autorizado
             throw new UserNotAuthorizedError('Apenas administradores podem visualizar a lista de usuários.');
        }

        // 2. Executa a operação de dados.
        try {
            const usuarios = await this.usuarioService.getUsuarios();
            return usuarios;
        } catch (error) {
            console.error('Erro no Use Case GetUsuarios:', error);

            let errorMessage = "Ocorreu um erro desconhecido ao obter a lista de usuários.";
            
            if (error instanceof Error) {
                errorMessage = `Falha ao obter lista de usuários: ${error.message}`;
            }

            // Re-lança o erro para o ViewModel tratar
            throw new Error(errorMessage);
        }
    }
}
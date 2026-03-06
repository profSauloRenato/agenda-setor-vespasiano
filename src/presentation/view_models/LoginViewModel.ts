// src/presentation/view_models/LoginViewModel.ts

import { useState } from "react";
import {
  InvalidCredentialsError,
  UserNotFoundError,
} from "../../domain/errors/DomainError";
import { ILoginUser } from "../../domain/use_cases/LoginUser";
import { useAuth } from "../context/AuthContext";
import { useNotificationService } from "../../config/serviceLocator";
import { NotificationService } from "../../infra/services/NotificationService";

// Define o estado inicial do ViewModel
interface LoginState {
  email: string;
  password: string;
  isLoading: boolean;
  error: string | null;
  isLoggedIn: boolean;
}

/**
 * Hook customizado que atua como o ViewModel para a tela de Login.
 * É responsável por gerenciar a lógica de UI, o estado e interagir com o Domínio.
 */
export const useLoginViewModel = (loginUserUseCase: ILoginUser, notificationService: NotificationService) => {
  // O estado do ViewModel é gerenciado internamente
  const [state, setState] = useState<LoginState>({
    email: "",
    password: "",
    isLoading: false,
    error: null,
    isLoggedIn: false,
  });

  const { signIn } = useAuth();

  // Função para atualizar os campos de input
  const setField = (
    field: keyof Omit<LoginState, "isLoading" | "error" | "isLoggedIn">,
    value: string,
  ) => {
    setState((prev) => ({ ...prev, [field]: value, error: null })); // Limpa o erro ao digitar
  };

  // Lógica principal de submissão do formulário
  const handleLogin = async () => {
    // 1. Validação básica (deve ser aprimorada no futuro)
    if (!state.email || !state.password) {
      setState((prev) => ({
        ...prev,
        error: "Por favor, preencha todos os campos.",
        isLoading: false,
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // 2. Chama o Use Case (Camada de Domínio)
      const user = await loginUserUseCase.execute(state.email, state.password);

      // 3. Sucesso: Se o usuário foi retornado, atualiza o estado
      if (user) {
        signIn(user);

        // Registra token de push após login
        try {
          const token = await notificationService.registerForPushNotifications();
          if (token) {
            await notificationService.saveDeviceToken(user.id, token);
          }
        } catch (e) {
          console.log("Erro ao registrar token de push:", e);
        }

        setState((prev) => ({ ...prev, isLoggedIn: true, isLoading: false }));
      }
    } catch (err) {
      // 4. Tratamento dos Erros de Domínio
      let errorMessage =
        "Ocorreu um erro inesperado. Tente novamente mais tarde.";

      if (err instanceof InvalidCredentialsError) {
        // Mensagem de feedback específico para o usuário!
        errorMessage =
          "Email ou senha incorretos. Por favor, verifique suas credenciais.";
      } else if (err instanceof UserNotFoundError) {
        errorMessage =
          "Perfil não encontrado. Contate um administrador para ativar sua conta.";
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
    }
  };

  // O ViewModel retorna o estado e as funções para a View (Tela)
  return {
    state,
    setField,
    handleLogin,
  };
};

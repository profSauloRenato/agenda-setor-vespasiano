// src/presentation/view_models/CargosViewModel.ts

import { useCallback, useEffect, useState } from "react";
import { UserNotAuthorizedError } from "../../domain/errors/DomainError";
import { ICargo } from "../../domain/models/ICargo";
import {
  CreateCargoParams,
  ICreateCargo,
} from "../../domain/use_cases/cargos/CreateCargo";
import { IDeleteCargo } from "../../domain/use_cases/cargos/DeleteCargo";
import { IGetAllCargos } from "../../domain/use_cases/cargos/GetAllCargos";
import { IUpdateCargo } from "../../domain/use_cases/cargos/UpdateCargo";
import { useAuth } from "../context/AuthContext"; // Para obter o usuário logado

// --- NOVOS TIPOS DE USE CASES ---
export type CargoUseCases = {
  getCargos: IGetAllCargos;
  createCargo: ICreateCargo;
  updateCargo: IUpdateCargo;
  deleteCargo: IDeleteCargo;
};

// --- 1. DEFINIÇÃO DE ESTADO ---
interface CargosState {
  cargos: ICargo[];
  isLoading: boolean; // Para a carga inicial da lista
  isSubmitting: boolean; // Para operações de CRUD (formulário/botões de ação)
  error: string | null;
  refreshKey: number;
}

/**
 * Hook customizado que atua como o ViewModel para a tela de gerenciamento de Cargos.
 */
export const useCargosViewModel = (cargoUseCases: CargoUseCases) => {
  const { user } = useAuth();

  const [state, setState] = useState<CargosState>({
    cargos: [],
    isLoading: true,
    isSubmitting: false, // Inicialização correta
    error: null,
    refreshKey: 0,
  });

  // --- 2. LÓGICA DE CARREGAMENTO DE DADOS (READ) ---

  const loadCargos = useCallback(async () => {
    if (!user) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Usuário não autenticado.",
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const cargos = await cargoUseCases.getCargos.execute(user);

      setState((prev) => ({
        ...prev,
        cargos,
        isLoading: false,
      }));
    } catch (err) {
      let errorMessage = "Ocorreu um erro ao carregar os cargos.";

      if (err instanceof UserNotAuthorizedError) {
        errorMessage =
          "Acesso Negado. Apenas administradores podem gerenciar cargos.";
      } else if (err instanceof Error) {
        errorMessage = `Erro de sistema: ${err.message}`;
      }

      console.error("Erro no loadCargos:", err);
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
        cargos: [],
      }));
    }
  }, [user, cargoUseCases.getCargos]);

  useEffect(() => {
    loadCargos();
  }, [loadCargos, state.refreshKey]);

  // --- 3. EXPOSIÇÃO DE MÉTODOS DE AÇÃO (CRUD) ---

  const refreshCargos = () => {
    setState((prev) => ({ ...prev, refreshKey: prev.refreshKey + 1 }));
  };

  /**
   * Use Case: Cria um novo cargo no sistema.
   */
  const createCargo = useCallback(
    async (cargoData: CreateCargoParams): Promise<ICargo | undefined> => {
      if (!user) {
        setState((prev) => ({
          ...prev,
          error: "Sessão inválida. Faça login novamente.",
        }));
        return undefined;
      }

      // CORRIGIDO: Usa isSubmitting no início
      setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

      try {
        const novoCargo = await cargoUseCases.createCargo.execute(
          user,
          cargoData,
        );

        // Atualiza a lista localmente adicionando o novo cargo
        setState((prev) => ({
          ...prev,
          cargos: [novoCargo, ...prev.cargos],
          error: null,
        }));

        return novoCargo;
      } catch (err) {
        let errorMessage = "Falha ao criar cargo.";

        if (err instanceof UserNotAuthorizedError) {
          errorMessage =
            "Acesso Negado. Apenas administradores podem criar cargos.";
        } else if (err instanceof Error) {
          errorMessage = `Erro: ${err.message}`;
        }

        console.error("Erro no createCargo:", err);
        setState((prev) => ({ ...prev, error: errorMessage }));
        return undefined;
      } finally {
        // CORRIGIDO: Usa isSubmitting no final
        setState((prev) => ({ ...prev, isSubmitting: false }));
      }
    },
    [user, cargoUseCases.createCargo],
  );

  /**
   * Use Case: Atualiza um cargo existente.
   */
  const updateCargo = useCallback(
    async (cargoData: ICargo): Promise<ICargo | undefined> => {
      if (!user) {
        setState((prev) => ({
          ...prev,
          error: "Sessão inválida. Faça login novamente.",
        }));
        return undefined;
      }

      // CORRIGIDO: Usa isSubmitting no início
      setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

      try {
        const cargoAtualizado = await cargoUseCases.updateCargo.execute(
          user,
          cargoData,
        );

        // Atualiza a lista: Mapeia para substituir o cargo antigo pelo atualizado
        setState((prev) => ({
          ...prev,
          cargos: prev.cargos.map((cargo) =>
            cargo.id === cargoAtualizado.id ? cargoAtualizado : cargo,
          ),
          error: null,
        }));

        return cargoAtualizado;
      } catch (err) {
        let errorMessage = "Falha ao atualizar cargo.";

        if (err instanceof UserNotAuthorizedError) {
          errorMessage =
            "Acesso Negado. Apenas administradores podem atualizar cargos.";
        } else if (err instanceof Error) {
          errorMessage = `Erro: ${err.message}`;
        }

        console.error("Erro no updateCargo:", err);
        setState((prev) => ({ ...prev, error: errorMessage }));
        return undefined;
      } finally {
        // CORRIGIDO: Usa isSubmitting no final
        setState((prev) => ({ ...prev, isSubmitting: false }));
      }
    },
    [user, cargoUseCases.updateCargo],
  );

  /**
   * Use Case: Exclui um cargo existente.
   */
  const deleteCargo = useCallback(
    async (cargoId: string): Promise<boolean> => {
      if (!user) {
        setState((prev) => ({
          ...prev,
          error: "Sessão inválida. Faça login novamente.",
        }));
        return false;
      }

      // CORRIGIDO: Usa isSubmitting no início
      setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

      try {
        await cargoUseCases.deleteCargo.execute(user, cargoId);

        // Atualiza a lista: Remove o cargo da lista
        setState((prev) => ({
          ...prev,
          cargos: prev.cargos.filter((cargo) => cargo.id !== cargoId),
          error: null,
        }));

        return true;
      } catch (err) {
        let errorMessage = "Falha ao excluir cargo.";

        if (err instanceof UserNotAuthorizedError) {
          errorMessage =
            "Acesso Negado. Apenas administradores podem excluir cargos.";
        } else if (err instanceof Error) {
          errorMessage = `Erro: ${err.message}`;
        }

        console.error("Erro no deleteCargo:", err);
        setState((prev) => ({ ...prev, error: errorMessage }));
        return false;
      } finally {
        // CORRIGIDO: Usa isSubmitting no final
        setState((prev) => ({ ...prev, isSubmitting: false }));
      }
    },
    [user, cargoUseCases.deleteCargo],
  );

  // O ViewModel retorna o estado e as funções para a View (Tela)
  return {
    state,
    loadCargos,
    refreshCargos,
    createCargo,
    updateCargo,
    deleteCargo,
  };
};

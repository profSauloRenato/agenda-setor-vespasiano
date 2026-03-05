// src/presentation/view_models/EventosViewModel.ts

import { useCallback, useEffect, useState } from "react";
import {
  DomainError,
  UserNotAuthorizedError,
  ValidationError,
} from "../../domain/errors/DomainError";
import { IEvento } from "../../domain/models/IEvento";
import { IUsuario } from "../../domain/models/IUsuario";
import { ICreateEvento } from "../../domain/use_cases/eventos/CreateEvento";
import { IDeleteEvento } from "../../domain/use_cases/eventos/DeleteEvento";
import { IGetAllEventos } from "../../domain/use_cases/eventos/GetAllEventos";
import { IUpdateEvento } from "../../domain/use_cases/eventos/UpdateEvento";
import {
  CreateEventoParams,
  UpdateEventoParams,
} from "../../domain/use_cases/eventos/types";
import { useAuth } from "../context/AuthContext";

export type EventoUseCases = {
  getAllEventos: IGetAllEventos;
  createEvento: ICreateEvento;
  updateEvento: IUpdateEvento;
  deleteEvento: IDeleteEvento;
};

interface EventosState {
  eventos: IEvento[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
}

export const useEventosViewModel = (eventoUseCases: EventoUseCases) => {
  const { user } = useAuth();

  const [state, setState] = useState<EventosState>({
    eventos: [],
    isLoading: true,
    isSubmitting: false,
    error: null,
  });

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const loadEventos = useCallback(
    async (startDate?: string, endDate?: string) => {
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
        const eventos = await eventoUseCases.getAllEventos.execute(
          user,
          startDate,
          endDate,
        );
        setState((prev) => ({ ...prev, eventos, isLoading: false }));
      } catch (err) {
        console.error("Erro no loadEventos:", err);
        setState((prev) => ({
          ...prev,
          error: "Ocorreu um erro ao carregar os eventos.",
          isLoading: false,
          eventos: [],
        }));
      }
    },
    [user, eventoUseCases.getAllEventos],
  );

  useEffect(() => {
    loadEventos();
  }, [loadEventos, refreshTrigger]);

  const refreshEventos = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const createEvento = useCallback(
    async (data: CreateEventoParams): Promise<IEvento | undefined> => {
      if (!user) return undefined;
      setState((prev) => ({ ...prev, isSubmitting: true, error: null }));
      try {
        const evento = await eventoUseCases.createEvento.execute(user, data);
        refreshEventos();
        return evento;
      } catch (err) {
        let errorMessage = "Falha ao criar evento.";
        if (err instanceof ValidationError) errorMessage = err.message;
        else if (err instanceof UserNotAuthorizedError)
          errorMessage = "Você não tem permissão para criar eventos.";
        else if (err instanceof DomainError) errorMessage = err.message;
        console.error("Erro no createEvento:", err);
        setState((prev) => ({ ...prev, error: errorMessage }));
        return undefined;
      } finally {
        setState((prev) => ({ ...prev, isSubmitting: false }));
      }
    },
    [user, eventoUseCases.createEvento, refreshEventos],
  );

  const updateEvento = useCallback(
    async (data: UpdateEventoParams): Promise<IEvento | undefined> => {
      if (!user) return undefined;
      setState((prev) => ({ ...prev, isSubmitting: true, error: null }));
      try {
        const evento = await eventoUseCases.updateEvento.execute(user, data);
        refreshEventos();
        return evento;
      } catch (err) {
        let errorMessage = "Falha ao atualizar evento.";
        if (err instanceof ValidationError) errorMessage = err.message;
        else if (err instanceof UserNotAuthorizedError)
          errorMessage = "Você não tem permissão para editar eventos.";
        else if (err instanceof DomainError) errorMessage = err.message;
        console.error("Erro no updateEvento:", err);
        setState((prev) => ({ ...prev, error: errorMessage }));
        return undefined;
      } finally {
        setState((prev) => ({ ...prev, isSubmitting: false }));
      }
    },
    [user, eventoUseCases.updateEvento, refreshEventos],
  );

  const deleteEvento = useCallback(
    async (eventoId: string): Promise<boolean> => {
      if (!user) return false;
      setState((prev) => ({ ...prev, isSubmitting: true, error: null }));
      try {
        await eventoUseCases.deleteEvento.execute(user, eventoId);
        refreshEventos();
        return true;
      } catch (err) {
        let errorMessage = "Falha ao excluir evento.";
        if (err instanceof UserNotAuthorizedError)
          errorMessage = "Apenas administradores podem excluir eventos.";
        else if (err instanceof DomainError) errorMessage = err.message;
        console.error("Erro no deleteEvento:", err);
        setState((prev) => ({ ...prev, error: errorMessage }));
        return false;
      } finally {
        setState((prev) => ({ ...prev, isSubmitting: false }));
      }
    },
    [user, eventoUseCases.deleteEvento, refreshEventos],
  );

  // Função auxiliar: verifica se o usuário logado é do setor do evento
  const isEventoDoSetor = useCallback(
    (evento: IEvento, currentUser: IUsuario): boolean => {
      if (!currentUser.localizacao_id || !evento.localizacao_id) return false;
      return evento.localizacao_id === currentUser.localizacao_id;
    },
    [],
  );

  return {
    state,
    loadEventos,
    refreshEventos,
    createEvento,
    updateEvento,
    deleteEvento,
    isEventoDoSetor,
  };
};

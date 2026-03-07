import { useCallback, useEffect, useState } from 'react';
import { ICompromissoPessoal } from '../../domain/models/ICompromissoPessoal';
import { IGetAllCompromissos } from '../../domain/use_cases/compromissos/GetAllCompromissos';
import { ICreateCompromisso } from '../../domain/use_cases/compromissos/CreateCompromisso';
import { IUpdateCompromisso } from '../../domain/use_cases/compromissos/UpdateCompromisso';
import { IDeleteCompromisso } from '../../domain/use_cases/compromissos/DeleteCompromisso';
import { CreateCompromissoParams, UpdateCompromissoParams } from '../../domain/use_cases/compromissos/types';
import { useAuth } from '../context/AuthContext';

export type CompromissoUseCases = {
  getAll: IGetAllCompromissos;
  create: ICreateCompromisso;
  update: IUpdateCompromisso;
  delete: IDeleteCompromisso;
};

interface CompromissosState {
  compromissos: ICompromissoPessoal[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
}

export const useCompromissosViewModel = (
  useCases: CompromissoUseCases,
  startDate?: string,
  endDate?: string,
) => {
  const { user } = useAuth();

  const [state, setState] = useState<CompromissosState>({
    compromissos: [],
    isLoading: true,
    isSubmitting: false,
    error: null,
  });

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshCompromissos = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const loadCompromissos = useCallback(async () => {
    if (!user) {
      setState((prev) => ({ ...prev, isLoading: false, error: 'Usuário não autenticado.' }));
      return;
    }
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const compromissos = await useCases.getAll.execute(user.id, startDate, endDate);
      setState((prev) => ({ ...prev, compromissos, isLoading: false }));
    } catch (err) {
      console.error('Erro no loadCompromissos:', err);
      setState((prev) => ({
        ...prev,
        error: 'Ocorreu um erro ao carregar os compromissos.',
        isLoading: false,
        compromissos: [],
      }));
    }
  }, [user, useCases.getAll, startDate, endDate, refreshTrigger]);

  useEffect(() => {
    loadCompromissos();
  }, [loadCompromissos]);

  const createCompromisso = useCallback(
    async (data: CreateCompromissoParams): Promise<ICompromissoPessoal | undefined> => {
      if (!user) return undefined;
      setState((prev) => ({ ...prev, isSubmitting: true, error: null }));
      try {
        const compromisso = await useCases.create.execute(user.id, data);
        refreshCompromissos();
        return compromisso;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Falha ao criar compromisso.';
        console.error('Erro no createCompromisso:', err);
        setState((prev) => ({ ...prev, error: msg }));
        return undefined;
      } finally {
        setState((prev) => ({ ...prev, isSubmitting: false }));
      }
    },
    [user, useCases.create, refreshCompromissos],
  );

  const updateCompromisso = useCallback(
    async (data: UpdateCompromissoParams): Promise<ICompromissoPessoal | undefined> => {
      if (!user) return undefined;
      setState((prev) => ({ ...prev, isSubmitting: true, error: null }));
      try {
        const compromisso = await useCases.update.execute(data);
        refreshCompromissos();
        return compromisso;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Falha ao atualizar compromisso.';
        console.error('Erro no updateCompromisso:', err);
        setState((prev) => ({ ...prev, error: msg }));
        return undefined;
      } finally {
        setState((prev) => ({ ...prev, isSubmitting: false }));
      }
    },
    [user, useCases.update, refreshCompromissos],
  );

  const deleteCompromisso = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) return false;
      setState((prev) => ({ ...prev, isSubmitting: true, error: null }));
      try {
        await useCases.delete.execute(id);
        refreshCompromissos();
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Falha ao excluir compromisso.';
        console.error('Erro no deleteCompromisso:', err);
        setState((prev) => ({ ...prev, error: msg }));
        return false;
      } finally {
        setState((prev) => ({ ...prev, isSubmitting: false }));
      }
    },
    [user, useCases.delete, refreshCompromissos],
  );

  return {
    state,
    loadCompromissos,
    refreshCompromissos,
    createCompromisso,
    updateCompromisso,
    deleteCompromisso,
  };
};
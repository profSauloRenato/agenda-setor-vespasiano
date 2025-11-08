// src/presentation/view_models/CargosViewModel.ts

import { useCallback, useEffect, useState } from 'react';
import { UserNotAuthorizedError } from '../../domain/errors/DomainError';
import { ICargo } from '../../domain/models/ICargo';
import { CreateCargoParams, ICreateCargo } from '../../domain/use_cases/cargos/CreateCargo';
import { IDeleteCargo } from '../../domain/use_cases/cargos/DeleteCargo'; // <-- NOVO IMPORT
import { IGetCargos } from '../../domain/use_cases/cargos/GetCargos';
import { IUpdateCargo } from '../../domain/use_cases/cargos/UpdateCargo'; // <-- NOVO IMPORT
import { useAuth } from '../context/AuthContext'; // Para obter o usuário logado

// --- NOVOS TIPOS DE USE CASES ---
// Define todos os Use Cases de Cargo que este ViewModel irá usar
export type CargoUseCases = {
  getCargos: IGetCargos;
  createCargo: ICreateCargo;
  updateCargo: IUpdateCargo; // <-- Novo
  deleteCargo: IDeleteCargo; // <-- Novo
};

// --- 1. DEFINIÇÃO DE ESTADO ---
interface CargosState {
  cargos: ICargo[];
  isLoading: boolean;
  error: string | null;
  // Usado para forçar a recarga da lista após um CRUD
  refreshKey: number; 
}

/**
 * Hook customizado que atua como o ViewModel para a tela de gerenciamento de Cargos.
 * Ele gerencia o ciclo de vida dos dados e trata erros de domínio.
 */
// O hook agora aceita um objeto com todos os Use Cases de Cargo
export const useCargosViewModel = (cargoUseCases: CargoUseCases) => {
  
  // Obtém o usuário logado do AuthContext. Essencial para a regra de segurança do Use Case.
  const { user } = useAuth();
  
  const [state, setState] = useState<CargosState>({
    cargos: [],
    isLoading: true,
    error: null,
    refreshKey: 0,
  });

  // --- 2. LÓGICA DE CARREGAMENTO DE DADOS (READ) ---

  const loadCargos = useCallback(async () => {
    // ⚠️ Se o usuário não estiver carregado, não prossegue
    if (!user) {
        setState(prev => ({ ...prev, isLoading: false, error: "Usuário não autenticado." }));
        return;
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Chama o Use Case de Leitura
      const cargos = await cargoUseCases.getCargos.execute(user); 

      setState(prev => ({ 
        ...prev, 
        cargos, 
        isLoading: false,
      }));

    } catch (err) {
      let errorMessage = "Ocorreu um erro ao carregar os cargos.";
      
      // TRATAMENTO DE ERRO DE DOMÍNIO (Permissão)
      if (err instanceof UserNotAuthorizedError) {
        errorMessage = "Acesso Negado. Apenas administradores podem gerenciar cargos.";
      } else if (err instanceof Error) {
        errorMessage = `Erro de sistema: ${err.message}`;
      }
      
      console.error("Erro no loadCargos:", err);
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isLoading: false,
        cargos: [] // Limpa a lista em caso de erro
      }));
    }
  }, [user, cargoUseCases.getCargos]); // Recarrega se o usuário ou o Use Case mudar

  // Efeito para carregar os dados na montagem do componente e sempre que refreshKey mudar
  useEffect(() => {
    loadCargos();
  }, [loadCargos, state.refreshKey]); 
  
  // --- 3. EXPOSIÇÃO DE MÉTODOS DE AÇÃO (CRUD) ---

  // Método para forçar a recarga após uma ação de CRUD
  const refreshCargos = () => {
    setState(prev => ({ ...prev, refreshKey: prev.refreshKey + 1 }));
  };

  /**
   * Use Case: Cria um novo cargo no sistema.
   * @param cargoData - O nome e a descrição do novo cargo.
   * @returns O cargo recém-criado (com ID gerado) ou undefined em caso de falha.
   */
  const createCargo = useCallback(async (cargoData: CreateCargoParams): Promise<ICargo | undefined> => {
    
    if (!user) {
      setState(prev => ({ ...prev, error: "Sessão inválida. Faça login novamente." }));
      return undefined;
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Chama o Use Case de Criação (Que já possui a verificação RBAC)
      const novoCargo = await cargoUseCases.createCargo.execute(
        user,
        cargoData
      );

      // Atualiza a lista localmente adicionando o novo cargo
      setState(prev => ({ 
        ...prev, 
        cargos: [novoCargo, ...prev.cargos], // Adiciona o novo no início
        error: null,
      }));
      
      return novoCargo;

    } catch (err) {
      let errorMessage = "Falha ao criar cargo.";
      
      if (err instanceof UserNotAuthorizedError) {
        errorMessage = "Acesso Negado. Apenas administradores podem criar cargos.";
      } else if (err instanceof Error) {
        errorMessage = `Erro: ${err.message}`; // Propaga o erro de unicidade (nome duplicado)
      }

      console.error("Erro no createCargo:", err);
      setState(prev => ({ ...prev, error: errorMessage }));
      return undefined;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [user, cargoUseCases.createCargo]);

  /**
   * Use Case: Atualiza um cargo existente.
   * @param cargoData - O objeto ICargo completo com o ID e as novas informações.
   * @returns O cargo atualizado ou undefined em caso de falha.
   */
  const updateCargo = useCallback(async (cargoData: ICargo): Promise<ICargo | undefined> => {
    
    if (!user) {
      setState(prev => ({ ...prev, error: "Sessão inválida. Faça login novamente." }));
      return undefined;
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Chama o Use Case de Atualização
      const cargoAtualizado = await cargoUseCases.updateCargo.execute(user, cargoData);

      // Atualiza a lista: Mapeia para substituir o cargo antigo pelo atualizado
      setState(prev => ({ 
        ...prev, 
        cargos: prev.cargos.map(cargo => 
          cargo.id === cargoAtualizado.id ? cargoAtualizado : cargo
        ),
        error: null,
      }));
      
      return cargoAtualizado;

    } catch (err) {
      let errorMessage = "Falha ao atualizar cargo.";
      
      if (err instanceof UserNotAuthorizedError) {
        errorMessage = "Acesso Negado. Apenas administradores podem atualizar cargos.";
      } else if (err instanceof Error) {
        errorMessage = `Erro: ${err.message}`; // Propaga erros como nome duplicado
      }

      console.error("Erro no updateCargo:", err);
      setState(prev => ({ ...prev, error: errorMessage }));
      return undefined;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [user, cargoUseCases.updateCargo]);

  /**
   * Use Case: Exclui um cargo existente.
   * @param cargoId - O ID do cargo a ser excluído.
   * @returns true se a exclusão foi bem-sucedida, false caso contrário.
   */
  const deleteCargo = useCallback(async (cargoId: string): Promise<boolean> => {
    
    if (!user) {
      setState(prev => ({ ...prev, error: "Sessão inválida. Faça login novamente." }));
      return false;
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Chama o Use Case de Exclusão
      await cargoUseCases.deleteCargo.execute(user, cargoId);

      // Atualiza a lista: Remove o cargo da lista
      setState(prev => ({ 
        ...prev, 
        cargos: prev.cargos.filter(cargo => cargo.id !== cargoId),
        error: null,
      }));
      
      return true;

    } catch (err) {
      let errorMessage = "Falha ao excluir cargo.";
      
      if (err instanceof UserNotAuthorizedError) {
        errorMessage = "Acesso Negado. Apenas administradores podem excluir cargos.";
      } else if (err instanceof Error) {
        // Propaga erros como "Cargo está vinculado a usuários" (foreign key violation)
        errorMessage = `Erro: ${err.message}`; 
      }

      console.error("Erro no deleteCargo:", err);
      setState(prev => ({ ...prev, error: errorMessage }));
      return false;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [user, cargoUseCases.deleteCargo]);

  // O ViewModel retorna o estado e as funções para a View (Tela)
  return {
    state,
    loadCargos,
    refreshCargos,
    createCargo, 
    updateCargo, // <-- NOVO MÉTODO EXPOSTO
    deleteCargo, // <-- NOVO MÉTODO EXPOSTO
  };
};
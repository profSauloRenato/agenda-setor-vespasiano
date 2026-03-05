// src/presentation/view_models/LocalizacoesViewModel.ts

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DomainError,
  UserNotAuthorizedError,
  ValidationError,
} from "../../domain/errors/DomainError";
import {
  ILocalizacao,
  LocalizacaoTipo,
  LOCALIZACAO_TIPOS_LISTA,
} from "../../domain/models/ILocalizacao";
import { ICreateLocalizacao } from "../../domain/use_cases/localizacoes/CreateLocalizacao";
import { IDeleteLocalizacao } from "../../domain/use_cases/localizacoes/DeleteLocalizacao";
import { IGetAllLocalizacoes } from "../../domain/use_cases/localizacoes/GetAllLocalizacoes";
import { IUpdateLocalizacao } from "../../domain/use_cases/localizacoes/UpdateLocalizacao";
import { useAuth } from "../context/AuthContext";

export interface ILocalizacaoNode extends ILocalizacao {
  children?: ILocalizacaoNode[];
  level: number;
}

export interface ILocalizacaoViewModelNode extends ILocalizacaoNode {
  nome_completo: string;
  parent_nome?: string | null;
  administracao_nome?: string | null;
  regional_nome?: string | null;
  sede_congregacao_id: string | null;
  nome_congregacao_sede: string | null;
}

export type LocalizacaoUseCases = {
  getLocalizacoes: IGetAllLocalizacoes;
  createLocalizacao: ICreateLocalizacao;
  updateLocalizacao: IUpdateLocalizacao;
  deleteLocalizacao: IDeleteLocalizacao;
};

interface LocalizacoesState {
  localizacoes: ILocalizacao[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
}

export const useLocalizacoesViewModel = (
  localizacaoUseCases: LocalizacaoUseCases,
) => {
  const { user } = useAuth();

  const [state, setState] = useState<LocalizacoesState>({
    localizacoes: [],
    isLoading: true,
    isSubmitting: false,
    error: null,
  });

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const loadLocalizacoes = useCallback(async () => {
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
      const localizacoes =
        await localizacaoUseCases.getLocalizacoes.execute(user);
      setState((prev) => ({ ...prev, localizacoes, isLoading: false }));
    } catch (err) {
      let errorMessage = "Ocorreu um erro ao carregar as localizações.";
      if (err instanceof UserNotAuthorizedError) {
        errorMessage =
          "Você não tem permissão para visualizar esta lista (Apenas Admin).";
      }
      console.error("Erro no loadLocalizacoes:", err);
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
        localizacoes: [],
      }));
    }
  }, [user, localizacaoUseCases.getLocalizacoes]);

  useEffect(() => {
    loadLocalizacoes();
  }, [loadLocalizacoes, refreshTrigger]);

  const refreshLocalizacoes = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const flattenedHierarchy = useMemo((): ILocalizacaoViewModelNode[] => {
    const locationsMap = new Map(
      state.localizacoes.map((loc) => [
        loc.id,
        {
          ...loc,
          children: [],
          level: 0,
          nome_completo: loc.nome,
          parent_nome: null,
          administracao_nome: null,
          regional_nome: null,
          sede_congregacao_id: loc.sede_congregacao_id || null,
          nome_congregacao_sede: null,
        } as ILocalizacaoViewModelNode,
      ]),
    );

    const rootNodes: ILocalizacaoViewModelNode[] = [];
    const resultList: ILocalizacaoViewModelNode[] = [];

    locationsMap.forEach((node) => {
      const sedeId = node.sede_congregacao_id || null;
      if (sedeId) {
        const sede = locationsMap.get(sedeId);
        if (sede && sede.tipo === "Congregação") {
          node.nome_congregacao_sede = sede.nome;
        }
      }
      if (node.parent_id && locationsMap.has(node.parent_id)) {
        const parent = locationsMap.get(
          node.parent_id,
        )! as ILocalizacaoViewModelNode;
        parent.children!.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    const processNode = (node: ILocalizacaoViewModelNode, level: number) => {
      node.level = level;
      const indent = "— ".repeat(level);
      const infoSuffix =
        node.tipo === "Congregação"
          ? `(${node.tipo})`
          : node.nome_congregacao_sede
            ? `(Sede: ${node.nome_congregacao_sede})`
            : `(Sede: Não Definida - ${node.tipo})`;
      node.nome_completo = `${indent}${node.nome} ${infoSuffix}`;
      resultList.push(node);
      node
        .children!.sort((a, b) => a.nome.localeCompare(b.nome))
        .forEach((child) =>
          processNode(child as ILocalizacaoViewModelNode, level + 1),
        );
    };

    rootNodes
      .sort((a, b) => a.nome.localeCompare(b.nome))
      .forEach((root) => processNode(root, 0));

    return resultList;
  }, [state.localizacoes]);

  const congregacoesForSelect = useMemo(() => {
    return state.localizacoes
      .filter((loc) => loc.tipo === "Congregação")
      .map((cong) => ({ value: cong.id, label: cong.nome }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [state.localizacoes]);

  const getFullHierarchyNames = useCallback(
    (localizacao: ILocalizacaoViewModelNode): ILocalizacaoViewModelNode => {
      const CONGREGACAO_TIPO = LOCALIZACAO_TIPOS_LISTA.find(
        (t) => t === "Congregação",
      );
      if (localizacao.tipo !== CONGREGACAO_TIPO) return localizacao;

      let currentParentId = localizacao.parent_id;
      const hierarchy = {
        administracao_nome: null as string | null,
        regional_nome: null as string | null,
      };
      const locationsMap = new Map<string, ILocalizacao>(
        state.localizacoes.map((loc) => [loc.id, loc]),
      );

      const setor = currentParentId
        ? locationsMap.get(currentParentId)
        : undefined;

      if (setor && setor.parent_id) {
        const administracao = locationsMap.get(setor.parent_id);
        if (administracao) {
          hierarchy.administracao_nome = administracao.nome;
          currentParentId = administracao.parent_id;
        }
      }

      if (hierarchy.administracao_nome && currentParentId) {
        const regional = locationsMap.get(currentParentId);
        if (regional) hierarchy.regional_nome = regional.nome;
      }

      const hierarchyNames = [
        hierarchy.regional_nome,
        hierarchy.administracao_nome,
        setor?.nome,
      ].filter(Boolean) as string[];
      const nomeCompletoHierarquico = [
        ...hierarchyNames,
        localizacao.nome,
      ].join(" - ");

      return {
        ...localizacao,
        ...hierarchy,
        parent_nome: setor ? setor.nome : null,
        nome_completo: nomeCompletoHierarquico,
        nome_congregacao_sede: localizacao.nome_congregacao_sede,
      } as ILocalizacaoViewModelNode;
    },
    [state.localizacoes],
  );

  const handleSubmission = useCallback(
    async (
      data: Omit<ILocalizacao, "id"> | ILocalizacao,
      isEditing: boolean,
    ): Promise<ILocalizacao | undefined> => {
      if (!user) {
        setState((prev) => ({
          ...prev,
          error: "Sessão inválida. Faça login novamente.",
        }));
        return undefined;
      }
      setState((prev) => ({ ...prev, isSubmitting: true, error: null }));
      const actionType = isEditing ? "atualizar" : "criar";
      try {
        let result: ILocalizacao;
        if (isEditing) {
          result = await localizacaoUseCases.updateLocalizacao.execute(
            data as ILocalizacao,
            user,
          );
        } else {
          result = await localizacaoUseCases.createLocalizacao.execute(
            data as Omit<ILocalizacao, "id">,
            user,
          );
        }
        refreshLocalizacoes();
        return result;
      } catch (err) {
        let errorMessage = `Falha ao ${actionType} localização.`;
        if (err instanceof ValidationError) {
          errorMessage = `Erro de Validação: ${err.message}`;
        } else if (err instanceof UserNotAuthorizedError) {
          errorMessage =
            "Você não tem permissão de administrador para esta ação.";
        } else if (err instanceof DomainError) {
          errorMessage = err.message;
        }
        console.error(`Erro na submissão de Localização (${actionType}):`, err);
        setState((prev) => ({ ...prev, error: errorMessage }));
        return undefined;
      } finally {
        setState((prev) => ({ ...prev, isSubmitting: false }));
      }
    },
    [user, localizacaoUseCases, refreshLocalizacoes],
  );

  const createLocalizacao = useCallback(
    (data: Omit<ILocalizacao, "id">) => handleSubmission(data, false),
    [handleSubmission],
  );

  const updateLocalizacao = useCallback(
    (data: ILocalizacao) => handleSubmission(data, true),
    [handleSubmission],
  );

  const deleteLocalizacao = useCallback(
    async (localizacaoId: string): Promise<boolean> => {
      if (!user) {
        setState((prev) => ({
          ...prev,
          error: "Sessão inválida. Faça login novamente.",
        }));
        return false;
      }
      setState((prev) => ({ ...prev, isSubmitting: true, error: null }));
      try {
        await localizacaoUseCases.deleteLocalizacao.execute(
          localizacaoId,
          user,
        );
        refreshLocalizacoes();
        return true;
      } catch (err) {
        let errorMessage = "Falha ao excluir localização.";
        if (err instanceof UserNotAuthorizedError) {
          errorMessage =
            "Você não tem permissão de administrador para esta ação.";
        } else if (err instanceof DomainError) {
          errorMessage = err.message;
        }
        console.error("Erro no deleteLocalizacao:", err);
        setState((prev) => ({ ...prev, error: errorMessage }));
        return false;
      } finally {
        setState((prev) => ({ ...prev, isSubmitting: false }));
      }
    },
    [user, localizacaoUseCases.deleteLocalizacao, refreshLocalizacoes],
  );

  return {
    state: { ...state, localizacoes: flattenedHierarchy },
    allLocalizacoes: state.localizacoes,
    congregacoesForSelect,
    refreshLocalizacoes,
    createLocalizacao,
    updateLocalizacao,
    deleteLocalizacao,
    getFullHierarchyNames,
  };
};

// src/presentation/view_models/UsuariosViewModel.ts

import { ICargo } from "../../domain/models/ICargo";
import { ILocalizacao } from "../../domain/models/ILocalizacao";
import { IUsuario } from "../../domain/models/IUsuario";
import { IGetAllCargos } from "../../domain/use_cases/cargos/GetAllCargos";
import { IGetAllLocalizacoes } from "../../domain/use_cases/localizacoes/GetAllLocalizacoes";
import {
  CreateUsuarioParams,
  ICreateUsuario,
} from "../../domain/use_cases/usuarios/CreateUsuario";
import { IDeleteUsuario } from "../../domain/use_cases/usuarios/DeleteUsuario";
import { IGetUsuarios } from "../../domain/use_cases/usuarios/GetUsuarios";
import { IUpdateUsuario } from "../../domain/use_cases/usuarios/UpdateUsuario";
import { IUsuarioService } from "../../domain/services/IUsuarioService";

export interface UsuariosState {
  usuarios: IUsuario[];
  isLoading: boolean;
  error: string | null;
  localizacoesDisponiveis: ILocalizacao[];
  cargosDisponiveis: ICargo[];
}

type UsuarioDataToCreate = Pick<
  IUsuario,
  "nome" | "email" | "localizacao_id" | "is_admin"
>;

export class UsuariosViewModel {
  private _state: UsuariosState = {
    usuarios: [],
    isLoading: false,
    error: null,
    localizacoesDisponiveis: [],
    cargosDisponiveis: [],
  };

  private onStateChange?: () => void;

  public get state(): UsuariosState {
    return this._state;
  }

  public setOnStateChange(callback: () => void) {
    this.onStateChange = callback;
  }

  private setState(partial: Partial<UsuariosState>) {
    this._state = { ...this._state, ...partial };
    this.onStateChange?.();
  }

  constructor(
    private getLocalizacoesUseCase: IGetAllLocalizacoes,
    private getCargosUseCase: IGetAllCargos,
    private getUsuariosUseCase: IGetUsuarios,
    private createUsuarioUseCase: ICreateUsuario,
    private updateUsuarioUseCase: IUpdateUsuario,
    private deleteUsuarioUseCase: IDeleteUsuario,
    private usuarioService: IUsuarioService,
  ) {}

  public async loadReferenceData(usuarioLogado: IUsuario): Promise<void> {
    this.setState({ isLoading: true, error: null });
    try {
      const [localizacoes, cargos] = await Promise.all([
        this.getLocalizacoesUseCase.execute(usuarioLogado),
        this.getCargosUseCase.execute(usuarioLogado),
      ]);
      this.setState({ localizacoesDisponiveis: localizacoes, cargosDisponiveis: cargos, isLoading: false });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro ao carregar dados de referência.";
      this.setState({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  }

  public async loadUsuarios(usuarioLogado: IUsuario): Promise<void> {
    this.setState({ isLoading: true, error: null });
    try {
      const fetchedUsuarios = await this.getUsuariosUseCase.execute(usuarioLogado);
      this.setState({ usuarios: fetchedUsuarios, isLoading: false });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro ao carregar usuários.";
      this.setState({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  }

  public async handleCreateUsuario(
    adminUser: IUsuario,
    novoUsuario: UsuarioDataToCreate,
    cargosIds: string[],
    senha: string,
  ): Promise<void> {
    this.setState({ isLoading: true, error: null });
    try {
      const dataToCreate: CreateUsuarioParams = {
        ...novoUsuario,
        cargosIds,
        localizacao_id: novoUsuario.localizacao_id,
        senha,
      };
      await this.createUsuarioUseCase.execute(adminUser, dataToCreate);
      await this.loadUsuarios(adminUser);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Falha ao criar o novo membro.";
      this.setState({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  }

  /**
   * Atualiza dados básicos, cargos e, opcionalmente, a senha do usuário.
   * novaSenha só é enviada ao banco se for uma string não vazia.
   */
  public async handleUpdateUsuario(
    usuarioLogado: IUsuario,
    usuarioToUpdate: IUsuario,
    novosCargosIds: string[],
    novaSenha?: string,
  ): Promise<void> {
    this.setState({ error: null });
    try {
      await this.updateUsuarioUseCase.execute(usuarioLogado, {
        usuario: usuarioToUpdate,
        novosCargosIds,
      });

      if (novaSenha && novaSenha.trim().length >= 6) {
        await this.usuarioService.updateSenha(usuarioToUpdate.id, novaSenha.trim());
      }

      await this.loadUsuarios(usuarioLogado);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro ao atualizar usuário.";
      this.setState({ error: msg });
      throw new Error(msg);
    }
  }

  public async handleDeleteUsuario(
    executor: IUsuario,
    userId: string,
  ): Promise<void> {
    this.setState({ isLoading: true, error: null });
    try {
      await this.deleteUsuarioUseCase.execute(executor, userId);
      await this.loadUsuarios(executor);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro ao deletar usuário.";
      this.setState({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  }
}
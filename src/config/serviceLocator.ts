// src/config/serviceLocator.ts

// --- Dependências da camada de Data/Infra ---
import { IAuthService } from "../domain/services/IAuthService";
import { ICargoService } from "../domain/services/ICargoService";
import { ILocalizacaoService } from "../domain/services/ILocalizacaoService";
import { IUsuarioService } from "../domain/services/IUsuarioService";

import { SupabaseAuthService } from "../data/repositories/SupabaseAuthService";
import { SupabaseLocalizacaoService } from "../infra/services/SupabaseLocalizacaoService";
import { SupabaseUsuarioService } from "../infra/services/SupabaseUsuarioService";
import { SupabaseEventoService } from "../infra/services/SupabaseEventoService";
import { SupabaseVersiculoService } from "../infra/services/SupabaseVersiculoService";
import { SupabaseMensagemAdminService } from "../infra/services/SupabaseMensagemAdminService";
import { NotificationService } from "../infra/services/NotificationService";

// Compromissos Pessoais
import { SupabaseCompromissoPessoalService } from '../infra/services/SupabaseCompromissoPessoalService';
import { ICompromissoPessoalService } from '../domain/services/ICompromissoPessoalService';
import { GetAllCompromissos, IGetAllCompromissos } from '../domain/use_cases/compromissos/GetAllCompromissos';
import { CreateCompromisso, ICreateCompromisso } from '../domain/use_cases/compromissos/CreateCompromisso';
import { UpdateCompromisso, IUpdateCompromisso } from '../domain/use_cases/compromissos/UpdateCompromisso';
import { DeleteCompromisso, IDeleteCompromisso } from '../domain/use_cases/compromissos/DeleteCompromisso';
import { CompromissoUseCases } from '../presentation/view_models/CompromissosViewModel';

// --- Dependências da camada de Domain (Use Cases) ---
// Auth
import { ILoginUser, LoginUser } from "../domain/use_cases/LoginUser";
// Cargos
import {
  CreateCargo,
  ICreateCargo,
} from "../domain/use_cases/cargos/CreateCargo";
import {
  DeleteCargo,
  IDeleteCargo,
} from "../domain/use_cases/cargos/DeleteCargo";
import {
  GetAllCargos,
  IGetAllCargos,
} from "../domain/use_cases/cargos/GetAllCargos";
import {
  IUpdateCargo,
  UpdateCargo,
} from "../domain/use_cases/cargos/UpdateCargo";
// Localizacao
import {
  CreateLocalizacao, // <-- ADICIONADO
  ICreateLocalizacao, // <-- ADICIONADO
} from "../domain/use_cases/localizacoes/CreateLocalizacao"; // <-- ADICIONADO
import {
  DeleteLocalizacao, // <-- ADICIONADO
  IDeleteLocalizacao, // <-- ADICIONADO
} from "../domain/use_cases/localizacoes/DeleteLocalizacao"; // <-- ADICIONADO
import {
  GetAllLocalizacoes,
  IGetAllLocalizacoes,
} from "../domain/use_cases/localizacoes/GetAllLocalizacoes";
import {
  IUpdateLocalizacao,
  UpdateLocalizacao, // <-- ADICIONADO
} from "../domain/use_cases/localizacoes/UpdateLocalizacao"; // <-- ADICIONADO
// Usuários
import {
  CreateUsuario,
  ICreateUsuario,
} from "../domain/use_cases/usuarios/CreateUsuario";
import {
  DeleteUsuario,
  IDeleteUsuario,
} from "../domain/use_cases/usuarios/DeleteUsuario";
import {
  GetUsuarios,
  IGetUsuarios,
} from "../domain/use_cases/usuarios/GetUsuarios";
import {
  IUpdateUsuario,
  UpdateUsuario,
} from "../domain/use_cases/usuarios/UpdateUsuario";
// Eventos
import { IEventoService } from "../domain/services/IEventoService";
import {
  GetAllEventos,
  IGetAllEventos,
} from "../domain/use_cases/eventos/GetAllEventos";
import {
  CreateEvento,
  ICreateEvento,
} from "../domain/use_cases/eventos/CreateEvento";
import {
  UpdateEvento,
  IUpdateEvento,
} from "../domain/use_cases/eventos/UpdateEvento";
import {
  DeleteEvento,
  IDeleteEvento,
} from "../domain/use_cases/eventos/DeleteEvento";

// IMPORTAR O TIPO LocalizacaoUseCases (Necessário para o cast)
import { LocalizacaoUseCases } from "../domain/use_cases/localizacoes/types"; // <--- ADICIONADO

import { supabase as supabaseClient } from "./supabaseClient";

// --- Dependências da camada de Presentation (View Models) ---
import { SupabaseCargoService } from "../infra/services/SupabaseCargoService";
import { UsuariosViewModel } from "../presentation/view_models/UsuariosViewModel";

/**
 * Interface que define todos os serviços e Use Cases injetáveis.
 */
interface IServiceLocator {
  // Use Cases de Entidades
  loginUser: ILoginUser; // Use Cases de Cargos (CRUD)

  getAllCargos: IGetAllCargos;
  createCargo: ICreateCargo;
  updateCargo: IUpdateCargo;
  deleteCargo: IDeleteCargo; // Use Cases de Usuário e Localização

  getUsuarios: IGetUsuarios;
  updateUsuario: IUpdateUsuario;
  deleteUsuario: IDeleteUsuario;
  createUsuario: ICreateUsuario; // Localização

  getAllLocalizacoes: IGetAllLocalizacoes;
  createLocalizacao: ICreateLocalizacao; // <-- ADICIONADO
  updateLocalizacao: IUpdateLocalizacao; // <-- ADICIONADO
  deleteLocalizacao: IDeleteLocalizacao; // <-- ADICIONADO // View Models (Instâncias prontas)

  // Eventos
  getAllEventos: IGetAllEventos;
  createEvento: ICreateEvento;
  updateEvento: IUpdateEvento;
  deleteEvento: IDeleteEvento;
  eventoService: IEventoService;

  // Compromissos Pessoais
  compromissoPessoalService: ICompromissoPessoalService;
  getAllCompromissos: IGetAllCompromissos;
  createCompromisso: ICreateCompromisso;
  updateCompromisso: IUpdateCompromisso;
  deleteCompromisso: IDeleteCompromisso;

  usuariosViewModel: UsuariosViewModel; // Serviços de Data (Geralmente não expostos, mas úteis para testes)

  authService: IAuthService;
  cargoService: ICargoService;
  usuarioService: IUsuarioService;
  localizacaoService: ILocalizacaoService;

  versiculoService: SupabaseVersiculoService;
  mensagemAdminService: SupabaseMensagemAdminService;
  notificationService: NotificationService;
}

// -----------------------------------------------------
// 1. Inicialização dos Serviços (Camada de Data/Infra)
// -----------------------------------------------------
const authService: IAuthService = new SupabaseAuthService();
const cargoService: ICargoService = new SupabaseCargoService(supabaseClient);
const usuarioService: IUsuarioService = new SupabaseUsuarioService(
  supabaseClient,
);
const localizacaoService: ILocalizacaoService = new SupabaseLocalizacaoService(
  supabaseClient,
);

// -----------------------------------------------------
// 2. Inicialização dos Use Cases (Camada de Domínio)
// -----------------------------------------------------
const loginUser: ILoginUser = new LoginUser(authService);
const getAllCargos: IGetAllCargos = new GetAllCargos(cargoService);
const createCargo: ICreateCargo = new CreateCargo(cargoService);
const updateCargo: IUpdateCargo = new UpdateCargo(cargoService);
const deleteCargo: IDeleteCargo = new DeleteCargo(cargoService);

// Use Cases de Usuário e Localização
const createUsuario: ICreateUsuario = new CreateUsuario(usuarioService);
const getUsuarios: IGetUsuarios = new GetUsuarios(usuarioService);
const updateUsuario: IUpdateUsuario = new UpdateUsuario(usuarioService);
const deleteUsuario: IDeleteUsuario = new DeleteUsuario(usuarioService);

// Use Cases de Localização <-- ADICIONADO
const getAllLocalizacoes: IGetAllLocalizacoes = new GetAllLocalizacoes(
  localizacaoService,
);
const createLocalizacao: ICreateLocalizacao = new CreateLocalizacao( // <-- ADICIONADO
  localizacaoService,
);
const updateLocalizacao: IUpdateLocalizacao = new UpdateLocalizacao( // <-- ADICIONADO
  localizacaoService,
);
const deleteLocalizacao: IDeleteLocalizacao = new DeleteLocalizacao( // <-- ADICIONADO
  localizacaoService,
);

// Serviço de Eventos
const eventoService: IEventoService = new SupabaseEventoService(supabaseClient);
const versiculoService = new SupabaseVersiculoService(supabaseClient);
const mensagemAdminService = new SupabaseMensagemAdminService(supabaseClient);
const notificationService = new NotificationService(supabaseClient);

// Use Cases de Eventos
const getAllEventos: IGetAllEventos = new GetAllEventos(eventoService);
const createEvento: ICreateEvento = new CreateEvento(eventoService);
const updateEvento: IUpdateEvento = new UpdateEvento(eventoService);
const deleteEvento: IDeleteEvento = new DeleteEvento(eventoService);

// Serviço de Compromissos Pessoais
const compromissoPessoalService: ICompromissoPessoalService =
  new SupabaseCompromissoPessoalService(supabaseClient);

// Use Cases de Compromissos Pessoais
const getAllCompromissos: IGetAllCompromissos = new GetAllCompromissos(compromissoPessoalService);
const createCompromisso: ICreateCompromisso = new CreateCompromisso(compromissoPessoalService);
const updateCompromisso: IUpdateCompromisso = new UpdateCompromisso(compromissoPessoalService);
const deleteCompromisso: IDeleteCompromisso = new DeleteCompromisso(compromissoPessoalService);

// -----------------------------------------------------
// 3. Inicialização dos View Models (Camada de Presentation)
// -----------------------------------------------------
// ViewModel de Usuários (injetando os Use Cases necessários)
const usuariosViewModel: UsuariosViewModel = new UsuariosViewModel(
  getAllLocalizacoes,
  getAllCargos,
  getUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
);

/**
 * O objeto ServiceLocator final.
 * Contém todas as instâncias prontas para uso.
 */
export const serviceLocator: IServiceLocator = {
  // Use Cases
  loginUser,
  getAllCargos,
  createCargo,
  updateCargo,
  deleteCargo, // Use Cases de Usuário e Localização

  createUsuario,
  getUsuarios,
  updateUsuario,
  deleteUsuario, // Localização <-- ADICIONADO

  getAllLocalizacoes,
  createLocalizacao,
  updateLocalizacao,
  deleteLocalizacao, // View Models

  // Eventos
  getAllEventos,
  createEvento,
  updateEvento,
  deleteEvento,
  eventoService,

  // Compromissos Pessoais
  compromissoPessoalService,
  getAllCompromissos,
  createCompromisso,
  updateCompromisso,
  deleteCompromisso,

  usuariosViewModel, // Serviços de Data

  authService,
  cargoService,
  usuarioService,
  localizacaoService,
  versiculoService,
  mensagemAdminService,
  notificationService,
};

// -----------------------------------------------------
// 4. EXPORT: Hooks de conveniência para usar na View
// -----------------------------------------------------

// Hooks para Use Cases individuais (para CargosManager, por exemplo)
export const useLoginUseCase = () => serviceLocator.loginUser;
export const useGetAllCargosUseCase = () => serviceLocator.getAllCargos;
export const useCreateCargoUseCase = () => serviceLocator.createCargo;
export const useUpdateCargoUseCase = () => serviceLocator.updateCargo;
export const useDeleteCargoUseCase = () => serviceLocator.deleteCargo;

// Hooks para Use Cases de Localização (Individual) <-- ADICIONADO (Para resolver o erro de importação)
export const useGetAllLocalizacoesUseCase = () =>
  serviceLocator.getAllLocalizacoes;
export const useCreateLocalizacaoUseCase = () =>
  serviceLocator.createLocalizacao;
export const useUpdateLocalizacaoUseCase = () =>
  serviceLocator.updateLocalizacao;
export const useDeleteLocalizacaoUseCase = () =>
  serviceLocator.deleteLocalizacao;

// Hook para o ViewModel
export const useUsuariosViewModel = () => serviceLocator.usuariosViewModel;

// Hook para Use Cases de Localização (Agrupado) <-- CORREÇÃO APLICADA AQUI
export const useLocalizacaoUseCases = () =>
  ({
    getLocalizacoes: serviceLocator.getAllLocalizacoes,
    createLocalizacao: serviceLocator.createLocalizacao,
    updateLocalizacao: serviceLocator.updateLocalizacao,
    deleteLocalizacao: serviceLocator.deleteLocalizacao,
  }) as LocalizacaoUseCases; // <--- CASTING EXPLÍCITO APLICADO PARA RESOLVER O ERRO DE TIPAGEM

// Hook para os Use Cases de Cargo (ajustado para 'getCargos' conforme esperado pela View)
export const useCargoUseCases = () => ({
  getCargos: serviceLocator.getAllCargos,
  createCargo: serviceLocator.createCargo,
  updateCargo: serviceLocator.updateCargo,
  deleteCargo: serviceLocator.deleteCargo,
});

// Hooks para Use Cases de Eventos
export const useEventoUseCases = () => ({
  getAllEventos: serviceLocator.getAllEventos,
  createEvento: serviceLocator.createEvento,
  updateEvento: serviceLocator.updateEvento,
  deleteEvento: serviceLocator.deleteEvento,
});

// Hook para Use Cases de Compromissos Pessoais
export const useCompromissoUseCases = (): CompromissoUseCases => ({
  getAll: serviceLocator.getAllCompromissos,
  create: serviceLocator.createCompromisso,
  update: serviceLocator.updateCompromisso,
  delete: serviceLocator.deleteCompromisso,
});

// HOOK DE CONVENIÊNCIA para injeção completa na tela UsuariosManagerScreen
export const useUsuarioManagerDependencies = () => ({
  usuariosViewModel: serviceLocator.usuariosViewModel,
  cargoUseCases: useCargoUseCases(),
  localizacaoUseCases: useLocalizacaoUseCases(),
});

export const useVersiculoService = () => serviceLocator.versiculoService;
export const useMensagemAdminService = () =>
  serviceLocator.mensagemAdminService;
export const useNotificationService = () => serviceLocator.notificationService;
export const useUsuarioService = () => serviceLocator.usuarioService;

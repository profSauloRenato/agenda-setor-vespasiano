// src/config/serviceLocator.ts

// Dependências da camada de Data
import { IAuthService } from "../data/protocols/IAuthService";
import { ICargoService } from "../data/protocols/ICargoService";
import { SupabaseAuthService } from "../data/repositories/SupabaseAuthService";
import { SupabaseCargoService } from "../data/repositories/SupabaseCargoService";

// Dependências da camada de Domain (Use Cases)
// Auth
import { ILoginUser, LoginUser } from "../domain/use_cases/LoginUser"; // Corrigido o path de import
// Cargos
import { CreateCargo, ICreateCargo } from '../domain/use_cases/cargos/CreateCargo';
import { DeleteCargo, IDeleteCargo } from "../domain/use_cases/cargos/DeleteCargo"; // <-- NOVO: DeleteCargo (Próximo Passo)
import { GetCargos, IGetCargos } from "../domain/use_cases/cargos/GetCargos";
import { IUpdateCargo, UpdateCargo } from "../domain/use_cases/cargos/UpdateCargo"; // <-- NOVO: UpdateCargo

/**
 * Interface que define todos os serviços e Use Cases injetáveis.
 * Ajuda o TypeScript a garantir o contrato do ServiceLocator.
 */
interface IServiceLocator {
  // Use Cases de Entidades
  loginUser: ILoginUser;
  
  // Use Cases de Cargos (CRUD)
  getCargos: IGetCargos;
  createCargo: ICreateCargo;
  updateCargo: IUpdateCargo;
  deleteCargo: IDeleteCargo; // <-- Novo
  
  // Serviços de Data (Geralmente não expostos, mas úteis para testes)
  authService: IAuthService;
  cargoService: ICargoService;
}

// 1. Inicialização dos Serviços (Camada de Data)
// Usamos a implementação concreta (Supabase)
const authService: IAuthService = new SupabaseAuthService();
const cargoService: ICargoService = new SupabaseCargoService();

// 2. Inicialização dos Use Cases (Camada de Domínio)
// Os Use Cases recebem o Serviço de Data como dependência.
const loginUser: ILoginUser = new LoginUser(authService);
const getCargos: IGetCargos = new GetCargos(cargoService);
const createCargo: ICreateCargo = new CreateCargo(cargoService);
const updateCargo: IUpdateCargo = new UpdateCargo(cargoService); // <-- Instância de UpdateCargo
const deleteCargo: IDeleteCargo = new DeleteCargo(cargoService); // <-- Instância de DeleteCargo (A ser criado)

/**
 * O objeto ServiceLocator final.
 * Contém todas as instâncias prontas para uso.
 */
export const serviceLocator: IServiceLocator = {
  // Use Cases
  loginUser,
  getCargos,
  createCargo,
  updateCargo, // <-- Exportado
  deleteCargo, // <-- Exportado
  
  // Serviços de Data
  authService,
  cargoService,
};

// EXPORT: Hooks de conveniência para usar os Use Cases na View
// Isso evita que a View precise importar o serviceLocator inteiro.
export const useLoginUseCase = () => serviceLocator.loginUser;
export const useGetCargosUseCase = () => serviceLocator.getCargos;
export const useCreateCargoUseCase = () => serviceLocator.createCargo;
export const useUpdateCargoUseCase = () => serviceLocator.updateCargo;
export const useDeleteCargoUseCase = () => serviceLocator.deleteCargo; // <-- Novo Hook
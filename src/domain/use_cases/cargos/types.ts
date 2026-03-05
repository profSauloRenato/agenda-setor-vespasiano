// src/domain/use_cases/cargos/types.ts

import { ICreateCargo } from "./CreateCargo";
import { IDeleteCargo } from "./DeleteCargo";
import { IGetAllCargos } from "./GetAllCargos";
import { IUpdateCargo } from "./UpdateCargo";

/**
 * Agrupamento de todas as interfaces de Use Cases relacionadas à entidade Cargo.
 * Usado para injeção de dependência em ViewModels e Telas.
 */
export interface CargoUseCases {
  getCargos: IGetAllCargos;
  createCargo: ICreateCargo;
  updateCargo: IUpdateCargo;
  deleteCargo: IDeleteCargo;
}

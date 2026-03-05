// src/domain/services/ICargoService.ts

import { ICargo } from "../models/ICargo";

export interface ICargoService {
  getAllCargos(): Promise<ICargo[]>;
  createCargo(cargoData: Omit<ICargo, "id">): Promise<ICargo>;
  updateCargo(cargo: ICargo): Promise<ICargo>;
  deleteCargo(id: string): Promise<void>;
}

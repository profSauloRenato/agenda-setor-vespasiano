// src/domain/use_cases/cargos/GetAllCargos.ts

import { ICargoService } from "../../services/ICargoService";
import { ICargo } from "../../models/ICargo";
import { IUsuario } from "../../models/IUsuario";

export interface IGetAllCargos {
  /**
   * Executa a busca de todos os cargos.
   * @param currentUser O usuário logado (opcional — usado apenas para log/auditoria).
   */
  execute(currentUser?: IUsuario): Promise<ICargo[]>;
}

/**
 * Use Case para obter a lista completa de cargos.
 * REGRA DE NEGÓCIO: Qualquer usuário autenticado pode listar cargos.
 * O controle de quem pode CRIAR/EDITAR/DELETAR cargos é feito nos Use Cases específicos.
 */
export class GetAllCargos implements IGetAllCargos {
  constructor(private readonly cargoService: ICargoService) {}

  async execute(currentUser?: IUsuario): Promise<ICargo[]> {
    try {
      const cargos = await this.cargoService.getAllCargos();
      return cargos;
    } catch (error) {
      console.error("Erro no Use Case GetAllCargos:", error);
      throw error;
    }
  }
}

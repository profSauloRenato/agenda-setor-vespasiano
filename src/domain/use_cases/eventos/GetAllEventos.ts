// src/domain/use_cases/eventos/GetAllEventos.ts

import { IEvento } from "../../models/IEvento";
import { IUsuario } from "../../models/IUsuario";
import { IEventoService } from "../../services/IEventoService";

export interface IGetAllEventos {
  execute(
    currentUser: IUsuario,
    startDate?: string,
    endDate?: string,
  ): Promise<IEvento[]>;
}

export class GetAllEventos implements IGetAllEventos {
  constructor(private readonly eventoService: IEventoService) {}

  async execute(
    currentUser: IUsuario,
    startDate?: string,
    endDate?: string,
  ): Promise<IEvento[]> {
    try {
      const eventos = await this.eventoService.getAllEventos(
        startDate,
        endDate,
      );
      return eventos;
    } catch (error) {
      console.error("Erro no Use Case GetAllEventos:", error);
      throw error;
    }
  }
}

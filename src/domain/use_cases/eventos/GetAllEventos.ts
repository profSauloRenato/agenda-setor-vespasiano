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
      // Admin vê tudo sem filtro de abrangência
      if (currentUser.is_admin) {
        return await this.eventoService.getAllEventos(startDate, endDate);
      }

      // Usuário comum: filtra pela hierarquia de localização e cargos
      if (!currentUser.localizacao_id) {
        // Sem localização definida, retorna vazio
        return [];
      }

      const cargoIds = (currentUser.cargos ?? []).map((c) => c.id);

      return await this.eventoService.buscarEventos({
        dataInicio: startDate,
        dataFim: endDate,
        localizacaoId: currentUser.localizacao_id,
        cargoIds,
      });
    } catch (error) {
      console.error("Erro no Use Case GetAllEventos:", error);
      throw error;
    }
  }
}
// src/domain/use_cases/eventos/CreateEvento.ts

import {
  UserNotAuthorizedError,
  ValidationError,
} from "../../errors/DomainError";
import { IEvento } from "../../models/IEvento";
import { IUsuario } from "../../models/IUsuario";
import { IEventoService } from "../../services/IEventoService";
import { CreateEventoParams } from "./types";

export interface ICreateEvento {
  execute(currentUser: IUsuario, data: CreateEventoParams): Promise<IEvento>;
}

export class CreateEvento implements ICreateEvento {
  constructor(private readonly eventoService: IEventoService) {}

  private validateData(data: CreateEventoParams): void {
    if (!data.titulo || data.titulo.trim().length < 3) {
      throw new ValidationError("O título deve ter no mínimo 3 caracteres.");
    }
    if (!data.tipo) {
      throw new ValidationError("O tipo do evento é obrigatório.");
    }
    if (!data.data_inicio) {
      throw new ValidationError("A data de início é obrigatória.");
    }
    if (data.cargos_visiveis.length === 0) {
      throw new ValidationError(
        "Selecione pelo menos um cargo para visualizar o evento.",
      );
    }
    if (data.recorrente) {
      if (!data.recorrencia_tipo) {
        throw new ValidationError("Informe o tipo de recorrência.");
      }
      if (
        data.recorrencia_tipo === "semanal" &&
        data.recorrencia_dia_semana === null
      ) {
        throw new ValidationError(
          "Informe o dia da semana para recorrência semanal.",
        );
      }
      if (!data.recorrencia_fim && !data.recorrencia_total) {
        throw new ValidationError(
          "Informe a data fim ou o número de repetições da recorrência.",
        );
      }
    }
  }

  async execute(
    currentUser: IUsuario,
    data: CreateEventoParams,
  ): Promise<IEvento> {
    if (!currentUser.is_admin) {
      throw new UserNotAuthorizedError(
        "Você não tem permissão para criar eventos.",
      );
    }

    try {
      this.validateData(data);
      const evento = await this.eventoService.createEvento(
        data,
        currentUser.id,
      );
      return evento;
    } catch (error) {
      console.error("Erro no Use Case CreateEvento:", error);
      throw error;
    }
  }
}

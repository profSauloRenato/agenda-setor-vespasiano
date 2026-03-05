// src/domain/use_cases/eventos/UpdateEvento.ts

import {
  UserNotAuthorizedError,
  ValidationError,
} from "../../errors/DomainError";
import { IEvento } from "../../models/IEvento";
import { IUsuario } from "../../models/IUsuario";
import { IEventoService } from "../../services/IEventoService";
import { UpdateEventoParams } from "./types";

export interface IUpdateEvento {
  execute(currentUser: IUsuario, data: UpdateEventoParams): Promise<IEvento>;
}

export class UpdateEvento implements IUpdateEvento {
  constructor(private readonly eventoService: IEventoService) {}

  async execute(
    currentUser: IUsuario,
    data: UpdateEventoParams,
  ): Promise<IEvento> {
    if (!currentUser.is_admin && !currentUser.pode_cadastrar_eventos) {
      throw new UserNotAuthorizedError(
        "Você não tem permissão para editar eventos.",
      );
    }
    if (!data.titulo || data.titulo.trim().length < 3) {
      throw new ValidationError("O título deve ter no mínimo 3 caracteres.");
    }
    if (data.cargos_visiveis.length === 0) {
      throw new ValidationError(
        "Selecione pelo menos um cargo para visualizar o evento.",
      );
    }

    try {
      const evento = await this.eventoService.updateEvento(data);
      return evento;
    } catch (error) {
      console.error("Erro no Use Case UpdateEvento:", error);
      throw error;
    }
  }
}

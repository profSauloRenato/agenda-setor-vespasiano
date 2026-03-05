// src/domain/use_cases/eventos/DeleteEvento.ts

import { UserNotAuthorizedError } from "../../errors/DomainError";
import { IUsuario } from "../../models/IUsuario";
import { IEventoService } from "../../services/IEventoService";

export interface IDeleteEvento {
  execute(currentUser: IUsuario, eventoId: string): Promise<void>;
}

export class DeleteEvento implements IDeleteEvento {
  constructor(private readonly eventoService: IEventoService) {}

  async execute(currentUser: IUsuario, eventoId: string): Promise<void> {
    if (!currentUser.is_admin) {
      throw new UserNotAuthorizedError(
        "Apenas administradores podem excluir eventos.",
      );
    }

    try {
      await this.eventoService.deleteEvento(eventoId);
    } catch (error) {
      console.error("Erro no Use Case DeleteEvento:", error);
      throw error;
    }
  }
}

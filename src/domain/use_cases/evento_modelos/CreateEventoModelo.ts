import { IEventoModelo } from '../../models/IEventoModelo';
import { IEventoModeloService, CreateEventoModeloParams } from '../../services/IEventoModeloService';

export interface ICreateEventoModelo {
  execute(data: CreateEventoModeloParams): Promise<IEventoModelo>;
}

export class CreateEventoModelo implements ICreateEventoModelo {
  constructor(private readonly service: IEventoModeloService) {}

  execute(data: CreateEventoModeloParams) {
    if (!data.nome.trim()) throw new Error('Nome é obrigatório.');
    return this.service.create(data);
  }
}
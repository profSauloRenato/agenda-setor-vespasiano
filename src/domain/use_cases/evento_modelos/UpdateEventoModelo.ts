import { IEventoModelo } from '../../models/IEventoModelo';
import { IEventoModeloService, UpdateEventoModeloParams } from '../../services/IEventoModeloService';

export interface IUpdateEventoModelo {
  execute(data: UpdateEventoModeloParams): Promise<IEventoModelo>;
}

export class UpdateEventoModelo implements IUpdateEventoModelo {
  constructor(private readonly service: IEventoModeloService) {}

  execute(data: UpdateEventoModeloParams) {
    if (!data.nome.trim()) throw new Error('Nome é obrigatório.');
    return this.service.update(data);
  }
}
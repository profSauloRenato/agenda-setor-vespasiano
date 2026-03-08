import { IEventoModeloService } from '../../services/IEventoModeloService';

export interface IDeleteEventoModelo {
  execute(id: string): Promise<void>;
}

export class DeleteEventoModelo implements IDeleteEventoModelo {
  constructor(private readonly service: IEventoModeloService) {}

  execute(id: string) {
    return this.service.delete(id);
  }
}
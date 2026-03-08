import { IEventoModelo } from '../../models/IEventoModelo';
import { IEventoModeloService } from '../../services/IEventoModeloService';

export interface IGetAllEventoModelos {
  execute(apenasAtivos?: boolean): Promise<IEventoModelo[]>;
}

export class GetAllEventoModelos implements IGetAllEventoModelos {
  constructor(private readonly service: IEventoModeloService) {}

  execute(apenasAtivos?: boolean) {
    return this.service.getAll(apenasAtivos);
  }
}
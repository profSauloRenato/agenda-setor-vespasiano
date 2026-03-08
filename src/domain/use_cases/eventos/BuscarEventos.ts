import { IEvento } from '../../models/IEvento';
import { IEventoService, BuscarEventosParams } from '../../services/IEventoService';

export interface IBuscarEventos {
  execute(params: BuscarEventosParams): Promise<IEvento[]>;
}

export class BuscarEventos implements IBuscarEventos {
  constructor(private readonly service: IEventoService) {}

  execute(params: BuscarEventosParams) {
    return this.service.buscarEventos(params);
  }
}
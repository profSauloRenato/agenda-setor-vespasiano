import { IEventoModelo } from '../models/IEventoModelo';

export interface CreateEventoModeloParams {
  nome: string;
  categoria: 'evento' | 'reuniao_fixa';
}

export interface UpdateEventoModeloParams {
  id: string;
  nome: string;
  categoria: 'evento' | 'reuniao_fixa';
  ativo: boolean;
}

export interface IEventoModeloService {
  getAll(apenasAtivos?: boolean): Promise<IEventoModelo[]>;
  create(data: CreateEventoModeloParams): Promise<IEventoModelo>;
  update(data: UpdateEventoModeloParams): Promise<IEventoModelo>;
  delete(id: string): Promise<void>;
}
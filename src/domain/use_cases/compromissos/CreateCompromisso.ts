import { ICompromissoPessoal } from '../../models/ICompromissoPessoal';
import { ICompromissoPessoalService } from '../../services/ICompromissoPessoalService';
import { CreateCompromissoParams } from './types';

export interface ICreateCompromisso {
  execute(usuarioId: string, data: CreateCompromissoParams): Promise<ICompromissoPessoal>;
}

export class CreateCompromisso implements ICreateCompromisso {
  constructor(private readonly service: ICompromissoPessoalService) {}

  execute(usuarioId: string, data: CreateCompromissoParams) {
    if (!data.titulo.trim()) throw new Error('Título é obrigatório.');
    if (!data.data_inicio) throw new Error('Data de início é obrigatória.');
    if (data.recorrente && !data.recorrencia_tipo)
      throw new Error('Tipo de recorrência é obrigatório para compromissos recorrentes.');
    return this.service.create(data, usuarioId);
  }
}
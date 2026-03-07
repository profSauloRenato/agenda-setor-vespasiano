import { ICompromissoPessoal } from '../../models/ICompromissoPessoal';
import { ICompromissoPessoalService } from '../../services/ICompromissoPessoalService';
import { UpdateCompromissoParams } from './types';

export interface IUpdateCompromisso {
  execute(data: UpdateCompromissoParams): Promise<ICompromissoPessoal>;
}

export class UpdateCompromisso implements IUpdateCompromisso {
  constructor(private readonly service: ICompromissoPessoalService) {}

  execute(data: UpdateCompromissoParams) {
    if (!data.titulo.trim()) throw new Error('Título é obrigatório.');
    if (!data.data_inicio) throw new Error('Data de início é obrigatória.');
    return this.service.update(data);
  }
}
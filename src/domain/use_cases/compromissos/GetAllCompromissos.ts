import { ICompromissoPessoal } from '../../models/ICompromissoPessoal';
import { ICompromissoPessoalService } from '../../services/ICompromissoPessoalService';

export interface IGetAllCompromissos {
  execute(usuarioId: string, startDate?: string, endDate?: string): Promise<ICompromissoPessoal[]>;
}

export class GetAllCompromissos implements IGetAllCompromissos {
  constructor(private readonly service: ICompromissoPessoalService) {}

  execute(usuarioId: string, startDate?: string, endDate?: string) {
    return this.service.getAll(usuarioId, startDate, endDate);
  }
}
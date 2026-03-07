import { ICompromissoPessoalService } from '../../services/ICompromissoPessoalService';

export interface IDeleteCompromisso {
  execute(id: string): Promise<void>;
}

export class DeleteCompromisso implements IDeleteCompromisso {
  constructor(private readonly service: ICompromissoPessoalService) {}

  execute(id: string) {
    return this.service.delete(id);
  }
}
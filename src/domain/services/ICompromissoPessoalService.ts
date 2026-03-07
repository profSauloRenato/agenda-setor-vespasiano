import { ICompromissoPessoal } from '../models/ICompromissoPessoal';
import {
  CreateCompromissoParams,
  UpdateCompromissoParams,
} from '../use_cases/compromissos/types';

export interface ICompromissoPessoalService {
  getAll(usuarioId: string, startDate?: string, endDate?: string): Promise<ICompromissoPessoal[]>;
  getById(id: string): Promise<ICompromissoPessoal>;
  create(data: CreateCompromissoParams, usuarioId: string): Promise<ICompromissoPessoal>;
  update(data: UpdateCompromissoParams): Promise<ICompromissoPessoal>;
  delete(id: string): Promise<void>;
}
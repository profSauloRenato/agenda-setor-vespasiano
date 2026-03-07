import { ICompromissoAlerta } from '../../models/ICompromissoPessoal';

export interface CreateCompromissoParams {
  titulo: string;
  descricao?: string | null;
  data_inicio: string;
  data_fim?: string | null;
  recorrente: boolean;
  recorrencia_tipo?: 'semanal' | 'mensal' | null;
  recorrencia_fim?: string | null;
  recorrencia_semana_do_mes?: number | null;
  recorrencia_dia_semana?: number | null;
  alertas: Pick<ICompromissoAlerta, 'horas_antes'>[];
}

export interface UpdateCompromissoParams extends CreateCompromissoParams {
  id: string;
}
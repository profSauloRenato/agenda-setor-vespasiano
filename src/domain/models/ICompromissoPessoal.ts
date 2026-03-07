export interface ICompromissoAlerta {
  id: string;
  compromisso_id: string;
  horas_antes: number;
  enviado: boolean;
  enviado_em: string | null;
}

export interface ICompromissoPessoal {
  id: string;
  usuario_id: string;
  titulo: string;
  descricao: string | null;
  data_inicio: string;
  data_fim: string | null;
  recorrente: boolean;
  recorrencia_tipo: 'semanal' | 'mensal' | null;
  recorrencia_fim: string | null;
  // Mensal modo "dia fixo": usa data_inicio.getDate()
  // Mensal modo "Nª dia-da-semana":
  recorrencia_semana_do_mes: number | null; // 1–5
  recorrencia_dia_semana: number | null;    // 0–6
  criado_em: string;
  atualizado_em: string;
  alertas: ICompromissoAlerta[];
}
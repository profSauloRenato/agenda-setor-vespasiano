// src/domain/models/IEvento.ts

export const EVENTO_TIPOS_LISTA = [
  "Reunião de Congregação",
  "Reunião de Setor",
  "Reunião de Administração",
  "Reunião de Regional",
  "Evento Especial",
  "Culto",
] as const;

export type EventoTipo = (typeof EVENTO_TIPOS_LISTA)[number];

export const RECORRENCIA_TIPOS_LISTA = [
  "semanal",
  "mensal",
  "bimestral",
  "trimestral",
  "personalizado",
] as const;
export type RecorrenciaTipo = (typeof RECORRENCIA_TIPOS_LISTA)[number];

export const DIAS_SEMANA = [
  { label: "Domingo", value: 0 },
  { label: "Segunda-feira", value: 1 },
  { label: "Terça-feira", value: 2 },
  { label: "Quarta-feira", value: 3 },
  { label: "Quinta-feira", value: 4 },
  { label: "Sexta-feira", value: 5 },
  { label: "Sábado", value: 6 },
] as const;

export const SEMANAS_DO_MES = [
  { label: "1ª semana", value: 1 },
  { label: "2ª semana", value: 2 },
  { label: "3ª semana", value: 3 },
  { label: "4ª semana", value: 4 },
  { label: "Última semana", value: 5 },
] as const;

export interface IEvento {
  id: string;
  titulo: string;
  tipo: EventoTipo;
  descricao: string | null;
  localizacao_id: string | null;
  responsavel_id: string | null;
  cargos_visiveis: string[];
  rsvp_habilitado: boolean;
  abrangencia_id: string | null;

  // Datas
  data_inicio: string; // ISO string
  data_fim: string | null;

  // Recorrência
  recorrente: boolean;
  recorrencia_tipo: RecorrenciaTipo | null;
  recorrencia_dia_semana: number | null;
  recorrencia_fim: string | null;
  recorrencia_total: number | null;
  recorrencia_intervalo: number | null;
  recorrencia_semana_do_mes: number | null;
  evento_referencia_id: string | null;
  dias_antes_referencia: number | null;

  // Controle
  criado_por: string | null;
  criado_em: string;
  atualizado_em: string;

  // Campos enriquecidos (join — opcionais)
  modelo_id?: string | null;
  nome_modelo?: string | null;
  categoria_modelo?: 'evento' | 'reuniao_fixa' | null;
  nome_localizacao?: string | null;
  nome_responsavel?: string | null;
  nomes_cargos?: string[];

  // Endereço da localização (join)
  endereco_rua?: string | null;
  endereco_numero?: string | null;
  endereco_bairro?: string | null;
  endereco_cidade?: string | null;
  endereco_estado?: string | null;
  endereco_cep?: string | null;

  // Flag de destaque para membros do setor onde o evento ocorre
  destaque_setor?: boolean;

  // Alertas push
  alertas?: IEventoAlerta[];
}

// Alertas de notificação push
export interface IEventoAlerta {
  id?: string;
  evento_id?: string;
  horas_antes: number;
  enviado?: boolean;
  enviado_em?: string | null;
}

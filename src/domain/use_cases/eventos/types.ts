// src/domain/use_cases/eventos/types.ts

import {
  EventoTipo,
  IEventoAlerta,
  RecorrenciaTipo,
} from "../../models/IEvento";

export type CreateEventoParams = {
  titulo: string;
  tipo: EventoTipo;
  descricao: string | null;
  localizacao_id: string | null;
  responsavel_id: string | null;
  cargos_visiveis: string[];
  rsvp_habilitado: boolean;
  data_inicio: string;
  data_fim: string | null;
  recorrente: boolean;
  recorrencia_tipo: RecorrenciaTipo | null;
  recorrencia_dia_semana: number | null;
  recorrencia_fim: string | null;
  recorrencia_total: number | null;
  recorrencia_intervalo: number | null;
  recorrencia_semana_do_mes: number | null;
  evento_referencia_id: string | null;
  dias_antes_referencia: number | null;
  modelo_id?: string | null;
  alertas?: IEventoAlerta[];
  abrangencia_id?: string | null;
};

export type UpdateEventoParams = CreateEventoParams & {
  id: string;
  abrangencia_id?: string | null;
};

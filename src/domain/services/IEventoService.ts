// src/domain/services/IEventoService.ts

import { IEvento } from "../models/IEvento";
import {
  CreateEventoParams,
  UpdateEventoParams,
} from "../use_cases/eventos/types";

export interface BuscarEventosParams {
  dataInicio?: string;
  dataFim?: string;
  localizacaoIds?: string[];
  modeloIds?: string[];
  cargosVisiveis?: string[];
  categoriaModelo?: string;
}

export interface IEventoService {
  getAllEventos(startDate?: string, endDate?: string): Promise<IEvento[]>;
  getEventoById(id: string): Promise<IEvento>;
  buscarEventos(params: BuscarEventosParams): Promise<IEvento[]>;
  createEvento(data: CreateEventoParams, criadoPorId: string): Promise<IEvento>;
  updateEvento(data: UpdateEventoParams): Promise<IEvento>;
  deleteEvento(id: string): Promise<void>;
}

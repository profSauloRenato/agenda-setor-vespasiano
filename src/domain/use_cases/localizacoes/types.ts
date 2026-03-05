// src/domain/use_cases/localizacoes/types.ts

import { ICreateLocalizacao } from "./CreateLocalizacao";
import { IDeleteLocalizacao } from "./DeleteLocalizacao";
import { GetAllLocalizacoes } from "./GetAllLocalizacoes";
import { IUpdateLocalizacao } from "./UpdateLocalizacao";

export interface LocalizacaoUseCases {
  getLocalizacoes: GetAllLocalizacoes;
  createLocalizacao: ICreateLocalizacao;
  updateLocalizacao: IUpdateLocalizacao;
  deleteLocalizacao: IDeleteLocalizacao;
}

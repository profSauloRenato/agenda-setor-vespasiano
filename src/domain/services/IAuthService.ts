// src/domain/services/IAuthService.ts

import { IUsuario } from "../models/IUsuario";

export interface IAuthService {
  login(email: string, password: string): Promise<IUsuario | null>;
  register(nome: string, email: string, password: string): Promise<IUsuario>;
  getLoggedUser(): Promise<IUsuario | null>;
  logout(): Promise<void>;
}

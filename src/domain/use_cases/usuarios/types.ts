// src/domain/use_cases/usuarios/types.ts

import { ICreateUsuario } from "./CreateUsuario";
import { DeleteUsuario } from "./DeleteUsuario";
import { GetUsuarios } from "./GetUsuarios";
import { UpdateUsuario } from "./UpdateUsuario";

export interface UsuarioUseCases {
  getUsers: GetUsuarios;
  updateUser: UpdateUsuario;
  deleteUser: DeleteUsuario;
  createUser: ICreateUsuario;
}

export type CategoriaEventoModelo = 'evento' | 'reuniao_fixa';

export interface IEventoModelo {
  id: string;
  nome: string;
  categoria: CategoriaEventoModelo;
  ativo: boolean;
  criado_em: string;
}
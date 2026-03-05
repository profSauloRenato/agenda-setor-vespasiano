// src/domain/models/IMensagemAdmin.ts

// src/domain/models/IMensagemAdmin.ts

export interface IMensagemAdmin {
  id: string;
  titulo: string;
  texto: string;
  ativa: boolean;
  localizacao_id: string | null;
  cargos_visiveis: string[];
  criado_por: string | null;
  criado_em: string;
}

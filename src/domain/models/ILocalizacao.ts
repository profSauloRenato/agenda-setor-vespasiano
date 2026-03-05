// src/domain/models/ILocalizacao.ts

// 1. VALORES DE TEMPO DE EXECUÇÃO (Runtime)
// Usamos 'as const' para criar uma tupla de strings, que o TypeScript
// reconhecerá como valores literais fixos.

export const LOCALIZACAO_TIPOS_LISTA = [
  "Regional",
  "Administração", // Corrigido
  "Setor",
  "Congregação",
] as const;

// 2. TIPO DE COMPILAÇÃO (Compile-Time)
// Derivamos o tipo estrito a partir da lista de valores.
// Isso garante que o tipo e o valor estejam sempre sincronizados.
export type LocalizacaoTipo = (typeof LOCALIZACAO_TIPOS_LISTA)[number];

// 3. INTERFACE PRINCIPAL (A ser completada)
export interface ILocalizacao {
  id: string;
  nome: string;
  tipo: LocalizacaoTipo; // Usando o tipo derivado
  parent_id: string | null; // ... (outros campos como endereço, etc.)
  endereco_rua: string | null;
  endereco_numero: string | null;
  endereco_bairro: string | null;
  endereco_cidade: string | null;
  endereco_estado: string | null;
  endereco_cep: string | null;
  sede_congregacao_id?: string | null;
}

// Nota: Você precisará importar e usar LOCALIZACAO_TIPOS_LISTA
// na camada de Apresentação para preencher selects e em handleCreate.

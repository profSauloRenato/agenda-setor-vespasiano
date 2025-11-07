// Define a interface ILocalizacao (Modelo de Hierarquia de Localização)
// Esta entidade representa as Congregações, Setores e Regionais,
// sendo fundamental para o RBAC e segmentação de usuários.

export interface ILocalizacao {
  // O 'id' da localização, um UUID que serve como chave primária.
  id: string; 

  // Nome da localização (ex: "Setor Vespasiano", "Congregação Morro Alto").
  // Deve ser UNIQUE no banco de dados.
  nome: string;

  // Tipo da localização ('Regional', 'Setor' ou 'Congregacao').
  // Ajuda a montar a hierarquia de forma programática.
  tipo: 'Regional' | 'Setor' | 'Congregacao'; 

  // ID da localização "mãe" na hierarquia (ex: o Setor pai de uma Congregação).
  // É uma Foreign Key (FK) para a própria tabela 'localizacao', permitindo a hierarquia.
  parent_id: string | null; // Pode ser nulo se for a raiz (ex: uma Regional)

  // --------------------------------------------------------------------
  // Propriedades Estendidas (Opcionais para a UI/Lógica de Negócio)
  // --------------------------------------------------------------------

  // Opcional: Adiciona o nome da localização pai para exibição rápida na UI.
  nome_pai?: string;

  // Opcional: Lista de localizações filhas (Congregações) para montar a árvore hierárquica na UI (Admin).
  filhas?: ILocalizacao[];
}
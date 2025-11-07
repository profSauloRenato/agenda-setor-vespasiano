// Define a interface IUsuario (Modelo de Usuário)
// Esta interface representa a entidade de dados 'usuario' no PostgreSQL
// e é usada em todo o projeto para garantir a tipagem estática.

export interface IUsuario {
  // O 'id' do usuário é um UUID, que no Supabase é referenciado pela chave do sistema de Autenticação (auth.users).
  id: string; 

  // O e-mail do usuário, usado para login e comunicação.
  email: string;

  // Nome completo do usuário, obrigatório (NOT NULL).
  nome: string; 

  // ID da Congregação/Localização principal à qual o usuário pertence.
  // É uma Foreign Key (FK) para a tabela 'localizacao'.
  localizacao_id: string;

  // --------------------------------------------------------------------
  // Propriedades Estendidas (Dados que não vêm diretamente da tabela 'usuario',
  // mas são essenciais para a lógica da aplicação)
  // --------------------------------------------------------------------

  // Indica se o usuário possui o cargo de "Administrador do Sistema".
  // Esta propriedade é calculada e crucial para a navegação e o RBAC[cite: 89, 104].
  is_admin: boolean;

  // Um array contendo os IDs de todos os cargos que o usuário possui.
  // Essencial para a lógica de visualização de eventos (RLS)[cite: 107].
  cargos?: string[]; 

  // Opcional: Pode ser usado para armazenar o token do Firebase Cloud Messaging (FCM)
  // para receber Notificações Push[cite: 166]. 
  device_token?: string | null; 

  // Opcional: Adiciona o nome da localização (Congregação/Setor) para exibição rápida.
  nome_localizacao?: string;
}
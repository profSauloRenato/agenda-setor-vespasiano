// Define a interface ICargo (Modelo de Cargo/Permissão)
// Esta entidade é central para o RBAC, definindo quais permissões
// e acessos um usuário possui no sistema.

export interface ICargo {
  // O 'id' do cargo, um UUID que serve como chave primária.
  id: string; 

  // Nome único do cargo (ex: 'Ancião', 'Diácono', 'Administrador do Sistema').
  // Útil para referência humana e nas políticas de RLS.
  nome: string;

  // Permissão booleana que indica se o usuário com este cargo pode enviar mensagens Push Administrativas (CRÍTICO para a Fase 4).
  // Mapeia para a coluna 'pode_enviar_push'.
  pode_enviar_push: boolean;

  // --------------------------------------------------------------------
  // Propriedades Estendidas (Opcionais para a UI/Lógica de Negócio)
  // --------------------------------------------------------------------

  // Opcional: Indica se o cargo está atualmente selecionado (usado em multi-selects
  // em formulários de edição ou filtros).
  selecionado?: boolean;
}
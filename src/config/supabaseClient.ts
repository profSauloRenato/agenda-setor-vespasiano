import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@env';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store'; // Para armazenar o JWT com segurança
import 'react-native-url-polyfill/auto'; // Importa polyfills necessários para RN

// ----------------------------------------------------------------
// Verificação de segurança: Garantir que as chaves foram carregadas
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("As variáveis de ambiente SUPABASE_URL ou SUPABASE_ANON_KEY não foram carregadas. Verifique o arquivo .env e a configuração do babel.config.js.");
}
// ----------------------------------------------------------------

// --- SECURE STORAGE PARA AUTENTICAÇÃO ---

// Adaptador para usar o expo-secure-store com o Supabase Auth
// Isso garante que o token JWT do usuário seja salvo de forma segura
// e persistente no dispositivo, mantendo o usuário logado.
const SecureStoreAdapter = {
  // Obtém o token JWT seguro
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  // Salva o token JWT seguro
  setItem: (key: string, value: string) => {
    SecureStore.setItemAsync(key, value);
  },
  // Remove o token JWT
  removeItem: (key: string) => {
    SecureStore.deleteItemAsync(key);
  },
};

// --- CRIAÇÃO DO CLIENTE SUPABASE ---

// Cria a instância do cliente Supabase.
// O parâmetro 'auth.storage' garante que o Supabase use o SecureStore
// para gerenciar a sessão do usuário de forma segura.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true, // Garante que a sessão seja renovada automaticamente
    persistSession: true,   // Mantém a sessão ativa entre reinicializações do App
    detectSessionInUrl: false, // Necessário para evitar problemas em ambientes móveis
  },
});
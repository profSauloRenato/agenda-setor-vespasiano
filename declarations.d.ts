// declarations.d.ts

// Define as variáveis que serão injetadas via react-native-dotenv
declare module '@env' {
  export const SUPABASE_URL: string;
  export const SUPABASE_ANON_KEY: string;
  // Adicione outras variáveis de ambiente aqui se necessário
}
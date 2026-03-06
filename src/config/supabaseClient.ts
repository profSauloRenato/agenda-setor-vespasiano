import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import "react-native-url-polyfill/auto";

const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl as string;
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra
  ?.supabaseAnonKey as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "As variáveis de ambiente SUPABASE_URL ou SUPABASE_ANON_KEY não foram carregadas. Verifique o app.json (extra).",
  );
}

const SecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: async (key: string, value: string) =>
    SecureStore.setItemAsync(key, value),
  removeItem: async (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

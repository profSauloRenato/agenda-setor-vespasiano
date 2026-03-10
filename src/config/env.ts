// src/config/env.ts

import Constants from "expo-constants";

// Lê o ambiente definido em app.json → extra.appEnv
// "development" → Expo Go
// "production"  → APK
const appEnv = Constants.expoConfig?.extra?.appEnv ?? "production";

const DEV_IP = Constants.expoConfig?.extra?.devIp ?? "localhost";

export const isDev = appEnv === "development";

export const RESET_PASSWORD_REDIRECT = isDev
  ? `exp://${DEV_IP}:8081/--/reset-password`
  : "com.setorvespasiano.agenda://reset-password";
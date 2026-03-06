// src/infra/services/NotificationService.ts

import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { SupabaseClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

// Configura como as notificações aparecem quando o app está aberto
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  constructor(private supabase: SupabaseClient) {}

  // Solicita permissão e retorna o token do dispositivo
  async registerForPushNotifications(): Promise<string | null> {
    // Expo Go não suporta push notifications (SDK 53+)
    if (Constants.appOwnership === "expo") {
      console.log("Expo Go detectado — push notifications desabilitado.");
      return null;
    }

    if (!Device.isDevice) {
      console.log("Push notifications não funcionam em emulador.");
      return null;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Permissão de notificação negada.");
      return null;
    }

    // Obtém o token Expo Push
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: "67dbb0ff-e592-44fc-9f82-1678280aeec7",
    });

    const token = tokenData.data;
    console.log("Expo Push Token:", token);

    // Configuração específica do Android
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#0A3D62",
      });
    }

    return token;
  }

  // Salva o token no banco de dados
  async saveDeviceToken(userId: string, token: string): Promise<void> {
    const { error } = await this.supabase.from("usuario_tokens").upsert(
      {
        usuario_id: userId,
        token,
        plataforma: Platform.OS,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: "usuario_id" },
    );

    if (error) {
      console.error("Erro ao salvar token:", error);
    } else {
      console.log("Token salvo com sucesso.");
    }
  }

  // Remove o token ao fazer logout
  async removeDeviceToken(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("usuario_tokens")
      .delete()
      .eq("usuario_id", userId);

    if (error) {
      console.error("Erro ao remover token:", error);
    }
  }
}

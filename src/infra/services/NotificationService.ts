// src/infra/services/NotificationService.ts

import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { SupabaseClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

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

  async registerForPushNotifications(): Promise<string | null> {
    if (Constants.appOwnership === "expo") {
      console.log("Expo Go detectado — push notifications desabilitado.");
      return null;
    }
    if (!Device.isDevice) {
      console.log("Push notifications não funcionam em emulador.");
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Permissão de notificação negada.");
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: "67dbb0ff-e592-44fc-9f82-1678280aeec7",
    });

    const token = tokenData.data;
    console.log("Expo Push Token:", token);

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
    if (error) console.error("Erro ao salvar token:", error);
    else console.log("Token salvo com sucesso.");
  }

  async removeDeviceToken(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("usuario_tokens")
      .delete()
      .eq("usuario_id", userId);
    if (error) console.error("Erro ao remover token:", error);
  }

  /**
   * Envia push para os destinatários de uma mensagem admin.
   * Filtra tokens pelos cargos e localização da mensagem.
   * Se cargos_visiveis estiver vazio, envia para todos.
   */
  async enviarPushMensagem(params: {
    titulo: string;
    cargosVisiveis: string[];
    localizacaoId: string | null;
  }): Promise<{ enviados: number; erros: number }> {
    try {
      // 1. Busca todos os tokens cadastrados
      const { data: tokens, error: tokensError } = await this.supabase
        .from("usuario_tokens")
        .select("token, usuario_id");

      if (tokensError) throw tokensError;
      if (!tokens || tokens.length === 0) return { enviados: 0, erros: 0 };

      // 2. Filtra por cargos se necessário
      let tokensDestino: string[] = [];

      if (params.cargosVisiveis.length === 0 && !params.localizacaoId) {
        // Sem filtro — envia para todos
        tokensDestino = tokens.map((t) => t.token);
      } else {
        // Busca usuários que atendem ao filtro
        let query = this.supabase
          .from("usuario")
          .select("id, localizacao_id, usuario_cargos(cargo_id)");

        if (params.localizacaoId) {
          query = query.eq("localizacao_id", params.localizacaoId);
        }

        const { data: usuarios, error: usuariosError } = await query;
        if (usuariosError) throw usuariosError;

        const usuariosIds = (usuarios ?? [])
          .filter((u) => {
            if (params.cargosVisiveis.length === 0) return true;
            const cargosDoUsuario = (u.usuario_cargos ?? []).map(
              (uc: any) => uc.cargo_id
            );
            return params.cargosVisiveis.some((c) => cargosDoUsuario.includes(c));
          })
          .map((u) => u.id);

        tokensDestino = tokens
          .filter((t) => usuariosIds.includes(t.usuario_id))
          .map((t) => t.token);
      }

      if (tokensDestino.length === 0) return { enviados: 0, erros: 0 };

      // 3. Monta as mensagens no formato Expo
      const mensagens = tokensDestino.map((token) => ({
        to: token,
        sound: "default",
        title: "📢 Nova mensagem na Agenda",
        body: `A Paz de Deus! Tem uma nova mensagem de seu interesse no App.\nAssunto: ${params.titulo}`,
        data: { tipo: "mensagem_admin" },
      }));

      // 4. Envia em lotes de 100 (limite da API Expo)
      const LOTE = 100;
      let enviados = 0;
      let erros = 0;

      for (let i = 0; i < mensagens.length; i += LOTE) {
        const lote = mensagens.slice(i, i + LOTE);
        try {
          const response = await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              "Accept-Encoding": "gzip, deflate",
            },
            body: JSON.stringify(lote),
          });

          const result = await response.json();
          const dados: any[] = result.data ?? [];

          dados.forEach((item) => {
            if (item.status === "ok") enviados++;
            else erros++;
          });
        } catch (e) {
          erros += lote.length;
          console.error("Erro ao enviar lote de push:", e);
        }
      }

      console.log(`Push mensagem: ${enviados} enviados, ${erros} erros.`);
      return { enviados, erros };

    } catch (e) {
      console.error("Erro em enviarPushMensagem:", e);
      return { enviados: 0, erros: 1 };
    }
  }
}
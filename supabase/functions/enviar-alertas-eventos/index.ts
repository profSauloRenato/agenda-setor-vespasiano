import { createClient } from "jsr:@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

Deno.serve(async (_req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const agora = new Date();
    let totalEnviados = 0;

    // ============================================================
    // BLOCO 1 — Alertas de eventos (lógica original preservada)
    // ============================================================
    const { data: alertasEventos, error: erroEventos } = await supabase
      .from("evento_alerta")
      .select(`
        id,
        horas_antes,
        evento:evento_id (
          id,
          titulo,
          tipo,
          data_inicio,
          localizacao_id,
          cargos_visiveis
        )
      `)
      .eq("enviado", false);

    if (erroEventos) throw erroEventos;

    for (const alerta of alertasEventos ?? []) {
      const evento = alerta.evento as any;
      if (!evento) continue;

      const dataEvento = new Date(evento.data_inicio);
      const horaEnvio = new Date(dataEvento.getTime() - alerta.horas_antes * 60 * 60 * 1000);
      if (agora < horaEnvio) continue;

      const localizacaoIds = await getLocalizacoesFilhas(supabase, evento.localizacao_id);

      const { data: usuarios } = await supabase
        .from("usuario")
        .select("id, nome, usuario_cargos(cargo_id)")
        .in("localizacao_id", localizacaoIds);

      if (!usuarios || usuarios.length === 0) continue;

      const cargosVisiveis: string[] = evento.cargos_visiveis ?? [];
      const usuariosFiltrados = usuarios.filter((u: any) => {
        const cargosUsuario = (u.usuario_cargos ?? []).map((c: any) => c.cargo_id);
        return cargosUsuario.some((c: string) => cargosVisiveis.includes(c));
      });

      if (usuariosFiltrados.length === 0) continue;

      const { data: tokens } = await supabase
        .from("usuario_tokens")
        .select("token, usuario_id")
        .in("usuario_id", usuariosFiltrados.map((u: any) => u.id));

      if (!tokens || tokens.length === 0) continue;

      const messages = tokens.map((t: any) => {
        const nome = usuariosFiltrados.find((u: any) => u.id === t.usuario_id)?.nome ?? "Irmão(ã)";
        return {
          to: t.token,
          title: evento.titulo,
          body: `A Paz de Deus, irmão ${nome}! Passando para lembrar do nosso compromisso: ${evento.tipo} ${formatarData(dataEvento)}. Contamos com sua presença!`,
          data: { evento_id: evento.id },
        };
      });

      await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messages),
      });

      await supabase
        .from("evento_alerta")
        .update({ enviado: true, enviado_em: new Date().toISOString() })
        .eq("id", alerta.id);

      totalEnviados += messages.length;
    }

    // ============================================================
    // BLOCO 2 — Alertas de compromissos pessoais
    // ============================================================
    const { data: alertasCompromissos, error: erroCompromissos } = await supabase
      .from("compromisso_alerta")
      .select(`
        id,
        minutos_antes,
        compromisso:compromisso_id (
          id,
          titulo,
          data_inicio,
          usuario_id,
          recorrente,
          recorrencia_tipo,
          recorrencia_fim,
          recorrencia_semana_do_mes,
          recorrencia_dia_semana
        )
      `)
      .eq("enviado", false);

    if (erroCompromissos) throw erroCompromissos;

    for (const alerta of alertasCompromissos ?? []) {
      const compromisso = alerta.compromisso as any;
      if (!compromisso) continue;

      const dataCompromisso = new Date(compromisso.data_inicio);
      const horaEnvio = new Date(
        dataCompromisso.getTime() - alerta.minutos_antes * 60 * 1000,
      );
      if (agora < horaEnvio) continue;

      // Verifica se hoje é dia de ocorrência da recorrência
      if (compromisso.recorrente && compromisso.recorrencia_tipo) {
        const hoje = new Date();
        const fim = compromisso.recorrencia_fim
          ? new Date(compromisso.recorrencia_fim + "T23:59:59")
          : null;

        if (fim && hoje > fim) continue;

        let bate = false;
        const inicio = new Date(compromisso.data_inicio);

        if (compromisso.recorrencia_tipo === "semanal") {
          bate = inicio.getDay() === hoje.getDay();
        } else if (compromisso.recorrencia_tipo === "mensal") {
          if (
            compromisso.recorrencia_semana_do_mes !== null &&
            compromisso.recorrencia_dia_semana !== null
          ) {
            const semanaDoMes = Math.ceil(hoje.getDate() / 7);
            bate =
              hoje.getDay() === compromisso.recorrencia_dia_semana &&
              semanaDoMes === compromisso.recorrencia_semana_do_mes;
          } else {
            bate = inicio.getDate() === hoje.getDate();
          }
        }
        if (!bate) continue;
      }

      // Busca nome do usuário dono do compromisso
      const { data: usuario } = await supabase
        .from("usuario")
        .select("id, nome")
        .eq("id", compromisso.usuario_id)
        .single();

      if (!usuario) continue;

      // Busca tokens do próprio usuário
      const { data: tokens } = await supabase
        .from("usuario_tokens")
        .select("token")
        .eq("usuario_id", compromisso.usuario_id);

      if (!tokens || tokens.length === 0) continue;

      const messages = tokens.map((t: any) => ({
        to: t.token,
        title: `🔒 ${compromisso.titulo}`,
        body: `Olá, ${usuario.nome.split(" ")[0]}! Você tem um compromisso pessoal ${formatarData(dataCompromisso)}.`,
        data: { compromisso_id: compromisso.id },
      }));

      await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messages),
      });

      await supabase
        .from("compromisso_alerta")
        .update({ enviado: true, enviado_em: new Date().toISOString() })
        .eq("id", alerta.id);

      totalEnviados += messages.length;
    }

    // ============================================================
    // RESPOSTA FINAL
    // ============================================================
    return new Response(
      JSON.stringify({
        message: `Alertas processados. ${totalEnviados} notificações enviadas.`,
        timestamp: agora.toISOString(),
      }),
      { status: 200 },
    );

  } catch (error) {
    console.error("Erro na Edge Function:", error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
});

// ============================================================
// HELPERS
// ============================================================
async function getLocalizacoesFilhas(
  supabase: any,
  localizacaoId: string | null,
): Promise<string[]> {
  if (!localizacaoId) return [];

  const ids: string[] = [localizacaoId];
  const fila = [localizacaoId];

  while (fila.length > 0) {
    const atual = fila.shift()!;
    const { data: filhos } = await supabase
      .from("localizacao")
      .select("id")
      .eq("parent_id", atual);

    for (const filho of filhos ?? []) {
      ids.push(filho.id);
      fila.push(filho.id);
    }
  }

  return ids;
}

function formatarData(data: Date): string {
  const hoje = new Date();
  const amanha = new Date();
  amanha.setDate(hoje.getDate() + 1);

  const mesmodia = (a: Date, b: Date) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  const hora = data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (mesmodia(data, hoje)) return `hoje às ${hora}`;
  if (mesmodia(data, amanha)) return `amanhã às ${hora}`;

  return `em ${data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })} às ${hora}`;
}
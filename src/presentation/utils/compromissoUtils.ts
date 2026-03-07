import { ICompromissoPessoal } from "../../domain/models/ICompromissoPessoal";

// Retorna qual é a Nª ocorrência de um dia-da-semana no mês (1=primeira, 2=segunda...)
const semanaDoMes = (date: Date): number => {
  return Math.ceil(date.getDate() / 7);
};

export const expandirRecorrencias = (
  c: ICompromissoPessoal,
  dataAlvo: string,
): ICompromissoPessoal[] => {
  if (!c.recorrente || !c.recorrencia_tipo) {
    return c.data_inicio.split("T")[0] === dataAlvo ? [c] : [];
  }

  const inicio = new Date(c.data_inicio);
  const alvo = new Date(dataAlvo + "T00:00:00");
  const fim = c.recorrencia_fim ? new Date(c.recorrencia_fim + "T23:59:59") : null;

  if (alvo < new Date(inicio.toDateString())) return [];
  if (fim && alvo > fim) return [];

  let bate = false;

  if (c.recorrencia_tipo === "semanal") {
    // Mesmo dia da semana
    bate = inicio.getDay() === alvo.getDay();

  } else if (c.recorrencia_tipo === "mensal") {

    if (c.recorrencia_semana_do_mes !== null && c.recorrencia_dia_semana !== null) {
      // Modo "Nª dia-da-semana do mês"
      // Ex: "toda segunda terça-feira" → semana=2, dia=2
      bate =
        alvo.getDay() === c.recorrencia_dia_semana &&
        semanaDoMes(alvo) === c.recorrencia_semana_do_mes;
    } else {
      // Modo "todo dia X do mês"
      bate = inicio.getDate() === alvo.getDate();
    }
  }

  if (!bate) return [];

  const dataOcorrencia = new Date(alvo);
  dataOcorrencia.setHours(inicio.getHours(), inicio.getMinutes(), 0, 0);

  return [{
    ...c,
    data_inicio: dataOcorrencia.toISOString(),
    data_fim: c.data_fim
      ? (() => {
          const duracao =
            new Date(c.data_fim).getTime() - new Date(c.data_inicio).getTime();
          return new Date(dataOcorrencia.getTime() + duracao).toISOString();
        })()
      : null,
  }];
};

export const formatarDataISO = (date: Date): string =>
  date.toISOString().split("T")[0];
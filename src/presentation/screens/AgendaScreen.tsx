// src/presentation/screens/AgendaScreen.tsx

import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { IEvento } from "../../domain/models/IEvento";
import { useEventoUseCases } from "../../config/serviceLocator";
import { useEventosViewModel } from "../view_models/EventosViewModel";
import EventoDetailsModal from "./admin/components/EventoDetailsModal";

// Configuração do calendário em português
LocaleConfig.locales["pt-br"] = {
  monthNames: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"],
  monthNamesShort: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
  dayNames: ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"],
  dayNamesShort: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
  today: "Hoje",
};
LocaleConfig.defaultLocale = "pt-br";

// Cores por nível hierárquico (tipo do evento)
const TIPO_CORES: Record<string, string> = {
  "Reunião de Congregação": "#28A745",
  "Reunião de Setor": "#17A2B8",
  "Reunião de Administração": "#FFC107",
  "Reunião de Regional": "#DC3545",
  "Evento Especial": "#6F42C1",
  "Culto": "#0A3D62",
};

const getTipoCor = (tipo: string): string => TIPO_CORES[tipo] ?? "#6C757D";

const formatarHora = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

const formatarDataISO = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

// -------------------------------------------
// CARD DE EVENTO NO FEED
// -------------------------------------------
const EventoCard: React.FC<{
  evento: IEvento;
  onPress: (evento: IEvento) => void;
}> = ({ evento, onPress }) => {
  const cor = getTipoCor(evento.tipo);

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: cor, borderLeftWidth: 5 }]}
      onPress={() => onPress(evento)}
    >
      <View style={styles.cardHora}>
        <Text style={[styles.cardHoraText, { color: cor }]}>
          {formatarHora(evento.data_inicio)}
        </Text>
        {evento.recorrente && <Text style={styles.cardRecorrente}>🔁</Text>}
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitulo}>{evento.titulo}</Text>
        <Text style={[styles.cardTipo, { color: cor }]}>{evento.tipo}</Text>
        {evento.nome_localizacao && (
          <Text style={styles.cardLocal}>📍 {evento.nome_localizacao}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

// -------------------------------------------
// TELA PRINCIPAL
// -------------------------------------------
const AgendaScreen: React.FC<{ route?: any }> = ({ route }) => {
  const eventoUseCases = useEventoUseCases();
  const { state, loadEventos } = useEventosViewModel(eventoUseCases);

  const [dataSelecionada, setDataSelecionada] = useState<string>(
    formatarDataISO(new Date())
  );
  const [eventoSelecionado, setEventoSelecionado] = useState<IEvento | null>(null);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);

  // Carrega eventos ao montar
  useEffect(() => {
    loadEventos();
  }, []);

  // Abre evento automaticamente se vier da notificação push
  useEffect(() => {
    const eventoId = route?.params?.eventoId;
    if (eventoId && state.eventos.length > 0) {
      const evento = state.eventos.find((e) => e.id === eventoId);
      if (evento) {
        setDataSelecionada(evento.data_inicio.split("T")[0]);
        setEventoSelecionado(evento);
        setIsDetailsVisible(true);
      }
    }
  }, [route?.params?.eventoId, state.eventos]);

  // Monta os dots do calendário por data e cor
  const markedDates = React.useMemo(() => {
    const marks: Record<string, any> = {};

    state.eventos.forEach((evento) => {
      const dataKey = evento.data_inicio.split("T")[0];
      const cor = getTipoCor(evento.tipo);

      if (!marks[dataKey]) {
        marks[dataKey] = { dots: [] };
      }
      // Evita dots duplicados da mesma cor
      const jaTemCor = marks[dataKey].dots.some((d: any) => d.color === cor);
      if (!jaTemCor) {
        marks[dataKey].dots.push({ color: cor });
      }
    });

    // Destaca o dia selecionado
    if (marks[dataSelecionada]) {
      marks[dataSelecionada] = {
        ...marks[dataSelecionada],
        selected: true,
        selectedColor: "#0A3D62",
      };
    } else {
      marks[dataSelecionada] = { selected: true, selectedColor: "#0A3D62" };
    }

    return marks;
  }, [state.eventos, dataSelecionada]);

  // Filtra eventos do dia selecionado
  const eventosDoDia = React.useMemo(() => {
    return state.eventos
      .filter((e) => e.data_inicio.split("T")[0] === dataSelecionada)
      .sort((a, b) => a.data_inicio.localeCompare(b.data_inicio));
  }, [state.eventos, dataSelecionada]);

  const handlePressEvento = (evento: IEvento) => {
    setEventoSelecionado(evento);
    setIsDetailsVisible(true);
  };

  const formatarDataExibicao = (dataISO: string): string => {
    const [ano, mes, dia] = dataISO.split("-");
    return new Date(Number(ano), Number(mes) - 1, Number(dia)).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <View style={styles.container}>

      {/* CALENDÁRIO */}
      <Calendar
        markingType="multi-dot"
        markedDates={markedDates}
        onDayPress={(day) => setDataSelecionada(day.dateString)}
        theme={{
          todayTextColor: "#17A2B8",
          selectedDayBackgroundColor: "#0A3D62",
          arrowColor: "#0A3D62",
          monthTextColor: "#0A3D62",
          textMonthFontWeight: "bold",
          textDayFontSize: 14,
        }}
      />

      {/* LEGENDA DE CORES */}
      <View style={styles.legenda}>
        {Object.entries(TIPO_CORES).map(([tipo, cor]) => (
          <View key={tipo} style={styles.legendaItem}>
            <View style={[styles.legendaDot, { backgroundColor: cor }]} />
            <Text style={styles.legendaText}>{tipo.replace("Reunião de ", "")}</Text>
          </View>
        ))}
      </View>

      {/* DATA SELECIONADA */}
      <Text style={styles.dataSelecionadaText}>
        {formatarDataExibicao(dataSelecionada)}
      </Text>

      {/* LOADING */}
      {state.isLoading && (
        <ActivityIndicator size="large" color="#17A2B8" style={{ marginTop: 20 }} />
      )}

      {/* LISTA DE EVENTOS DO DIA */}
      {!state.isLoading && eventosDoDia.length === 0 && (
        <View style={styles.semEventos}>
          <Text style={styles.semEventosText}>Nenhum evento neste dia.</Text>
        </View>
      )}

      {!state.isLoading && eventosDoDia.length > 0 && (
        <FlatList
          data={eventosDoDia}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EventoCard evento={item} onPress={handlePressEvento} />
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {/* MODAL DE DETALHES */}
      <EventoDetailsModal
        isVisible={isDetailsVisible}
        onClose={() => {
          setIsDetailsVisible(false);
          setEventoSelecionado(null);
        }}
        evento={eventoSelecionado}
        onEdit={() => { }}
        onDelete={() => { }}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  legenda: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  legendaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
    marginBottom: 4,
  },
  legendaDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },
  legendaText: {
    fontSize: 11,
    color: "#555",
  },
  dataSelecionadaText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0A3D62",
    paddingHorizontal: 15,
    paddingVertical: 10,
    textTransform: "capitalize",
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginBottom: 8,
    borderRadius: 8,
    padding: 12,
    elevation: 1,
  },
  cardHora: {
    width: 55,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  cardHoraText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  cardRecorrente: {
    fontSize: 12,
    marginTop: 4,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitulo: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
  },
  cardTipo: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "600",
  },
  cardLocal: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  semEventos: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
  },
  semEventosText: {
    fontSize: 15,
    color: "#6C757D",
  },
});

export default AgendaScreen;
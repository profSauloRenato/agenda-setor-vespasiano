// src/presentation/screens/AgendaScreen.tsx

import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { IEvento } from "../../domain/models/IEvento";
import { ICompromissoPessoal } from "../../domain/models/ICompromissoPessoal";
import { useEventoUseCases, useCompromissoUseCases } from "../../config/serviceLocator";
import { useEventosViewModel } from "../view_models/EventosViewModel";
import { useCompromissosViewModel } from "../view_models/CompromissosViewModel";
import { CreateCompromissoParams, UpdateCompromissoParams } from "../../domain/use_cases/compromissos/types";
import EventoDetailsModal from "./admin/components/EventoDetailsModal";
import { CompromissoFormModal } from "./agenda/components/CompromissoFormModal";
import CompromissoDetailsModal from "./agenda/components/CompromissoDetailsModal";
import SafeScreen from "../components/SafeScreen";
import { expandirRecorrencias, formatarDataISO } from "../utils/compromissoUtils";
import { useAuth } from "../context/AuthContext";

// -------------------------------------------
// LOCALE
// -------------------------------------------
LocaleConfig.locales["pt-br"] = {
  monthNames: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"],
  monthNamesShort: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
  dayNames: ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"],
  dayNamesShort: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
  today: "Hoje",
};
LocaleConfig.defaultLocale = "pt-br";

// -------------------------------------------
// CONSTANTES DE COR
// -------------------------------------------
const TIPO_CORES: Record<string, string> = {
  "Congregação": "#28A745",
  "Setor": "#17A2B8",
  "Administração": "#FFC107",
  "Regional": "#DC3545",
  "Evento Especial": "#6F42C1",
  "Culto": "#0A3D62",
};
const COR_COMPROMISSO = "#6C757D";

const getTipoCor = (tipo: string): string => TIPO_CORES[tipo] ?? "#6C757D";

// -------------------------------------------
// HELPERS
// -------------------------------------------
const formatarHora = (iso: string): string =>
  new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

const formatarDataExibicao = (dataISO: string): string => {
  const [ano, mes, dia] = dataISO.split("-");
  return new Date(Number(ano), Number(mes) - 1, Number(dia)).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

// -------------------------------------------
// TIPO UNIFICADO PARA O FEED
// -------------------------------------------
type FeedItem =
  | { kind: "evento"; data: IEvento }
  | { kind: "compromisso"; data: ICompromissoPessoal };

// -------------------------------------------
// CARD DE EVENTO
// -------------------------------------------
const EventoCard: React.FC<{
  evento: IEvento;
  onPress: (evento: IEvento) => void;
}> = ({ evento, onPress }) => {
  const cor = getTipoCor(evento.tipo_abrangencia ?? evento.tipo);
  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: cor }]}
      onPress={() => onPress(evento)}
    >
      <View style={styles.cardHoraCol}>
        <Text style={[styles.cardHoraText, { color: cor }]}>
          {formatarHora(evento.data_inicio)}
        </Text>
        {evento.recorrente && <Text style={styles.cardRecorrente}>🔁</Text>}
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitulo}>{evento.titulo}</Text>
        <Text style={[styles.cardTipo, { color: cor }]}>{evento.tipo_abrangencia ?? evento.tipo}</Text>
        {evento.nome_localizacao && (
          <Text style={styles.cardLocal}>📍 {evento.nome_localizacao}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

// -------------------------------------------
// CARD DE COMPROMISSO PESSOAL
// -------------------------------------------
const CompromissoCard: React.FC<{
  compromisso: ICompromissoPessoal;
  onPress: (compromisso: ICompromissoPessoal) => void;
}> = ({ compromisso, onPress }) => (
  <TouchableOpacity
    style={[styles.card, { borderLeftColor: COR_COMPROMISSO }]}
    onPress={() => onPress(compromisso)}
  >
    <View style={styles.cardHoraCol}>
      <Text style={[styles.cardHoraText, { color: COR_COMPROMISSO }]}>
        {formatarHora(compromisso.data_inicio)}
      </Text>
      {compromisso.recorrente && <Text style={styles.cardRecorrente}>🔁</Text>}
    </View>
    <View style={styles.cardInfo}>
      <View style={styles.cardTituloRow}>
        <Text style={styles.cardTitulo} numberOfLines={1}>
          {compromisso.titulo}
        </Text>
        <Text style={styles.cardLockIcon}>🔒</Text>
      </View>
      <Text style={[styles.cardTipo, { color: COR_COMPROMISSO }]}>
        Compromisso pessoal
      </Text>
      {compromisso.descricao ? (
        <Text style={styles.cardLocal} numberOfLines={1}>
          {compromisso.descricao}
        </Text>
      ) : null}
    </View>
  </TouchableOpacity>
);

// -------------------------------------------
// TELA PRINCIPAL
// -------------------------------------------
const AgendaScreen: React.FC<{ route?: any }> = ({ route }) => {
  const { user } = useAuth();
  const eventoUseCases = useEventoUseCases();
  const compromissoUseCases = useCompromissoUseCases();
  const navigation = useNavigation<any>();

  const { state: eventosState, loadEventos } = useEventosViewModel(eventoUseCases);
  const {
    state: compromissosState,
    refreshCompromissos,
    createCompromisso,
    updateCompromisso,
    deleteCompromisso,
  } = useCompromissosViewModel(compromissoUseCases);

  const [dataSelecionada, setDataSelecionada] = useState<string>(
    formatarDataISO(new Date())
  );

  // Modais de evento
  const [eventoSelecionado, setEventoSelecionado] = useState<IEvento | null>(null);
  const [isEventoDetailsVisible, setIsEventoDetailsVisible] = useState(false);

  // Modais de compromisso
  const [compromissoSelecionado, setCompromissoSelecionado] = useState<ICompromissoPessoal | null>(null);
  const [isCompromissoDetailsVisible, setIsCompromissoDetailsVisible] = useState(false);
  const [isCompromissoFormVisible, setIsCompromissoFormVisible] = useState(false);
  const [compromissoToEdit, setCompromissoToEdit] = useState<ICompromissoPessoal | null>(null);

  // Carrega ao focar a tela — estabilizado com user?.id para evitar loops
  useFocusEffect(
    useCallback(() => {
      loadEventos();
      refreshCompromissos();
    }, [user?.id])
  );

  // Abre evento automaticamente se vier da notificação push
  useEffect(() => {
    const eventoId = route?.params?.eventoId;
    if (eventoId && eventosState.eventos.length > 0) {
      const evento = eventosState.eventos.find((e) => e.id === eventoId);
      if (evento) {
        setDataSelecionada(evento.data_inicio.split("T")[0]);
        setEventoSelecionado(evento);
        setIsEventoDetailsVisible(true);
      }
    }
  }, [route?.params?.eventoId, eventosState.eventos]);

  // -------------------------------------------
  // MARKED DATES — eventos + compromissos
  // -------------------------------------------
  const [mesVisivel, setMesVisivel] = useState<string>(
    formatarDataISO(new Date()).substring(0, 7)
  );

  const markedDates = React.useMemo(() => {
    const marks: Record<string, any> = {};

    // Dots de eventos
    eventosState.eventos.forEach((evento) => {
      const key = evento.data_inicio.split("T")[0];
      const cor = getTipoCor(evento.tipo_abrangencia ?? evento.tipo);
      if (!marks[key]) marks[key] = { dots: [] };
      if (!marks[key].dots.some((d: any) => d.color === cor)) {
        marks[key].dots.push({ color: cor });
      }
    });

    // Dots de compromissos — expande recorrências para todos os dias do mês visível
    const [ano, mes] = mesVisivel.split("-").map(Number);
    const diasNoMes = new Date(ano, mes, 0).getDate();

    for (let dia = 1; dia <= diasNoMes; dia++) {
      const dataAlvo = `${mesVisivel}-${String(dia).padStart(2, "0")}`;
      compromissosState.compromissos.forEach((c) => {
        const ocorrencias = expandirRecorrencias(c, dataAlvo);
        if (ocorrencias.length > 0) {
          if (!marks[dataAlvo]) marks[dataAlvo] = { dots: [] };
          if (!marks[dataAlvo].dots.some((d: any) => d.color === COR_COMPROMISSO)) {
            marks[dataAlvo].dots.push({ color: COR_COMPROMISSO });
          }
        }
      });
    }

    // Dia selecionado
    marks[dataSelecionada] = {
      ...(marks[dataSelecionada] ?? {}),
      selected: true,
      selectedColor: "#0A3D62",
    };

    return marks;
  }, [eventosState.eventos, compromissosState.compromissos, dataSelecionada, mesVisivel]);

  // -------------------------------------------
  // FEED UNIFICADO DO DIA — ordenado por hora
  // -------------------------------------------
  const feedDoDia = React.useMemo((): FeedItem[] => {
    const eventos: FeedItem[] = eventosState.eventos
      .filter((e) => e.data_inicio.split("T")[0] === dataSelecionada)
      .map((e) => ({ kind: "evento" as const, data: e }));

    const compromissos: FeedItem[] = compromissosState.compromissos
      .flatMap((c) => expandirRecorrencias(c, dataSelecionada))
      .map((c) => ({ kind: "compromisso" as const, data: c }));

    return [...eventos, ...compromissos].sort((a, b) =>
      a.data.data_inicio.localeCompare(b.data.data_inicio)
    );
  }, [eventosState.eventos, compromissosState.compromissos, dataSelecionada]);

  // -------------------------------------------
  // HANDLERS DE COMPROMISSO
  // -------------------------------------------
  const handleSaveCompromisso = async (
    params: CreateCompromissoParams | UpdateCompromissoParams,
  ) => {
    let ok: ICompromissoPessoal | undefined;
    if ("id" in params) {
      ok = await updateCompromisso(params as UpdateCompromissoParams);
    } else {
      ok = await createCompromisso(params as CreateCompromissoParams);
    }
    if (ok) {
      setIsCompromissoFormVisible(false);
      setCompromissoToEdit(null);
    }
  };

  const handleEditCompromisso = (compromisso: ICompromissoPessoal) => {
    setIsCompromissoDetailsVisible(false);
    setCompromissoToEdit(compromisso);
    setIsCompromissoFormVisible(true);
  };

  const handleDeleteCompromisso = async (id: string) => {
    await deleteCompromisso(id);
  };

  const isLoading = eventosState.isLoading || compromissosState.isLoading;

  // -------------------------------------------
  // RENDER
  // -------------------------------------------
  return (
    <SafeScreen style={styles.container}>

      {/* CALENDÁRIO */}
      <Calendar
        markingType="multi-dot"
        markedDates={markedDates}
        onDayPress={(day) => setDataSelecionada(day.dateString)}
        onMonthChange={(month) => setMesVisivel(month.dateString.substring(0, 7))}
        theme={{
          todayTextColor: "#17A2B8",
          selectedDayBackgroundColor: "#0A3D62",
          arrowColor: "#0A3D62",
          monthTextColor: "#0A3D62",
          textMonthFontWeight: "bold",
          textDayFontSize: 14,
        }}
      />

      {/* LEGENDA */}
      <View style={styles.legenda}>
        {Object.entries(TIPO_CORES).map(([tipo, cor]) => (
          <View key={tipo} style={styles.legendaItem}>
            <View style={[styles.legendaDot, { backgroundColor: cor }]} />
            <Text style={styles.legendaText}>{tipo.replace("Reunião de ", "")}</Text>
          </View>
        ))}
        <View style={styles.legendaItem}>
          <Text style={styles.legendaLockIcon}>🔒</Text>
          <Text style={styles.legendaText}>Pessoal</Text>
        </View>
      </View>

      {/* BARRA: data + lupa */}
      <View style={styles.barraDia}>
        <Text style={styles.dataSelecionadaText} numberOfLines={1}>
          {formatarDataExibicao(dataSelecionada)}
        </Text>
        <TouchableOpacity
          style={styles.buscaButton}
          onPress={() => navigation.navigate("Busca" as any)}
        >
          <Text style={styles.buscaButtonText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* LOADING */}
      {isLoading && (
        <ActivityIndicator size="large" color="#17A2B8" style={{ marginTop: 20 }} />
      )}

      {/* FEED VAZIO */}
      {!isLoading && feedDoDia.length === 0 && (
        <View style={styles.semEventos}>
          <Text style={styles.semEventosText}>Nenhum evento neste dia.</Text>
          <Text style={styles.semEventosHint}>
            Toque em " + " para adicionar um compromisso pessoal.
          </Text>
        </View>
      )}

      {/* FEED UNIFICADO */}
      {!isLoading && feedDoDia.length > 0 && (
        <FlatList
          data={feedDoDia}
          keyExtractor={(item) => `${item.kind}-${item.data.id}-${item.data.data_inicio}`}
          renderItem={({ item }) => {
            if (item.kind === "evento") {
              return (
                <EventoCard
                  evento={item.data as IEvento}
                  onPress={(e) => {
                    setEventoSelecionado(e);
                    setIsEventoDetailsVisible(true);
                  }}
                />
              );
            }
            return (
              <CompromissoCard
                compromisso={item.data as ICompromissoPessoal}
                onPress={(c) => {
                  setCompromissoSelecionado(c);
                  setIsCompromissoDetailsVisible(true);
                }}
              />
            );
          }}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {/* MODAL: detalhes de evento */}
      <EventoDetailsModal
        isVisible={isEventoDetailsVisible}
        onClose={() => {
          setIsEventoDetailsVisible(false);
          setEventoSelecionado(null);
        }}
        evento={eventoSelecionado}
        onEdit={() => { }}
        onDelete={() => { }}
      />

      {/* MODAL: detalhes de compromisso */}
      <CompromissoDetailsModal
        isVisible={isCompromissoDetailsVisible}
        onClose={() => {
          setIsCompromissoDetailsVisible(false);
          setCompromissoSelecionado(null);
        }}
        compromisso={compromissoSelecionado}
        onEdit={handleEditCompromisso}
        onDelete={handleDeleteCompromisso}
      />

      {/* MODAL: formulário de compromisso */}
      <CompromissoFormModal
        isVisible={isCompromissoFormVisible}
        onClose={() => {
          setIsCompromissoFormVisible(false);
          setCompromissoToEdit(null);
        }}
        onSave={handleSaveCompromisso}
        compromissoToEdit={compromissoToEdit}
        isSubmitting={compromissosState.isSubmitting}
      />

      {/* BOTÃO FLUTUANTE — novo compromisso */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setCompromissoToEdit(null);
          setIsCompromissoFormVisible(true);
        }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

    </SafeScreen>
  );
};

// -------------------------------------------
// ESTILOS
// -------------------------------------------
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
  legendaLockIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  legendaText: {
    fontSize: 11,
    color: "#555",
  },
  barraDia: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  dataSelecionadaText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "bold",
    color: "#0A3D62",
    textTransform: "capitalize",
    marginRight: 10,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginBottom: 8,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 5,
    elevation: 1,
  },
  cardHoraCol: {
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
  cardTituloRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardTitulo: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
  },
  cardLockIcon: {
    fontSize: 13,
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
    paddingHorizontal: 30,
  },
  semEventosText: {
    fontSize: 15,
    color: "#6C757D",
    textAlign: "center",
  },
  semEventosHint: {
    fontSize: 13,
    color: "#AAA",
    marginTop: 8,
    textAlign: "center",
  },
  buscaButton: {
    backgroundColor: "#17A2B8",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    marginRight: 6,
  },
  buscaButtonText: {
    fontSize: 22,
  },
  fab: {
    position: "absolute",
    bottom: 64,
    right: 20,
    backgroundColor: "#4A4A6A",
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 14,
    borderRadius: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
});

export default AgendaScreen;
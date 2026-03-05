// src/presentation/screens/HomeScreen.tsx

import { NavigationProp, useNavigation, useFocusEffect } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useEventoUseCases, useVersiculoService } from "../../config/serviceLocator";
import { useEventosViewModel } from "../view_models/EventosViewModel";
import { IEvento } from "../../domain/models/IEvento";
import { IVersiculo } from "../../domain/models/IVersiculo";
import EventoDetailsModal from "./admin/components/EventoDetailsModal";
import { useMensagemAdminService } from "../../config/serviceLocator";
import { IMensagemAdmin } from "../../domain/models/IMensagemAdmin";

type RootStackParamList = {
  CargosManager: undefined;
  UsuariosManager: undefined;
  LocalizacaoTypeSelection: undefined;
  LocalizacoesManager: { locationType: string };
  EventosManager: undefined;
  Agenda: undefined;
  AdminPanel: undefined
};

// Cores por tipo de evento
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

const formatarDataCurta = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
};

// -------------------------------------------
// CARD DE EVENTO
// -------------------------------------------
const EventoCard: React.FC<{
  evento: IEvento;
  onPress: (evento: IEvento) => void;
}> = ({ evento, onPress }) => {
  const cor = getTipoCor(evento.tipo);
  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: cor }]}
      onPress={() => onPress(evento)}
    >
      <View style={styles.cardDataCol}>
        <Text style={[styles.cardData, { color: cor }]}>
          {formatarDataCurta(evento.data_inicio)}
        </Text>
        <Text style={[styles.cardHora, { color: cor }]}>
          {formatarHora(evento.data_inicio)}
        </Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitulo} numberOfLines={1}>{evento.titulo}</Text>
        <Text style={[styles.cardTipo, { color: cor }]}>{evento.tipo}</Text>
        {evento.nome_localizacao && (
          <Text style={styles.cardLocal} numberOfLines={1}>📍 {evento.nome_localizacao}</Text>
        )}
      </View>
      {evento.recorrente && <Text style={styles.cardRecorrente}>🔁</Text>}
    </TouchableOpacity>
  );
};

// -------------------------------------------
// CARROSSEL DE VERSÍCULO E MENSAGENS
// -------------------------------------------
const CarrosselCards: React.FC<{
  versiculo: IVersiculo | null;
  mensagens: IMensagemAdmin[];
}> = ({ versiculo, mensagens }) => {
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [expandido, setExpandido] = useState(false);
  const [textoTruncado, setTextoTruncado] = useState(false);

  const cards = React.useMemo(() => {
    const lista: Array<{ tipo: "versiculo" | "mensagem"; dados: any }> = [];
    if (versiculo) lista.push({ tipo: "versiculo", dados: versiculo });
    mensagens.forEach((m) => lista.push({ tipo: "mensagem", dados: m }));
    return lista;
  }, [versiculo, mensagens]);

  // Rotação automática — pausa quando expandido
  useEffect(() => {
    if (cards.length <= 1 || expandido) return;
    const timer = setInterval(() => {
      setIndiceAtual((prev) => (prev + 1) % cards.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [cards.length, expandido]);

  // Reset ao trocar de card
  useEffect(() => {
    setExpandido(false);
    setTextoTruncado(false);
  }, [indiceAtual]);

  if (cards.length === 0) return null;
  const card = cards[indiceAtual];
  if (!card) return null;

  const isMensagem = card.tipo === "mensagem";
  const bgColor = isMensagem ? "#8B0000" : "#0A3D62";
  const labelColor = isMensagem ? "#FFCCCC" : "#BEE5EB";
  const texto = isMensagem ? card.dados.texto : `"${card.dados.texto}"`;
  const LIMITE_LINHAS = 2;

  return (
    <View style={[stylesCarrossel.container, { backgroundColor: bgColor }]}>

      <Text style={[stylesCarrossel.label, { color: labelColor }]}>
        {isMensagem ? `📢 ${card.dados.titulo}` : "📖 Versículo do Dia"}
      </Text>

      <Text
        style={stylesCarrossel.texto}
        numberOfLines={expandido ? undefined : LIMITE_LINHAS}
        onTextLayout={(e) => {
          if (!expandido) {
            setTextoTruncado(e.nativeEvent.lines.length >= LIMITE_LINHAS);
          }
        }}
      >
        {texto}
      </Text>

      {!isMensagem && (
        <Text style={[stylesCarrossel.referencia, { color: labelColor }]}>
          — {card.dados.referencia}
        </Text>
      )}

      {/* RODAPÉ: navegação + ler mais na mesma linha */}
      <View style={stylesCarrossel.rodape}>
        {cards.length > 1 && !expandido ? (
          <View style={stylesCarrossel.navegacao}>
            <TouchableOpacity
              onPress={() => setIndiceAtual((prev) => (prev - 1 + cards.length) % cards.length)}
            >
              <Text style={stylesCarrossel.seta}>‹</Text>
            </TouchableOpacity>

            <View style={stylesCarrossel.dots}>
              {cards.map((c, i) => (
                <View
                  key={i}
                  style={[
                    stylesCarrossel.dot,
                    i === indiceAtual && stylesCarrossel.dotAtivo,
                    c.tipo === "mensagem" && {
                      backgroundColor: i === indiceAtual ? "#FF6B6B" : "rgba(255,107,107,0.4)",
                    },
                  ]}
                />
              ))}
            </View>

            {/* Ler mais no lugar da seta direita quando texto truncado */}
            {textoTruncado ? (
              <TouchableOpacity onPress={() => setExpandido(true)}>
                <Text style={[stylesCarrossel.lerMais, { color: labelColor }]}>Ler mais ▼</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => setIndiceAtual((prev) => (prev + 1) % cards.length)}
              >
                <Text style={stylesCarrossel.seta}>›</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          // Quando expandido, mostra apenas o botão recolher
          textoTruncado && (
            <TouchableOpacity onPress={() => setExpandido(false)}>
              <Text style={[stylesCarrossel.lerMais, { color: labelColor, textAlign: "right" }]}>
                Recolher ▲
              </Text>
            </TouchableOpacity>
          )
        )}
      </View>

    </View>
  );
};

const stylesCarrossel = StyleSheet.create({
  container: {
    margin: 15,
    borderRadius: 12,
    padding: 15,
    minHeight: 164,
    justifyContent: "space-between",
  },
  containerExpandido: {
    minHeight: undefined,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },
  texto: {
    fontSize: 15,
    color: "#fff",
    fontStyle: "italic",
    lineHeight: 22,
  },
  referencia: {
    fontSize: 13,
    marginTop: 8,
    textAlign: "right",
    fontWeight: "600",
  },
  rodape: {
    marginTop: 10,
  },
  navegacao: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  seta: {
    color: "#BEE5EB",
    fontSize: 28,
    fontWeight: "bold",
    paddingHorizontal: 8,
  },
  dots: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  dotAtivo: {
    backgroundColor: "#fff",
  },
  lerMais: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "right",
    marginTop: 4,
  },
});

// -------------------------------------------
// TELA PRINCIPAL
// -------------------------------------------
const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { user, signOut } = useAuth();
  const eventoUseCases = useEventoUseCases();
  const versiculoService = useVersiculoService();
  const { state, loadEventos, refreshEventos } = useEventosViewModel(eventoUseCases);

  const [eventoSelecionado, setEventoSelecionado] = useState<IEvento | null>(null);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [versiculo, setVersiculo] = useState<IVersiculo | null>(null);
  const [mensagens, setMensagens] = useState<IMensagemAdmin[]>([]);
  const mensagemService = useMensagemAdminService();

  const isAdmin = user?.is_admin === true;

  useFocusEffect(
    React.useCallback(() => {
      refreshEventos();
      versiculoService.getVersiculoHoje().then(setVersiculo).catch(() => { });
      const cargoIds = user?.cargos?.map((c) => c.id) ?? [];
      mensagemService.getMensagensAtivas(cargoIds).then(setMensagens).catch(() => { });
    }, [])
  );

  // Filtra eventos dos próximos 7 dias
  const proximosEventos = React.useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const limite = new Date(hoje);
    limite.setDate(limite.getDate() + 7);

    return state.eventos
      .filter((e) => {
        const data = new Date(e.data_inicio);
        return data >= hoje && data <= limite;
      })
      .sort((a, b) => a.data_inicio.localeCompare(b.data_inicio));
  }, [state.eventos]);

  const handlePressEvento = (evento: IEvento) => {
    setEventoSelecionado(evento);
    setIsDetailsVisible(true);
  };

  return (
    <View style={styles.container}>

      {/* CABEÇALHO */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSaudacao}>
            Olá, {user?.nome?.split(" ")[0] ?? "irmão"}
          </Text>
          <Text style={styles.headerSubtitulo}>Agenda Setor Vespasiano</Text>
        </View>
        <View style={styles.headerActions}>
          {isAdmin && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.navigate("AdminPanel")}
            >
              <Text style={styles.headerButtonText}>⚙️</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.headerButton} onPress={signOut}>
            <Text style={styles.headerButtonText}>🚪</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CARROSSEL - FIXO */}
      {(versiculo || mensagens.length > 0) && (
        <CarrosselCards versiculo={versiculo} mensagens={mensagens} />
      )}

      {/* TÍTULO - FIXO */}
      <Text style={styles.sectionTitle}>📅 Próximos 7 dias</Text>

      {/* FEED - ROLÁVEL */}
      {state.isLoading && (
        <ActivityIndicator size="large" color="#17A2B8" style={{ marginTop: 20 }} />
      )}

      {!state.isLoading && proximosEventos.length === 0 && (
        <View style={styles.semEventos}>
          <Text style={styles.semEventosText}>Nenhum evento nos próximos 7 dias.</Text>
        </View>
      )}

      {!state.isLoading && proximosEventos.length > 0 && (
        <FlatList
          data={proximosEventos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EventoCard evento={item} onPress={handlePressEvento} />
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          style={styles.feed}
        />
      )}

      {/* BOTÃO FIXO - ABRIR AGENDA */}
      <TouchableOpacity
        style={styles.agendaButton}
        onPress={() => navigation.navigate("Agenda")}
      >
        <Text style={styles.agendaButtonText}>📅 Abrir Agenda Completa</Text>
      </TouchableOpacity>

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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0A3D62",
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  headerSaudacao: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitulo: {
    fontSize: 12,
    color: "#BEE5EB",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerButton: {
    padding: 6,
  },
  headerButtonText: {
    fontSize: 22,
  },
  scroll: {
    flex: 1,
    marginBottom: 120,
  },
  versiculoCard: {
    backgroundColor: "#0A3D62",
    margin: 15,
    borderRadius: 12,
    padding: 15,
  },
  versiculoLabel: {
    fontSize: 12,
    color: "#BEE5EB",
    marginBottom: 8,
    fontWeight: "600",
  },
  versiculoTexto: {
    fontSize: 15,
    color: "#fff",
    fontStyle: "italic",
    lineHeight: 22,
  },
  versiculoReferencia: {
    fontSize: 13,
    color: "#BEE5EB",
    marginTop: 8,
    textAlign: "right",
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0A3D62",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginBottom: 8,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 5,
    elevation: 1,
  },
  cardDataCol: {
    width: 60,
    alignItems: "center",
    marginRight: 10,
  },
  cardData: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  cardHora: {
    fontSize: 13,
    fontWeight: "bold",
    marginTop: 2,
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
    fontSize: 11,
    marginTop: 2,
    fontWeight: "600",
  },
  cardLocal: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
  },
  cardRecorrente: {
    fontSize: 14,
    marginLeft: 8,
  },
  semEventos: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  semEventosText: {
    fontSize: 14,
    color: "#6C757D",
  },
  adminPanel: {
    margin: 15,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    elevation: 1,
  },
  adminPanelTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#0A3D62",
    marginBottom: 12,
  },
  adminGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  adminGridButton: {
    width: "47%",
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DEE2E6",
  },
  adminGridIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  adminGridText: {
    fontSize: 13,
    color: "#0A3D62",
    fontWeight: "600",
  },
  agendaButton: {
    position: "absolute",
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: "#17A2B8",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    elevation: 4,
  },
  agendaButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  feed: {
    flex: 1,
    marginBottom: 110,
  },
});

export default HomeScreen;
// src/presentation/screens/admin/EventosManagerScreen.tsx

import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { SelectPicker, SelectPickerItem } from "../admin/components/SelectPicker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { IEvento } from "../../../domain/models/IEvento";
import { ICargo } from "../../../domain/models/ICargo";
import { ILocalizacao } from "../../../domain/models/ILocalizacao";
import { EventoUseCases, useEventosViewModel } from "../../view_models/EventosViewModel";
import { useAuth } from "../../context/AuthContext";
import { useCargoUseCases, useLocalizacaoUseCases } from "../../../config/serviceLocator";
import { EventoFormModal } from "./components/EventoFormModal";
import EventoDetailsModal from "./components/EventoDetailsModal";
import SafeScreen from "../../components/SafeScreen";

interface EventosManagerScreenProps {
  eventoUseCases: EventoUseCases;
}

// ─── HELPERS ────────────────────────────────────────────────────────────────

const formatarData = (iso: string): string =>
  new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatarDataCurta = (iso: string): string =>
  new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

// ─── CARD DE EVENTO ──────────────────────────────────────────────────────────

const EventoItem: React.FC<{
  evento: IEvento;
  onViewDetails: (evento: IEvento) => void;
}> = ({ evento, onViewDetails }) => (
  <TouchableOpacity
    style={styles.card}
    onPress={() => onViewDetails(evento)}
    activeOpacity={0.7}
  >
    <View style={styles.cardLeft}>
      <View style={styles.cardTituloRow}>
        <Text style={styles.cardNome} numberOfLines={1}>{evento.titulo}</Text>
        {evento.recorrente && (
          <Text style={styles.recorrenteIcon}>🔁</Text>
        )}
      </View>
      <Text style={styles.cardData}>{formatarData(evento.data_inicio)}</Text>
      {evento.nome_localizacao && (
        <Text style={styles.cardLocal} numberOfLines={1}>
          📍 {evento.nome_localizacao}
        </Text>
      )}
      {evento.tipo_abrangencia && (
        <Text style={styles.cardAbrangencia}>
          📣 {evento.tipo_abrangencia}
          {evento.nome_abrangencia ? `: ${evento.nome_abrangencia}` : ""}
        </Text>
      )}
    </View>
    <Feather name="chevron-right" size={18} color="#17A2B8" />
  </TouchableOpacity>
);

// ─── TELA PRINCIPAL ──────────────────────────────────────────────────────────

export const EventosManagerScreen: React.FC<EventosManagerScreenProps> = ({
  eventoUseCases,
}) => {
  const { user } = useAuth();
  const { state, deleteEvento, refreshEventos } = useEventosViewModel(eventoUseCases);
  const cargoUseCases = useCargoUseCases();
  const localizacaoUseCases = useLocalizacaoUseCases();

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [eventoToEdit, setEventoToEdit] = useState<IEvento | null>(null);
  const [cargosDisponiveis, setCargosDisponiveis] = useState<ICargo[]>([]);
  const [localizacoesDisponiveis, setLocalizacoesDisponiveis] = useState<ILocalizacao[]>([]);
  const [isLoadingRefs, setIsLoadingRefs] = useState(true);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [eventoToDetail, setEventoToDetail] = useState<IEvento | null>(null);

  // ── Filtros ──────────────────────────────────────────────────────────────
  const [filtrosExpandido, setFiltrosExpandido] = useState(false);
  const [filtroRegionalId, setFiltroRegionalId] = useState<string>("todos");
  const [filtroAdminId, setFiltroAdminId] = useState<string>("todos");
  const [filtroSetorId, setFiltroSetorId] = useState<string>("todos");
  const [filtroCargoId, setFiltroCargoId] = useState<string>("todos");
  const [filtroDataInicio, setFiltroDataInicio] = useState<Date | null>(null);
  const [filtroDataFim, setFiltroDataFim] = useState<Date | null>(null);
  const [showPickerDataInicio, setShowPickerDataInicio] = useState(false);
  const [showPickerDataFim, setShowPickerDataFim] = useState(false);

  // ── Localizações para filtro ─────────────────────────────────────────────
  const regionais = useMemo(
    () => localizacoesDisponiveis.filter(l => l.tipo === "Regional").sort((a, b) => a.nome.localeCompare(b.nome)),
    [localizacoesDisponiveis]
  );
  const administracoes = useMemo(() => {
    const base = localizacoesDisponiveis.filter(l => l.tipo === "Administração");
    return (filtroRegionalId === "todos" ? base : base.filter(l => l.parent_id === filtroRegionalId))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [localizacoesDisponiveis, filtroRegionalId]);

  const setores = useMemo(() => {
    const base = localizacoesDisponiveis.filter(l => l.tipo === "Setor");
    if (filtroAdminId !== "todos") return base.filter(l => l.parent_id === filtroAdminId).sort((a, b) => a.nome.localeCompare(b.nome));
    if (filtroRegionalId !== "todos") {
      const adminIds = administracoes.map(a => a.id);
      return base.filter(l => adminIds.includes(l.parent_id ?? "")).sort((a, b) => a.nome.localeCompare(b.nome));
    }
    return base.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [localizacoesDisponiveis, filtroAdminId, filtroRegionalId, administracoes]);

  const handleRegionalChange = (val: string) => {
    setFiltroRegionalId(val);
    setFiltroAdminId("todos");
    setFiltroSetorId("todos");
  };
  const handleAdminChange = (val: string) => {
    setFiltroAdminId(val);
    setFiltroSetorId("todos");
  };

  const filtrosAtivos = useMemo(() => {
    let count = 0;
    if (filtroRegionalId !== "todos") count++;
    if (filtroAdminId !== "todos") count++;
    if (filtroSetorId !== "todos") count++;
    if (filtroCargoId !== "todos") count++;
    if (filtroDataInicio) count++;
    if (filtroDataFim) count++;
    return count;
  }, [filtroRegionalId, filtroAdminId, filtroSetorId, filtroCargoId, filtroDataInicio, filtroDataFim]);

  const limparFiltros = () => {
    setFiltroRegionalId("todos");
    setFiltroAdminId("todos");
    setFiltroSetorId("todos");
    setFiltroCargoId("todos");
    setFiltroDataInicio(null);
    setFiltroDataFim(null);
  };

  // ── Lista filtrada ────────────────────────────────────────────────────────
  const listaFiltrada = useMemo(() => {
    let lista = [...state.eventos];

    // Filtro de localização — filtra por localizacao_id ou abrangencia_id
    if (filtroSetorId !== "todos") {
      const congregacaoIds = localizacoesDisponiveis
        .filter(l => l.tipo === "Congregação" && l.parent_id === filtroSetorId)
        .map(l => l.id);
      lista = lista.filter(e =>
        congregacaoIds.includes(e.localizacao_id ?? "") ||
        e.localizacao_id === filtroSetorId
      );
    } else if (filtroAdminId !== "todos") {
      const setorIds = setores.map(s => s.id);
      const congregacaoIds = localizacoesDisponiveis
        .filter(l => l.tipo === "Congregação" && setorIds.includes(l.parent_id ?? ""))
        .map(l => l.id);
      lista = lista.filter(e =>
        congregacaoIds.includes(e.localizacao_id ?? "") ||
        setorIds.includes(e.localizacao_id ?? "")
      );
    } else if (filtroRegionalId !== "todos") {
      const adminIds = administracoes.map(a => a.id);
      const setorIdsFiltrados = localizacoesDisponiveis
        .filter(l => l.tipo === "Setor" && adminIds.includes(l.parent_id ?? ""))
        .map(l => l.id);
      const congregacaoIds = localizacoesDisponiveis
        .filter(l => l.tipo === "Congregação" && setorIdsFiltrados.includes(l.parent_id ?? ""))
        .map(l => l.id);
      lista = lista.filter(e =>
        congregacaoIds.includes(e.localizacao_id ?? "") ||
        setorIdsFiltrados.includes(e.localizacao_id ?? "") ||
        adminIds.includes(e.localizacao_id ?? "")
      );
    }

    // Filtro de cargo visível
    if (filtroCargoId !== "todos") {
      lista = lista.filter(e => e.cargos_visiveis.includes(filtroCargoId));
    }

    // Filtro de período
    if (filtroDataInicio) {
      const ini = new Date(filtroDataInicio);
      ini.setHours(0, 0, 0, 0);
      lista = lista.filter(e => new Date(e.data_inicio) >= ini);
    }
    if (filtroDataFim) {
      const fim = new Date(filtroDataFim);
      fim.setHours(23, 59, 59, 999);
      lista = lista.filter(e => new Date(e.data_inicio) <= fim);
    }

    return lista;
  }, [state.eventos, filtroRegionalId, filtroAdminId, filtroSetorId, filtroCargoId, filtroDataInicio, filtroDataFim, localizacoesDisponiveis, administracoes, setores]);

  // ── Carregar dados de referência ─────────────────────────────────────────
  useEffect(() => {
    const loadReferenceData = async () => {
      if (!user) return;
      try {
        const [cargos, localizacoes] = await Promise.all([
          cargoUseCases.getCargos.execute(user),
          localizacaoUseCases.getLocalizacoes.execute(user),
        ]);
        setCargosDisponiveis(cargos);
        setLocalizacoesDisponiveis(localizacoes);
      } catch (e) {
        Alert.alert("Erro", "Falha ao carregar dados de referência.");
      } finally {
        setIsLoadingRefs(false);
      }
    };
    loadReferenceData();
  }, [user]);

  useEffect(() => {
    if (state.error) Alert.alert("Erro", state.error);
  }, [state.error]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleEdit = (evento: IEvento) => {
    setIsDetailsModalVisible(false);
    setEventoToDetail(null);
    setEventoToEdit(evento);
    setIsFormVisible(true);
  };

  const handleDelete = async (eventoId: string) => {
    await deleteEvento(eventoId);
  };

  const handleOpenCreate = () => {
    setEventoToEdit(null);
    setIsFormVisible(true);
  };

  const handleOpenDetails = (evento: IEvento) => {
    setEventoToDetail(evento);
    setIsDetailsModalVisible(true);
  };

  const handleFormClose = () => {
    setIsFormVisible(false);
    setEventoToEdit(null);
    refreshEventos();
  };

  // ── Loading inicial ───────────────────────────────────────────────────────
  if (isLoadingRefs) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#17A2B8" />
        <Text style={styles.loadingText}>Carregando dados...</Text>
      </View>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeScreen style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Eventos</Text>
        <TouchableOpacity style={styles.btnNovo} onPress={handleOpenCreate}>
          <Feather name="plus" size={16} color="#fff" />
          <Text style={styles.btnNovoText}>Novo</Text>
        </TouchableOpacity>
      </View>

      {/* FILTROS — colapsável */}
      <View style={styles.filtrosBox}>
        <TouchableOpacity
          style={styles.filtrosHeader}
          onPress={() => setFiltrosExpandido(prev => !prev)}
          activeOpacity={0.7}
        >
          <Feather name="filter" size={14} color="#17A2B8" />
          <Text style={styles.filtrosLabel}>Filtros</Text>
          {filtrosAtivos > 0 && (
            <TouchableOpacity onPress={limparFiltros}>
              <Text style={styles.limparFiltros}>Limpar ({filtrosAtivos})</Text>
            </TouchableOpacity>
          )}
          <Feather
            name={filtrosExpandido ? "chevron-up" : "chevron-down"}
            size={16}
            color="#17A2B8"
            style={{ marginLeft: 20 }}
          />
        </TouchableOpacity>

        {filtrosExpandido && (
          <View style={styles.filtrosConteudo}>

            {/* Regional */}
            <View style={styles.pickerRow}>
              <Text style={styles.pickerLabel}>Regional</Text>
              <View style={styles.pickerWrap}>
                <SelectPicker
                  selectedValue={filtroRegionalId}
                  onValueChange={(v: string | null) => handleRegionalChange(v ?? "todos")}
                  items={[{ label: "Todas", value: "todos" }, ...regionais.map(r => ({ label: r.nome, value: r.id }))]}
                  dropdownIconColor="#17A2B8"
                />
              </View>
            </View>

            {/* Administração */}
            <View style={styles.pickerRow}>
              <Text style={styles.pickerLabel}>Administração</Text>
              <View style={styles.pickerWrap}>
                <SelectPicker
                  selectedValue={filtroAdminId}
                  onValueChange={(v: string | null) => handleAdminChange(v ?? "todos")}
                  items={[{ label: "Todas", value: "todos" }, ...administracoes.map(a => ({ label: a.nome, value: a.id }))]}
                  enabled={administracoes.length > 0}
                  dropdownIconColor="#17A2B8"
                />
              </View>
            </View>

            {/* Setor */}
            <View style={styles.pickerRow}>
              <Text style={styles.pickerLabel}>Setor</Text>
              <View style={styles.pickerWrap}>
                <SelectPicker
                  selectedValue={filtroSetorId}
                  onValueChange={(v: string | null) => setFiltroSetorId(v ?? "todos")}
                  items={[{ label: "Todos", value: "todos" }, ...setores.map(s => ({ label: s.nome, value: s.id }))]}
                  enabled={setores.length > 0}
                  dropdownIconColor="#17A2B8"
                />
              </View>
            </View>

            {/* Cargo visível */}
            <View style={styles.pickerRow}>
              <Text style={styles.pickerLabel}>Cargo</Text>
              <View style={styles.pickerWrap}>
                <SelectPicker
                  selectedValue={filtroCargoId}
                  onValueChange={(v: string | null) => setFiltroCargoId(v ?? "todos")}
                  items={[{ label: "Todos", value: "todos" }, ...cargosDisponiveis.map(c => ({ label: c.nome, value: c.id }))]}
                  dropdownIconColor="#17A2B8"
                />
              </View>
            </View>

            {/* Período */}
            <View style={styles.periodoRow}>
              <Text style={styles.pickerLabel}>Período</Text>
              <View style={styles.periodoButtons}>
                <TouchableOpacity
                  style={styles.dateFilterButton}
                  onPress={() => setShowPickerDataInicio(true)}
                >
                  <Feather name="calendar" size={13} color="#17A2B8" />
                  <Text style={styles.dateFilterText}>
                    {filtroDataInicio ? formatarDataCurta(filtroDataInicio.toISOString()) : "De..."}
                  </Text>
                  {filtroDataInicio && (
                    <TouchableOpacity onPress={() => setFiltroDataInicio(null)}>
                      <Feather name="x" size={13} color="#DC3545" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dateFilterButton}
                  onPress={() => setShowPickerDataFim(true)}
                >
                  <Feather name="calendar" size={13} color="#17A2B8" />
                  <Text style={styles.dateFilterText}>
                    {filtroDataFim ? formatarDataCurta(filtroDataFim.toISOString()) : "Até..."}
                  </Text>
                  {filtroDataFim && (
                    <TouchableOpacity onPress={() => setFiltroDataFim(null)}>
                      <Feather name="x" size={13} color="#DC3545" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {showPickerDataInicio && (
              <DateTimePicker
                value={filtroDataInicio ?? new Date()}
                mode="date"
                display="default"
                onChange={(_, date) => {
                  setShowPickerDataInicio(false);
                  if (date) setFiltroDataInicio(date);
                }}
              />
            )}
            {showPickerDataFim && (
              <DateTimePicker
                value={filtroDataFim ?? new Date()}
                mode="date"
                display="default"
                onChange={(_, date) => {
                  setShowPickerDataFim(false);
                  if (date) setFiltroDataFim(date);
                }}
              />
            )}
          </View>
        )}
      </View>

      {/* LOADING */}
      {state.isLoading && listaFiltrada.length === 0 && (
        <ActivityIndicator size="large" color="#17A2B8" style={{ marginTop: 30 }} />
      )}

      {/* LISTA VAZIA */}
      {!state.isLoading && listaFiltrada.length === 0 && (
        <View style={styles.emptyState}>
          <Feather name="calendar" size={40} color="#DEE2E6" />
          <Text style={styles.emptyText}>
            {filtrosAtivos > 0
              ? "Nenhum evento encontrado para os filtros selecionados."
              : "Nenhum evento cadastrado ainda."}
          </Text>
        </View>
      )}

      {/* LISTA */}
      {!state.isLoading && listaFiltrada.length > 0 && (
        <FlatList
          data={listaFiltrada}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <EventoItem evento={item} onViewDetails={handleOpenDetails} />
          )}
          contentContainerStyle={{ paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FOOTER — contador */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {listaFiltrada.length}{" "}
          {listaFiltrada.length === 1 ? "evento" : "eventos"}
          {filtrosAtivos > 0 ? " encontrado(s)" : " no total"}
        </Text>
      </View>

      {/* MODAIS */}
      {isFormVisible && (
        <EventoFormModal
          isVisible={isFormVisible}
          onClose={handleFormClose}
          eventoToEdit={eventoToEdit}
          eventoUseCases={eventoUseCases}
          cargosDisponiveis={cargosDisponiveis}
          localizacoesDisponiveis={localizacoesDisponiveis}
        />
      )}

      <EventoDetailsModal
        isVisible={isDetailsModalVisible}
        onClose={() => {
          setIsDetailsModalVisible(false);
          setEventoToDetail(null);
        }}
        evento={eventoToDetail}
        onEdit={handleEdit}
        onDelete={handleDelete}
        showAdminActions={true}
      />

    </SafeScreen>
  );
};

// ─── ESTILOS ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F4F8",
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#6C757D",
    fontSize: 15,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0A3D62",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  btnNovo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#17A2B8",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  btnNovoText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  // Filtros
  filtrosBox: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 6,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  filtrosHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingBottom: 8,
  },
  filtrosLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#17A2B8",
    flex: 1,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  limparFiltros: {
    fontSize: 12,
    color: "#DC3545",
    fontWeight: "600",
  },
  filtrosConteudo: {
    borderTopWidth: 1,
    borderTopColor: "#F0F4F8",
    paddingTop: 10,
    paddingBottom: 8,
    gap: 8,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  pickerLabel: {
    width: 110,
    fontSize: 13,
    color: "#4A4A6A",
    fontWeight: "600",
  },
  pickerWrap: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#DEE2E6",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    height: 48,
  },
  picker: {
    height: 60,
    color: "#333",
  },
  periodoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  periodoButtons: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
  },
  dateFilterButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#DEE2E6",
    borderRadius: 8,
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  dateFilterText: {
    flex: 1,
    fontSize: 13,
    color: "#333",
  },

  // Cards
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  cardLeft: {
    flex: 1,
  },
  cardTituloRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardNome: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#0A3D62",
  },
  recorrenteIcon: {
    fontSize: 13,
  },
  cardData: {
    fontSize: 13,
    color: "#333",
    marginTop: 3,
  },
  cardLocal: {
    fontSize: 12,
    color: "#555",
    marginTop: 3,
  },
  cardAbrangencia: {
    fontSize: 12,
    color: "#17A2B8",
    fontWeight: "600",
    marginTop: 3,
  },

  // Empty
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyText: {
    textAlign: "center",
    color: "#ADB5BD",
    fontSize: 14,
    lineHeight: 22,
  },

  // Footer
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#DEE2E6",
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
    color: "#6C757D",
    fontWeight: "600",
  },
});
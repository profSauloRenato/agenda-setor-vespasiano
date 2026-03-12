// src/presentation/screens/BuscaScreen.tsx

import React, { useEffect, useState, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { IEvento } from "../../domain/models/IEvento";
import { IEventoModelo } from "../../domain/models/IEventoModelo";
import { ILocalizacao } from "../../domain/models/ILocalizacao";
import { ICargo } from "../../domain/models/ICargo";
import {
  useEventoModeloUseCases,
  useEventoUseCases,
  serviceLocator,
} from "../../config/serviceLocator";
import EventoDetailsModal from "./admin/components/EventoDetailsModal";
import SafeScreen from "../components/SafeScreen";
import { SelectPicker, SelectPickerItem } from "../screens/admin/components/SelectPicker"

// -------------------------------------------
// PERÍODOS PRÉ-DEFINIDOS
// -------------------------------------------
const PERIODOS = [
  { label: "Próximos 30 dias", value: "30d" },
  { label: "Próximos 3 meses", value: "3m" },
  { label: "Próximos 6 meses", value: "6m" },
  { label: "Este ano", value: "ano" },
  { label: "Próximo ano", value: "prox_ano" },
];

const calcularPeriodo = (value: string): { inicio: string; fim: string } => {
  const hoje = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const toISO = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const inicio = toISO(hoje);

  if (value === "30d") { const fim = new Date(hoje); fim.setDate(fim.getDate() + 30); return { inicio, fim: toISO(fim) }; }
  if (value === "3m") { const fim = new Date(hoje); fim.setMonth(fim.getMonth() + 3); return { inicio, fim: toISO(fim) }; }
  if (value === "6m") { const fim = new Date(hoje); fim.setMonth(fim.getMonth() + 6); return { inicio, fim: toISO(fim) }; }
  if (value === "ano") { return { inicio, fim: `${hoje.getFullYear()}-12-31` }; }
  if (value === "prox_ano") { const ano = hoje.getFullYear() + 1; return { inicio: `${ano}-01-01`, fim: `${ano}-12-31` }; }
  return { inicio, fim: inicio };
};

// -------------------------------------------
// CARD DE RESULTADO
// -------------------------------------------
const ResultadoCard: React.FC<{
  evento: IEvento;
  onPress: (evento: IEvento) => void;
}> = ({ evento, onPress }) => {
  const data = new Date(evento.data_inicio);
  const horaStr = data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(evento)}>
      <View style={styles.cardData}>
        <Text style={styles.cardDia}>{String(data.getDate()).padStart(2, "0")}</Text>
        <Text style={styles.cardMes}>{data.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</Text>
        <Text style={styles.cardAno}>{data.getFullYear()}</Text>
      </View>
      <View style={styles.cardDivider} />
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitulo} numberOfLines={1}>{evento.titulo}</Text>
        {evento.nome_modelo && <Text style={styles.cardModelo}>{evento.nome_modelo}</Text>}
        <Text style={styles.cardHora}>🕐 {horaStr}</Text>
        {evento.nome_localizacao && (
          <Text style={styles.cardLocal} numberOfLines={1}>📍 {evento.nome_localizacao}</Text>
        )}
        {evento.recorrente && (
          <View style={styles.recorrenteBadge}>
            <Text style={styles.recorrenteBadgeText}>🔁 Recorrente</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// -------------------------------------------
// MODAL DE FILTROS
// -------------------------------------------
interface Filtros {
  periodoValue: string;
  modeloId: string;
  categoriaModelo: string;
  regionalId: string;
  administracaoId: string;
  setorId: string;
  localizacaoId: string;
  cargoId: string;
}

const filtrosVazios: Filtros = {
  periodoValue: "",
  modeloId: "",
  categoriaModelo: "",
  regionalId: "",
  administracaoId: "",
  setorId: "",
  localizacaoId: "",
  cargoId: "",
};

const ModalFiltros: React.FC<{
  isVisible: boolean;
  onClose: () => void;
  onBuscar: (filtros: Filtros) => void;
  modelos: IEventoModelo[];
  localizacoes: ILocalizacao[];
  cargos: ICargo[];
  isBuscando: boolean;
}> = ({ isVisible, onClose, onBuscar, modelos, localizacoes, cargos, isBuscando }) => {
  const [filtros, setFiltros] = useState<Filtros>(filtrosVazios);

  const set = (key: keyof Filtros, value: string | null) =>
    setFiltros((prev) => ({ ...prev, [key]: value ?? "" }));

  const regionais = useMemo(
    () => localizacoes.filter((l) => l.tipo === "Regional").sort((a, b) => a.nome.localeCompare(b.nome)),
    [localizacoes]
  );
  const administracoes = useMemo(
    () => localizacoes.filter((l) => l.tipo === "Administração" && l.parent_id === (filtros.regionalId || null)).sort((a, b) => a.nome.localeCompare(b.nome)),
    [localizacoes, filtros.regionalId]
  );
  const setores = useMemo(
    () => localizacoes.filter((l) => l.tipo === "Setor" && l.parent_id === (filtros.administracaoId || null)).sort((a, b) => a.nome.localeCompare(b.nome)),
    [localizacoes, filtros.administracaoId]
  );
  const congregacoes = useMemo(
    () => localizacoes.filter((l) => l.tipo === "Congregação" && l.parent_id === (filtros.setorId || null)).sort((a, b) => a.nome.localeCompare(b.nome)),
    [localizacoes, filtros.setorId]
  );

  const modelosEventos = modelos.filter((m) => m.categoria === "evento");
  const modelosReunioes = modelos.filter((m) => m.categoria === "reuniao_fixa");

  const tipoItems: SelectPickerItem[] = [
    { label: "Todos os tipos", value: "" },
    { label: "Eventos", value: "evento" },
    { label: "Reuniões", value: "reuniao_fixa" },
  ];

  const modeloItems: SelectPickerItem[] = [
    { label: "Todos", value: "" },
    ...(!filtros.categoriaModelo || filtros.categoriaModelo === "evento"
      ? modelosEventos.map((m) => ({ label: m.nome, value: m.id }))
      : []),
    ...(!filtros.categoriaModelo || filtros.categoriaModelo === "reuniao_fixa"
      ? modelosReunioes.map((m) => ({ label: m.nome, value: m.id }))
      : []),
  ];

  const periodoItems: SelectPickerItem[] = [
    { label: "Qualquer período", value: "" },
    ...PERIODOS.map((p) => ({ label: p.label, value: p.value })),
  ];

  const regionalItems: SelectPickerItem[] = [
    { label: "Todas as Regionais", value: "" },
    ...regionais.map((r) => ({ label: r.nome, value: r.id })),
  ];

  const administracaoItems: SelectPickerItem[] = [
    { label: "Todas as Administrações", value: "" },
    ...administracoes.map((a) => ({ label: a.nome, value: a.id })),
  ];

  const setorItems: SelectPickerItem[] = [
    { label: "Todos os Setores", value: "" },
    ...setores.map((s) => ({ label: s.nome, value: s.id })),
  ];

  const congregacaoItems: SelectPickerItem[] = [
    { label: "Todas as Congregações do Setor", value: "" },
    ...congregacoes.map((c) => ({ label: c.nome, value: c.id })),
  ];

  const cargoItems: SelectPickerItem[] = [
    { label: "Todos os cargos", value: "" },
    ...cargos.map((c) => ({ label: c.nome, value: c.id })),
  ];

  const temFiltro = Object.values(filtros).some((v) => v !== "");
  const handleLimpar = () => setFiltros(filtrosVazios);
  const handleBuscar = () => { onBuscar(filtros); };

  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet">
      <SafeScreen style={styles.modalContainer}>

        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancelar}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitulo}>Filtros de Busca</Text>
          <TouchableOpacity onPress={handleLimpar}>
            <Text style={styles.modalLimpar}>Limpar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>

          {/* TIPO */}
          <Text style={styles.secaoTitulo}>Tipo</Text>
          <View style={styles.pickerBox}>
            <SelectPicker
              selectedValue={filtros.categoriaModelo}
              onValueChange={(v: string | null) => { set("categoriaModelo", v ?? ""); set("modeloId", ""); }}
              items={tipoItems}
            />
          </View>

          {/* NOME */}
          <Text style={styles.secaoTitulo}>Nome do evento / reunião</Text>
          <View style={styles.pickerBox}>
            <SelectPicker
              selectedValue={filtros.modeloId}
              onValueChange={(v: string | null) => set("modeloId", v ?? "")}
              items={modeloItems}
            />
          </View>

          {/* PERÍODO */}
          <Text style={styles.secaoTitulo}>Período</Text>
          <View style={styles.pickerBox}>
            <SelectPicker
              selectedValue={filtros.periodoValue}
              onValueChange={(v: string | null) => set("periodoValue", v ?? "")}
              items={periodoItems}
            />
          </View>

          {/* LOCALIZAÇÃO */}
          <Text style={styles.secaoTitulo}>Localização</Text>

          <Text style={styles.nivelLabel}>Regional</Text>
          <View style={styles.pickerBox}>
            <SelectPicker
              selectedValue={filtros.regionalId}
              onValueChange={(v: string | null) => {
                set("regionalId", v ?? "");
                set("administracaoId", "");
                set("setorId", "");
                set("localizacaoId", "");
              }}
              items={regionalItems}
            />
          </View>

          {filtros.regionalId ? (
            <>
              <Text style={styles.nivelLabel}>Administração</Text>
              <View style={styles.pickerBox}>
                <SelectPicker
                  selectedValue={filtros.administracaoId}
                  onValueChange={(v: string | null) => {
                    set("administracaoId", v ?? "");
                    set("setorId", "");
                    set("localizacaoId", "");
                  }}
                  items={administracaoItems}
                />
              </View>
            </>
          ) : null}

          {filtros.administracaoId ? (
            <>
              <Text style={styles.nivelLabel}>Setor</Text>
              <View style={styles.pickerBox}>
                <SelectPicker
                  selectedValue={filtros.setorId}
                  onValueChange={(v: string | null) => {
                    set("setorId", v ?? "");
                    set("localizacaoId", "");
                  }}
                  items={setorItems}
                />
              </View>
            </>
          ) : null}

          {filtros.setorId ? (
            <>
              <Text style={styles.nivelLabel}>Congregação</Text>
              <View style={[styles.pickerBox, styles.pickerBoxDestaque]}>
                <SelectPicker
                  selectedValue={filtros.localizacaoId}
                  onValueChange={(v: string | null) => set("localizacaoId", v ?? "")}
                  items={congregacaoItems}
                />
              </View>
            </>
          ) : null}

          {/* CARGO */}
          <Text style={styles.secaoTitulo}>Cargo que pode visualizar</Text>
          <View style={styles.pickerBox}>
            <SelectPicker
              selectedValue={filtros.cargoId}
              onValueChange={(v: string | null) => set("cargoId", v ?? "")}
              items={cargoItems}
            />
          </View>

        </ScrollView>

        {/* Footer */}
        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[styles.buscarButton, (!temFiltro || isBuscando) && styles.buscarButtonDisabled]}
            onPress={handleBuscar}
            disabled={!temFiltro || isBuscando}
          >
            {isBuscando
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.buscarButtonText}>🔍 Buscar</Text>
            }
          </TouchableOpacity>
        </View>

      </SafeScreen>
    </Modal>
  );
};

// -------------------------------------------
// TELA PRINCIPAL
// -------------------------------------------
const BuscaScreen: React.FC = () => {
  const eventoUseCases = useEventoUseCases();
  const modeloUseCases = useEventoModeloUseCases();

  const [modelos, setModelos] = useState<IEventoModelo[]>([]);
  const [localizacoes, setLocalizacoes] = useState<ILocalizacao[]>([]);
  const [cargos, setCargos] = useState<ICargo[]>([]);
  const [isLoadingAuxiliar, setIsLoadingAuxiliar] = useState(true);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [resultados, setResultados] = useState<IEvento[]>([]);
  const [isBuscando, setIsBuscando] = useState(false);
  const [buscaFeita, setBuscaFeita] = useState(false);
  const [filtrosAplicados, setFiltrosAplicados] = useState<string>("");

  const [eventoSelecionado, setEventoSelecionado] = useState<IEvento | null>(null);
  const [isDetalhesVisible, setIsDetalhesVisible] = useState(false);

  useEffect(() => {
    Promise.all([
      modeloUseCases.getAll.execute(true),
      serviceLocator.localizacaoService.getAllLocalizacoes(),
      serviceLocator.cargoService.getAllCargos(),
    ])
      .then(([mods, locs, cars]) => {
        setModelos(mods);
        setLocalizacoes(locs);
        setCargos(cars);
      })
      .catch(console.error)
      .finally(() => setIsLoadingAuxiliar(false));
  }, []);

  const getLocalizacaoIds = (filtros: Filtros, localizacoes: ILocalizacao[]): string[] => {
    if (filtros.localizacaoId) return [filtros.localizacaoId];
    if (filtros.setorId) {
      return localizacoes.filter((l) => l.tipo === "Congregação" && l.parent_id === filtros.setorId).map((l) => l.id);
    }
    if (filtros.administracaoId) {
      const setoresIds = localizacoes.filter((l) => l.tipo === "Setor" && l.parent_id === filtros.administracaoId).map((l) => l.id);
      return localizacoes.filter((l) => l.tipo === "Congregação" && setoresIds.includes(l.parent_id ?? "")).map((l) => l.id);
    }
    if (filtros.regionalId) {
      const admsIds = localizacoes.filter((l) => l.tipo === "Administração" && l.parent_id === filtros.regionalId).map((l) => l.id);
      const setoresIds = localizacoes.filter((l) => l.tipo === "Setor" && admsIds.includes(l.parent_id ?? "")).map((l) => l.id);
      return localizacoes.filter((l) => l.tipo === "Congregação" && setoresIds.includes(l.parent_id ?? "")).map((l) => l.id);
    }
    return [];
  };

  const montarResumo = (filtros: Filtros): string => {
    const partes: string[] = [];
    if (filtros.categoriaModelo) partes.push(filtros.categoriaModelo === "evento" ? "Eventos" : "Reuniões");
    if (filtros.modeloId) partes.push(modelos.find((m) => m.id === filtros.modeloId)?.nome ?? "");
    if (filtros.periodoValue) partes.push(PERIODOS.find((p) => p.value === filtros.periodoValue)?.label ?? "");
    if (filtros.localizacaoId) partes.push(localizacoes.find((l) => l.id === filtros.localizacaoId)?.nome ?? "");
    else if (filtros.setorId) partes.push(localizacoes.find((l) => l.id === filtros.setorId)?.nome ?? "");
    else if (filtros.administracaoId) partes.push(localizacoes.find((l) => l.id === filtros.administracaoId)?.nome ?? "");
    else if (filtros.regionalId) partes.push(localizacoes.find((l) => l.id === filtros.regionalId)?.nome ?? "");
    if (filtros.cargoId) partes.push(cargos.find((c) => c.id === filtros.cargoId)?.nome ?? "");
    return partes.filter(Boolean).join(" · ");
  };

  const handleBuscar = async (filtros: Filtros) => {
    setIsBuscando(true);
    setIsModalVisible(false);
    try {
      const periodo = filtros.periodoValue ? calcularPeriodo(filtros.periodoValue) : undefined;
      const locIds = getLocalizacaoIds(filtros, localizacoes);
      const eventos = await eventoUseCases.buscarEventos.execute({
        dataInicio: periodo?.inicio,
        dataFim: periodo?.fim,
        localizacaoIds: locIds.length > 0 ? locIds : undefined,
        modeloIds: filtros.modeloId ? [filtros.modeloId] : undefined,
        categoriaModelo: filtros.categoriaModelo || undefined,
        cargosVisiveis: filtros.cargoId ? [filtros.cargoId] : undefined,
      });
      setResultados(eventos);
      setFiltrosAplicados(montarResumo(filtros));
    } catch (err) {
      console.error(err);
    } finally {
      setIsBuscando(false);
      setBuscaFeita(true);
    }
  };

  if (isLoadingAuxiliar) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#17A2B8" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <SafeScreen style={styles.container}>

      {!buscaFeita && !isBuscando && (
        <View style={styles.inicialContainer}>
          <Text style={styles.inicialIcone}>🔍</Text>
          <Text style={styles.inicialTitulo}>Buscar Eventos e Reuniões</Text>
          <Text style={styles.inicialSubtitulo}>
            Use os filtros para encontrar eventos por período, localização, nome ou cargo.
          </Text>
          <TouchableOpacity style={styles.abrirFiltrosButton} onPress={() => setIsModalVisible(true)}>
            <Text style={styles.abrirFiltrosButtonText}>Definir filtros e buscar</Text>
          </TouchableOpacity>
        </View>
      )}

      {isBuscando && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#17A2B8" />
          <Text style={styles.loadingText}>Buscando...</Text>
        </View>
      )}

      {buscaFeita && !isBuscando && (
        <>
          <View style={styles.resultadosHeader}>
            <View style={styles.resultadosHeaderInfo}>
              <Text style={styles.resultadosCount}>
                {resultados.length === 0 ? "Nenhum resultado" : `${resultados.length} resultado${resultados.length > 1 ? "s" : ""}`}
              </Text>
              {filtrosAplicados ? (
                <Text style={styles.filtrosAplicadosText} numberOfLines={1}>{filtrosAplicados}</Text>
              ) : null}
            </View>
            <TouchableOpacity style={styles.alterarFiltrosButton} onPress={() => setIsModalVisible(true)}>
              <Text style={styles.alterarFiltrosButtonText}>⚙️ Filtros</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={resultados}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ResultadoCard
                evento={item}
                onPress={(e) => { setEventoSelecionado(e); setIsDetalhesVisible(true); }}
              />
            )}
            contentContainerStyle={{ paddingBottom: 20, paddingTop: 8 }}
            ListEmptyComponent={
              <View style={styles.vazioContainer}>
                <Text style={styles.vazioIcone}>📭</Text>
                <Text style={styles.vazioText}>Nenhum evento encontrado.</Text>
                <Text style={styles.vazioHint}>Tente ajustar os filtros.</Text>
              </View>
            }
          />
        </>
      )}

      <ModalFiltros
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onBuscar={handleBuscar}
        modelos={modelos}
        localizacoes={localizacoes}
        cargos={cargos}
        isBuscando={isBuscando}
      />

      <EventoDetailsModal
        isVisible={isDetalhesVisible}
        onClose={() => { setIsDetalhesVisible(false); setEventoSelecionado(null); }}
        evento={eventoSelecionado}
        onEdit={() => { }}
        onDelete={() => { }}
      />

    </SafeScreen>
  );
};

// -------------------------------------------
// ESTILOS
// -------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { fontSize: 15, color: "#6C757D" },
  inicialContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40, gap: 12 },
  inicialIcone: { fontSize: 48 },
  inicialTitulo: { fontSize: 20, fontWeight: "700", color: "#0A3D62", textAlign: "center" },
  inicialSubtitulo: { fontSize: 14, color: "#6C757D", textAlign: "center", lineHeight: 20 },
  abrirFiltrosButton: { marginTop: 8, backgroundColor: "#17A2B8", borderRadius: 10, paddingHorizontal: 28, paddingVertical: 14 },
  abrirFiltrosButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  resultadosHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#DEE2E6" },
  resultadosHeaderInfo: { flex: 1, marginRight: 10 },
  resultadosCount: { fontSize: 14, fontWeight: "700", color: "#0A3D62" },
  filtrosAplicadosText: { fontSize: 12, color: "#888", marginTop: 2 },
  alterarFiltrosButton: { borderWidth: 1.5, borderColor: "#17A2B8", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  alterarFiltrosButtonText: { fontSize: 13, color: "#17A2B8", fontWeight: "600" },
  card: { flexDirection: "row", backgroundColor: "#fff", marginHorizontal: 16, marginBottom: 10, borderRadius: 10, padding: 12, elevation: 1, alignItems: "center", gap: 12 },
  cardData: { alignItems: "center", minWidth: 40 },
  cardDia: { fontSize: 22, fontWeight: "800", color: "#0A3D62", lineHeight: 26 },
  cardMes: { fontSize: 12, fontWeight: "600", color: "#17A2B8", textTransform: "uppercase" },
  cardAno: { fontSize: 11, color: "#999" },
  cardDivider: { width: 1, alignSelf: "stretch", backgroundColor: "#DEE2E6" },
  cardInfo: { flex: 1, gap: 3 },
  cardTitulo: { fontSize: 15, fontWeight: "700", color: "#222" },
  cardModelo: { fontSize: 12, color: "#17A2B8", fontWeight: "600" },
  cardHora: { fontSize: 12, color: "#555" },
  cardLocal: { fontSize: 12, color: "#666" },
  recorrenteBadge: { alignSelf: "flex-start", backgroundColor: "#EEF9FB", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginTop: 2 },
  recorrenteBadgeText: { fontSize: 11, color: "#17A2B8", fontWeight: "600" },
  vazioContainer: { padding: 40, alignItems: "center", gap: 8 },
  vazioIcone: { fontSize: 40 },
  vazioText: { fontSize: 15, color: "#6C757D", textAlign: "center", fontWeight: "600" },
  vazioHint: { fontSize: 13, color: "#AAA", textAlign: "center" },
  modalContainer: { flex: 1, backgroundColor: "#F8F9FA" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#0A3D62", paddingTop: 50, paddingBottom: 15, paddingHorizontal: 16 },
  modalTitulo: { fontSize: 17, fontWeight: "700", color: "#fff" },
  modalCancelar: { fontSize: 15, color: "#BEE5EB" },
  modalLimpar: { fontSize: 15, color: "#FF6B6B", fontWeight: "600" },
  modalScroll: { flex: 1 },
  modalContent: { padding: 16, paddingBottom: 8 },
  modalFooter: { padding: 16, paddingBottom: 32, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#DEE2E6" },
  secaoTitulo: { fontSize: 13, fontWeight: "700", color: "#0A3D62", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 16, marginBottom: 6 },
  nivelLabel: { fontSize: 12, fontWeight: "600", color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 8, marginBottom: 4 },
  pickerBox: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#DEE2E6", borderRadius: 8, overflow: "hidden" },
  pickerBoxDestaque: { borderColor: "#0A3D62", borderWidth: 2 },
  buscarButton: { backgroundColor: "#0A3D62", borderRadius: 10, padding: 14, alignItems: "center" },
  buscarButtonDisabled: { backgroundColor: "#A0B4C8" },
  buscarButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});

export default BuscaScreen;
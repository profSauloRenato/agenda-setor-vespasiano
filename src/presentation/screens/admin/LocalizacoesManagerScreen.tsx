// src/presentation/screens/admin/LocalizacoesManagerScreen.tsx

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
import { NavigationProp, RouteProp } from "@react-navigation/native";
import { ILocalizacao, LocalizacaoTipo } from "../../../domain/models/ILocalizacao";
import {
  ILocalizacaoViewModelNode,
  LocalizacaoUseCases,
  useLocalizacoesViewModel,
} from "../../view_models/LocalizacoesViewModel";
import { LocalizacaoCreateModal } from "./components/LocalizacaoCreateModal";
import LocalizacaoDetailsModal from "./components/LocalizacaoDetailsModal";
import { LocalizacaoEditModal } from "./components/LocalizacaoEditModal";
import SafeScreen from "../../components/SafeScreen";
import { SelectPicker, SelectPickerItem } from "../admin/components/SelectPicker";

type AdminStackParamList = { LocalizacoesManager: { locationType: LocalizacaoTipo } };
type LocalizacoesManagerRouteProp = RouteProp<AdminStackParamList, "LocalizacoesManager">;
type LocalizacoesManagerNavigationProp = NavigationProp<AdminStackParamList, "LocalizacoesManager">;

export interface LocalizacoesManagerScreenProps {
  route: LocalizacoesManagerRouteProp;
  navigation: LocalizacoesManagerNavigationProp;
  localizacaoUseCases: LocalizacaoUseCases;
}

const CongregacaoItem: React.FC<{
  localizacao: ILocalizacaoViewModelNode;
  hierarquia: string;
  onPress: (loc: ILocalizacaoViewModelNode) => void;
}> = ({ localizacao, hierarquia, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={() => onPress(localizacao)} activeOpacity={0.7}>
    <View style={styles.cardLeft}>
      <Text style={styles.cardNome}>{localizacao.nome}</Text>
      {hierarquia ? <Text style={styles.cardHierarquia}>{hierarquia}</Text> : null}
    </View>
    <Feather name="chevron-right" size={18} color="#17A2B8" />
  </TouchableOpacity>
);

const LocalizacaoItem: React.FC<{
  localizacao: ILocalizacaoViewModelNode;
  onDelete: (id: string) => Promise<boolean>;
  onEdit: (loc: ILocalizacaoViewModelNode) => void;
  onViewDetails: (loc: ILocalizacaoViewModelNode) => void;
}> = ({ localizacao, onDelete, onEdit, onViewDetails }) => {
  const handleDelete = () => {
    Alert.alert(
      "Confirmar Exclusão",
      `Excluir "${localizacao.nome}" (${localizacao.tipo})?\n\n⚠️ Se houver sub-localizações ou usuários associados, a exclusão será bloqueada.`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: () => onDelete(localizacao.id) },
      ]
    );
  };
  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Text style={styles.cardNome}>{localizacao.nome}</Text>
        <Text style={styles.cardHierarquia}>
          {localizacao.nome_congregacao_sede ? `Sede: ${localizacao.nome_congregacao_sede}` : "Sede: Não definida"}
        </Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.btnEdit} onPress={() => onEdit(localizacao)}>
          <Feather name="edit-2" size={14} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnDelete} onPress={handleDelete}>
          <Feather name="trash-2" size={14} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const LocalizacoesManagerScreenComponent: React.FC<LocalizacoesManagerScreenProps> = ({
  route,
  localizacaoUseCases: injectedUseCases,
}) => {
  const locationType: LocalizacaoTipo = route.params?.locationType || ("Congregação" as LocalizacaoTipo);
  const isCongregacao = locationType === "Congregação";

  const pluralizeLocationType = (type: LocalizacaoTipo): string => {
    switch (type) {
      case "Congregação": return "Congregações";
      case "Administração": return "Administrações";
      case "Setor": return "Setores";
      case "Regional": return "Regionais";
      default: return `${type}s`;
    }
  };
  const pluralizedLocationType = pluralizeLocationType(locationType);
  const btnNovoLabel = locationType === "Setor" ? "Novo" : "Nova";
  const localizacaoUseCases = useMemo(() => injectedUseCases, [injectedUseCases]);

  const {
    state, refreshLocalizacoes,
    deleteLocalizacao: handleDeleteLocalizacao,
    createLocalizacao: handleCreateLocalizacao,
    updateLocalizacao: handleUpdateLocalizacao,
    getFullHierarchyNames, allLocalizacoes,
  } = useLocalizacoesViewModel(localizacaoUseCases);

  const [filtrosExpandido, setFiltrosExpandido] = useState(false);
  const [filtroRegionalId, setFiltroRegionalId] = useState<string>("todos");
  const [filtroAdminId, setFiltroAdminId] = useState<string>("todos");
  const [filtroSetorId, setFiltroSetorId] = useState<string>("todos");

  const regionais = useMemo(
    () => allLocalizacoes.filter(l => l.tipo === "Regional").sort((a, b) => a.nome.localeCompare(b.nome)),
    [allLocalizacoes]
  );
  const administracoes = useMemo(() => {
    const base = allLocalizacoes.filter(l => l.tipo === "Administração");
    return (filtroRegionalId === "todos" ? base : base.filter(l => l.parent_id === filtroRegionalId))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [allLocalizacoes, filtroRegionalId]);
  const setores = useMemo(() => {
    const base = allLocalizacoes.filter(l => l.tipo === "Setor");
    if (filtroAdminId !== "todos") return base.filter(l => l.parent_id === filtroAdminId).sort((a, b) => a.nome.localeCompare(b.nome));
    if (filtroRegionalId !== "todos") {
      const adminIds = administracoes.map(a => a.id);
      return base.filter(l => adminIds.includes(l.parent_id ?? "")).sort((a, b) => a.nome.localeCompare(b.nome));
    }
    return base.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [allLocalizacoes, filtroAdminId, filtroRegionalId, administracoes]);

  const handleRegionalChange = (val: string | null) => {
    setFiltroRegionalId(val ?? "todos");
    setFiltroAdminId("todos");
    setFiltroSetorId("todos");
  };
  const handleAdminChange = (val: string | null) => {
    setFiltroAdminId(val ?? "todos");
    setFiltroSetorId("todos");
  };

  const filtrosAtivos = [filtroRegionalId, filtroAdminId, filtroSetorId].filter(f => f !== "todos").length;
  const limparFiltros = () => { setFiltroRegionalId("todos"); setFiltroAdminId("todos"); setFiltroSetorId("todos"); };

  const listaFiltrada = useMemo(() => {
    let lista = state.localizacoes.filter(l => l.tipo === locationType);
    if (isCongregacao) {
      if (filtroSetorId !== "todos") {
        lista = lista.filter(l => l.parent_id === filtroSetorId);
      } else if (filtroAdminId !== "todos") {
        const setorIds = setores.map(s => s.id);
        lista = lista.filter(l => setorIds.includes(l.parent_id ?? ""));
      } else if (filtroRegionalId !== "todos") {
        const adminIds = administracoes.map(a => a.id);
        const setorIdsFiltrados = allLocalizacoes.filter(l => l.tipo === "Setor" && adminIds.includes(l.parent_id ?? "")).map(s => s.id);
        lista = lista.filter(l => setorIdsFiltrados.includes(l.parent_id ?? ""));
      }
    }
    return lista.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [state.localizacoes, locationType, filtroSetorId, filtroAdminId, filtroRegionalId, administracoes, setores, allLocalizacoes, isCongregacao]);

  const getHierarquiaLabel = (loc: ILocalizacaoViewModelNode): string => {
    const setor = allLocalizacoes.find(l => l.id === loc.parent_id);
    if (!setor) return "";
    const admin = allLocalizacoes.find(l => l.id === setor.parent_id);
    if (!admin) return setor.nome;
    const regional = allLocalizacoes.find(l => l.id === admin.parent_id);
    if (!regional) return `${admin.nome} › ${setor.nome}`;
    return `${regional.nome} › ${admin.nome} › ${setor.nome}`;
  };

  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [currentEdit, setCurrentEdit] = useState<ILocalizacaoViewModelNode | null>(null);
  const [currentDetail, setCurrentDetail] = useState<ILocalizacaoViewModelNode | null>(null);

  const handleOpenEdit = (loc: ILocalizacaoViewModelNode) => {
    setCurrentEdit(loc); setIsDetailsModalVisible(false); setIsEditModalVisible(true);
  };
  const handleOpenDetails = (loc: ILocalizacaoViewModelNode) => {
    setCurrentDetail(getFullHierarchyNames(loc)); setIsDetailsModalVisible(true);
  };

  const handleCreate = async (data: {
    nome: string; parent_id: string | null;
    endereco_rua: string | null; endereco_numero: string | null;
    endereco_bairro: string | null; endereco_cidade: string | null;
    endereco_estado: string | null; endereco_cep: string | null;
  }) => {
    await handleCreateLocalizacao({
      nome: data.nome, tipo: locationType, parent_id: data.parent_id,
      sede_congregacao_id: null, endereco_rua: data.endereco_rua,
      endereco_numero: data.endereco_numero, endereco_bairro: data.endereco_bairro,
      endereco_cidade: data.endereco_cidade, endereco_estado: data.endereco_estado,
      endereco_cep: data.endereco_cep,
    });
    setIsCreateModalVisible(false);
  };

  const handleUpdate = async (localizacao: ILocalizacao) => {
    await handleUpdateLocalizacao(localizacao);
    setIsEditModalVisible(false);
    setCurrentEdit(null);
  };

  useEffect(() => { refreshLocalizacoes(); }, [refreshLocalizacoes]);
  useEffect(() => {
    if (state.error && !state.isSubmitting) Alert.alert("Erro", state.error);
  }, [state.error, state.isSubmitting]);

  // Items para SelectPicker
  const regionalItems: SelectPickerItem[] = [
    { label: "Todas", value: "todos" },
    ...regionais.map(r => ({ label: r.nome, value: r.id })),
  ];
  const administracaoItems: SelectPickerItem[] = [
    { label: "Todas", value: "todos" },
    ...administracoes.map(a => ({ label: a.nome, value: a.id })),
  ];
  const setorItems: SelectPickerItem[] = [
    { label: "Todos", value: "todos" },
    ...setores.map(s => ({ label: s.nome, value: s.id })),
  ];

  return (
    <SafeScreen style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{pluralizedLocationType}</Text>
        <TouchableOpacity style={styles.btnNovo} onPress={() => setIsCreateModalVisible(true)}>
          <Feather name="plus" size={16} color="#fff" />
          <Text style={styles.btnNovoText}>{btnNovoLabel}</Text>
        </TouchableOpacity>
      </View>

      {isCongregacao && (
        <View style={styles.filtrosBox}>
          <TouchableOpacity style={styles.filtrosHeader} onPress={() => setFiltrosExpandido(prev => !prev)} activeOpacity={0.7}>
            <Feather name="filter" size={14} color="#17A2B8" />
            <Text style={styles.filtrosLabel}>Filtros</Text>
            {filtrosAtivos > 0 && (
              <TouchableOpacity onPress={limparFiltros}>
                <Text style={styles.limparFiltros}>Limpar ({filtrosAtivos})</Text>
              </TouchableOpacity>
            )}
            <Feather name={filtrosExpandido ? "chevron-up" : "chevron-down"} size={16} color="#17A2B8" style={{ marginLeft: 20 }} />
          </TouchableOpacity>

          {filtrosExpandido && (
            <View style={styles.filtrosConteudo}>
              <View style={styles.pickerRow}>
                <Text style={styles.pickerLabel}>Regional</Text>
                <View style={styles.pickerWrap}>
                  <SelectPicker selectedValue={filtroRegionalId} onValueChange={handleRegionalChange} items={regionalItems} dropdownIconColor="#17A2B8" />
                </View>
              </View>
              <View style={styles.pickerRow}>
                <Text style={styles.pickerLabel}>Administração</Text>
                <View style={styles.pickerWrap}>
                  <SelectPicker selectedValue={filtroAdminId} onValueChange={handleAdminChange} items={administracaoItems} enabled={administracoes.length > 0} dropdownIconColor="#17A2B8" />
                </View>
              </View>
              <View style={styles.pickerRow}>
                <Text style={styles.pickerLabel}>Setor</Text>
                <View style={styles.pickerWrap}>
                  <SelectPicker selectedValue={filtroSetorId} onValueChange={(v: string | null) => setFiltroSetorId(v ?? "todos")} items={setorItems} enabled={setores.length > 0} dropdownIconColor="#17A2B8" />
                </View>
              </View>
            </View>
          )}
        </View>
      )}

      {state.isLoading && listaFiltrada.length === 0 && (
        <ActivityIndicator size="large" color="#17A2B8" style={{ marginTop: 30 }} />
      )}

      {!state.isLoading && listaFiltrada.length === 0 && (
        <View style={styles.emptyState}>
          <Feather name="map-pin" size={40} color="#DEE2E6" />
          <Text style={styles.emptyText}>
            {filtrosAtivos > 0 ? "Nenhuma congregação encontrada para os filtros selecionados." : `Nenhuma ${locationType.toLowerCase()} cadastrada ainda.`}
          </Text>
        </View>
      )}

      {!state.isLoading && listaFiltrada.length > 0 && (
        <FlatList
          data={listaFiltrada}
          keyExtractor={item => item.id}
          renderItem={({ item }) =>
            isCongregacao ? (
              <CongregacaoItem localizacao={item} hierarquia={getHierarquiaLabel(item)} onPress={handleOpenDetails} />
            ) : (
              <LocalizacaoItem localizacao={item} onDelete={handleDeleteLocalizacao} onEdit={handleOpenEdit} onViewDetails={handleOpenDetails} />
            )
          }
          contentContainerStyle={{ paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {listaFiltrada.length}{" "}
          {listaFiltrada.length === 1 ? locationType.toLowerCase() : pluralizedLocationType.toLowerCase()}{" "}
          {filtrosAtivos > 0 ? "encontrada(s)" : "no total"}
        </Text>
      </View>

      <LocalizacaoCreateModal isVisible={isCreateModalVisible} onClose={() => setIsCreateModalVisible(false)} creationType={locationType} allLocalizacoes={allLocalizacoes} onSave={handleCreate} />

      {currentEdit && (
        <LocalizacaoEditModal isVisible={isEditModalVisible} onClose={() => { setIsEditModalVisible(false); setCurrentEdit(null); }} localizacao={currentEdit as ILocalizacao} onUpdate={handleUpdate} allLocalizacoes={allLocalizacoes} />
      )}

      <LocalizacaoDetailsModal
        isVisible={isDetailsModalVisible}
        onClose={() => { setIsDetailsModalVisible(false); setCurrentDetail(null); }}
        localizacao={currentDetail}
        onEdit={handleOpenEdit}
        onDelete={loc => {
          Alert.alert("Confirmar Exclusão", `Excluir "${loc.nome}"?\n\n⚠️ Se houver sub-localizações ou usuários associados, a exclusão será bloqueada.`, [
            { text: "Cancelar", style: "cancel" },
            { text: "Excluir", style: "destructive", onPress: () => { handleDeleteLocalizacao(loc.id); setIsDetailsModalVisible(false); } },
          ]);
        }}
      />
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F4F8" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#0A3D62", paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  btnNovo: { flexDirection: "row", alignItems: "center", backgroundColor: "#17A2B8", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, gap: 6 },
  btnNovoText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  filtrosBox: { backgroundColor: "#fff", marginHorizontal: 15, marginTop: 15, marginBottom: 10, borderRadius: 12, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 6, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
  filtrosHeader: { flexDirection: "row", alignItems: "center", gap: 6, paddingBottom: 8 },
  filtrosLabel: { fontSize: 13, fontWeight: "700", color: "#17A2B8", flex: 1, textTransform: "uppercase", letterSpacing: 0.5 },
  limparFiltros: { fontSize: 12, color: "#DC3545", fontWeight: "600" },
  filtrosConteudo: { borderTopWidth: 1, borderTopColor: "#F0F4F8", paddingTop: 10, paddingBottom: 8, gap: 8 },
  pickerRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  pickerLabel: { width: 110, fontSize: 13, color: "#4A4A6A", fontWeight: "600" },
  pickerWrap: { flex: 1, borderWidth: 1, borderColor: "#DEE2E6", borderRadius: 8, overflow: "hidden", backgroundColor: "#fff" },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", marginHorizontal: 15, marginTop: 10, borderRadius: 10, paddingVertical: 14, paddingHorizontal: 16, elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2 },
  cardLeft: { flex: 1 },
  cardNome: { fontSize: 15, fontWeight: "700", color: "#0A3D62" },
  cardHierarquia: { fontSize: 12, color: "#6C757D", marginTop: 3 },
  cardActions: { flexDirection: "row", gap: 8 },
  btnEdit: { backgroundColor: "#FFC107", padding: 8, borderRadius: 8 },
  btnDelete: { backgroundColor: "#DC3545", padding: 8, borderRadius: 8 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 40 },
  emptyText: { textAlign: "center", color: "#ADB5BD", fontSize: 14, lineHeight: 22 },
  footer: { borderTopWidth: 1, borderTopColor: "#DEE2E6", paddingVertical: 12, paddingHorizontal: 20, backgroundColor: "#fff", alignItems: "center" },
  footerText: { fontSize: 13, color: "#6C757D", fontWeight: "600" },
});

export const LocalizacoesManagerScreen = LocalizacoesManagerScreenComponent;
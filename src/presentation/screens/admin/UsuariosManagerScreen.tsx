// src/presentation/screens/admin/UsuariosManagerScreen.tsx

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
import { ICargo } from "../../../domain/models/ICargo";
import { ILocalizacao } from "../../../domain/models/ILocalizacao";
import { IUsuario } from "../../../domain/models/IUsuario";
import { CargoUseCases } from "../../../domain/use_cases/cargos/types";
import { useAuth } from "../../context/AuthContext";
import { UsuariosViewModel } from "../../view_models/UsuariosViewModel";
import { UsuarioCreateModal } from "./components/UsuarioCreateModal";
import { UsuarioEditModal } from "./components/UsuarioEditModal";
import SafeScreen from "../../components/SafeScreen";
import { useUsuarioService } from "../../../config/serviceLocator";
import { SelectPicker, SelectPickerItem } from "../admin/components/SelectPicker";

type UsuarioDataToCreate = Pick<IUsuario, "nome" | "email" | "localizacao_id" | "is_admin">;

interface UsuariosManagerScreenProps {
  usuariosViewModel: UsuariosViewModel;
  cargoUseCases: CargoUseCases;
}

const UsuarioItem: React.FC<{
  item: IUsuario;
  onEdit: (u: IUsuario) => void;
  onDelete: (u: IUsuario) => void;
}> = ({ item, onEdit, onDelete }) => (
  <View style={styles.card}>
    <View style={styles.cardTop}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.nome.split(" ").slice(0, 2).map(p => p[0]).join("").toUpperCase()}
        </Text>
      </View>
      <View style={styles.cardTopInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.cardNome} numberOfLines={1}>{item.nome}</Text>
          {item.deve_trocar_senha && (
            <View style={styles.provisoriaBadge}>
              <Feather name="clock" size={10} color="#856404" />
              <Text style={styles.provisoriaText}>Provisória</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardEmail} numberOfLines={1}>{item.email}</Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.btnEdit} onPress={() => onEdit(item)}>
          <Feather name="edit-2" size={14} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnDelete} onPress={() => onDelete(item)}>
          <Feather name="trash-2" size={14} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
    <View style={styles.cardBottom}>
      <View style={styles.cardTag}>
        <Feather name="map-pin" size={11} color="#17A2B8" />
        <Text style={styles.cardTagText} numberOfLines={1}>{item.nome_localizacao || "Sem congregação"}</Text>
      </View>
      <View style={styles.cardTag}>
        <Feather name="briefcase" size={11} color="#17A2B8" />
        <Text style={styles.cardTagText} numberOfLines={1}>{(item.cargos || []).map(c => c.nome).join(", ") || "Sem cargo"}</Text>
      </View>
      <View style={[styles.cardTag, item.is_admin ? styles.tagAdmin : styles.tagMembro]}>
        <Text style={[styles.cardTagText, item.is_admin ? styles.tagAdminText : styles.tagMembroText]}>
          {item.is_admin ? "Admin" : "Usuário"}
        </Text>
      </View>
    </View>
  </View>
);

export const UsuariosManagerScreen: React.FC<UsuariosManagerScreenProps> = ({
  usuariosViewModel,
  cargoUseCases,
}) => {
  const { user } = useAuth();
  const usuarioService = useUsuarioService();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCreationModalVisible, setIsCreationModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IUsuario | null>(null);
  const [availableCargos, setAvailableCargos] = useState<ICargo[]>([]);
  const [state, setState] = useState(usuariosViewModel.state);

  const [filtrosExpandido, setFiltrosExpandido] = useState(false);
  const [filtroLocalizacaoId, setFiltroLocalizacaoId] = useState<string>("todos");
  const [filtroCargoId, setFiltroCargoId] = useState<string>("todos");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");

  useEffect(() => { setState(usuariosViewModel.state); }, [usuariosViewModel.state]);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        await Promise.all([usuariosViewModel.loadUsuarios(user), usuariosViewModel.loadReferenceData(user)]);
        setState({ ...usuariosViewModel.state });
      } catch (error) { console.error("Erro ao carregar dados iniciais:", error); }
    };
    loadData();
  }, [user]);

  useEffect(() => {
    const loadCargos = async () => {
      try {
        const cargos = await cargoUseCases.getCargos.execute();
        setAvailableCargos(cargos);
      } catch (error) { console.error("Erro ao carregar cargos:", error); }
    };
    loadCargos();
  }, []);

  const localizacoesFiltro = useMemo(() => {
    const mapa = new Map<string, string>();
    state.usuarios.forEach(u => { if (u.localizacao_id && u.nome_localizacao) mapa.set(u.localizacao_id, u.nome_localizacao); });
    return Array.from(mapa.entries()).map(([id, nome]) => ({ id, nome })).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [state.usuarios]);

  const cargosFiltro = useMemo(() => {
    const mapa = new Map<string, string>();
    state.usuarios.forEach(u => (u.cargos || []).forEach(c => mapa.set(c.id, c.nome)));
    return Array.from(mapa.entries()).map(([id, nome]) => ({ id, nome })).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [state.usuarios]);

  const filtrosAtivos = [filtroLocalizacaoId, filtroCargoId, filtroTipo].filter(f => f !== "todos").length;
  const limparFiltros = () => { setFiltroLocalizacaoId("todos"); setFiltroCargoId("todos"); setFiltroTipo("todos"); };

  const listaFiltrada = useMemo(() => {
    let lista = [...state.usuarios];
    if (filtroLocalizacaoId !== "todos") lista = lista.filter(u => u.localizacao_id === filtroLocalizacaoId);
    if (filtroCargoId !== "todos") lista = lista.filter(u => (u.cargos || []).some(c => c.id === filtroCargoId));
    if (filtroTipo === "admin") lista = lista.filter(u => u.is_admin);
    else if (filtroTipo === "membro") lista = lista.filter(u => !u.is_admin);
    return lista.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [state.usuarios, filtroLocalizacaoId, filtroCargoId, filtroTipo]);

  const handleEdit = (usuario: IUsuario) => { setSelectedUser(usuario); setIsModalVisible(true); };

  const handleCreate = async (novoUsuario: UsuarioDataToCreate, cargosIds: string[], senha: string) => {
    if (!user) return;
    try {
      await usuariosViewModel.handleCreateUsuario(user, novoUsuario, cargosIds, senha);
      setState({ ...usuariosViewModel.state });
      setIsCreationModalVisible(false);
    } catch { Alert.alert("Erro ao Criar Usuário", usuariosViewModel.state.error || "Ocorreu uma falha na criação."); }
  };

  const handleSave = async (updatedUsuario: IUsuario, novosCargosIds: string[]) => {
    if (!user) return;
    try {
      await usuariosViewModel.handleUpdateUsuario(user, updatedUsuario, novosCargosIds);
      setState({ ...usuariosViewModel.state });
      setIsModalVisible(false);
      Alert.alert("Sucesso", `Membro ${updatedUsuario.nome} atualizado com sucesso!`);
    } catch { Alert.alert("Erro ao Salvar", usuariosViewModel.state.error || "Ocorreu uma falha na atualização."); }
  };

  const handleResetSenha = async (userId: string, novaSenha: string) => {
    await usuarioService.adminResetSenha(userId, novaSenha);
    if (user) { await usuariosViewModel.loadUsuarios(user); setState({ ...usuariosViewModel.state }); }
  };

  const handleDelete = (usuario: IUsuario) => {
    if (!user) return;
    Alert.alert("Confirmar Exclusão", `Tem certeza que deseja remover "${usuario.nome}"? Esta ação é irreversível.`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover", style: "destructive",
        onPress: async () => {
          try {
            await usuariosViewModel.handleDeleteUsuario(user, usuario.id);
            setState({ ...usuariosViewModel.state });
          } catch { Alert.alert("Erro ao Remover", usuariosViewModel.state.error || "Ocorreu uma falha na remoção."); }
        },
      },
    ]);
  };

  if (state.isLoading && state.usuarios.length === 0) {
    return <ActivityIndicator size="large" style={styles.centerContainer} color="#17A2B8" />;
  }
  if (state.error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{`Erro: ${state.error}`}</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={() => { if (user) { usuariosViewModel.loadUsuarios(user); setState({ ...usuariosViewModel.state }); } }}>
          <Text style={styles.refreshButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Items para SelectPicker
  const localizacaoItems: SelectPickerItem[] = [
    { label: "Todas", value: "todos" },
    ...localizacoesFiltro.map(l => ({ label: l.nome, value: l.id })),
  ];
  const cargoItems: SelectPickerItem[] = [
    { label: "Todos", value: "todos" },
    ...cargosFiltro.map(c => ({ label: c.nome, value: c.id })),
  ];
  const tipoItems: SelectPickerItem[] = [
    { label: "Todos", value: "todos" },
    { label: "Administradores", value: "admin" },
    { label: "Membros padrão", value: "membro" },
  ];

  return (
    <SafeScreen style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Membros</Text>
        <TouchableOpacity style={styles.btnNovo} onPress={() => setIsCreationModalVisible(true)}>
          <Feather name="plus" size={16} color="#fff" />
          <Text style={styles.btnNovoText}>Novo</Text>
        </TouchableOpacity>
      </View>

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
              <Text style={styles.pickerLabel}>Congregação</Text>
              <View style={styles.pickerWrap}>
                <SelectPicker selectedValue={filtroLocalizacaoId} onValueChange={(v: string | null) => setFiltroLocalizacaoId(v ?? "todos")} items={localizacaoItems} dropdownIconColor="#17A2B8" />
              </View>
            </View>
            <View style={styles.pickerRow}>
              <Text style={styles.pickerLabel}>Cargo</Text>
              <View style={styles.pickerWrap}>
                <SelectPicker selectedValue={filtroCargoId} onValueChange={(v: string | null) => setFiltroCargoId(v ?? "todos")} items={cargoItems} enabled={cargosFiltro.length > 0} dropdownIconColor="#17A2B8" />
              </View>
            </View>
            <View style={styles.pickerRow}>
              <Text style={styles.pickerLabel}>Perfil</Text>
              <View style={styles.pickerWrap}>
                <SelectPicker selectedValue={filtroTipo} onValueChange={(v: string | null) => setFiltroTipo(v ?? "todos")} items={tipoItems} dropdownIconColor="#17A2B8" />
              </View>
            </View>
          </View>
        )}
      </View>

      {!state.isLoading && listaFiltrada.length === 0 && (
        <View style={styles.emptyState}>
          <Feather name="users" size={40} color="#DEE2E6" />
          <Text style={styles.emptyText}>
            {filtrosAtivos > 0 ? "Nenhum membro encontrado para os filtros selecionados." : "Nenhum membro cadastrado ainda."}
          </Text>
        </View>
      )}

      <FlatList
        data={listaFiltrada}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <UsuarioItem item={item} onEdit={handleEdit} onDelete={handleDelete} />}
        contentContainerStyle={{ paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
        refreshing={state.isLoading && state.usuarios.length > 0}
        onRefresh={() => { if (user) { usuariosViewModel.loadUsuarios(user); setState({ ...usuariosViewModel.state }); } }}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {listaFiltrada.length} {listaFiltrada.length === 1 ? "membro" : "membros"} {filtrosAtivos > 0 ? "encontrado(s)" : "no total"}
        </Text>
      </View>

      {selectedUser && (
        <UsuarioEditModal isVisible={isModalVisible} onClose={() => setIsModalVisible(false)} usuario={selectedUser} availableCargos={availableCargos} availableLocalizacoes={state.localizacoesDisponiveis as ILocalizacao[]} onSave={handleSave} onResetSenha={handleResetSenha} />
      )}
      {isCreationModalVisible && (
        <UsuarioCreateModal isVisible={isCreationModalVisible} onClose={() => setIsCreationModalVisible(false)} availableCargos={availableCargos} availableLocalizacoes={state.localizacoesDisponiveis as ILocalizacao[]} onSave={handleCreate} />
      )}
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F4F8" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F0F4F8" },
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
  card: { backgroundColor: "#fff", marginHorizontal: 15, marginTop: 10, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2 },
  cardTop: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#0A3D62", justifyContent: "center", alignItems: "center", marginRight: 10 },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  cardTopInfo: { flex: 1, marginRight: 8 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  cardNome: { fontSize: 15, fontWeight: "700", color: "#0A3D62", flexShrink: 1 },
  provisoriaBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#FFF3CD", borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: "#FFEAA7" },
  provisoriaText: { fontSize: 10, color: "#856404", fontWeight: "600" },
  cardEmail: { fontSize: 12, color: "#6C757D", marginTop: 2 },
  cardActions: { flexDirection: "row", gap: 8 },
  btnEdit: { backgroundColor: "#FFC107", padding: 8, borderRadius: 8 },
  btnDelete: { backgroundColor: "#DC3545", padding: 8, borderRadius: 8 },
  cardBottom: { flexDirection: "row", flexWrap: "wrap", gap: 6, borderTopWidth: 1, borderTopColor: "#F0F4F8", paddingTop: 8 },
  cardTag: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#F0F4F8", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, maxWidth: "60%" },
  cardTagText: { fontSize: 11, color: "#4A4A6A", fontWeight: "500" },
  tagAdmin: { backgroundColor: "#FDECEA" },
  tagAdminText: { color: "#DC3545", fontWeight: "700" },
  tagMembro: { backgroundColor: "#EEF6FF" },
  tagMembroText: { color: "#0A3D62", fontWeight: "600" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 40 },
  emptyText: { textAlign: "center", color: "#ADB5BD", fontSize: 14, lineHeight: 22 },
  footer: { borderTopWidth: 1, borderTopColor: "#DEE2E6", paddingVertical: 12, paddingHorizontal: 20, backgroundColor: "#fff", alignItems: "center" },
  footerText: { fontSize: 13, color: "#6C757D", fontWeight: "600" },
  errorText: { fontSize: 18, color: "#DC3545", textAlign: "center", marginBottom: 20 },
  refreshButton: { backgroundColor: "#0A3D62", padding: 10, borderRadius: 5 },
  refreshButtonText: { color: "#FFFFFF", fontWeight: "bold" },
});
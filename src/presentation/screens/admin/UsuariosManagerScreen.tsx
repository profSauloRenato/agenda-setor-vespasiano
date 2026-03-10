// src/presentation/screens/admin/UsuariosManagerScreen.tsx

import React, { useEffect, useState } from "react";
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

type UsuarioDataToCreate = Pick<IUsuario, "nome" | "email" | "localizacao_id" | "is_admin">;

interface UsuariosManagerScreenProps {
  usuariosViewModel: UsuariosViewModel;
  cargoUseCases: CargoUseCases;
}

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

  useEffect(() => {
    setState(usuariosViewModel.state);
  }, [usuariosViewModel.state]);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        await Promise.all([
          usuariosViewModel.loadUsuarios(user),
          usuariosViewModel.loadReferenceData(user),
        ]);
        setState({ ...usuariosViewModel.state });
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
      }
    };
    loadData();
  }, [user]);

  useEffect(() => {
    const loadCargos = async () => {
      try {
        const cargos = await cargoUseCases.getCargos.execute();
        setAvailableCargos(cargos);
      } catch (error) {
        console.error("Erro ao carregar cargos disponíveis:", error);
      }
    };
    loadCargos();
  }, []);

  const handleEdit = (usuario: IUsuario) => {
    setSelectedUser(usuario);
    setIsModalVisible(true);
  };

  const handleAddUser = () => setIsCreationModalVisible(true);

  const handleCreate = async (
    novoUsuario: UsuarioDataToCreate,
    cargosIds: string[],
    senha: string,
  ) => {
    if (!user) return;
    try {
      await usuariosViewModel.handleCreateUsuario(user, novoUsuario, cargosIds, senha);
      setState({ ...usuariosViewModel.state });
      setIsCreationModalVisible(false);
    } catch (error) {
      Alert.alert("Erro ao Criar Usuário", usuariosViewModel.state.error || "Ocorreu uma falha na criação.");
    }
  };

  const handleSave = async (updatedUsuario: IUsuario, novosCargosIds: string[]) => {
    if (!user) return;
    try {
      await usuariosViewModel.handleUpdateUsuario(user, updatedUsuario, novosCargosIds);
      setState({ ...usuariosViewModel.state });
      setIsModalVisible(false);
      Alert.alert("Sucesso", `Membro ${updatedUsuario.nome} atualizado com sucesso!`);
    } catch (error) {
      Alert.alert("Erro ao Salvar", usuariosViewModel.state.error || "Ocorreu uma falha na atualização.");
    }
  };

  const handleResetSenha = async (userId: string, novaSenha: string) => {
    await usuarioService.adminResetSenha(userId, novaSenha);
    // Recarrega lista para atualizar badge de deve_trocar_senha
    if (user) {
      await usuariosViewModel.loadUsuarios(user);
      setState({ ...usuariosViewModel.state });
    }
  };

  const handleDelete = (usuario: IUsuario) => {
    if (!user) return;
    Alert.alert(
      "Confirmar Exclusão",
      `Tem certeza que deseja remover o membro "${usuario.nome}"? Esta ação é irreversível.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              await usuariosViewModel.handleDeleteUsuario(user, usuario.id);
              setState({ ...usuariosViewModel.state });
            } catch (error) {
              Alert.alert("Erro ao Remover", usuariosViewModel.state.error || "Ocorreu uma falha na remoção do usuário.");
            }
          },
        },
      ],
    );
  };

  const renderUserItem = ({ item }: { item: IUsuario }) => (
    <View style={styles.itemContainer}>
      <View style={styles.topInfoContainer}>
        <View style={styles.nameRow}>
          <Text style={styles.userName}>{item.nome}</Text>
          {item.deve_trocar_senha && (
            <View style={styles.provisoriaBadge}>
              <Feather name="clock" size={11} color="#856404" />
              <Text style={styles.provisoriaText}>Senha provisória</Text>
            </View>
          )}
        </View>
        <Text style={styles.userCargos}>
          {`Cargos: ${(item.cargos || []).map((c) => c.nome).join(", ") || "Nenhum"}`}
        </Text>
        <Text style={styles.userLocation}>
          {`Localização: ${item.nome_localizacao || "Não definido"}`}
        </Text>
      </View>
      <View style={styles.detailsAndActionsContainer}>
        <View style={styles.bottomInfoColumn}>
          <Text style={styles.userEmail}>{item.email}</Text>
          <Text style={styles.userStatus}>
            <Text style={item.is_admin ? styles.userAdminStatus : styles.userMemberStatus}>
              {item.is_admin ? "ADMINISTRADOR" : "MEMBRO PADRÃO"}
            </Text>
          </Text>
        </View>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            onPress={() => handleEdit(item)}
            style={[styles.actionButton, { backgroundColor: "#FFC107", marginRight: 8 }]}
          >
            <Text style={styles.actionButtonText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDelete(item)}
            style={[styles.actionButton, { backgroundColor: "#DC3545" }]}
          >
            <Text style={styles.actionButtonText}>Remover</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (state.isLoading) {
    return <ActivityIndicator size="large" style={styles.centerContainer} color="#0A3D62" />;
  }

  if (state.error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{`Erro: ${state.error}`}</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => {
            if (user) {
              usuariosViewModel.loadUsuarios(user);
              usuariosViewModel.loadReferenceData(user);
              setState({ ...usuariosViewModel.state });
            }
          }}
        >
          <Text style={styles.refreshButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeScreen style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>
          Gerenciamento de Membros ({state.usuarios.length})
        </Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddUser}>
          <Text style={styles.addButtonText}>+ Adicionar Membro</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={state.usuarios}
        keyExtractor={(item) => item.id}
        renderItem={renderUserItem}
        refreshing={state.isLoading && state.usuarios.length > 0}
        onRefresh={() => {
          if (user) {
            usuariosViewModel.loadUsuarios(user);
            usuariosViewModel.loadReferenceData(user);
            setState({ ...usuariosViewModel.state });
          }
        }}
      />

      {selectedUser && (
        <UsuarioEditModal
          isVisible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          usuario={selectedUser}
          availableCargos={availableCargos}
          availableLocalizacoes={state.localizacoesDisponiveis as ILocalizacao[]}
          onSave={handleSave}
          onResetSenha={handleResetSenha}
        />
      )}

      {isCreationModalVisible && (
        <UsuarioCreateModal
          isVisible={isCreationModalVisible}
          onClose={() => setIsCreationModalVisible(false)}
          availableCargos={availableCargos}
          availableLocalizacoes={state.localizacoesDisponiveis as ILocalizacao[]}
          onSave={handleCreate}
        />
      )}
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F0F4F8" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F0F4F8" },
  headerContainer: { paddingVertical: 15, backgroundColor: "#F0F4F8" },
  header: { fontSize: 22, fontWeight: "bold", color: "#0A3D62", marginBottom: 15 },
  addButton: {
    backgroundColor: "#17A2B8",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
    elevation: 2,
  },
  addButtonText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 16 },
  itemContainer: {
    padding: 15,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginBottom: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  topInfoContainer: { marginBottom: 10 },
  nameRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 2 },
  userName: { fontSize: 18, fontWeight: "600", color: "#333" },
  provisoriaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF3CD",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#FFEAA7",
  },
  provisoriaText: { fontSize: 11, color: "#856404", fontWeight: "600" },
  detailsAndActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
  bottomInfoColumn: { flex: 1, marginRight: 10 },
  userEmail: { fontSize: 14, color: "#6C757D" },
  userAdminStatus: { fontWeight: "bold", color: "#DC3545" },
  userMemberStatus: { fontWeight: "500", color: "#6C757D" },
  userStatus: { marginTop: 5 },
  userLocation: { fontSize: 14, color: "#6C757D", marginTop: 4 },
  userCargos: { fontSize: 14, color: "#0A3D62", fontWeight: "500", marginTop: 5 },
  actionsContainer: { flexDirection: "row", alignItems: "center" },
  actionButton: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 5 },
  actionButtonText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 14 },
  errorText: { fontSize: 18, color: "#DC3545", textAlign: "center", marginBottom: 20 },
  refreshButton: { backgroundColor: "#0A3D62", padding: 10, borderRadius: 5 },
  refreshButtonText: { color: "#FFFFFF", fontWeight: "bold" },
});
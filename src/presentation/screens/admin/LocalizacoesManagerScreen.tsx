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

import { NavigationProp, RouteProp } from "@react-navigation/native";
import {
  ILocalizacao,
  LocalizacaoTipo,
} from "../../../domain/models/ILocalizacao";
import {
  ILocalizacaoViewModelNode,
  LocalizacaoUseCases,
  useLocalizacoesViewModel,
} from "../../view_models/LocalizacoesViewModel";

import { LocalizacaoCreateModal } from "./components/LocalizacaoCreateModal";
import LocalizacaoDetailsModal from "./components/LocalizacaoDetailsModal";
import { LocalizacaoEditModal } from "./components/LocalizacaoEditModal";

type AdminStackParamList = {
  LocalizacoesManager: { locationType: LocalizacaoTipo };
};

type LocalizacoesManagerRouteProp = RouteProp<
  AdminStackParamList,
  "LocalizacoesManager"
>;

type LocalizacoesManagerNavigationProp = NavigationProp<
  AdminStackParamList,
  "LocalizacoesManager"
>;

export interface LocalizacoesManagerScreenProps {
  route: LocalizacoesManagerRouteProp;
  navigation: LocalizacoesManagerNavigationProp;
  localizacaoUseCases: LocalizacaoUseCases;
}

// -------------------------------------------
// COMPONENTE: ITEM DA LISTA
// -------------------------------------------
const LocalizacaoItem: React.FC<{
  localizacao: ILocalizacaoViewModelNode;
  onDelete: (id: string) => Promise<boolean>;
  onEdit: (loc: ILocalizacaoViewModelNode) => void;
  onViewDetails: (loc: ILocalizacaoViewModelNode) => void;
}> = ({ localizacao, onDelete, onEdit, onViewDetails }) => {
  const handleDelete = () => {
    Alert.alert(
      "Confirmar Exclusão",
      `Tem certeza que deseja excluir "${localizacao.nome}" (${localizacao.tipo})?\n\n⚠️ Se houver sub-localizações ou usuários associados, a exclusão será bloqueada.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => onDelete(localizacao.id),
        },
      ]
    );
  };

  if (localizacao.tipo === "Congregação") {
    return (
      <TouchableOpacity
        style={styles.localizacaoItemSimplified}
        onPress={() => onViewDetails(localizacao)}
      >
        <Text style={styles.localizacaoNameSimplified}>{localizacao.nome}</Text>
        <Text style={styles.viewDetailsText}>Ver Detalhes </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.localizacaoItem}>
      <View style={styles.textContainer}>
        <Text style={styles.localizacaoName}>{localizacao.nome}</Text>
        {localizacao.nome_congregacao_sede ? (
          <Text style={styles.localizacaoType}>
            Sede: {localizacao.nome_congregacao_sede}
          </Text>
        ) : (
          <Text style={styles.localizacaoType}>Sede: Não Definida</Text>
        )}
      </View>
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#FFC107" }]}
          onPress={() => onEdit(localizacao)}
        >
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#DC3545", marginLeft: 10 }]}
          onPress={handleDelete}
        >
          <Text style={styles.actionButtonText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// -------------------------------------------
// TELA PRINCIPAL
// -------------------------------------------
const LocalizacoesManagerScreenComponent: React.FC<LocalizacoesManagerScreenProps> = ({ route, localizacaoUseCases: injectedUseCases }) => {
  const locationType: LocalizacaoTipo =
    route.params?.locationType || ("Congregação" as LocalizacaoTipo);

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

  const localizacaoUseCases: LocalizacaoUseCases = useMemo(
    () => injectedUseCases,
    [injectedUseCases]
  );

  const {
    state,
    refreshLocalizacoes,
    deleteLocalizacao: handleDeleteLocalizacao,
    createLocalizacao: handleCreateLocalizacao,
    updateLocalizacao: handleUpdateLocalizacao,
    getFullHierarchyNames,
    allLocalizacoes,
  } = useLocalizacoesViewModel(localizacaoUseCases);

  // Estado dos modais
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [currentLocalizacaoToEdit, setCurrentLocalizacaoToEdit] =
    useState<ILocalizacaoViewModelNode | null>(null);
  const [currentLocalizacaoToDetail, setCurrentLocalizacaoToDetail] =
    useState<ILocalizacaoViewModelNode | null>(null);

  const filteredLocalizacoes = state.localizacoes.filter(
    (loc) => loc.tipo === locationType
  );

  const handleOpenCreate = () => setIsCreateModalVisible(true);

  const handleOpenEdit = (localizacao: ILocalizacaoViewModelNode) => {
    setCurrentLocalizacaoToEdit(localizacao);
    setIsDetailsModalVisible(false);
    setIsEditModalVisible(true);
  };

  const handleOpenDetails = (localizacao: ILocalizacaoViewModelNode) => {
    setCurrentLocalizacaoToDetail(getFullHierarchyNames(localizacao));
    setIsDetailsModalVisible(true);
  };

  const handleCreate = async (data: {
    nome: string;
    parent_id: string | null;
    endereco_rua: string | null;
    endereco_numero: string | null;
    endereco_bairro: string | null;
    endereco_cidade: string | null;
    endereco_estado: string | null;
    endereco_cep: string | null;
  }) => {
    await handleCreateLocalizacao({
      nome: data.nome,
      tipo: locationType,
      parent_id: data.parent_id,
      sede_congregacao_id: null,
      endereco_rua: data.endereco_rua,
      endereco_numero: data.endereco_numero,
      endereco_bairro: data.endereco_bairro,
      endereco_cidade: data.endereco_cidade,
      endereco_estado: data.endereco_estado,
      endereco_cep: data.endereco_cep,
    });
    setIsCreateModalVisible(false);
  };

  const handleUpdate = async (localizacao: ILocalizacao) => {
    await handleUpdateLocalizacao(localizacao);
    setIsEditModalVisible(false);
    setCurrentLocalizacaoToEdit(null);
  };

  useEffect(() => {
    refreshLocalizacoes();
  }, [refreshLocalizacoes]);

  useEffect(() => {
    if (state.error && !state.isSubmitting) {
      Alert.alert("Erro", state.error);
    }
  }, [state.error, state.isSubmitting]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        Gerenciamento de {pluralizedLocationType}
      </Text>

      <TouchableOpacity style={styles.addButton} onPress={handleOpenCreate}>
        <Text style={styles.addButtonText}>+ Criar Novo(a) {locationType}</Text>
      </TouchableOpacity>

      {state.isLoading && filteredLocalizacoes.length === 0 && (
        <ActivityIndicator size="large" color="#17A2B8" style={{ marginTop: 20 }} />
      )}

      {!state.isLoading && filteredLocalizacoes.length > 0 && (
        <FlatList
          data={filteredLocalizacoes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <LocalizacaoItem
              localizacao={item}
              onDelete={handleDeleteLocalizacao}
              onEdit={handleOpenEdit}
              onViewDetails={handleOpenDetails}
            />
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {/* Modal de Criação */}
      <LocalizacaoCreateModal
        isVisible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        creationType={locationType}
        allLocalizacoes={allLocalizacoes}
        onSave={handleCreate}
      />

      {/* Modal de Edição */}
      {currentLocalizacaoToEdit && (
        <LocalizacaoEditModal
          isVisible={isEditModalVisible}
          onClose={() => {
            setIsEditModalVisible(false);
            setCurrentLocalizacaoToEdit(null);
          }}
          localizacao={currentLocalizacaoToEdit as ILocalizacao}
          onUpdate={handleUpdate}
          allLocalizacoes={allLocalizacoes}
        />
      )}

      {/* Modal de Detalhes */}
      <LocalizacaoDetailsModal
        isVisible={isDetailsModalVisible}
        onClose={() => {
          setIsDetailsModalVisible(false);
          setCurrentLocalizacaoToDetail(null);
        }}
        localizacao={currentLocalizacaoToDetail}
        onEdit={handleOpenEdit}
        onDelete={(loc) => {
          Alert.alert(
            "Confirmar Exclusão",
            `Tem certeza que deseja excluir "${loc.nome}"?`,
            [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Excluir",
                style: "destructive",
                onPress: () => {
                  handleDeleteLocalizacao(loc.id);
                  setIsDetailsModalVisible(false);
                },
              },
            ]
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#F8F9FA",
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#0A3D62",
  },
  addButton: {
    backgroundColor: "#17A2B8",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
    elevation: 2,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  localizacaoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  localizacaoItemSimplified: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#E6F3F5",
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#BEE5EB",
    borderRadius: 5,
    marginBottom: 8,
  },
  textContainer: {
    flex: 1,
  },
  localizacaoName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  localizacaoNameSimplified: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0A3D62",
    flex: 1,
  },
  localizacaoType: {
    fontSize: 12,
    color: "#6C757D",
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: "row",
    marginLeft: 10,
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  actionButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  viewDetailsText: {
    fontSize: 14,
    color: "#007BFF",
    fontWeight: "600",
    marginLeft: 10,
  },
});

export const LocalizacoesManagerScreen = LocalizacoesManagerScreenComponent;
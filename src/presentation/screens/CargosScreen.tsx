// src/presentation/screens/CargosScreen.tsx

import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { ICargo } from "../../domain/models/ICargo";
import { CreateCargoParams } from "../../domain/use_cases/cargos/CreateCargo";

// Importa o NOVO MODAL
import CargoFormModal from "../components/CargoFormModal";

import {
  useCreateCargoUseCase,
  useDeleteCargoUseCase,
  useGetAllCargosUseCase,
  useUpdateCargoUseCase,
} from "../../config/serviceLocator";

import {
  CargoUseCases,
  useCargosViewModel,
} from "../view_models/CargosViewModel";

// ------------------------------------------
// COMPONENTE: ITEM DA LISTA (CargoItem)
// ------------------------------------------
/**
 * Componente funcional para renderizar um item individual da lista de Cargos.
 */
const CargoItem: React.FC<{
  cargo: ICargo;
  onDelete: (id: string) => Promise<boolean>;
  onEdit: (cargo: ICargo) => void; // Nova prop para edição
}> = ({ cargo, onDelete, onEdit }) => {
  const handleDelete = () => {
    Alert.alert(
      "Confirmar Exclusão",
      `Tem certeza que deseja excluir o cargo "${cargo.nome}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            onDelete(cargo.id);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.cargoItem}>
      <View style={styles.textContainer}>
        <Text style={styles.cargoName}>{cargo.nome}</Text>
        <Text style={styles.cargoDescription}>
          {cargo.descricao || "Sem descrição."}
        </Text>

        {/* Visualização Rápida de Permissão */}
        <Text
          style={
            cargo.pode_enviar_push ? styles.pushEnabled : styles.pushDisabled
          }
        >
          {cargo.pode_enviar_push ? "Permite PUSH" : "PUSH Desabilitado"}
        </Text>
      </View>
      <View style={styles.actionsContainer}>
        {/* Botão de Edição */}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#FFC107" }]}
          onPress={() => onEdit(cargo)} // Abre o modal em modo edição
        >
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        {/* Botão de Exclusão */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: "#DC3545", marginLeft: 10 },
          ]}
          onPress={handleDelete}
        >
          <Text style={styles.actionButtonText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ------------------------------------------
// TELA PRINCIPAL: CargosManagerScreen
// ------------------------------------------
/**
 * Tela de Gerenciamento de Cargos (Exclusivo para Administradores).
 */
const CargosManagerScreen: React.FC = () => {
  const navigation = useNavigation();

  // 1. OBTÉM OS USE CASES
  const getCargos = useGetAllCargosUseCase();
  const createCargo = useCreateCargoUseCase();
  const updateCargo = useUpdateCargoUseCase();
  const deleteCargo = useDeleteCargoUseCase();

  // Cria o objeto completo de Use Cases para injetar no ViewModel
  const cargoUseCases: CargoUseCases = {
    getCargos,
    createCargo,
    updateCargo,
    deleteCargo,
  };

  // 2. OBTÉM ESTADO E FUNÇÕES DO VIEWMODEL
  const {
    state,
    refreshCargos,
    deleteCargo: handleDeleteCargo,
    createCargo: handleCreateCargo,
    updateCargo: handleUpdateCargo,
  } = useCargosViewModel(cargoUseCases);

  // 3. ESTADO DO MODAL
  const [isModalVisible, setIsModalVisible] = useState(false);
  // Armazena o cargo a ser editado. Undefined = Criação. ICargo = Edição.
  const [currentCargoToEdit, setCurrentCargoToEdit] = useState<
    ICargo | undefined
  >(undefined);

  // 4. FUNÇÕES DE MANIPULAÇÃO DO MODAL
  const handleOpenCreate = () => {
    setCurrentCargoToEdit(undefined); // Garante que está em modo Criação
    setIsModalVisible(true);
  };

  const handleOpenEdit = (cargo: ICargo) => {
    setCurrentCargoToEdit(cargo); // Define o cargo para Edição
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setCurrentCargoToEdit(undefined); // Limpa o estado após fechar
  };

  // 5. FUNÇÃO DE SUBMISSÃO DO FORMULÁRIO
  const handleFormSubmit = async (data: ICargo | CreateCargoParams) => {
    if (currentCargoToEdit) {
      // Se currentCargoToEdit está definido, é uma EDIÇÃO
      const result = await handleUpdateCargo(data as ICargo);
      return result; // Retorna o resultado para fechar o modal ou mostrar erro
    } else {
      // Se currentCargoToEdit é undefined, é uma CRIAÇÃO
      const result = await handleCreateCargo(data as CreateCargoParams);
      return result; // Retorna o resultado
    }
  };

  // --- RENDERIZAÇÃO CONDICIONAL ---

  // ... (Mantém a renderização de loading e erro) ...
  if (state.isLoading && state.cargos.length === 0 && !state.error) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0A3D62" />
        <Text style={styles.loadingText}>Carregando cargos...</Text>
      </View>
    );
  }

  if (state.error && !isModalVisible) {
    // Não exibe erro da listagem se o modal estiver aberto (evita conflito com erro do modal)
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{state.error}</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={refreshCargos}>
          <Text style={styles.refreshButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }
  // ... (Fim da renderização de loading e erro) ...

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Gerenciamento de Cargos</Text>

      {/* Botão para adicionar novo cargo */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleOpenCreate} // Chama a nova função para criar
      >
        <Text style={styles.addButtonText}>+ Adicionar Novo Cargo</Text>
      </TouchableOpacity>

      <FlatList
        data={state.cargos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CargoItem
            cargo={item}
            onDelete={handleDeleteCargo}
            onEdit={handleOpenEdit} // Passa a função de edição
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshing={state.isLoading && state.cargos.length > 0}
        onRefresh={refreshCargos}
      />

      {/* O Modal de Criação/Edição é renderizado aqui */}
      <CargoFormModal
        isVisible={isModalVisible}
        onClose={handleCloseModal}
        cargo={currentCargoToEdit} // Passa o cargo (ou undefined)
        onSubmit={handleFormSubmit} // Passa a função que gerencia create/update
        isLoading={state.isSubmitting} // Usamos isSubmitting para o estado do botão de envio
        error={state.error} // Passa o erro para ser exibido no modal
      />
    </View>
  );
};

// --- ESTILOS (Ajustados com as novas classes de texto) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F0F4F8",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F4F8",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 18,
    color: "#DC3545",
    textAlign: "center",
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: "#0A3D62",
    padding: 10,
    borderRadius: 5,
  },
  refreshButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0A3D62",
    marginBottom: 15,
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
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  cargoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  textContainer: {
    flex: 1,
    marginRight: 10,
  },
  cargoName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  cargoDescription: {
    fontSize: 14,
    color: "#6C757D",
    marginTop: 4,
  },
  pushEnabled: {
    fontSize: 12,
    color: "#28A745", // Verde para habilitado
    fontWeight: "500",
    marginTop: 5,
  },
  pushDisabled: {
    fontSize: 12,
    color: "#DC3545", // Vermelho para desabilitado
    fontWeight: "500",
    marginTop: 5,
  },
  actionsContainer: {
    flexDirection: "row",
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default CargosManagerScreen;

// src/presentation/components/LocalizacaoDetailsModal.tsx

import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ILocalizacaoViewModelNode } from "../../../view_models/LocalizacoesViewModel";

// Tipagem estendida para garantir os campos hierárquicos para exibição.
interface ILocalizacaoDetails extends ILocalizacaoViewModelNode {
  // Estas propriedades devem ser calculadas no seu ViewModel/Service (e.g., nome completo do pai)
  parent_nome?: string | null; // Ex: Nome do Setor
  administracao_nome?: string | null; // Ex: Nome da Administração
  regional_nome?: string | null; // Ex: Nome da Regional
  sede_congregracao_id?: string | null;
}

interface LocalizacaoDetailsModalProps {
  isVisible: boolean;
  onClose: () => void;
  localizacao: ILocalizacaoDetails | null; // A localização para detalhar
  onEdit: (loc: ILocalizacaoDetails) => void;
  onDelete: (loc: ILocalizacaoDetails) => void;
}

const LocalizacaoDetailsModal: React.FC<LocalizacaoDetailsModalProps> = ({
  isVisible,
  onClose,
  localizacao,
  onEdit,
  onDelete,
}) => {
  if (!localizacao) return null;

  // Função auxiliar para renderizar blocos de informação
  const renderDetailBlock = (
    title: string,
    value: string | null | undefined
  ) => (
    <View style={styles.detailItem}>
      <Text style={styles.detailTitle}>{title}:</Text>
      <Text style={styles.detailValue}>{value || "Não Cadastrado"}</Text>
    </View>
  );

  // Função auxiliar para renderizar a hierarquia
  const renderHierarchy = () => {
    if (localizacao.tipo === "Regional") return null;

    return (
      <View style={styles.section}>
        {/* <Text style={styles.sectionHeader}>🏛️ Hierarquia</Text> */}

        {localizacao.tipo === "Congregação" &&
          renderDetailBlock("Setor", localizacao.parent_nome)}

        {/* Se você tiver a lógica para buscar a Administração e Regional, use aqui: */}
        {localizacao.administracao_nome &&
          renderDetailBlock("Administração", localizacao.administracao_nome)}
        {localizacao.regional_nome &&
          renderDetailBlock("Regional", localizacao.regional_nome)}
      </View>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>🏛️ {localizacao.nome}</Text>
          {/* <Text style={styles.modalSubtitle}>Tipo: {localizacao.tipo}</Text> */}

          <ScrollView style={{ maxHeight: 400, width: "100%" }}>
            {/* Seção 1: Hierarquia */}
            {renderHierarchy()}

            {/* Seção 2: Endereço (Apenas se existir) */}
            {localizacao.endereco_rua && (
              <View style={styles.section}>
                <Text style={styles.sectionHeader}>📍 Endereço</Text>
                {renderDetailBlock(
                  "Rua",
                  `${localizacao.endereco_rua}, ${localizacao.endereco_numero}`
                )}
                {renderDetailBlock("Bairro", localizacao.endereco_bairro)}
                {renderDetailBlock(
                  "Cidade/Estado",
                  `${localizacao.endereco_cidade} - ${localizacao.endereco_estado}`
                )}
                {renderDetailBlock("CEP", localizacao.endereco_cep)}
              </View>
            )}

            {/* Seção 3: Outros Detalhes (Sede) */}
            <View style={styles.section}>
              {localizacao.tipo !== "Congregação" &&
                renderDetailBlock(
                  "Congregação Sede ID",
                  localizacao.sede_congregracao_id
                )}
            </View>
          </ScrollView>

          {/* Botões de Ação */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.editButton]}
              onPress={() => onEdit(localizacao)}
            >
              <Text style={styles.textStyle}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={() => onDelete(localizacao)}
            >
              <Text style={styles.textStyle}>Excluir</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ... Estilos aqui (Use os estilos do seu LocalizacaoFormModal como base)
const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalView: {
    width: "90%",
    maxHeight: "90%",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    alignItems: "stretch",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0A3D62",
    textAlign: "center",
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#6C757D",
    textAlign: "center",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  section: {
    marginBottom: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#17A2B8",
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: "row",
    marginBottom: 5,
  },
  detailTitle: {
    fontWeight: "600",
    color: "#343A40",
    width: 150, // Ajuda a alinhar o valor
  },
  detailValue: {
    flex: 1,
    color: "#000",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 10,
  },
  button: {
    borderRadius: 8,
    padding: 12,
    elevation: 2,
    flex: 1,
    alignItems: "center",
    marginHorizontal: 5,
  },
  editButton: {
    backgroundColor: "#FFC107",
  },
  deleteButton: {
    backgroundColor: "#DC3545",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  closeButton: {
    marginTop: 10,
    padding: 10,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#6C757D",
    fontWeight: "bold",
  },
});

export default LocalizacaoDetailsModal;

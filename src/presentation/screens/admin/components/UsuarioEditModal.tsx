// src/presentation/screens/admin/components/UsuarioEditModal.tsx

import { Feather } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ICargo } from "../../../../domain/models/ICargo";
import { ILocalizacao } from "../../../../domain/models/ILocalizacao";
import { IUsuario } from "../../../../domain/models/IUsuario";

interface UsuarioEditModalProps {
  isVisible: boolean;
  onClose: () => void;
  usuario: IUsuario;
  availableCargos: ICargo[];
  availableLocalizacoes: ILocalizacao[]; // Lista de todas as localizações disponíveis
  onSave: (updatedUsuario: IUsuario, novosCargosIds: string[]) => Promise<void>;
}

export const UsuarioEditModal: React.FC<UsuarioEditModalProps> = ({
  isVisible,
  onClose,
  usuario,
  availableCargos,
  availableLocalizacoes,
  onSave,
}) => {
  const [nome, setNome] = useState(usuario.nome);
  const [email, setEmail] = useState(usuario.email);
  const [isAdmin, setIsAdmin] = useState(usuario.is_admin);
  const [localizacaoId, setLocalizacaoId] = useState<string | null>(
    usuario.localizacao_id || null
  );
  const [selectedCargosIds, setSelectedCargosIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const congregacaoLocalizacoes = availableLocalizacoes.filter(
    (loc) => loc.tipo === "Congregação"
  );
  useEffect(() => {
    if (usuario) {
      setNome(usuario.nome);
      setEmail(usuario.email);
      setIsAdmin(usuario.is_admin);
      setLocalizacaoId(usuario.localizacao_id || null);
      const currentIds = (usuario.cargos || []).map((c) => c.id);
      setSelectedCargosIds(currentIds);
    }
  }, [usuario]);
  const toggleCargoSelection = (cargoId: string) => {
    setSelectedCargosIds((prevIds) => {
      if (prevIds.includes(cargoId)) {
        return prevIds.filter((id) => id !== cargoId);
      } else {
        return [...prevIds, cargoId];
      }
    });
  };
  const handleSavePress = async () => {
    if (!nome) {
      Alert.alert("Erro", "O nome do usuário não pode ser vazio.");
      return;
    }
    if (!email) {
      Alert.alert("Erro", "O email do usuário não pode ser vazio.");
      return;
    }

    setIsSaving(true);
    try {
      const updatedUsuario: IUsuario = {
        ...usuario,
        nome: nome,
        email: email,
        is_admin: isAdmin,
        localizacao_id: localizacaoId,
      };

      await onSave(updatedUsuario, selectedCargosIds);
    } catch (error) {
      console.error("Erro ao salvar no modal:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Editar Usuário: {usuario.nome}</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Feather name="x" size={24} color="#0A3D62" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Nome</Text>
        <TextInput
          style={styles.input}
          value={nome}
          onChangeText={setNome}
          placeholder="Nome Completo"
        />
        <Text style={styles.label}>Email (Não Editável)</Text>
        <TextInput
          style={[styles.input, styles.disabledInput]}
          value={email}
          editable={false}
        />
        <Text style={styles.label}>Localização (Congregação)</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={localizacaoId}
            onValueChange={(itemValue: string | null) =>
              setLocalizacaoId(itemValue)
            }
            style={
              Platform.OS === "android"
                ? styles.pickerAndroid
                : styles.pickerIOS
            }
            itemStyle={Platform.OS === "ios" ? styles.pickerItemIOS : undefined}
          >
            <Picker.Item
              label="Nenhuma Localização"
              value={null}
              color="#6C757D"
            />

            {congregacaoLocalizacoes.map((loc) => (
              <Picker.Item key={loc.id} label={loc.nome} value={loc.id} />
            ))}
          </Picker>
        </View>
        <View style={styles.switchContainer}>
          <Text style={styles.label}>Permissão de Administrador</Text>

          <Switch
            value={isAdmin}
            onValueChange={setIsAdmin}
            trackColor={{ false: "#767577", true: "#0A3D62" }}
            thumbColor={isAdmin ? "#fff" : "#f4f3f4"}
          />
        </View>
        <Text style={[styles.label, styles.sectionTitle]}>
          Atribuição de Cargos
        </Text>
        <View style={styles.cargosList}>
          {availableCargos.map((cargo) => {
            const isSelected = selectedCargosIds.includes(cargo.id);
            return (
              <TouchableOpacity
                key={cargo.id}
                style={[
                  styles.cargoItem,
                  isSelected && styles.cargoItemSelected,
                ]}
                onPress={() => toggleCargoSelection(cargo.id)}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Feather
                    name={isSelected ? "check-square" : "square"}
                    size={18}
                    color={isSelected ? "#fff" : "#0A3D62"}
                  />

                  <Text
                    style={[
                      styles.cargoText,
                      isSelected && styles.cargoTextSelected,
                    ]}
                  >
                    {cargo.nome}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSavePress}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Salvar Alterações</Text>
          )}
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#DCE0E6",
    backgroundColor: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0A3D62",
  },
  closeButton: {
    padding: 5,
  },
  content: {
    padding: 20,
    backgroundColor: "#F0F4F8",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 15,
    marginBottom: 5,
    color: "#0A3D62",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#DCE0E6",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  disabledInput: {
    backgroundColor: "#E9ECEF",
    color: "#6C757D",
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#DCE0E6",
    borderRadius: 8,
    overflow: "hidden",
  },
  pickerAndroid: {
    height: 55,
    color: "#333",
  },
  pickerIOS: {
    height: 150,
  },
  pickerItemIOS: {
    fontSize: 16,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#DCE0E6",
  },
  sectionTitle: {
    fontSize: 18,
    marginTop: 25,
    marginBottom: 10,
    borderBottomWidth: 0,
    paddingBottom: 0,
    color: "#333",
  },
  cargosList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },
  cargoItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#DCE0E6",
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  cargoItemSelected: {
    backgroundColor: "#0A3D62",
    borderColor: "#0A3D62",
  },
  cargoText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#0A3D62",
  },
  cargoTextSelected: {
    color: "#fff",
  },
  footer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#DCE0E6",
    backgroundColor: "#FFFFFF",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#A5D6A7",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

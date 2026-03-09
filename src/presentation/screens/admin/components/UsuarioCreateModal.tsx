// src/presentation/screens/admin/components/UsuarioCreateModal.tsx

import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ICargo } from "../../../../domain/models/ICargo";
import { ILocalizacao } from "../../../../domain/models/ILocalizacao";
import { IUsuario } from "../../../../domain/models/IUsuario";

import { Picker } from "@react-native-picker/picker";
import Checkbox from "expo-checkbox";

/**
 * Define os campos mínimos de IUsuario necessários para a criação.
 * Deve estar sincronizado com UsuarioDataToCreate do ViewModel.
 */
type UsuarioDataToCreate = Pick<
  IUsuario,
  "nome" | "email" | "localizacao_id" | "is_admin"
>;

// Definição do tipo de função onSave
type OnCreateSave = (
  novoUsuario: UsuarioDataToCreate,
  cargosIds: string[],
  senha: string
) => Promise<void>;

interface UsuarioCreateModalProps {
  isVisible: boolean;
  onClose: () => void;
  availableCargos: ICargo[];
  availableLocalizacoes: ILocalizacao[];
  onSave: OnCreateSave;
}

const initialNewUser: UsuarioDataToCreate = {
  nome: "",
  email: "",
  is_admin: false,
  localizacao_id: null,
};

export const UsuarioCreateModal: React.FC<UsuarioCreateModalProps> = ({
  isVisible,
  onClose,
  availableCargos,
  availableLocalizacoes,
  onSave,
}) => {
  const [userData, setUserData] = useState<UsuarioDataToCreate>(initialNewUser);
  const [selectedCargoIds, setSelectedCargoIds] = useState<string[]>([]);
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const congregacaoLocalizacoes: ILocalizacao[] = availableLocalizacoes
    .filter((loc) => !!loc)
    .filter(
      (loc) => loc.tipo === "Congregação" && loc.nome && loc.nome.length > 0
    );

  const pickerItems = [
    { id: null, nome: "Nenhuma (Opcional)" } as unknown as ILocalizacao,
    ...congregacaoLocalizacoes,
  ];

  useEffect(() => {
    if (isVisible) {
      setUserData(initialNewUser);
      setSelectedCargoIds([]);
      setPassword("");
      setConfirmPassword("");
      setIsSaving(false);
    }
  }, [isVisible]);

  const handleInputChange = (
    field: keyof UsuarioDataToCreate,
    value: string | boolean | null
  ) => {
    if (
      field === "localizacao_id" &&
      (typeof value === "string" || value === null)
    ) {
      setUserData((prev) => ({
        ...prev,
        [field]: value === "" ? null : value,
      }));
    } else if (typeof value === "boolean") {
      setUserData((prev) => ({ ...prev, [field]: value }));
    } else if (typeof value === "string") {
      setUserData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleLocationChange = (localizacaoId: string | null) => {
    handleInputChange("localizacao_id", localizacaoId);
  };

  const handleToggleCargo = (cargoId: string) => {
    setSelectedCargoIds((prev) =>
      prev.includes(cargoId)
        ? prev.filter((id) => id !== cargoId)
        : [...prev, cargoId]
    );
  };

  const handleSave = async () => {
    if (!userData.nome || !userData.email || !password) {
      Alert.alert(
        "Campos Obrigatórios",
        "Nome, E-mail e Senha são obrigatórios."
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Senha Inválida",
        "A senha deve ter pelo menos 6 caracteres."
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        "Confirmação de Senha",
        "As senhas digitadas não são idênticas."
      );
      return;
    }

    setIsSaving(true);

    try {
      await onSave(userData, selectedCargoIds, password);

      onClose();
    } catch (e) {
      const errorMessage =
        (e as Error).message || "Erro desconhecido na criação.";
      Alert.alert("Erro ao Criar", errorMessage);
      console.error("Erro no modal de criação:", e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={isVisible}
      onRequestClose={onClose}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Adicionar Novo Membro</Text>
          <ScrollView style={styles.scrollView}>
            <Text style={styles.label}>Nome Completo *</Text>
            <TextInput
              style={styles.input}
              value={userData.nome}
              onChangeText={(text) => handleInputChange("nome", text)}
            />
            <Text style={styles.label}>E-mail *</Text>
            <TextInput
              style={styles.input}
              value={userData.email}
              onChangeText={(text) => handleInputChange("email", text)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={styles.label}>Senha *</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true}
            />
            <Text style={styles.label}>Confirmar Senha *</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={true}
            />
            <Text style={styles.label}>Localização (Congregação)</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={userData.localizacao_id}
                onValueChange={handleLocationChange}
                style={styles.picker}
              >
                {pickerItems.map((loc, index) => (
                  <Picker.Item
                    key={loc.id || `none-${index}`}
                    label={loc.nome ?? "Nome Inválido"}
                    value={loc.id}
                  />
                ))}
              </Picker>
            </View>
            <View style={styles.checkboxContainer}>
              <Checkbox
                value={userData.is_admin}
                onValueChange={(value) => handleInputChange("is_admin", value)}
              />
              <Text style={styles.checkboxLabel}>É Administrador?</Text>
            </View>
            <Text style={styles.label}>Cargos</Text>
            {availableCargos.map((cargo) => (
              <View key={cargo.id} style={styles.checkboxContainer}>
                <Checkbox
                  value={selectedCargoIds.includes(cargo.id)}
                  onValueChange={() => handleToggleCargo(cargo.id)}
                />
                <Text style={styles.checkboxLabel}>{cargo.nome}</Text>
              </View>
            ))}
          </ScrollView>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isSaving}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Criar Membro</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#0A3D62",
    textAlign: "center",
  },
  scrollView: {
    maxHeight: 400,
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 5,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
    color: "#333",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 10,
  },
  picker: {
    height: 54,
    width: "100%",
    color: "#333",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: "#28A745",
  },
  cancelButton: {
    backgroundColor: "#DC3545",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});

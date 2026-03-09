// src/presentation/screens/admin/components/UsuarioCreateModal.tsx

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
import { Picker } from "@react-native-picker/picker";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type UsuarioDataToCreate = Pick<
  IUsuario,
  "nome" | "email" | "localizacao_id" | "is_admin"
>;

type OnCreateSave = (
  novoUsuario: UsuarioDataToCreate,
  cargosIds: string[],
  senha: string,
) => Promise<void>;

interface UsuarioCreateModalProps {
  isVisible: boolean;
  onClose: () => void;
  availableCargos: ICargo[];
  availableLocalizacoes: ILocalizacao[];
  onSave: OnCreateSave;
}

export const UsuarioCreateModal: React.FC<UsuarioCreateModalProps> = ({
  isVisible,
  onClose,
  availableCargos,
  availableLocalizacoes,
  onSave,
}) => {
  const insets = useSafeAreaInsets();

  const congregacoes = availableLocalizacoes.filter(
    (loc) => loc?.tipo === "Congregação" && loc.nome?.length > 0,
  );

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  // Inicializa com o primeiro id real da lista, ou null se vazia
  const [localizacaoId, setLocalizacaoId] = useState<string | null>(
    congregacoes[0]?.id ?? null,
  );
  const [selectedCargoIds, setSelectedCargoIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Reinicia o formulário ao abrir — e garante que localizacaoId
  // aponta para um valor válido da lista atual
  useEffect(() => {
    if (isVisible) {
      setNome("");
      setEmail("");
      setSenha("");
      setConfirmarSenha("");
      setSenhaVisivel(false);
      setIsAdmin(false);
      setLocalizacaoId(congregacoes[0]?.id ?? null);
      setSelectedCargoIds([]);
      setIsSaving(false);
    }
  }, [isVisible]);

  const toggleCargo = (cargoId: string) => {
    setSelectedCargoIds((prev) =>
      prev.includes(cargoId) ? prev.filter((id) => id !== cargoId) : [...prev, cargoId],
    );
  };

  const handleSave = async () => {
    if (!nome.trim() || !email.trim() || !senha) {
      Alert.alert("Campos obrigatórios", "Nome, e-mail e senha são obrigatórios.");
      return;
    }
    if (senha.length < 6) {
      Alert.alert("Senha inválida", "A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== confirmarSenha) {
      Alert.alert("Confirmação de senha", "As senhas digitadas não são idênticas.");
      return;
    }

    setIsSaving(true);
    try {
      await onSave(
        { nome: nome.trim(), email: email.trim(), is_admin: isAdmin, localizacao_id: localizacaoId },
        selectedCargoIds,
        senha,
      );
      onClose();
    } catch (e) {
      Alert.alert("Erro ao criar", (e as Error).message || "Erro desconhecido.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={isVisible}
      onRequestClose={onClose}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Adicionar Novo Membro</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Feather name="x" size={24} color="#0A3D62" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Nome Completo *</Text>
        <TextInput
          style={styles.input}
          value={nome}
          onChangeText={setNome}
          placeholder="Nome completo"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>E-mail *</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="email@exemplo.com"
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Senha *</Text>
        <View style={styles.senhaContainer}>
          <TextInput
            style={styles.senhaInput}
            value={senha}
            onChangeText={setSenha}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor="#999"
            secureTextEntry={!senhaVisivel}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity onPress={() => setSenhaVisivel((v) => !v)} style={styles.senhaToggle}>
            <Feather name={senhaVisivel ? "eye-off" : "eye"} size={20} color="#0A3D62" />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Confirmar Senha *</Text>
        <TextInput
          style={styles.input}
          value={confirmarSenha}
          onChangeText={setConfirmarSenha}
          placeholder="Repita a senha"
          placeholderTextColor="#999"
          secureTextEntry={!senhaVisivel}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Localização (Congregação)</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={localizacaoId}
            onValueChange={(v) => setLocalizacaoId(v as string | null)}
            style={Platform.OS === "android" ? styles.pickerAndroid : styles.pickerIOS}
            itemStyle={Platform.OS === "ios" ? styles.pickerItemIOS : undefined}
          >
            <Picker.Item label="Nenhuma (Opcional)" value={null} color="#6C757D" />
            {congregacoes.map((loc) => (
              <Picker.Item key={loc.id} label={loc.nome} value={loc.id} />
            ))}
          </Picker>
        </View>

        <View style={styles.switchContainer}>
          <Text style={styles.label}>É Administrador?</Text>
          <Switch
            value={isAdmin}
            onValueChange={setIsAdmin}
            trackColor={{ false: "#767577", true: "#0A3D62" }}
            thumbColor={isAdmin ? "#fff" : "#f4f3f4"}
          />
        </View>

        <Text style={[styles.label, { marginTop: 20 }]}>Cargos</Text>
        <View style={styles.cargosList}>
          {availableCargos.map((cargo) => {
            const selected = selectedCargoIds.includes(cargo.id);
            return (
              <TouchableOpacity
                key={cargo.id}
                style={[styles.cargoItem, selected && styles.cargoItemSelected]}
                onPress={() => toggleCargo(cargo.id)}
              >
                <Feather
                  name={selected ? "check-square" : "square"}
                  size={18}
                  color={selected ? "#fff" : "#0A3D62"}
                />
                <Text style={[styles.cargoText, selected && styles.cargoTextSelected]}>
                  {cargo.nome}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom || 15 }]}>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Criar Membro</Text>
          )}
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#DCE0E6",
    backgroundColor: "#FFFFFF",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#0A3D62",
  },
  closeButton: { padding: 5 },
  content: { padding: 20, backgroundColor: "#F0F4F8" },
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
    color: "#333",
  },
  senhaContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#DCE0E6",
    borderRadius: 8,
  },
  senhaInput: { flex: 1, padding: 12, fontSize: 16, color: "#333" },
  senhaToggle: { padding: 12 },
  pickerContainer: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#DCE0E6",
    borderRadius: 8,
    overflow: "hidden",
  },
  pickerAndroid: { height: 55, color: "#333" },
  pickerIOS: { height: 150 },
  pickerItemIOS: { fontSize: 16 },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#DCE0E6",
  },
  cargosList: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  cargoItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#DCE0E6",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  cargoItemSelected: { backgroundColor: "#0A3D62", borderColor: "#0A3D62" },
  cargoText: { marginLeft: 8, fontSize: 14, color: "#0A3D62" },
  cargoTextSelected: { color: "#fff" },
  footer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#DCE0E6",
    backgroundColor: "#FFFFFF",
  },
  saveButton: {
    backgroundColor: "#28A745",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },
  saveButtonDisabled: { backgroundColor: "#A5D6A7" },
  saveButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
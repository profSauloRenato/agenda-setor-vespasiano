// src/presentation/screens/admin/components/UsuarioCreateModal.tsx

import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ICargo } from "../../../../domain/models/ICargo";
import { ILocalizacao } from "../../../../domain/models/ILocalizacao";
import { IUsuario } from "../../../../domain/models/IUsuario";
import { SelectPicker, SelectPickerItem } from "../components/SelectPicker";
import { Feather } from "@expo/vector-icons";
import { gerarSenhaProvisoria } from "../../../../infra/services/SupabaseUsuarioService";

type UsuarioDataToCreate = Pick<IUsuario, "nome" | "email" | "localizacao_id" | "is_admin">;

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
  const congregacoes = availableLocalizacoes.filter(
    (loc) => loc?.tipo === "Congregação" && loc.nome?.length > 0,
  );

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [localizacaoId, setLocalizacaoId] = useState<string | null>(null);
  const [selectedCargoIds, setSelectedCargoIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const insets = useSafeAreaInsets();
  const screenHeight = Dimensions.get("window").height;
  const keyboardOffset = useRef(new Animated.Value(0)).current;
  const maxModalHeight = useRef(new Animated.Value(screenHeight * 0.92)).current;

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", (e) => {
      const kh = e.endCoordinates.height;
      const available = screenHeight - kh - insets.top - 16;
      Animated.parallel([
        Animated.timing(keyboardOffset, { toValue: kh, duration: e.duration || 250, useNativeDriver: false }),
        Animated.timing(maxModalHeight, { toValue: available, duration: e.duration || 250, useNativeDriver: false }),
      ]).start();
    });
    const hide = Keyboard.addListener("keyboardDidHide", () => {
      Animated.parallel([
        Animated.timing(keyboardOffset, { toValue: 0, duration: 250, useNativeDriver: false }),
        Animated.timing(maxModalHeight, { toValue: screenHeight * 0.92, duration: 250, useNativeDriver: false }),
      ]).start();
    });
    return () => { show.remove(); hide.remove(); };
  }, [keyboardOffset, maxModalHeight]);

  useEffect(() => {
    if (isVisible) {
      setNome("");
      setEmail("");
      setIsAdmin(false);
      setLocalizacaoId(null);
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
    if (!nome.trim() || !email.trim()) {
      Alert.alert("Campos obrigatórios", "Nome e e-mail são obrigatórios.");
      return;
    }

    const senha = gerarSenhaProvisoria(nome.trim());

    setIsSaving(true);
    try {
      await onSave(
        { nome: nome.trim(), email: email.trim(), is_admin: isAdmin, localizacao_id: localizacaoId },
        selectedCargoIds,
        senha,
      );
      // Exibe a senha provisória UMA VEZ para o admin copiar e repassar
      Alert.alert(
        "✅ Membro criado com sucesso!",
        `Senha provisória gerada:\n\n🔑  ${senha}\n\nRepasse esta senha ao membro. Ele será solicitado a criar uma nova senha no primeiro acesso.`,
        [{ text: "Entendi", style: "default" }],
      );
      onClose();
    } catch (e) {
      Alert.alert("Erro ao criar", (e as Error).message || "Erro desconhecido.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={isVisible} onRequestClose={onClose} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.modalView, { marginBottom: keyboardOffset, maxHeight: maxModalHeight }]}>

          <Text style={styles.modalTitle}>Adicionar Novo Membro</Text>

          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {/* Aviso sobre senha automática */}
            <View style={styles.infoBox}>
              <Feather name="info" size={15} color="#0A3D62" style={{ marginTop: 1 }} />
              <Text style={styles.infoText}>
                A senha provisória será gerada automaticamente e exibida após o cadastro para você repassar ao membro.
              </Text>
            </View>

            <Text style={styles.label}>Nome Completo *</Text>
            <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Nome completo" placeholderTextColor="#999" />

            <Text style={styles.label}>E-mail *</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="email@exemplo.com" placeholderTextColor="#999" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />

            <Text style={styles.label}>Localização (Congregação)</Text>
            <View style={styles.pickerContainer}>
              <SelectPicker
                selectedValue={localizacaoId}
                onValueChange={(v) => setLocalizacaoId(v)}
                items={[
                  { label: "Nenhuma (Opcional)", value: null, color: "#6C757D" },
                  ...congregacoes.map((loc) => ({ label: loc.nome, value: loc.id })),
                ]}
              />
            </View>

            <View style={styles.switchContainer}>
              <Text style={styles.label}>É Administrador?</Text>
              <Switch value={isAdmin} onValueChange={setIsAdmin} trackColor={{ false: "#767577", true: "#0A3D62" }} thumbColor={isAdmin ? "#fff" : "#f4f3f4"} />
            </View>

            <Text style={[styles.label, { marginTop: 20 }]}>Cargos</Text>
            <View style={styles.cargosList}>
              {availableCargos.map((cargo) => {
                const selected = selectedCargoIds.includes(cargo.id);
                return (
                  <TouchableOpacity key={cargo.id} style={[styles.cargoItem, selected && styles.cargoItemSelected]} onPress={() => toggleCargo(cargo.id)}>
                    <Feather name={selected ? "check-square" : "square"} size={18} color={selected ? "#fff" : "#0A3D62"} />
                    <Text style={[styles.cargoText, selected && styles.cargoTextSelected]}>{cargo.nome}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Dois botões: Cancelar + Criar Membro */}
          <View style={[styles.buttonContainer, { paddingBottom: insets.bottom || 12 }]}>
            <TouchableOpacity style={[styles.button, styles.buttonCancel]} onPress={onClose} disabled={isSaving}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.buttonSave, isSaving && styles.buttonDisabled]} onPress={handleSave} disabled={isSaving}>
              {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Criar Membro</Text>}
            </TouchableOpacity>
          </View>

        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  dismissArea: { flex: 1 },
  modalView: {
    backgroundColor: "white",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 16,
    flexShrink: 1,       // encolhe para caber no maxHeight
  },
  titleRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 15, color: "#0A3D62" },
  closeButton: { padding: 4 },
  content: { paddingBottom: 8 },
  infoBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#E3F2FD", borderRadius: 8, padding: 12, marginBottom: 4 },
  infoText: { flex: 1, fontSize: 13, color: "#0A3D62", lineHeight: 19 },
  label: { fontSize: 14, fontWeight: "600", marginTop: 14, marginBottom: 5, color: "#0A3D62" },
  input: { backgroundColor: "#F9F9F9", borderWidth: 1, borderColor: "#DCE0E6", borderRadius: 8, padding: 10, fontSize: 14, color: "#333" },
  pickerContainer: { backgroundColor: "#F9F9F9", borderWidth: 1, borderColor: "#DCE0E6", borderRadius: 8, overflow: "hidden" },
  switchContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#DCE0E6" },
  cargosList: { flexDirection: "row", flexWrap: "wrap", marginTop: 8, marginBottom: 4 },
  cargoItem: { flexDirection: "row", alignItems: "center", backgroundColor: "#F9F9F9", borderWidth: 1, borderColor: "#DCE0E6", borderRadius: 20, paddingVertical: 7, paddingHorizontal: 12, marginRight: 8, marginBottom: 8 },
  cargoItemSelected: { backgroundColor: "#0A3D62", borderColor: "#0A3D62" },
  cargoText: { marginLeft: 6, fontSize: 13, color: "#0A3D62" },
  cargoTextSelected: { color: "#fff" },
  buttonContainer: { flexDirection: "row", gap: 10, marginTop: 14, marginBottom: 14 },
  button: { flex: 1, borderRadius: 8, padding: 13, alignItems: "center" },
  buttonCancel: { backgroundColor: "#6C757D" },
  buttonSave: { backgroundColor: "#28A745" },
  buttonDisabled: { backgroundColor: "#A5D6A7" },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
});
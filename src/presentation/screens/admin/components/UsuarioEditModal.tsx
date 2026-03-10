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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ICargo } from "../../../../domain/models/ICargo";
import { ILocalizacao } from "../../../../domain/models/ILocalizacao";
import { IUsuario } from "../../../../domain/models/IUsuario";
import { gerarSenhaProvisoria } from "../../../../infra/services/SupabaseUsuarioService";

interface UsuarioEditModalProps {
  isVisible: boolean;
  onClose: () => void;
  usuario: IUsuario;
  availableCargos: ICargo[];
  availableLocalizacoes: ILocalizacao[];
  onSave: (updatedUsuario: IUsuario, novosCargosIds: string[]) => Promise<void>;
  onResetSenha: (userId: string, novaSenha: string) => Promise<void>;
}

export const UsuarioEditModal: React.FC<UsuarioEditModalProps> = ({
  isVisible,
  onClose,
  usuario,
  availableCargos,
  availableLocalizacoes,
  onSave,
  onResetSenha,
}) => {
  const [nome, setNome] = useState(usuario.nome);
  const [isAdmin, setIsAdmin] = useState(usuario.is_admin);
  const [localizacaoId, setLocalizacaoId] = useState<string | null>(usuario.localizacao_id || null);
  const [selectedCargosIds, setSelectedCargosIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const insets = useSafeAreaInsets();

  const congregacaoLocalizacoes = availableLocalizacoes.filter(
    (loc) => loc.tipo === "Congregação",
  );

  useEffect(() => {
    if (usuario) {
      setNome(usuario.nome);
      setIsAdmin(usuario.is_admin);
      setLocalizacaoId(usuario.localizacao_id || null);
      setSelectedCargosIds((usuario.cargos || []).map((c) => c.id));
    }
  }, [usuario]);

  const toggleCargoSelection = (cargoId: string) => {
    setSelectedCargosIds((prev) =>
      prev.includes(cargoId) ? prev.filter((id) => id !== cargoId) : [...prev, cargoId],
    );
  };

  const handleSavePress = async () => {
    if (!nome.trim()) {
      Alert.alert("Erro", "O nome do usuário não pode ser vazio.");
      return;
    }
    setIsSaving(true);
    try {
      await onSave(
        { ...usuario, nome: nome.trim(), is_admin: isAdmin, localizacao_id: localizacaoId },
        selectedCargosIds,
      );
    } catch (error) {
      console.error("Erro ao salvar no modal:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSenha = () => {
    const novaSenha = gerarSenhaProvisoria(usuario.nome);

    Alert.alert(
      "Redefinir Senha",
      `Gerar nova senha provisória para ${usuario.nome}?\n\nA senha será:\n🔑  ${novaSenha}\n\nO membro precisará trocá-la no próximo acesso.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Redefinir",
          style: "destructive",
          onPress: async () => {
            setIsResetting(true);
            try {
              await onResetSenha(usuario.id, novaSenha);
              Alert.alert(
                "✅ Senha redefinida",
                `Nova senha provisória:\n\n🔑  ${novaSenha}\n\nRepasse ao membro.`,
                [{ text: "Entendi" }],
              );
            } catch (e) {
              Alert.alert("Erro", (e as Error).message || "Falha ao redefinir senha.");
            } finally {
              setIsResetting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
          Editar: {usuario.nome}
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Feather name="x" size={24} color="#0A3D62" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Aviso de senha provisória ainda ativa */}
        {usuario.deve_trocar_senha && (
          <View style={styles.warningBox}>
            <Feather name="alert-triangle" size={15} color="#856404" style={{ marginTop: 1 }} />
            <Text style={styles.warningText}>
              Este membro ainda não trocou a senha provisória.
            </Text>
          </View>
        )}

        <Text style={styles.label}>Nome</Text>
        <TextInput
          style={styles.input}
          value={nome}
          onChangeText={setNome}
          placeholder="Nome Completo"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>E-mail (não editável)</Text>
        <View style={[styles.input, styles.disabledInput]}>
          <Text style={styles.disabledText}>{usuario.email}</Text>
        </View>

        <Text style={styles.label}>Localização (Congregação)</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={localizacaoId}
            onValueChange={(v: string | null) => setLocalizacaoId(v)}
            style={Platform.OS === "android" ? styles.pickerAndroid : styles.pickerIOS}
            itemStyle={Platform.OS === "ios" ? styles.pickerItemIOS : undefined}
          >
            <Picker.Item label="Nenhuma Localização" value={null} color="#6C757D" />
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

        <Text style={[styles.label, styles.sectionTitle]}>Atribuição de Cargos</Text>
        <View style={styles.cargosList}>
          {availableCargos.map((cargo) => {
            const isSelected = selectedCargosIds.includes(cargo.id);
            return (
              <TouchableOpacity
                key={cargo.id}
                style={[styles.cargoItem, isSelected && styles.cargoItemSelected]}
                onPress={() => toggleCargoSelection(cargo.id)}
              >
                <Feather
                  name={isSelected ? "check-square" : "square"}
                  size={18}
                  color={isSelected ? "#fff" : "#0A3D62"}
                />
                <Text style={[styles.cargoText, isSelected && styles.cargoTextSelected]}>
                  {cargo.nome}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Redefinir senha */}
        <TouchableOpacity
          style={[styles.resetButton, isResetting && { opacity: 0.6 }]}
          onPress={handleResetSenha}
          disabled={isResetting}
        >
          {isResetting ? (
            <ActivityIndicator color="#DC3545" size="small" />
          ) : (
            <>
              <Feather name="refresh-cw" size={15} color="#DC3545" />
              <Text style={styles.resetButtonText}>Redefinir senha do membro</Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom || 15 }]}>
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
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#DCE0E6",
    backgroundColor: "#FFFFFF",
  },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: "#0A3D62", marginRight: 10 },
  closeButton: { padding: 5 },
  content: { padding: 20, backgroundColor: "#F0F4F8" },
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FFF3CD",
    borderRadius: 8,
    padding: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#FFEAA7",
  },
  warningText: { flex: 1, fontSize: 13, color: "#856404", lineHeight: 19 },
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
  disabledInput: { backgroundColor: "#E9ECEF", justifyContent: "center" },
  disabledText: { fontSize: 16, color: "#6C757D" },
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
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#DCE0E6",
  },
  sectionTitle: { fontSize: 18, marginTop: 25, marginBottom: 10, color: "#333" },
  cargosList: { flexDirection: "row", flexWrap: "wrap", marginTop: 10 },
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
  cargoItemSelected: { backgroundColor: "#0A3D62", borderColor: "#0A3D62" },
  cargoText: { marginLeft: 8, fontSize: 14, color: "#0A3D62" },
  cargoTextSelected: { color: "#fff" },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 24,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DC3545",
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
  },
  resetButtonText: { fontSize: 14, color: "#DC3545", fontWeight: "600" },
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
  saveButtonDisabled: { backgroundColor: "#A5D6A7" },
  saveButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
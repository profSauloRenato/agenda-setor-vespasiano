// src/presentation/screens/PerfilScreen.tsx

import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useUsuarioService } from "../../config/serviceLocator";
import { supabase } from "../../config/supabaseClient";

const PerfilScreen: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const usuarioService = useUsuarioService();

  // ── Edição de nome ────────────────────────────────────────────────────────────
  const [editando, setEditando] = useState(false);
  const [novoNome, setNovoNome] = useState(user?.nome ?? "");
  const [salvando, setSalvando] = useState(false);

  // ── Modal de troca de senha ───────────────────────────────────────────────────
  const [senhaModalVisible, setSenhaModalVisible] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  const handleSalvarNome = async () => {
    if (!novoNome.trim()) {
      Alert.alert("Atenção", "O nome não pode ser vazio.");
      return;
    }
    if (novoNome.trim() === user?.nome) {
      setEditando(false);
      return;
    }
    setSalvando(true);
    try {
      await usuarioService.updateUsuarioBasico({ ...user!, nome: novoNome.trim() });
      await refreshUser();
      setEditando(false);
      Alert.alert("Sucesso", "Nome atualizado com sucesso!");
    } catch {
      Alert.alert("Erro", "Não foi possível atualizar o nome.");
    } finally {
      setSalvando(false);
    }
  };

  const handleCancelarNome = () => {
    setNovoNome(user?.nome ?? "");
    setEditando(false);
  };

  const handleAbrirModalSenha = () => {
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmarSenha("");
    setSenhaVisivel(false);
    setSenhaModalVisible(true);
  };

  const handleTrocarSenha = async () => {
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      Alert.alert("Atenção", "Preencha todos os campos.");
      return;
    }
    if (novaSenha.length < 6) {
      Alert.alert("Atenção", "A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      Alert.alert("Atenção", "As senhas não coincidem.");
      return;
    }
    if (novaSenha === senhaAtual) {
      Alert.alert("Atenção", "A nova senha não pode ser igual à senha atual.");
      return;
    }

    setSalvandoSenha(true);
    try {
      // Valida a senha atual reautenticando — se errar, rejeita
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: user!.email,
        password: senhaAtual,
      });

      if (loginError) {
        Alert.alert("Senha incorreta", "A senha atual informada está errada.");
        return;
      }

      await usuarioService.updateSenha(novaSenha);

      if (user?.deve_trocar_senha) {
        await usuarioService.marcarSenhaTrocada(user.id);
      }

      await refreshUser();
      setSenhaModalVisible(false);
      Alert.alert("✅ Senha alterada", "Sua senha foi atualizada com sucesso!");
    } catch (e) {
      Alert.alert("Erro", (e as Error).message || "Falha ao alterar senha.");
    } finally {
      setSalvandoSenha(false);
    }
  };

  if (!user) return null;

  const iniciais = user.nome
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Banner de senha provisória */}
      {user.deve_trocar_senha && (
        <TouchableOpacity style={styles.banner} onPress={handleAbrirModalSenha} activeOpacity={0.85}>
          <Feather name="alert-triangle" size={18} color="#856404" />
          <View style={styles.bannerTexts}>
            <Text style={styles.bannerTitle}>Senha provisória ativa</Text>
            <Text style={styles.bannerSub}>Toque aqui para criar sua senha pessoal.</Text>
          </View>
          <Feather name="chevron-right" size={18} color="#856404" />
        </TouchableOpacity>
      )}

      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{iniciais}</Text>
        </View>
        {user.is_admin && (
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>⚙️ Administrador</Text>
          </View>
        )}
      </View>

      {/* Card informações */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Informações pessoais</Text>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Nome</Text>
          {editando ? (
            <TextInput
              style={styles.input}
              value={novoNome}
              onChangeText={setNovoNome}
              autoFocus
              maxLength={100}
              autoCapitalize="words"
            />
          ) : (
            <View style={styles.fieldValueRow}>
              <Text style={styles.fieldValue}>{user.nome}</Text>
              <TouchableOpacity onPress={() => setEditando(true)}>
                <Text style={styles.editLink}>✏️ Editar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Email</Text>
          <Text style={styles.fieldValue}>{user.email}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Congregação</Text>
          <Text style={styles.fieldValue}>{user.nome_localizacao ?? "Não informada"}</Text>
        </View>
      </View>

      {/* Card cargos */}
      {user.cargos && user.cargos.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cargos</Text>
          <View style={styles.cargosContainer}>
            {user.cargos.map((cargo) => (
              <View key={cargo.id} style={styles.cargoBadge}>
                <Text style={styles.cargoBadgeText}>{cargo.nome}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Botão alterar senha */}
      <TouchableOpacity style={styles.senhaButton} onPress={handleAbrirModalSenha}>
        <Feather name="lock" size={16} color="#0A3D62" />
        <Text style={styles.senhaButtonText}>Alterar senha</Text>
        <Feather name="chevron-right" size={16} color="#0A3D62" />
      </TouchableOpacity>

      {/* Botões salvar/cancelar nome */}
      {editando && (
        <View style={styles.editActions}>
          <TouchableOpacity
            style={[styles.saveButton, salvando && styles.saveButtonDisabled]}
            onPress={handleSalvarNome}
            disabled={salvando}
          >
            {salvando
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.saveButtonText}>Salvar alterações</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancelarNome}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Modal troca de senha ─────────────────────────────────────────────── */}
      <Modal
        visible={senhaModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSenhaModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {user.deve_trocar_senha ? "Criar senha pessoal" : "Alterar senha"}
              </Text>
              <TouchableOpacity onPress={() => setSenhaModalVisible(false)}>
                <Feather name="x" size={22} color="#0A3D62" />
              </TouchableOpacity>
            </View>

            {user.deve_trocar_senha && (
              <Text style={styles.modalHint}>
                Você está usando uma senha provisória. Crie uma senha pessoal para continuar.
              </Text>
            )}

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Senha atual</Text>
              <View style={styles.senhaContainer}>
                <TextInput
                  style={styles.senhaInput}
                  value={senhaAtual}
                  onChangeText={setSenhaAtual}
                  placeholder="Senha atual"
                  placeholderTextColor="#999"
                  secureTextEntry={!senhaVisivel}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setSenhaVisivel(v => !v)} style={styles.senhaToggle}>
                  <Feather name={senhaVisivel ? "eye-off" : "eye"} size={20} color="#0A3D62" />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Nova senha</Text>
              <TextInput
                style={styles.inputModal}
                value={novaSenha}
                onChangeText={setNovaSenha}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#999"
                secureTextEntry={!senhaVisivel}
                autoCapitalize="none"
              />

              <Text style={styles.label}>Confirmar nova senha</Text>
              <TextInput
                style={styles.inputModal}
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
                placeholder="Repita a nova senha"
                placeholderTextColor="#999"
                secureTextEntry={!senhaVisivel}
                autoCapitalize="none"
              />
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#6C757D" }]}
                onPress={() => setSenhaModalVisible(false)}
              >
                <Text style={styles.modalBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#17A2B8" }, salvandoSenha && { opacity: 0.6 }]}
                onPress={handleTrocarSenha}
                disabled={salvandoSenha}
              >
                {salvandoSenha
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.modalBtnText}>Salvar</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  content: { padding: 16, paddingBottom: 40 },

  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3CD",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "#FFEAA7",
  },
  bannerTexts: { flex: 1 },
  bannerTitle: { fontSize: 14, fontWeight: "700", color: "#856404" },
  bannerSub: { fontSize: 12, color: "#856404", marginTop: 2 },

  avatarContainer: { alignItems: "center", marginVertical: 24, gap: 10 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#0A3D62",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  avatarText: { fontSize: 30, fontWeight: "bold", color: "#fff" },
  adminBadge: { backgroundColor: "#17A2B8", paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20 },
  adminBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 16, elevation: 1 },
  cardTitle: { fontSize: 13, fontWeight: "700", color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 },
  fieldRow: { paddingVertical: 10 },
  fieldLabel: { fontSize: 12, color: "#888", fontWeight: "600", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  fieldValueRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  fieldValue: { fontSize: 16, color: "#222", fontWeight: "500", flex: 1 },
  editLink: { fontSize: 13, color: "#17A2B8", fontWeight: "600" },
  input: {
    fontSize: 16,
    color: "#222",
    borderBottomWidth: 2,
    borderBottomColor: "#17A2B8",
    paddingVertical: 4,
  },
  divider: { height: 1, backgroundColor: "#F0F0F0" },
  cargosContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cargoBadge: { backgroundColor: "#EEF6FF", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: "#BEE5EB" },
  cargoBadgeText: { fontSize: 13, color: "#0A3D62", fontWeight: "600" },

  senhaButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
  },
  senhaButtonText: { flex: 1, fontSize: 15, color: "#0A3D62", fontWeight: "600" },

  editActions: { gap: 10 },
  saveButton: { backgroundColor: "#17A2B8", borderRadius: 10, padding: 14, alignItems: "center" },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  cancelButton: { borderRadius: 10, padding: 14, alignItems: "center", borderWidth: 1, borderColor: "#CCC" },
  cancelButtonText: { color: "#666", fontSize: 15, fontWeight: "600" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end", paddingBottom: 20 },
  modalBox: { backgroundColor: "#fff", marginHorizontal: 16, borderRadius: 16, padding: 20, maxHeight: "80%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#0A3D62" },
  modalHint: { fontSize: 13, color: "#6C757D", marginBottom: 12, lineHeight: 18 },
  label: { fontSize: 14, fontWeight: "600", color: "#343A40", marginBottom: 5, marginTop: 12 },
  inputModal: {
    borderWidth: 1,
    borderColor: "#CED4DA",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: "#333",
    backgroundColor: "#fff",
  },
  senhaContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CED4DA",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  senhaInput: { flex: 1, padding: 10, fontSize: 14, color: "#333" },
  senhaToggle: { padding: 10 },
  modalButtons: { flexDirection: "row", gap: 10, marginTop: 20 },
  modalBtn: { flex: 1, padding: 13, borderRadius: 8, alignItems: "center" },
  modalBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});

export default PerfilScreen;
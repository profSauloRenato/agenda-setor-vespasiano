// src/presentation/screens/PerfilScreen.tsx

import React, { useState } from "react";
import {
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { useUsuarioService } from "../../config/serviceLocator";

const PerfilScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, refreshUser } = useAuth();
  const usuarioService = useUsuarioService();

  const [editando, setEditando] = useState(false);
  const [novoNome, setNovoNome] = useState(user?.nome ?? "");
  const [salvando, setSalvando] = useState(false);

  const handleSalvar = async () => {
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
      await usuarioService.updateUsuarioBasico({
        ...user!,
        nome: novoNome.trim(),
      });
      await refreshUser();
      setEditando(false);
      Alert.alert("Sucesso", "Nome atualizado com sucesso!");
    } catch (err) {
      Alert.alert("Erro", "Não foi possível atualizar o nome.");
    } finally {
      setSalvando(false);
    }
  };

  const handleCancelar = () => {
    setNovoNome(user?.nome ?? "");
    setEditando(false);
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

      {/* Avatar com iniciais */}
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

      {/* Card de informações */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Informações pessoais</Text>

        {/* Nome */}
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

        {/* Email */}
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Email</Text>
          <Text style={styles.fieldValue}>{user.email}</Text>
        </View>

        <View style={styles.divider} />

        {/* Localização */}
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Congregação</Text>
          <Text style={styles.fieldValue}>
            {user.nome_localizacao ?? "Não informada"}
          </Text>
        </View>
      </View>

      {/* Card de cargos */}
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

      {/* Botões de salvar/cancelar edição */}
      {editando && (
        <View style={styles.editActions}>
          <TouchableOpacity
            style={[styles.saveButton, salvando && styles.saveButtonDisabled]}
            onPress={handleSalvar}
            disabled={salvando}
          >
            {salvando
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.saveButtonText}>Salvar alterações</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancelar}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  avatarContainer: {
    alignItems: "center",
    marginVertical: 24,
    gap: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#0A3D62",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#fff",
  },
  adminBadge: {
    backgroundColor: "#17A2B8",
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
  },
  adminBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  fieldRow: {
    paddingVertical: 10,
  },
  fieldLabel: {
    fontSize: 12,
    color: "#888",
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldValueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fieldValue: {
    fontSize: 16,
    color: "#222",
    fontWeight: "500",
    flex: 1,
  },
  editLink: {
    fontSize: 13,
    color: "#17A2B8",
    fontWeight: "600",
  },
  input: {
    fontSize: 16,
    color: "#222",
    borderBottomWidth: 2,
    borderBottomColor: "#17A2B8",
    paddingVertical: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
  },
  cargosContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  cargoBadge: {
    backgroundColor: "#EEF6FF",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#BEE5EB",
  },
  cargoBadgeText: {
    fontSize: 13,
    color: "#0A3D62",
    fontWeight: "600",
  },
  editActions: {
    gap: 10,
  },
  saveButton: {
    backgroundColor: "#17A2B8",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  cancelButton: {
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CCC",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default PerfilScreen;
// src/presentation/screens/admin/components/ModeloFormModal.tsx

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
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IEventoModelo, CategoriaEventoModelo } from "../../../../domain/models/IEventoModelo";

const CATEGORIA_LABELS: Record<CategoriaEventoModelo, string> = {
  evento: "Evento",
  reuniao_fixa: "Reunião",
};

const CATEGORIA_CORES: Record<CategoriaEventoModelo, string> = {
  evento: "#6F42C1",
  reuniao_fixa: "#17A2B8",
};

interface ModeloFormModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (nome: string, categoria: CategoriaEventoModelo) => Promise<void>;
  modeloToEdit: IEventoModelo | null;
  isSaving: boolean;
}

const ModeloFormModal: React.FC<ModeloFormModalProps> = ({
  isVisible,
  onClose,
  onSave,
  modeloToEdit,
  isSaving,
}) => {
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState<CategoriaEventoModelo>("reuniao_fixa");
  const insets = useSafeAreaInsets();
  const screenHeight = Dimensions.get("window").height;
  const keyboardOffset = useRef(new Animated.Value(0)).current;
  const maxModalHeight = useRef(new Animated.Value(screenHeight * 0.9)).current;

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
        Animated.timing(maxModalHeight, { toValue: screenHeight * 0.9, duration: 250, useNativeDriver: false }),
      ]).start();
    });
    return () => { show.remove(); hide.remove(); };
  }, [keyboardOffset, maxModalHeight]);

  useEffect(() => {
    if (isVisible) {
      setNome(modeloToEdit?.nome ?? "");
      setCategoria(modeloToEdit?.categoria ?? "reuniao_fixa");
    }
  }, [isVisible, modeloToEdit]);

  const handleSave = async () => {
    if (!nome.trim()) {
      Alert.alert("Atenção", "O nome é obrigatório.");
      return;
    }
    await onSave(nome.trim(), categoria);
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.modalView, { marginBottom: keyboardOffset, maxHeight: maxModalHeight }]}>

          <Text style={styles.modalTitle}>
            {modeloToEdit ? "Editar Modelo" : "Novo Modelo"}
          </Text>

          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Nome *</Text>
            <TextInput
              style={styles.input}
              value={nome}
              onChangeText={setNome}
              placeholder="Ex: Congregação"
              placeholderTextColor="#AAA"
              maxLength={100}
              autoFocus
            />

            <Text style={[styles.fieldLabel, { marginTop: 18 }]}>Categoria *</Text>
            <View style={styles.categoriaRow}>
              {(Object.keys(CATEGORIA_LABELS) as CategoriaEventoModelo[]).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoriaChip,
                    categoria === cat && { backgroundColor: CATEGORIA_CORES[cat], borderColor: CATEGORIA_CORES[cat] },
                  ]}
                  onPress={() => setCategoria(cat)}
                >
                  <Text style={[styles.categoriaChipText, categoria === cat && { color: "#fff" }]}>
                    {CATEGORIA_LABELS[cat]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.categoriaHint}>
              {categoria === "evento"
                ? "Eventos são definidos pela instituição (ex: Ensaio Regional, Mocidade)."
                : "Reuniões são encontros regulares ou extraordinários (ex: Reunião Administrativa)."}
            </Text>
          </ScrollView>

          <View style={[styles.buttonContainer, { paddingBottom: insets.bottom || 12 }]}>
            <TouchableOpacity style={[styles.button, styles.buttonCancel]} onPress={onClose} disabled={isSaving}>
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonSave, isSaving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>{modeloToEdit ? "Salvar Modelo" : "Criar Modelo"}</Text>}
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
    paddingTop: 20,
    flexShrink: 1,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#0A3D62", marginBottom: 15 },
  modalContent: { paddingBottom: 8 },
  fieldLabel: { fontSize: 14, fontWeight: "600", color: "#0A3D62", marginBottom: 8 },
  input: { backgroundColor: "#F9F9F9", borderWidth: 1, borderColor: "#DEE2E6", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#333" },
  categoriaRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  categoriaChip: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1.5, borderColor: "#DEE2E6", backgroundColor: "#fff", alignItems: "center" },
  categoriaChipText: { fontSize: 14, fontWeight: "600", color: "#555" },
  categoriaHint: { fontSize: 12, color: "#888", lineHeight: 18 },
  buttonContainer: { flexDirection: "row", gap: 10, marginTop: 16, marginBottom: 14 },
  button: { flex: 1, borderRadius: 8, padding: 13, alignItems: "center" },
  buttonCancel: { backgroundColor: "#6C757D" },
  buttonSave: { backgroundColor: "#3CB371" },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
});

export default ModeloFormModal;
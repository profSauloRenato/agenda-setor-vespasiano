// src/presentation/screens/admin/components/LocalizacaoCreateModal.tsx

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
import { ILocalizacao, LocalizacaoTipo } from "../../../../domain/models/ILocalizacao";
import { SelectPicker, SelectPickerItem } from "../components/SelectPicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PARENT_TIPO: Record<string, LocalizacaoTipo | null> = {
  Regional: null,
  Administração: "Regional",
  Setor: "Administração",
  Congregação: "Setor",
};

const PARENT_LABEL: Record<string, string> = {
  Administração: "Regional",
  Setor: "Administração",
  Congregação: "Setor",
};

interface LocalizacaoCreateModalProps {
  isVisible: boolean;
  onClose: () => void;
  creationType: LocalizacaoTipo;
  allLocalizacoes: ILocalizacao[];
  onSave: (data: {
    nome: string;
    parent_id: string | null;
    endereco_rua: string | null;
    endereco_numero: string | null;
    endereco_bairro: string | null;
    endereco_cidade: string | null;
    endereco_estado: string | null;
    endereco_cep: string | null;
  }) => Promise<void>;
}

const LocalizacaoCreateModal: React.FC<LocalizacaoCreateModalProps> = ({
  isVisible, onClose, creationType, allLocalizacoes, onSave,
}) => {
  const [nome, setNome] = useState<string>("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [enderecoRua, setEnderecoRua] = useState<string>("");
  const [enderecoNumero, setEnderecoNumero] = useState<string>("");
  const [enderecoBairro, setEnderecoBairro] = useState<string>("");
  const [enderecoCidade, setEnderecoCidade] = useState<string>("");
  const [enderecoEstado, setEnderecoEstado] = useState<string>("");
  const [enderecoCep, setEnderecoCep] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const isCongregacao = creationType === "Congregação";
  const tipoParent = PARENT_TIPO[creationType];
  const parentOptions = tipoParent
    ? allLocalizacoes.filter((loc) => loc.tipo === tipoParent).sort((a, b) => a.nome.localeCompare(b.nome))
    : [];
  const precisaDePai = tipoParent !== null;
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
      setNome(""); setParentId(null); setEnderecoRua(""); setEnderecoNumero("");
      setEnderecoBairro(""); setEnderecoCidade(""); setEnderecoEstado(""); setEnderecoCep(""); setIsSaving(false);
    }
  }, [isVisible]);

  const handleSave = async (): Promise<void> => {
    if (nome.trim().length < 3) { Alert.alert("Erro de Validação", "O nome deve ter no mínimo 3 caracteres."); return; }
    if (precisaDePai && !parentId) { Alert.alert("Campo Obrigatório", `Selecione ${PARENT_LABEL[creationType]} de origem.`); return; }
    setIsSaving(true);
    try {
      await onSave({
        nome: nome.trim(), parent_id: parentId,
        endereco_rua: enderecoRua.trim() || null, endereco_numero: enderecoNumero.trim() || null,
        endereco_bairro: enderecoBairro.trim() || null, endereco_cidade: enderecoCidade.trim() || null,
        endereco_estado: enderecoEstado.trim() || null, endereco_cep: enderecoCep.trim() || null,
      });
      onClose();
    } catch (e) {
      // Erro tratado no ViewModel
    } finally { setIsSaving(false); }
  };

  const isSaveDisabled = isSaving || (precisaDePai && parentOptions.length === 0);

  const parentItems: SelectPickerItem[] = [
    { label: `Selecione ${PARENT_LABEL[creationType] ?? ""}...`, value: null, color: "#999" },
    ...parentOptions.map((loc) => ({ label: loc.nome, value: loc.id })),
  ];

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.modalView, { marginBottom: keyboardOffset, maxHeight: maxModalHeight }]}>
          <Text style={styles.modalTitle}>Criar Novo(a) {creationType}</Text>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.label}>Nome:</Text>
            <TextInput style={styles.input} placeholder={`Nome da ${creationType}`} value={nome} onChangeText={setNome} autoCapitalize="words" editable={!isSaving} />

            {precisaDePai && (
              <View>
                <Text style={styles.label}>{PARENT_LABEL[creationType]}:</Text>
                {parentOptions.length === 0 ? (
                  <View style={styles.warningBox}>
                    <Text style={styles.warningText}>Nenhum(a) {PARENT_LABEL[creationType]} cadastrado(a). Cadastre primeiro.</Text>
                  </View>
                ) : (
                  <View style={styles.pickerContainer}>
                    <SelectPicker
                      selectedValue={parentId}
                      onValueChange={setParentId}
                      items={parentItems}
                      enabled={!isSaving}
                      placeholder={`Selecione ${PARENT_LABEL[creationType]}...`}
                    />
                  </View>
                )}
              </View>
            )}

            {isCongregacao && (
              <View>
                <Text style={styles.sectionTitle}>Endereço (opcional)</Text>
                <Text style={styles.label}>Rua:</Text>
                <TextInput style={styles.input} placeholder="Ex: Rua das Flores" value={enderecoRua} onChangeText={setEnderecoRua} editable={!isSaving} />
                <View style={styles.row}>
                  <View style={styles.colSmall}>
                    <Text style={styles.label}>Número:</Text>
                    <TextInput style={styles.input} placeholder="Ex: 123" value={enderecoNumero} onChangeText={setEnderecoNumero} keyboardType="numeric" editable={!isSaving} />
                  </View>
                  <View style={styles.colLarge}>
                    <Text style={styles.label}>Bairro:</Text>
                    <TextInput style={styles.input} placeholder="Ex: Centro" value={enderecoBairro} onChangeText={setEnderecoBairro} editable={!isSaving} />
                  </View>
                </View>
                <View style={styles.row}>
                  <View style={styles.colLarge}>
                    <Text style={styles.label}>Cidade:</Text>
                    <TextInput style={styles.input} placeholder="Ex: Vespasiano" value={enderecoCidade} onChangeText={setEnderecoCidade} editable={!isSaving} />
                  </View>
                  <View style={styles.colSmall}>
                    <Text style={styles.label}>UF:</Text>
                    <TextInput style={styles.input} placeholder="MG" value={enderecoEstado} onChangeText={setEnderecoEstado} maxLength={2} autoCapitalize="characters" editable={!isSaving} />
                  </View>
                </View>
                <Text style={styles.label}>CEP:</Text>
                <TextInput style={styles.input} placeholder="Ex: 33200-000" value={enderecoCep} onChangeText={setEnderecoCep} keyboardType="numeric" editable={!isSaving} />
              </View>
            )}
          </ScrollView>

          <View style={[styles.buttonContainer, { paddingBottom: insets.bottom || 12 }]}>
            <TouchableOpacity style={[styles.button, styles.buttonCancel]} onPress={onClose} disabled={isSaving}>
              <Text style={styles.textStyle}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.buttonSave, isSaveDisabled && styles.buttonDisabled]} onPress={handleSave} disabled={isSaveDisabled}>
              {isSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.textStyle}>Salvar</Text>}
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
  modalView: { backgroundColor: "white", borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 15, color: "#0A3D62" },
  scrollView: { flexShrink: 1 },
  scrollContent: { paddingBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#0A3D62", marginTop: 16, marginBottom: 4, borderBottomWidth: 1, borderBottomColor: "#DCE0E6", paddingBottom: 4 },
  label: { fontSize: 13, color: "#333", marginBottom: 4, marginTop: 10, fontWeight: "500" },
  input: { borderWidth: 1, borderColor: "#CCC", padding: 9, borderRadius: 6, backgroundColor: "#F9F9F9", fontSize: 14, color: "#333" },
  pickerContainer: { borderWidth: 1, borderColor: "#CCC", borderRadius: 6, backgroundColor: "#F9F9F9", overflow: "hidden" },
  warningBox: { backgroundColor: "#FFF3CD", borderWidth: 1, borderColor: "#FFEEBA", borderRadius: 6, padding: 10 },
  warningText: { color: "#856404", fontSize: 13 },
  row: { flexDirection: "row", gap: 10 },
  colSmall: { flex: 1 },
  colLarge: { flex: 2 },
  buttonContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 14, gap: 10 },
  button: { borderRadius: 8, padding: 13, flex: 1, alignItems: "center" },
  buttonSave: { backgroundColor: "#3CB371" },
  buttonCancel: { backgroundColor: "#6C757D" },
  buttonDisabled: { backgroundColor: "#A0C4A0" },
  textStyle: { color: "white", fontWeight: "bold", fontSize: 15 },
});

export { LocalizacaoCreateModal };
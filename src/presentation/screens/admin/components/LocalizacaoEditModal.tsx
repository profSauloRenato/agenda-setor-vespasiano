// src/presentation/screens/admin/components/LocalizacaoEditModal.tsx

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
import { ILocalizacao, LocalizacaoTipo } from "../../../../domain/models/ILocalizacao";
import { SelectPicker, SelectPickerItem } from "../components/SelectPicker";

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

interface LocalizacaoEditModalProps {
  isVisible: boolean;
  onClose: () => void;
  localizacao: ILocalizacao;
  allLocalizacoes: ILocalizacao[];
  onUpdate: (localizacao: ILocalizacao) => Promise<void>;
}

const LocalizacaoEditModal: React.FC<LocalizacaoEditModalProps> = ({
  isVisible, onClose, localizacao, allLocalizacoes, onUpdate,
}) => {
  const [nome, setNome] = useState(localizacao.nome);
  const [parentId, setParentId] = useState<string | null>(localizacao.parent_id);
  const [enderecoRua, setEnderecoRua] = useState(localizacao.endereco_rua || "");
  const [enderecoNumero, setEnderecoNumero] = useState(localizacao.endereco_numero || "");
  const [enderecoBairro, setEnderecoBairro] = useState(localizacao.endereco_bairro || "");
  const [enderecoCidade, setEnderecoCidade] = useState(localizacao.endereco_cidade || "");
  const [enderecoEstado, setEnderecoEstado] = useState(localizacao.endereco_estado || "");
  const [enderecoCep, setEnderecoCep] = useState(localizacao.endereco_cep || "");
  const [sedeId, setSedeId] = useState<string | null>(localizacao.sede_congregacao_id || null);
  const [isSaving, setIsSaving] = useState(false);

  const isCongregacao = localizacao.tipo === "Congregação";
  const isRegional = localizacao.tipo === "Regional";
  const tipoParent = PARENT_TIPO[localizacao.tipo];
  const parentOptions = tipoParent
    ? allLocalizacoes.filter((loc) => loc.tipo === tipoParent).sort((a, b) => a.nome.localeCompare(b.nome))
    : [];
  const congregacaoOptions = allLocalizacoes.filter((loc) => loc.tipo === "Congregação").sort((a, b) => a.nome.localeCompare(b.nome));
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
    setNome(localizacao.nome);
    setParentId(localizacao.parent_id);
    setEnderecoRua(localizacao.endereco_rua || "");
    setEnderecoNumero(localizacao.endereco_numero || "");
    setEnderecoBairro(localizacao.endereco_bairro || "");
    setEnderecoCidade(localizacao.endereco_cidade || "");
    setEnderecoEstado(localizacao.endereco_estado || "");
    setEnderecoCep(localizacao.endereco_cep || "");
    setSedeId(localizacao.sede_congregacao_id || null);
  }, [localizacao]);

  const handleUpdate = async () => {
    if (nome.trim().length < 3) { Alert.alert("Erro de Validação", "O nome deve ter no mínimo 3 caracteres."); return; }
    if (tipoParent && !parentId) { Alert.alert("Campo Obrigatório", `Selecione ${PARENT_LABEL[localizacao.tipo]} de origem.`); return; }
    setIsSaving(true);
    try {
      const updatedLocalizacao: ILocalizacao = {
        ...localizacao,
        nome: nome.trim(), parent_id: parentId,
        endereco_rua: enderecoRua.trim() || null, endereco_numero: enderecoNumero.trim() || null,
        endereco_bairro: enderecoBairro.trim() || null, endereco_cidade: enderecoCidade.trim() || null,
        endereco_estado: enderecoEstado.trim() || null, endereco_cep: enderecoCep.trim() || null,
        sede_congregacao_id: sedeId,
      };
      await onUpdate(updatedLocalizacao);
    } catch (e) {
      // Erro tratado no ManagerScreen
    } finally { setIsSaving(false); }
  };

  const sedeItems: SelectPickerItem[] = [
    { label: "Nenhuma (definir depois)...", value: null, color: "#999" },
    ...congregacaoOptions.map((loc) => ({ label: loc.nome, value: loc.id })),
  ];

  const parentItems: SelectPickerItem[] = [
    { label: `Selecione ${PARENT_LABEL[localizacao.tipo] ?? ""}...`, value: null, color: "#999" },
    ...parentOptions.map((loc) => ({ label: loc.nome, value: loc.id })),
  ];

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.modalView, { marginBottom: keyboardOffset, maxHeight: maxModalHeight }]}>
          <Text style={styles.modalTitle}>Editar {localizacao.tipo}</Text>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

            <Text style={styles.label}>Nome:</Text>
            <TextInput style={styles.input} value={nome} onChangeText={setNome} autoCapitalize="words" editable={!isSaving} />

            {isRegional && (
              <View>
                <Text style={styles.label}>Congregação Sede (opcional):</Text>
                <View style={styles.pickerContainer}>
                  <SelectPicker selectedValue={sedeId} onValueChange={setSedeId} items={sedeItems} enabled={!isSaving} placeholder="Nenhuma (definir depois)..." />
                </View>
              </View>
            )}

            {tipoParent && parentOptions.length > 0 && (
              <View>
                <Text style={styles.label}>{PARENT_LABEL[localizacao.tipo]}:</Text>
                <View style={styles.pickerContainer}>
                  <SelectPicker selectedValue={parentId} onValueChange={setParentId} items={parentItems} enabled={!isSaving} />
                </View>
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

            <Text style={styles.infoText}>ID: {localizacao.id.substring(0, 8)}...</Text>
          </ScrollView>

          <View style={[styles.buttonContainer, { paddingBottom: insets.bottom || 12 }]}>
            <TouchableOpacity style={[styles.button, styles.buttonCancel]} onPress={onClose} disabled={isSaving}>
              <Text style={styles.textStyle}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.buttonSave]} onPress={handleUpdate} disabled={isSaving}>
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
  modalView: { backgroundColor: "white", borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingHorizontal: 20, paddingTop: 20 },
  scrollContent: { paddingBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 15, color: "#0A3D62" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#0A3D62", marginTop: 16, marginBottom: 4, borderBottomWidth: 1, borderBottomColor: "#DCE0E6", paddingBottom: 4 },
  label: { fontSize: 13, color: "#333", marginBottom: 4, marginTop: 10, fontWeight: "500" },
  input: { borderWidth: 1, borderColor: "#CCC", padding: 9, borderRadius: 6, backgroundColor: "#F9F9F9", fontSize: 14, color: "#333" },
  pickerContainer: { borderWidth: 1, borderColor: "#CCC", borderRadius: 6, backgroundColor: "#F9F9F9", overflow: "hidden" },
  infoText: { fontSize: 12, color: "#6C757D", marginTop: 15, marginBottom: 5, textAlign: "right" },
  buttonContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 14, marginBottom: 14, gap: 10 },
  row: { flexDirection: "row", gap: 10 },
  colSmall: { flex: 1 },
  colLarge: { flex: 2 },
  button: { borderRadius: 8, padding: 13, flex: 1, alignItems: "center" },
  buttonSave: { backgroundColor: "#3CB371" },
  buttonCancel: { backgroundColor: "#6C757D" },
  textStyle: { color: "white", fontWeight: "bold", fontSize: 15 },
});

export { LocalizacaoEditModal };
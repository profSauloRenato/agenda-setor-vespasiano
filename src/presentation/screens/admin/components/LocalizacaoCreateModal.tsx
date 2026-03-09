// src/presentation/screens/admin/components/LocalizacaoCreateModal.tsx

import React, { useEffect, useState } from "react";
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
import { Picker } from "@react-native-picker/picker";
import { ILocalizacao, LocalizacaoTipo } from "../../../../domain/models/ILocalizacao";

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
  isVisible,
  onClose,
  creationType,
  allLocalizacoes,
  onSave,
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
    ? allLocalizacoes
      .filter((loc) => loc.tipo === tipoParent)
      .sort((a, b) => a.nome.localeCompare(b.nome))
    : [];
  const precisaDePai = tipoParent !== null;

  useEffect(() => {
    if (isVisible) {
      setNome("");
      setParentId(null);
      setEnderecoRua("");
      setEnderecoNumero("");
      setEnderecoBairro("");
      setEnderecoCidade("");
      setEnderecoEstado("");
      setEnderecoCep("");
      setIsSaving(false);
    }
  }, [isVisible]);

  const handleSave = async (): Promise<void> => {
    if (nome.trim().length < 3) {
      Alert.alert("Erro de Validação", "O nome deve ter no mínimo 3 caracteres.");
      return;
    }
    if (precisaDePai && !parentId) {
      Alert.alert("Campo Obrigatório", `Selecione ${PARENT_LABEL[creationType]} de origem.`);
      return;
    }
    setIsSaving(true);
    try {
      await onSave({
        nome: nome.trim(),
        parent_id: parentId,
        endereco_rua: enderecoRua.trim() || null,
        endereco_numero: enderecoNumero.trim() || null,
        endereco_bairro: enderecoBairro.trim() || null,
        endereco_cidade: enderecoCidade.trim() || null,
        endereco_estado: enderecoEstado.trim() || null,
        endereco_cep: enderecoCep.trim() || null,
      });
      onClose();
    } catch (e) {
      // Erro tratado no ViewModel
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = (): void => {
    onClose();
  };

  const isSaveDisabled = isSaving || (precisaDePai && parentOptions.length === 0);

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={handleClose}>
      <KeyboardAvoidingView style={styles.centeredView} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Criar Novo(a) {creationType}</Text>

            <Text style={styles.label}>Nome:</Text>
            <TextInput
              style={styles.input}
              placeholder={`Nome da ${creationType}`}
              value={nome}
              onChangeText={setNome}
              autoCapitalize="words"
              editable={!isSaving}
            />

            {precisaDePai && (
              <View>
                <Text style={styles.label}>{PARENT_LABEL[creationType]}:</Text>
                {parentOptions.length === 0 ? (
                  <View style={styles.warningBox}>
                    <Text style={styles.warningText}>
                      Nenhum(a) {PARENT_LABEL[creationType]} cadastrado(a). Cadastre primeiro.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={parentId}
                      onValueChange={(value) => setParentId(value)}
                      enabled={!isSaving}
                      style={{ color: "#333" }}
                    >
                      <Picker.Item label={`Selecione ${PARENT_LABEL[creationType]}...`} value={null} color="#999" />
                      {parentOptions.map((loc) => (
                        <Picker.Item key={loc.id} label={loc.nome} value={loc.id} />
                      ))}
                    </Picker>
                  </View>
                )}
              </View>
            )}

            {isCongregacao && (
              <View>
                <Text style={styles.sectionTitle}>Endereço (opcional)</Text>

                <Text style={styles.label}>Rua:</Text>
                <TextInput style={styles.input} placeholder="Ex: Rua das Flores" value={enderecoRua} onChangeText={setEnderecoRua} editable={!isSaving} />

                <Text style={styles.label}>Número:</Text>
                <TextInput style={styles.input} placeholder="Ex: 123" value={enderecoNumero} onChangeText={setEnderecoNumero} keyboardType="numeric" editable={!isSaving} />

                <Text style={styles.label}>Bairro:</Text>
                <TextInput style={styles.input} placeholder="Ex: Centro" value={enderecoBairro} onChangeText={setEnderecoBairro} editable={!isSaving} />

                <Text style={styles.label}>Cidade:</Text>
                <TextInput style={styles.input} placeholder="Ex: Vespasiano" value={enderecoCidade} onChangeText={setEnderecoCidade} editable={!isSaving} />

                <Text style={styles.label}>Estado (UF):</Text>
                <TextInput style={styles.input} placeholder="Ex: MG" value={enderecoEstado} onChangeText={setEnderecoEstado} maxLength={2} autoCapitalize="characters" editable={!isSaving} />

                <Text style={styles.label}>CEP:</Text>
                <TextInput style={styles.input} placeholder="Ex: 33200-000" value={enderecoCep} onChangeText={setEnderecoCep} keyboardType="numeric" editable={!isSaving} />
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={[styles.button, styles.buttonCancel]} onPress={handleClose} disabled={isSaving}>
                <Text style={styles.textStyle}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonSave, isSaveDisabled && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={isSaveDisabled}
              >
                {isSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.textStyle}>Salvar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  modalView: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 25,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#0A3D62",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0A3D62",
    marginTop: 20,
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#DCE0E6",
    paddingBottom: 5,
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
    marginTop: 10,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CCC",
    padding: 10,
    borderRadius: 5,
    backgroundColor: "#F9F9F9",
    fontSize: 15,
    color: "#333",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 5,
    backgroundColor: "#F9F9F9",
  },
  warningBox: {
    backgroundColor: "#FFF3CD",
    borderWidth: 1,
    borderColor: "#FFEEBA",
    borderRadius: 5,
    padding: 10,
  },
  warningText: {
    color: "#856404",
    fontSize: 13,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  buttonSave: { backgroundColor: "#3CB371" },
  buttonCancel: { backgroundColor: "#6C757D" },
  buttonDisabled: { backgroundColor: "#A0C4A0" },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    fontSize: 15,
  },
});

export { LocalizacaoCreateModal };
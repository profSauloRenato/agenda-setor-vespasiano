// src/presentation/screens/admin/components/LocalizacaoEditModal.tsx

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

interface LocalizacaoEditModalProps {
  isVisible: boolean;
  onClose: () => void;
  localizacao: ILocalizacao;
  allLocalizacoes: ILocalizacao[];
  onUpdate: (localizacao: ILocalizacao) => Promise<void>;
}

const LocalizacaoEditModal: React.FC<LocalizacaoEditModalProps> = ({
  isVisible,
  onClose,
  localizacao,
  allLocalizacoes,
  onUpdate,
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
    ? allLocalizacoes
      .filter((loc) => loc.tipo === tipoParent)
      .sort((a, b) => a.nome.localeCompare(b.nome))
    : [];
  const congregacaoOptions = allLocalizacoes
    .filter((loc) => loc.tipo === "Congregação")
    .sort((a, b) => a.nome.localeCompare(b.nome));

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
    if (nome.trim().length < 3) {
      Alert.alert("Erro de Validação", "O nome deve ter no mínimo 3 caracteres.");
      return;
    }
    if (tipoParent && !parentId) {
      Alert.alert("Campo Obrigatório", `Selecione ${PARENT_LABEL[localizacao.tipo]} de origem.`);
      return;
    }
    setIsSaving(true);
    try {
      const updatedLocalizacao: ILocalizacao = {
        ...localizacao,
        nome: nome.trim(),
        parent_id: parentId,
        endereco_rua: enderecoRua.trim() || null,
        endereco_numero: enderecoNumero.trim() || null,
        endereco_bairro: enderecoBairro.trim() || null,
        endereco_cidade: enderecoCidade.trim() || null,
        endereco_estado: enderecoEstado.trim() || null,
        endereco_cep: enderecoCep.trim() || null,
        sede_congregacao_id: sedeId,
      };
      await onUpdate(updatedLocalizacao);
    } catch (e) {
      // Erro tratado no ManagerScreen
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.centeredView} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Editar {localizacao.tipo}</Text>

            <Text style={styles.label}>Nome:</Text>
            <TextInput
              style={styles.input}
              value={nome}
              onChangeText={setNome}
              autoCapitalize="words"
              editable={!isSaving}
            />

            {isRegional && (
              <View>
                <Text style={styles.label}>Congregação Sede (opcional):</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={sedeId}
                    onValueChange={(value) => setSedeId(value)}
                    enabled={!isSaving}
                    style={{ color: "#333" }}
                  >
                    <Picker.Item label="Nenhuma (definir depois)..." value={null} color="#999" />
                    {congregacaoOptions.map((loc) => (
                      <Picker.Item key={loc.id} label={loc.nome} value={loc.id} />
                    ))}
                  </Picker>
                </View>
              </View>
            )}

            {tipoParent && parentOptions.length > 0 && (
              <View>
                <Text style={styles.label}>{PARENT_LABEL[localizacao.tipo]}:</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={parentId}
                    onValueChange={(value) => setParentId(value)}
                    enabled={!isSaving}
                    style={{ color: "#333" }}
                  >
                    <Picker.Item label={`Selecione ${PARENT_LABEL[localizacao.tipo]}...`} value={null} color="#999" />
                    {parentOptions.map((loc) => (
                      <Picker.Item key={loc.id} label={loc.nome} value={loc.id} />
                    ))}
                  </Picker>
                </View>
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

            <Text style={styles.infoText}>ID: {localizacao.id.substring(0, 8)}...</Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={[styles.button, styles.buttonCancel]} onPress={onClose} disabled={isSaving}>
                <Text style={styles.textStyle}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.buttonSave]} onPress={handleUpdate} disabled={isSaving}>
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
  infoText: {
    fontSize: 12,
    color: "#6C757D",
    marginTop: 15,
    marginBottom: 5,
    textAlign: "right",
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
  buttonSave: { backgroundColor: "#FFC107" },
  buttonCancel: { backgroundColor: "#6C757D" },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    fontSize: 15,
  },
});

export { LocalizacaoEditModal };
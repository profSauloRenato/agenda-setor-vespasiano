// src/presentation/screens/admin/VersiculosManagerScreen.tsx

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
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
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAuth } from "../../context/AuthContext";
import { useMensagemAdminService, useVersiculoService, useNotificationService } from "../../../config/serviceLocator";
import { IVersiculo } from "../../../domain/models/IVersiculo";
import { IMensagemAdmin } from "../../../domain/models/IMensagemAdmin";
import { ICargo } from "../../../domain/models/ICargo";
import { ILocalizacao } from "../../../domain/models/ILocalizacao";
import { useCargoUseCases, useLocalizacaoUseCases } from "../../../config/serviceLocator";
import SafeScreen from "../../components/SafeScreen";
import { SelectPicker, SelectPickerItem } from "../admin/components/SelectPicker";

type Aba = "versiculos" | "mensagens";

const formatarData = (iso: string): string => {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
};

const VersiculosManagerScreen: React.FC = () => {
  const { user } = useAuth();
  const versiculoService = useVersiculoService();
  const mensagemService = useMensagemAdminService();
  const notificationService = useNotificationService();
  const insets = useSafeAreaInsets();
  const screenHeight = Dimensions.get("window").height;
  const keyboardOffset = useRef(new Animated.Value(0)).current;
  const maxModalHeight = useRef(new Animated.Value(screenHeight * 0.85)).current;

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
        Animated.timing(maxModalHeight, { toValue: screenHeight * 0.85, duration: 250, useNativeDriver: false }),
      ]).start();
    });
    return () => { show.remove(); hide.remove(); };
  }, [keyboardOffset, maxModalHeight]);

  const [aba, setAba] = useState<Aba>("versiculos");

  const [versiculos, setVersiculos] = useState<IVersiculo[]>([]);
  const [isLoadingV, setIsLoadingV] = useState(true);
  const [isFormVVisible, setIsFormVVisible] = useState(false);
  const [versiculoToEdit, setVersiculoToEdit] = useState<IVersiculo | null>(null);

  const [mensagens, setMensagens] = useState<IMensagemAdmin[]>([]);
  const [isLoadingM, setIsLoadingM] = useState(true);
  const [isFormMVisible, setIsFormMVisible] = useState(false);
  const [mensagemToEdit, setMensagemToEdit] = useState<IMensagemAdmin | null>(null);
  const cargoUseCases = useCargoUseCases();
  const localizacaoUseCases = useLocalizacaoUseCases();
  const [cargosDisponiveis, setCargosDisponiveis] = useState<ICargo[]>([]);
  const [localizacoesDisponiveis, setLocalizacoesDisponiveis] = useState<ILocalizacao[]>([]);
  const [mLocalizacaoId, setMLocalizacaoId] = useState<string | null>(null);
  const [mCargosVisiveis, setMCargosVisiveis] = useState<string[]>([]);
  const [mEnviarPush, setMEnviarPush] = useState(false);

  const [vTexto, setVTexto] = useState("");
  const [vReferencia, setVReferencia] = useState("");
  const [vData, setVData] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmittingV, setIsSubmittingV] = useState(false);

  const [mTitulo, setMTitulo] = useState("");
  const [mTexto, setMTexto] = useState("");
  const [mAtiva, setMAtiva] = useState(true);
  const [isSubmittingM, setIsSubmittingM] = useState(false);

  const loadVersiculos = useCallback(async () => {
    setIsLoadingV(true);
    try {
      const data = await versiculoService.getVersiculos();
      setVersiculos(data);
    } catch { Alert.alert("Erro", "Falha ao carregar versículos."); }
    finally { setIsLoadingV(false); }
  }, []);

  const loadMensagens = useCallback(async () => {
    setIsLoadingM(true);
    try {
      const data = await mensagemService.getMensagens();
      setMensagens(data);
    } catch { Alert.alert("Erro", "Falha ao carregar mensagens."); }
    finally { setIsLoadingM(false); }
  }, []);

  useEffect(() => {
    loadVersiculos();
    loadMensagens();
    if (user) {
      cargoUseCases.getCargos.execute(user).then(setCargosDisponiveis).catch(() => { });
      localizacaoUseCases.getLocalizacoes.execute(user).then(setLocalizacoesDisponiveis).catch(() => { });
    }
  }, []);

  const handleOpenCreateV = () => {
    setVersiculoToEdit(null); setVTexto(""); setVReferencia(""); setVData(new Date()); setIsFormVVisible(true);
  };
  const handleOpenEditV = (v: IVersiculo) => {
    setVersiculoToEdit(v); setVTexto(v.texto); setVReferencia(v.referencia); setVData(new Date(v.data + "T12:00:00")); setIsFormVVisible(true);
  };

  const handleSaveV = async () => {
    if (!vTexto.trim() || !vReferencia.trim()) { Alert.alert("Atenção", "Preencha o texto e a referência."); return; }
    if (!user) return;
    setIsSubmittingV(true);
    try {
      const d = vData;
      const dataISO = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (versiculoToEdit) {
        await versiculoService.updateVersiculo(versiculoToEdit.id, { texto: vTexto, referencia: vReferencia, data: dataISO });
      } else {
        await versiculoService.createVersiculo({ texto: vTexto, referencia: vReferencia, data: dataISO, criado_por: null }, user.id);
      }
      setIsFormVVisible(false);
      loadVersiculos();
    } catch (e: any) {
      console.log("ERRO VERSICULO:", JSON.stringify(e));
      Alert.alert("Erro", e?.message ?? "Falha ao salvar versículo.");
    } finally { setIsSubmittingV(false); }
  };

  const handleDeleteV = (id: string) => {
    Alert.alert("Confirmar", "Excluir este versículo?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: async () => { await versiculoService.deleteVersiculo(id); loadVersiculos(); } },
    ]);
  };

  const handleOpenCreateM = () => {
    setMensagemToEdit(null); setMTitulo(""); setMTexto(""); setMAtiva(true); setMEnviarPush(false);
    setIsFormMVisible(true); setMLocalizacaoId(null); setMCargosVisiveis([]);
  };
  const handleOpenEditM = (m: IMensagemAdmin) => {
    setMensagemToEdit(m); setMTitulo(m.titulo); setMTexto(m.texto); setMAtiva(m.ativa);
    setIsFormMVisible(true); setMLocalizacaoId(m.localizacao_id); setMCargosVisiveis(m.cargos_visiveis);
  };

  const handleSaveM = async () => {
    if (!mTitulo.trim() || !mTexto.trim()) { Alert.alert("Atenção", "Preencha o título e o texto."); return; }
    if (!user) return;
    setIsSubmittingM(true);
    try {
      if (mensagemToEdit) {
        await mensagemService.updateMensagem(mensagemToEdit.id, { titulo: mTitulo, texto: mTexto, ativa: mAtiva, localizacao_id: mLocalizacaoId, cargos_visiveis: mCargosVisiveis });
      } else {
        await mensagemService.createMensagem({ titulo: mTitulo, texto: mTexto, ativa: mAtiva, localizacao_id: mLocalizacaoId, cargos_visiveis: mCargosVisiveis, criado_por: null }, user.id);
        if (mEnviarPush) {
          const resultado = await notificationService.enviarPushMensagem({ titulo: mTitulo, cargosVisiveis: mCargosVisiveis, localizacaoId: mLocalizacaoId });
          Alert.alert("Push enviado", `Notificações enviadas: ${resultado.enviados}\nErros: ${resultado.erros}`);
        }
      }
      setIsFormMVisible(false);
      loadMensagens();
    } catch (e: any) { Alert.alert("Erro", e?.message ?? "Falha ao salvar mensagem."); }
    finally { setIsSubmittingM(false); }
  };

  const handleDeleteM = (id: string) => {
    Alert.alert("Confirmar", "Excluir esta mensagem?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: async () => { await mensagemService.deleteMensagem(id); loadMensagens(); } },
    ]);
  };

  // Items para SelectPicker de localização — agrupados por tipo
  const ORDEM_TIPO_LOC = ["Regional", "Administração", "Setor", "Congregação"];
  const localizacoesOrdenadas = [...localizacoesDisponiveis].sort((a, b) => {
    const diff = ORDEM_TIPO_LOC.indexOf(a.tipo) - ORDEM_TIPO_LOC.indexOf(b.tipo);
    return diff !== 0 ? diff : a.nome.localeCompare(b.nome);
  });
  const localizacaoItems: SelectPickerItem[] = [
    { label: "Todos (sem filtro)", value: null, color: "#999" },
    ...ORDEM_TIPO_LOC.flatMap((tipo) => {
      const itens = localizacoesOrdenadas.filter((l) => l.tipo === tipo);
      if (itens.length === 0) return [];
      return [
        { label: `── ${tipo} ──`, value: `_header_${tipo}`, color: "#AAA" },
        ...itens.map((l) => ({ label: l.nome, value: l.id })),
      ];
    }),
  ];

  return (
    <SafeScreen style={styles.container}>

      <View style={styles.abas}>
        <TouchableOpacity style={[styles.aba, aba === "versiculos" && styles.abaAtiva]} onPress={() => setAba("versiculos")}>
          <Text style={[styles.abaText, aba === "versiculos" && styles.abaTextAtiva]}>📖 Versículos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.aba, aba === "mensagens" && styles.abaAtiva]} onPress={() => setAba("mensagens")}>
          <Text style={[styles.abaText, aba === "mensagens" && styles.abaTextAtiva]}>📢 Mensagens</Text>
        </TouchableOpacity>
      </View>

      {aba === "versiculos" && (
        <View style={styles.content}>
          <TouchableOpacity style={styles.addButton} onPress={handleOpenCreateV}>
            <Text style={styles.addButtonText}>+ Adicionar Versículo</Text>
          </TouchableOpacity>
          {isLoadingV
            ? <ActivityIndicator size="large" color="#17A2B8" style={{ marginTop: 20 }} />
            : <FlatList
              data={versiculos}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.item}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemData}>{formatarData(item.data)}</Text>
                    <Text style={styles.itemTexto} numberOfLines={2}>"{item.texto}"</Text>
                    <Text style={styles.itemRef}>— {item.referencia}</Text>
                  </View>
                  <View style={styles.itemActions}>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#FFC107" }]} onPress={() => handleOpenEditV(item)}>
                      <Text style={styles.actionBtnText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#DC3545", marginTop: 5 }]} onPress={() => handleDeleteV(item.id)}>
                      <Text style={styles.actionBtnText}>Excluir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>Nenhum versículo cadastrado.</Text>}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          }
        </View>
      )}

      {aba === "mensagens" && (
        <View style={styles.content}>
          <TouchableOpacity style={styles.addButton} onPress={handleOpenCreateM}>
            <Text style={styles.addButtonText}>+ Adicionar Mensagem</Text>
          </TouchableOpacity>
          {isLoadingM
            ? <ActivityIndicator size="large" color="#17A2B8" style={{ marginTop: 20 }} />
            : <FlatList
              data={mensagens}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.item}>
                  <View style={styles.itemInfo}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemTitulo}>{item.titulo}</Text>
                      <View style={[styles.badge, { backgroundColor: item.ativa ? "#28A745" : "#6C757D" }]}>
                        <Text style={styles.badgeText}>{item.ativa ? "Ativa" : "Inativa"}</Text>
                      </View>
                    </View>
                    <Text style={styles.itemTexto} numberOfLines={2}>{item.texto}</Text>
                  </View>
                  <View style={styles.itemActions}>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#FFC107" }]} onPress={() => handleOpenEditM(item)}>
                      <Text style={styles.actionBtnText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#DC3545", marginTop: 5 }]} onPress={() => handleDeleteM(item.id)}>
                      <Text style={styles.actionBtnText}>Excluir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma mensagem cadastrada.</Text>}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          }
        </View>
      )}

      {/* MODAL VERSÍCULO */}
      <Modal visible={isFormVVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalDismiss} activeOpacity={1} onPress={() => setIsFormVVisible(false)} />
          <Animated.View style={[styles.modalBox, { marginBottom: keyboardOffset, maxHeight: maxModalHeight, paddingBottom: insets.bottom || 12 }]}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 8 }}>
              <Text style={styles.label}>Data</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.dateButtonText}>📅 {vData.toLocaleDateString("pt-BR")}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker value={vData} mode="date" display="default" onChange={(_, date) => { setShowDatePicker(false); if (date) setVData(date); }} />
              )}
              <Text style={styles.label}>Referência</Text>
              <TextInput style={styles.input} value={vReferencia} onChangeText={setVReferencia} placeholder="Ex: João 3:16" />
              <Text style={styles.label}>Texto do versículo</Text>
              <TextInput style={[styles.input, styles.textArea]} value={vTexto} onChangeText={setVTexto} placeholder="Ex: Porque Deus amou o mundo..." multiline numberOfLines={4} />
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#6C757D" }]} onPress={() => setIsFormVVisible(false)}>
                <Text style={styles.modalBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#3CB371" }]} onPress={handleSaveV} disabled={isSubmittingV}>
                <Text style={styles.modalBtnText}>{isSubmittingV ? "Salvando..." : "Criar Versículo"}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* MODAL MENSAGEM */}
      <Modal visible={isFormMVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalDismiss} activeOpacity={1} onPress={() => setIsFormMVisible(false)} />
          <Animated.View style={[styles.modalBox, { marginBottom: keyboardOffset, maxHeight: maxModalHeight, paddingBottom: insets.bottom || 12 }]}>
            <Text style={styles.modalTitle}>{mensagemToEdit ? "Editar Mensagem" : "Nova Mensagem"}</Text>
            <ScrollView>
              <Text style={styles.label}>Título</Text>
              <TextInput style={styles.input} value={mTitulo} onChangeText={setMTitulo} placeholder="Ex: Aviso importante" />
              <Text style={styles.label}>Texto</Text>
              <TextInput style={[styles.input, styles.textArea]} value={mTexto} onChangeText={setMTexto} placeholder="Ex: Lembramos a todos que..." multiline numberOfLines={4} />

              <Text style={styles.label}>Localização (opcional)</Text>
              <View style={styles.pickerContainer}>
                <SelectPicker
                  selectedValue={mLocalizacaoId}
                  onValueChange={(v: string | null) => { if (v && String(v).startsWith("_header_")) return; setMLocalizacaoId(v); }}
                  items={localizacaoItems}
                  placeholder="Todos (sem filtro)"
                />
              </View>

              <Text style={styles.label}>Cargos que podem ver (opcional)</Text>
              <Text style={styles.infoText}>Se nenhum for selecionado, todos verão.</Text>
              <View style={styles.cargosContainer}>
                {cargosDisponiveis.map((cargo) => {
                  const selected = mCargosVisiveis.includes(cargo.id);
                  return (
                    <TouchableOpacity
                      key={cargo.id}
                      style={[styles.cargoChip, selected && styles.cargoChipSelected]}
                      onPress={() => setMCargosVisiveis((prev) => selected ? prev.filter((id) => id !== cargo.id) : [...prev, cargo.id])}
                    >
                      <Text style={[styles.cargoChipText, selected && styles.cargoChipTextSelected]}>{cargo.nome}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.label}>Mensagem ativa</Text>
                <Switch value={mAtiva} onValueChange={setMAtiva} />
              </View>

              {!mensagemToEdit && (
                <View style={styles.switchRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Enviar notificação push</Text>
                    <Text style={styles.infoText}>Os destinatários receberão uma notificação ao salvar.</Text>
                  </View>
                  <Switch value={mEnviarPush} onValueChange={setMEnviarPush} trackColor={{ false: "#767577", true: "#17A2B8" }} />
                </View>
              )}
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#6C757D" }]} onPress={() => setIsFormMVisible(false)}>
                <Text style={styles.modalBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#3CB371" }]} onPress={handleSaveM} disabled={isSubmittingM}>
                <Text style={styles.modalBtnText}>{isSubmittingM ? "Salvando..." : "Criar Mensagem"}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  abas: { flexDirection: "row", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#DEE2E6" },
  aba: { flex: 1, paddingVertical: 14, alignItems: "center" },
  abaAtiva: { borderBottomWidth: 3, borderBottomColor: "#17A2B8" },
  abaText: { fontSize: 14, color: "#6C757D", fontWeight: "600" },
  abaTextAtiva: { color: "#17A2B8" },
  content: { flex: 1, padding: 15 },
  addButton: { backgroundColor: "#17A2B8", padding: 12, borderRadius: 8, alignItems: "center", marginBottom: 15 },
  addButtonText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  item: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 8, padding: 12, marginBottom: 8, elevation: 1 },
  itemInfo: { flex: 1, marginRight: 8 },
  itemHeader: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  itemData: { fontSize: 12, color: "#17A2B8", fontWeight: "bold", marginBottom: 4 },
  itemTitulo: { fontSize: 15, fontWeight: "700", color: "#0A3D62", flex: 1 },
  itemTexto: { fontSize: 13, color: "#444", fontStyle: "italic" },
  itemRef: { fontSize: 12, color: "#6C757D", marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  itemActions: { justifyContent: "center" },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 5, alignItems: "center" },
  actionBtnText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  emptyText: { textAlign: "center", color: "#6C757D", marginTop: 30, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalDismiss: { flex: 1 },
  modalBox: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#0A3D62", marginBottom: 15 },
  label: { fontSize: 14, fontWeight: "600", color: "#343A40", marginBottom: 5, marginTop: 10 },
  input: { borderWidth: 1, borderColor: "#CED4DA", borderRadius: 8, padding: 10, fontSize: 14, backgroundColor: "#fff", color: "#333" },
  textArea: { height: 100, textAlignVertical: "top" },
  dateButton: { borderWidth: 1, borderColor: "#CED4DA", borderRadius: 8, padding: 12, backgroundColor: "#fff" },
  dateButtonText: { fontSize: 14, color: "#333" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  modalButtons: { flexDirection: "row", gap: 10, marginTop: 20 },
  modalBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: "center" },
  modalBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  pickerContainer: { borderWidth: 1, borderColor: "#CED4DA", borderRadius: 8, marginBottom: 5, backgroundColor: "#fff", overflow: "hidden" },
  infoText: { fontSize: 12, color: "#6C757D", marginBottom: 8 },
  cargosContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  cargoChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "#CED4DA", backgroundColor: "#fff" },
  cargoChipSelected: { backgroundColor: "#0A3D62", borderColor: "#0A3D62" },
  cargoChipText: { fontSize: 13, color: "#333" },
  cargoChipTextSelected: { color: "#fff" },
});

export default VersiculosManagerScreen;
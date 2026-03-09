// src/presentation/screens/admin/components/EventoFormModal.tsx

import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useState, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { ICargo } from "../../../../domain/models/ICargo";
import { ILocalizacao } from "../../../../domain/models/ILocalizacao";
import {
  DIAS_SEMANA,
  IEvento,
  IEventoAlerta,
  RecorrenciaTipo,
  SEMANAS_DO_MES,
} from "../../../../domain/models/IEvento";
import { IEventoModelo } from "../../../../domain/models/IEventoModelo";
import { EventoUseCases, useEventosViewModel } from "../../../view_models/EventosViewModel";
import { CreateEventoParams, UpdateEventoParams } from "../../../../domain/use_cases/eventos/types";
import { useEventoModeloUseCases } from "../../../../config/serviceLocator";

interface EventoFormModalProps {
  isVisible: boolean;
  onClose: () => void;
  eventoToEdit: IEvento | null;
  eventoUseCases: EventoUseCases;
  cargosDisponiveis: ICargo[];
  localizacoesDisponiveis: ILocalizacao[];
}

const initialFormState = {
  modelo_id: null as string | null,
  descricao: "",
  localizacao_id: null as string | null,
  abrangencia_id: null as string | null,
  responsavel_id: null as string | null,
  cargos_visiveis: [] as string[],
  rsvp_habilitado: false,
  data_inicio: new Date(),
  data_fim: null as Date | null,
  recorrente: false,
  recorrencia_tipo: null as RecorrenciaTipo | null,
  recorrencia_dia_semana: null as number | null,
  recorrencia_semana_do_mes: null as number | null,
  evento_referencia_id: null as string | null,
  dias_antes_referencia: null as number | null,
  recorrencia_intervalo: 1 as number | null,
  recorrencia_fim: null as Date | null,
  recorrencia_total: null as number | null,
  alertas: [] as IEventoAlerta[],
};

// -------------------------------------------
// SELETOR HIERÁRQUICO — LOCAL DO EVENTO (apenas Congregação)
// -------------------------------------------
const SeletorLocalizacao: React.FC<{
  localizacoes: ILocalizacao[];
  localizacaoId: string | null;
  onChange: (id: string | null) => void;
}> = ({ localizacoes, localizacaoId, onChange }) => {
  const [regionalId, setRegionalId] = useState<string | null>(null);
  const [administracaoId, setAdministracaoId] = useState<string | null>(null);
  const [setorId, setSetorId] = useState<string | null>(null);

  const regionais = useMemo(
    () => localizacoes.filter((l) => l.tipo === "Regional").sort((a, b) => a.nome.localeCompare(b.nome)),
    [localizacoes]
  );
  const administracoes = useMemo(
    () => localizacoes.filter((l) => l.tipo === "Administração" && l.parent_id === regionalId).sort((a, b) => a.nome.localeCompare(b.nome)),
    [localizacoes, regionalId]
  );
  const setores = useMemo(
    () => localizacoes.filter((l) => l.tipo === "Setor" && l.parent_id === administracaoId).sort((a, b) => a.nome.localeCompare(b.nome)),
    [localizacoes, administracaoId]
  );
  const congregacoes = useMemo(
    () => localizacoes.filter((l) => l.tipo === "Congregação" && l.parent_id === setorId).sort((a, b) => a.nome.localeCompare(b.nome)),
    [localizacoes, setorId]
  );

  useEffect(() => {
    if (localizacaoId) {
      const congregacao = localizacoes.find((l) => l.id === localizacaoId);
      if (congregacao) {
        const setor = localizacoes.find((l) => l.id === congregacao.parent_id);
        if (setor) {
          const adm = localizacoes.find((l) => l.id === setor.parent_id);
          if (adm) {
            const reg = localizacoes.find((l) => l.id === adm.parent_id);
            setRegionalId(reg?.id ?? null);
            setAdministracaoId(adm.id);
            setSetorId(setor.id);
          }
        }
      }
    }
  }, [localizacaoId]);

  return (
    <View style={seletorStyles.container}>
      <Text style={seletorStyles.nivelLabel}>Regional</Text>
      <View style={seletorStyles.pickerBox}>
        <Picker selectedValue={regionalId ?? ""} onValueChange={(id) => { setRegionalId(id || null); setAdministracaoId(null); setSetorId(null); onChange(null); }} style={{ color: "#333" }}>
          <Picker.Item label="Selecione a Regional..." value="" color="#999" />
          {regionais.map((r) => <Picker.Item key={r.id} label={r.nome} value={r.id} />)}
        </Picker>
      </View>

      {regionalId && (
        <>
          <Text style={seletorStyles.nivelLabel}>Administração</Text>
          <View style={seletorStyles.pickerBox}>
            <Picker selectedValue={administracaoId ?? ""} onValueChange={(id) => { setAdministracaoId(id || null); setSetorId(null); onChange(null); }} style={{ color: "#333" }}>
              <Picker.Item label="Selecione a Administração..." value="" color="#999" />
              {administracoes.map((a) => <Picker.Item key={a.id} label={a.nome} value={a.id} />)}
            </Picker>
          </View>
        </>
      )}

      {administracaoId && (
        <>
          <Text style={seletorStyles.nivelLabel}>Setor</Text>
          <View style={seletorStyles.pickerBox}>
            <Picker selectedValue={setorId ?? ""} onValueChange={(id) => { setSetorId(id || null); onChange(null); }} style={{ color: "#333" }}>
              <Picker.Item label="Selecione o Setor..." value="" color="#999" />
              {setores.map((s) => <Picker.Item key={s.id} label={s.nome} value={s.id} />)}
            </Picker>
          </View>
        </>
      )}

      {setorId && (
        <>
          <Text style={seletorStyles.nivelLabel}>Congregação</Text>
          <View style={[seletorStyles.pickerBox, seletorStyles.pickerBoxDestaque]}>
            <Picker selectedValue={localizacaoId ?? ""} onValueChange={(id) => onChange(id || null)} style={{ color: "#333" }}>
              <Picker.Item label="Selecione a Congregação..." value="" color="#999" />
              {congregacoes.map((c) => <Picker.Item key={c.id} label={c.nome} value={c.id} />)}
            </Picker>
          </View>
        </>
      )}

      {localizacaoId && (
        <View style={seletorStyles.confirmBox}>
          <Text style={seletorStyles.confirmText}>
            📍 {localizacoes.find((l) => l.id === localizacaoId)?.nome}
          </Text>
        </View>
      )}
    </View>
  );
};

// -------------------------------------------
// SELETOR DE ABRANGÊNCIA — qualquer nível hierárquico
// -------------------------------------------
const SeletorAbrangencia: React.FC<{
  localizacoes: ILocalizacao[];
  abrangenciaId: string | null;
  onChange: (id: string | null) => void;
}> = ({ localizacoes, abrangenciaId, onChange }) => {
  const ORDEM_TIPO = ["Regional", "Administração", "Setor", "Congregação"];

  const localizacoesOrdenadas = useMemo(
    () =>
      [...localizacoes].sort((a, b) => {
        const diff = ORDEM_TIPO.indexOf(a.tipo) - ORDEM_TIPO.indexOf(b.tipo);
        return diff !== 0 ? diff : a.nome.localeCompare(b.nome);
      }),
    [localizacoes]
  );

  const selecionada = localizacoes.find((l) => l.id === abrangenciaId);

  return (
    <View>
      <View style={seletorStyles.pickerBox}>
        <Picker
          selectedValue={abrangenciaId ?? ""}
          onValueChange={(v) => onChange(v || null)}
          style={{ color: "#333" }}
        >
          <Picker.Item label="Selecione a abrangência..." value="" color="#999" />
          {ORDEM_TIPO.map((tipo) => {
            const itens = localizacoesOrdenadas.filter((l) => l.tipo === tipo);
            if (itens.length === 0) return null;
            return [
              <Picker.Item key={`header-${tipo}`} label={`── ${tipo} ──`} value={`_${tipo}`} enabled={false} color="#AAA" />,
              ...itens.map((l) => (
                <Picker.Item key={l.id} label={l.nome} value={l.id} />
              )),
            ];
          })}
        </Picker>
      </View>
      {selecionada && (
        <View style={[seletorStyles.confirmBox, { backgroundColor: "#FFF3E0" }]}>
          <Text style={[seletorStyles.confirmText, { color: "#E65100" }]}>
            📣 {selecionada.tipo}: {selecionada.nome}
          </Text>
        </View>
      )}
    </View>
  );
};

const seletorStyles = StyleSheet.create({
  container: { gap: 4 },
  nivelLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 2,
  },
  pickerBox: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#DCE0E6",
    borderRadius: 8,
    overflow: "hidden",
  },
  pickerBoxDestaque: {
    borderColor: "#0A3D62",
    borderWidth: 2,
  },
  confirmBox: {
    marginTop: 8,
    backgroundColor: "#E8F4F8",
    borderRadius: 8,
    padding: 10,
  },
  confirmText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0A3D62",
  },
});

// -------------------------------------------
// MODAL PRINCIPAL
// -------------------------------------------
export const EventoFormModal: React.FC<EventoFormModalProps> = ({
  isVisible,
  onClose,
  eventoToEdit,
  eventoUseCases,
  cargosDisponiveis,
  localizacoesDisponiveis,
}) => {
  const { createEvento, updateEvento, state } = useEventosViewModel(eventoUseCases);
  const modeloUseCases = useEventoModeloUseCases();

  const [form, setForm] = useState(initialFormState);
  const [modelos, setModelos] = useState<IEventoModelo[]>([]);
  const [isLoadingModelos, setIsLoadingModelos] = useState(false);

  const [showDateInicio, setShowDateInicio] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDateFim, setShowDateFim] = useState(false);
  const [showDateRecorrenciaFim, setShowDateRecorrenciaFim] = useState(false);
  const [showTimeFim, setShowTimeFim] = useState(false);
  const [eventosVinculados, setEventosVinculados] = useState<Array<{
    titulo: string;
    horario: Date;
    dias_antes: number;
    cargos_visiveis: string[];
  }>>([]);
  const [showVinculadoTimePicker, setShowVinculadoTimePicker] = useState(false);
  const [editingVinculadoIndex, setEditingVinculadoIndex] = useState<number | null>(null);

  const OPCOES_ALERTA = [
    { label: "1 hora antes", value: 1 },
    { label: "3 horas antes", value: 3 },
    { label: "6 horas antes", value: 6 },
    { label: "12 horas antes", value: 12 },
    { label: "1 dia antes", value: 24 },
    { label: "2 dias antes", value: 48 },
    { label: "3 dias antes", value: 72 },
  ];

  useEffect(() => {
    if (isVisible) {
      setIsLoadingModelos(true);
      modeloUseCases.getAll.execute(true)
        .then(setModelos)
        .catch(() => Alert.alert("Erro", "Falha ao carregar modelos de eventos."))
        .finally(() => setIsLoadingModelos(false));
    }
  }, [isVisible]);

  const isEditing = eventoToEdit !== null;

  useEffect(() => {
    if (eventoToEdit) {
      setForm({
        modelo_id: eventoToEdit.modelo_id ?? null,
        descricao: eventoToEdit.descricao || "",
        localizacao_id: eventoToEdit.localizacao_id,
        abrangencia_id: eventoToEdit.abrangencia_id ?? null,
        responsavel_id: eventoToEdit.responsavel_id,
        cargos_visiveis: eventoToEdit.cargos_visiveis,
        rsvp_habilitado: eventoToEdit.rsvp_habilitado,
        data_inicio: new Date(eventoToEdit.data_inicio),
        data_fim: eventoToEdit.data_fim ? new Date(eventoToEdit.data_fim) : null,
        recorrente: eventoToEdit.recorrente,
        recorrencia_tipo: eventoToEdit.recorrencia_tipo,
        recorrencia_dia_semana: eventoToEdit.recorrencia_dia_semana,
        recorrencia_semana_do_mes: eventoToEdit.recorrencia_semana_do_mes,
        evento_referencia_id: eventoToEdit.evento_referencia_id,
        dias_antes_referencia: eventoToEdit.dias_antes_referencia,
        recorrencia_intervalo: eventoToEdit.recorrencia_intervalo ?? 1,
        recorrencia_fim: eventoToEdit.recorrencia_fim ? new Date(eventoToEdit.recorrencia_fim) : null,
        recorrencia_total: eventoToEdit.recorrencia_total,
        alertas: eventoToEdit.alertas ?? [],
      });
    } else {
      setForm(initialFormState);
      setEventosVinculados([]);
    }
  }, [eventoToEdit, isVisible]);

  const modeloSelecionado = modelos.find((m) => m.id === form.modelo_id) ?? null;
  const modelosEventos = modelos.filter((m) => m.categoria === "evento");
  const modelosReunioes = modelos.filter((m) => m.categoria === "reuniao_fixa");

  const toggleCargo = (cargoId: string) => {
    setForm((prev) => ({
      ...prev,
      cargos_visiveis: prev.cargos_visiveis.includes(cargoId)
        ? prev.cargos_visiveis.filter((id) => id !== cargoId)
        : [...prev.cargos_visiveis, cargoId],
    }));
  };

  const addAlerta = () => setForm((prev) => ({ ...prev, alertas: [...prev.alertas, { horas_antes: 24 }] }));
  const removeAlerta = (index: number) => setForm((prev) => ({ ...prev, alertas: prev.alertas.filter((_, i) => i !== index) }));
  const updateAlerta = (index: number, horas_antes: number) =>
    setForm((prev) => ({ ...prev, alertas: prev.alertas.map((a, i) => (i === index ? { ...a, horas_antes } : a)) }));

  const addEventoVinculado = () =>
    setEventosVinculados((prev) => [
      ...prev,
      { titulo: "", horario: new Date(form.data_inicio), dias_antes: 0, cargos_visiveis: [...form.cargos_visiveis] },
    ]);
  const removeEventoVinculado = (index: number) =>
    setEventosVinculados((prev) => prev.filter((_, i) => i !== index));
  const updateEventoVinculado = (index: number, field: string, value: any) =>
    setEventosVinculados((prev) => prev.map((ev, i) => (i === index ? { ...ev, [field]: value } : ev)));

  const handleSave = async () => {
    if (!form.modelo_id || !modeloSelecionado) {
      Alert.alert("Atenção", "Selecione o modelo do evento.");
      return;
    }
    if (!form.localizacao_id) {
      Alert.alert("Atenção", "Selecione a congregação onde ocorrerá o evento.");
      return;
    }
    if (!form.abrangencia_id) {
      Alert.alert("Atenção", "Selecione a abrangência do evento.");
      return;
    }
    if (form.cargos_visiveis.length === 0) {
      Alert.alert("Atenção", "Selecione ao menos um cargo que pode visualizar.");
      return;
    }

    try {
      const params = {
        titulo: modeloSelecionado.nome,
        tipo: modeloSelecionado.categoria === "evento"
          ? "Evento Especial" as const
          : "Reunião de Congregação" as const,
        modelo_id: form.modelo_id,
        descricao: form.descricao.trim() || null,
        localizacao_id: form.localizacao_id,
        abrangencia_id: form.abrangencia_id,
        responsavel_id: form.responsavel_id,
        cargos_visiveis: form.cargos_visiveis,
        rsvp_habilitado: form.rsvp_habilitado,
        data_inicio: form.data_inicio.toISOString(),
        data_fim: form.data_fim ? form.data_fim.toISOString() : null,
        recorrente: form.recorrente,
        recorrencia_tipo: form.recorrente ? form.recorrencia_tipo : null,
        recorrencia_dia_semana: form.recorrente ? form.recorrencia_dia_semana : null,
        recorrencia_semana_do_mes: form.recorrente ? form.recorrencia_semana_do_mes : null,
        evento_referencia_id: null,
        dias_antes_referencia: null,
        recorrencia_intervalo: form.recorrente ? form.recorrencia_intervalo : null,
        recorrencia_fim: form.recorrente && form.recorrencia_fim
          ? form.recorrencia_fim.toISOString().split("T")[0]
          : null,
        recorrencia_total: form.recorrente ? form.recorrencia_total : null,
        alertas: form.alertas,
      };

      let result;
      if (isEditing && eventoToEdit) {
        result = await updateEvento({ ...params, id: eventoToEdit.id } as UpdateEventoParams);
      } else {
        result = await createEvento(params as CreateEventoParams);
      }

      if (result) {
        for (const vinculado of eventosVinculados) {
          if (!vinculado.titulo.trim()) continue;
          await createEvento({
            titulo: vinculado.titulo,
            tipo: params.tipo,
            modelo_id: form.modelo_id!,
            descricao: null,
            localizacao_id: form.localizacao_id!,
            abrangencia_id: form.abrangencia_id,
            responsavel_id: form.responsavel_id,
            cargos_visiveis: vinculado.cargos_visiveis,
            rsvp_habilitado: false,
            data_inicio: (() => {
              const dataBase = new Date(form.data_inicio);
              dataBase.setDate(dataBase.getDate() - vinculado.dias_antes);
              dataBase.setHours(vinculado.horario.getHours(), vinculado.horario.getMinutes(), 0, 0);
              return dataBase.toISOString();
            })(),
            data_fim: null,
            recorrente: true,
            recorrencia_tipo: form.recorrencia_tipo,
            recorrencia_dia_semana: form.recorrencia_dia_semana,
            recorrencia_semana_do_mes: form.recorrencia_semana_do_mes,
            recorrencia_intervalo: form.recorrencia_intervalo,
            recorrencia_fim: form.recorrencia_fim
              ? form.recorrencia_fim.toISOString().split("T")[0]
              : null,
            recorrencia_total: form.recorrencia_total,
            evento_referencia_id: result.id,
            dias_antes_referencia: vinculado.dias_antes,
          });
        }
        onClose();
      } else {
        Alert.alert("Erro", state.error ?? "Falha ao salvar evento.");
      }
    } catch (e: any) {
      Alert.alert("Erro", e?.message ?? "Falha ao salvar evento.");
    }
  };

  const formatDate = (date: Date): string =>
    date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const formatTime = (date: Date): string =>
    date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{isEditing ? "Editar Evento" : "Criar Evento"}</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.headerClose}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* MODELO */}
        <Text style={styles.sectionTitle}>Selecione a Reunião ou Evento *</Text>
        {isLoadingModelos ? (
          <ActivityIndicator color="#17A2B8" style={{ marginVertical: 10 }} />
        ) : (
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={form.modelo_id ?? ""}
              onValueChange={(v) => setForm((p) => ({ ...p, modelo_id: v || null }))}
              mode="dropdown"
              style={{ color: "#333" }}
            >
              <Picker.Item label="Selecione o modelo..." value="" color="#999" />
              {modelosEventos.length > 0 && <Picker.Item label="── Eventos ──" value="_eventos" enabled={false} color="#AAA" />}
              {modelosEventos.map((m) => <Picker.Item key={m.id} label={m.nome} value={m.id} />)}
              {modelosReunioes.length > 0 && <Picker.Item label="── Reuniões ──" value="_reunioes" enabled={false} color="#AAA" />}
              {modelosReunioes.map((m) => <Picker.Item key={m.id} label={m.nome} value={m.id} />)}
            </Picker>
          </View>
        )}

        {/* DESCRIÇÃO */}
        <Text style={styles.label}>Descrição (opcional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.descricao}
          onChangeText={(v) => setForm((p) => ({ ...p, descricao: v }))}
          placeholder="Detalhes adicionais sobre a reunião ou evento"
          multiline
          numberOfLines={3}
        />

        {/* LOCAL DO EVENTO */}
        <Text style={styles.sectionTitle}>Local do Evento *</Text>
        <Text style={styles.infoText}>Selecione a congregação onde o evento ocorrerá.</Text>
        <SeletorLocalizacao
          localizacoes={localizacoesDisponiveis}
          localizacaoId={form.localizacao_id}
          onChange={(id) => setForm((p) => ({ ...p, localizacao_id: id }))}
        />

        {/* ABRANGÊNCIA */}
        <Text style={styles.sectionTitle}>Abrangência *</Text>
        <Text style={styles.infoText}>
          Quem poderá ver este evento? Selecione o nível hierárquico: uma congregação específica, um setor, uma administração ou toda a regional.
        </Text>
        <SeletorAbrangencia
          localizacoes={localizacoesDisponiveis}
          abrangenciaId={form.abrangencia_id}
          onChange={(id) => setForm((p) => ({ ...p, abrangencia_id: id }))}
        />

        {/* DATA INÍCIO */}
        <Text style={styles.sectionTitle}>Data e Hora *</Text>
        <Text style={styles.label}>Início</Text>
        <View style={styles.dateRow}>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowDateInicio(true)}>
            <Text style={styles.dateButtonText}>📅 {formatDate(form.data_inicio)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowTimePicker(true)}>
            <Text style={styles.dateButtonText}>🕐 {formatTime(form.data_inicio)}</Text>
          </TouchableOpacity>
        </View>

        {showDateInicio && (
          <DateTimePicker value={form.data_inicio} mode="date" display="default"
            onChange={(_, date) => { setShowDateInicio(false); if (date) { const u = new Date(form.data_inicio); u.setFullYear(date.getFullYear(), date.getMonth(), date.getDate()); setForm((p) => ({ ...p, data_inicio: u })); } }} />
        )}
        {showTimePicker && (
          <DateTimePicker value={form.data_inicio} mode="time" display="default"
            onChange={(_, date) => { setShowTimePicker(false); if (date) { const u = new Date(form.data_inicio); u.setHours(date.getHours(), date.getMinutes()); setForm((p) => ({ ...p, data_inicio: u })); } }} />
        )}

        {/* DATA FIM */}
        <View style={styles.switchRowFim}>
          <Text style={styles.label}>Definir horário de término</Text>
          <Switch value={form.data_fim !== null}
            onValueChange={(v) => setForm((p) => ({ ...p, data_fim: v ? new Date(p.data_inicio) : null }))}
            trackColor={{ false: "#767577", true: "#17A2B8" }} thumbColor="#fff" />
        </View>
        {form.data_fim !== null && (
          <View style={styles.dateRow}>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowDateFim(true)}>
              <Text style={styles.dateButtonText}>📅 {formatDate(form.data_fim)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowTimeFim(true)}>
              <Text style={styles.dateButtonText}>🕐 {formatTime(form.data_fim)}</Text>
            </TouchableOpacity>
          </View>
        )}
        {showDateFim && (
          <DateTimePicker value={form.data_fim || new Date()} mode="date" display="default"
            onChange={(_, date) => { setShowDateFim(false); if (date) { const u = new Date(form.data_fim!); u.setFullYear(date.getFullYear(), date.getMonth(), date.getDate()); setForm((p) => ({ ...p, data_fim: u })); } }} />
        )}
        {showTimeFim && (
          <DateTimePicker value={form.data_fim || new Date()} mode="time" display="default"
            onChange={(_, date) => { setShowTimeFim(false); if (date) { const u = new Date(form.data_fim!); u.setHours(date.getHours(), date.getMinutes()); setForm((p) => ({ ...p, data_fim: u })); } }} />
        )}

        {/* CARGOS VISÍVEIS */}
        <Text style={styles.sectionTitle}>Cargos que podem visualizar *</Text>
        <View style={styles.cargosContainer}>
          {cargosDisponiveis.map((cargo) => {
            const selected = form.cargos_visiveis.includes(cargo.id);
            return (
              <TouchableOpacity key={cargo.id}
                style={[styles.cargoChip, selected && styles.cargoChipSelected]}
                onPress={() => toggleCargo(cargo.id)}>
                <Text style={[styles.cargoChipText, selected && styles.cargoChipTextSelected]}>{cargo.nome}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* RECORRÊNCIA */}
        <View style={styles.switchRow}>
          <Text style={styles.label}>Evento Recorrente</Text>
          <Switch value={form.recorrente}
            onValueChange={(v) => setForm((p) => ({ ...p, recorrente: v }))}
            trackColor={{ false: "#767577", true: "#0A3D62" }} />
        </View>

        {form.recorrente && (
          <View style={styles.recorrenciaBox}>
            <Text style={styles.label}>Frequência</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={form.recorrencia_tipo ?? ""}
                onValueChange={(v) => setForm((p) => ({ ...p, recorrencia_tipo: (v || null) as RecorrenciaTipo | null }))}
                style={{ color: "#333" }}>
                <Picker.Item label="Selecione..." value="" color="#999" />
                <Picker.Item label="Semanal (toda semana)" value="semanal" />
                <Picker.Item label="Mensal (todo mês)" value="mensal" />
                <Picker.Item label="Bimestral (a cada 2 meses)" value="bimestral" />
                <Picker.Item label="Trimestral (a cada 3 meses)" value="trimestral" />
                <Picker.Item label="Personalizado (a cada X meses)" value="personalizado" />
              </Picker>
            </View>

            {form.recorrencia_tipo === "personalizado" && (
              <>
                <Text style={styles.label}>Repetir a cada quantos meses?</Text>
                <TextInput style={styles.input}
                  value={form.recorrencia_intervalo ? String(form.recorrencia_intervalo) : ""}
                  onChangeText={(v) => setForm((p) => ({ ...p, recorrencia_intervalo: v ? parseInt(v) : null }))}
                  placeholder="Ex: 4" keyboardType="numeric" />
              </>
            )}

            {form.recorrencia_tipo === "semanal" && (
              <>
                <Text style={styles.label}>Dia da semana</Text>
                <View style={styles.pickerContainer}>
                  <Picker selectedValue={form.recorrencia_dia_semana ?? ""}
                    onValueChange={(v) => setForm((p) => ({ ...p, recorrencia_dia_semana: v === "" ? null : Number(v) }))}
                    style={{ color: "#333" }}>
                    <Picker.Item label="Selecione..." value="" color="#999" />
                    {DIAS_SEMANA.map((dia) => <Picker.Item key={dia.value} label={dia.label} value={dia.value} />)}
                  </Picker>
                </View>
              </>
            )}

            {form.recorrencia_tipo && form.recorrencia_tipo !== "semanal" && (
              <>
                <Text style={styles.label}>Qual semana do mês?</Text>
                <View style={styles.pickerContainer}>
                  <Picker selectedValue={form.recorrencia_semana_do_mes ?? ""}
                    onValueChange={(v) => setForm((p) => ({ ...p, recorrencia_semana_do_mes: v === "" ? null : Number(v) }))}
                    style={{ color: "#333" }}>
                    <Picker.Item label="Selecione..." value="" color="#999" />
                    {SEMANAS_DO_MES.map((s) => <Picker.Item key={s.value} label={s.label} value={s.value} />)}
                  </Picker>
                </View>
                <Text style={styles.label}>Dia da semana</Text>
                <View style={styles.pickerContainer}>
                  <Picker selectedValue={form.recorrencia_dia_semana ?? ""}
                    onValueChange={(v) => setForm((p) => ({ ...p, recorrencia_dia_semana: v === "" ? null : Number(v) }))}
                    style={{ color: "#333" }}>
                    <Picker.Item label="Selecione..." value="" color="#999" />
                    {DIAS_SEMANA.map((dia) => <Picker.Item key={dia.value} label={dia.label} value={dia.value} />)}
                  </Picker>
                </View>
              </>
            )}

            <Text style={styles.label}>Repetir até (data)</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowDateRecorrenciaFim(true)}>
              <Text style={styles.dateButtonText}>
                📅 {form.recorrencia_fim ? formatDate(form.recorrencia_fim) : "Não definida"}
              </Text>
            </TouchableOpacity>
            {form.recorrencia_fim && (
              <TouchableOpacity onPress={() => setForm((p) => ({ ...p, recorrencia_fim: null }))}>
                <Text style={styles.clearText}>Remover data</Text>
              </TouchableOpacity>
            )}
            {showDateRecorrenciaFim && (
              <DateTimePicker value={form.recorrencia_fim || new Date()} mode="date" display="default"
                onChange={(_, date) => { setShowDateRecorrenciaFim(false); if (date) setForm((p) => ({ ...p, recorrencia_fim: date })); }} />
            )}
            {showVinculadoTimePicker && editingVinculadoIndex !== null && (
              <DateTimePicker value={eventosVinculados[editingVinculadoIndex]?.horario || new Date()} mode="time" display="default"
                onChange={(_, date) => { setShowVinculadoTimePicker(false); if (date && editingVinculadoIndex !== null) updateEventoVinculado(editingVinculadoIndex, "horario", date); setEditingVinculadoIndex(null); }} />
            )}

            <Text style={styles.label}>Ou repetir quantas vezes</Text>
            <TextInput style={styles.input}
              value={form.recorrencia_total ? String(form.recorrencia_total) : ""}
              onChangeText={(v) => setForm((p) => ({ ...p, recorrencia_total: v ? parseInt(v) : null }))}
              placeholder="Ex: 12" keyboardType="numeric" />
          </View>
        )}

        {/* EVENTOS VINCULADOS */}
        {form.recorrente && (
          <View>
            <Text style={styles.sectionTitle}>Eventos Vinculados</Text>
            <Text style={styles.infoText}>Eventos que ocorrem antes deste (ex: véspera, antevéspera)</Text>
            {eventosVinculados.map((vinculado, index) => (
              <View key={index} style={styles.vinculadoBox}>
                <View style={styles.vinculadoHeader}>
                  <Text style={styles.vinculadoTitle}>Evento {index + 1}</Text>
                  <TouchableOpacity onPress={() => removeEventoVinculado(index)}>
                    <Text style={styles.removeText}>✕ Remover</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.label}>Título:</Text>
                <TextInput style={styles.input} value={vinculado.titulo}
                  onChangeText={(v) => updateEventoVinculado(index, "titulo", v)}
                  placeholder="Ex: Reunião de véspera" />
                <Text style={styles.label}>Dias antes do evento principal:</Text>
                <TextInput style={styles.input}
                  value={vinculado.dias_antes === 0 ? "" : String(vinculado.dias_antes)}
                  onChangeText={(v) => { const num = v.replace(/[^0-9]/g, ""); updateEventoVinculado(index, "dias_antes", num === "" ? 0 : parseInt(num)); }}
                  keyboardType="numeric" placeholder="Ex: 1 (véspera)" />
                <Text style={styles.label}>Horário:</Text>
                <TouchableOpacity style={styles.dateButton} onPress={() => { setEditingVinculadoIndex(index); setShowVinculadoTimePicker(true); }}>
                  <Text style={styles.dateButtonText}>
                    🕐 {vinculado.horario.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.label}>Cargos que podem visualizar:</Text>
                <View style={styles.cargosContainer}>
                  {cargosDisponiveis.map((cargo) => {
                    const selected = vinculado.cargos_visiveis.includes(cargo.id);
                    return (
                      <TouchableOpacity key={cargo.id}
                        style={[styles.cargoChip, selected && styles.cargoChipSelected]}
                        onPress={() => { const novos = selected ? vinculado.cargos_visiveis.filter((id) => id !== cargo.id) : [...vinculado.cargos_visiveis, cargo.id]; updateEventoVinculado(index, "cargos_visiveis", novos); }}>
                        <Text style={[styles.cargoChipText, selected && styles.cargoChipTextSelected]}>{cargo.nome}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.addVinculadoButton} onPress={addEventoVinculado}>
              <Text style={styles.addVinculadoButtonText}>+ Adicionar Evento Vinculado</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ALERTAS PUSH */}
        <Text style={styles.sectionTitle}>Alertas de Notificação Push</Text>
        <Text style={styles.infoText}>Envie notificações automáticas antes do evento para os cargos visíveis.</Text>
        {form.alertas.map((alerta, index) => (
          <View key={index} style={styles.vinculadoBox}>
            <View style={styles.vinculadoHeader}>
              <Text style={styles.vinculadoTitle}>Alerta {index + 1}</Text>
              <TouchableOpacity onPress={() => removeAlerta(index)}>
                <Text style={styles.removeText}>✕ Remover</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.label}>Quando enviar:</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={alerta.horas_antes} onValueChange={(v) => updateAlerta(index, Number(v))} style={{ color: "#333" }}>
                {OPCOES_ALERTA.map((op) => <Picker.Item key={op.value} label={op.label} value={op.value} />)}
              </Picker>
            </View>
          </View>
        ))}
        <TouchableOpacity style={styles.addVinculadoButton} onPress={addAlerta}>
          <Text style={styles.addVinculadoButtonText}>+ Adicionar Alerta</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* FOOTER */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, state.isSubmitting && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={state.isSubmitting}>
          {state.isSubmitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveButtonText}>{isEditing ? "Salvar Alterações" : "Criar Evento"}</Text>}
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 15, borderBottomWidth: 1, borderBottomColor: "#DCE0E6", backgroundColor: "#0A3D62" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  headerClose: { fontSize: 22, color: "#fff", padding: 5 },
  content: { padding: 20, backgroundColor: "#F0F4F8", paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#0A3D62", marginTop: 20, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: "#DCE0E6", paddingBottom: 5 },
  label: { fontSize: 14, color: "#333", marginBottom: 5, marginTop: 12, fontWeight: "500" },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#DCE0E6", borderRadius: 8, padding: 12, fontSize: 15, color: "#333" },
  textArea: { height: 80, textAlignVertical: "top" },
  pickerContainer: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#DCE0E6", borderRadius: 8, overflow: "hidden" },
  dateRow: { flexDirection: "row", gap: 10 },
  dateButton: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#DCE0E6", borderRadius: 8, padding: 12, marginTop: 5, flex: 1 },
  dateButtonText: { fontSize: 14, color: "#333", textAlign: "center" },
  clearText: { color: "#DC3545", fontSize: 12, marginTop: 4, textAlign: "right" },
  cargosContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cargoChip: { borderWidth: 1, borderColor: "#0A3D62", borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14, backgroundColor: "#fff" },
  cargoChipSelected: { backgroundColor: "#0A3D62" },
  cargoChipText: { color: "#0A3D62", fontSize: 13 },
  cargoChipTextSelected: { color: "#fff" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 15, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#DCE0E6" },
  recorrenciaBox: { backgroundColor: "#E8F4F8", borderRadius: 8, padding: 15, marginTop: 10 },
  footer: { flexDirection: "row", padding: 15, borderTopWidth: 1, borderTopColor: "#DCE0E6", backgroundColor: "#fff", gap: 10 },
  saveButton: { flex: 1, backgroundColor: "#0A3D62", borderRadius: 8, padding: 15, alignItems: "center" },
  saveButtonDisabled: { backgroundColor: "#A0B4C8" },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  cancelButton: { flex: 1, backgroundColor: "#6C757D", borderRadius: 8, padding: 15, alignItems: "center" },
  cancelButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  infoText: { fontSize: 12, color: "#6C757D", marginBottom: 10 },
  vinculadoBox: { backgroundColor: "#fff", borderRadius: 8, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: "#DCE0E6" },
  vinculadoHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 5 },
  vinculadoTitle: { fontSize: 15, fontWeight: "700", color: "#0A3D62" },
  removeText: { color: "#DC3545", fontSize: 13 },
  addVinculadoButton: { borderWidth: 1, borderColor: "#17A2B8", borderRadius: 8, borderStyle: "dashed", padding: 12, alignItems: "center", marginTop: 5 },
  addVinculadoButtonText: { color: "#17A2B8", fontSize: 14, fontWeight: "600" },
  switchRowFim: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, marginBottom: 6 },
});
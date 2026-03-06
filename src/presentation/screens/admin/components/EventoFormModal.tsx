// src/presentation/screens/admin/components/EventoFormModal.tsx

import DateTimePicker from "@react-native-community/datetimepicker";
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
import { Picker } from "@react-native-picker/picker";
import { ICargo } from "../../../../domain/models/ICargo";
import { ILocalizacao } from "../../../../domain/models/ILocalizacao";
import {
  DIAS_SEMANA,
  EVENTO_TIPOS_LISTA,
  EventoTipo,
  IEvento,
  IEventoAlerta,
  RECORRENCIA_TIPOS_LISTA,
  RecorrenciaTipo,
  SEMANAS_DO_MES,
} from "../../../../domain/models/IEvento";
import { EventoUseCases, useEventosViewModel } from "../../../view_models/EventosViewModel";
import { CreateEventoParams, UpdateEventoParams } from "../../../../domain/use_cases/eventos/types";

interface EventoFormModalProps {
  isVisible: boolean;
  onClose: () => void;
  eventoToEdit: IEvento | null;
  eventoUseCases: EventoUseCases;
  cargosDisponiveis: ICargo[];
  localizacoesDisponiveis: ILocalizacao[];
}

const initialFormState = {
  titulo: "",
  tipo: "Reunião de Congregação" as EventoTipo,
  descricao: "",
  localizacao_id: null as string | null,
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

export const EventoFormModal: React.FC<EventoFormModalProps> = ({
  isVisible,
  onClose,
  eventoToEdit,
  eventoUseCases,
  cargosDisponiveis,
  localizacoesDisponiveis,
}) => {
  const { createEvento, updateEvento, state } = useEventosViewModel(eventoUseCases);

  const [form, setForm] = useState(initialFormState);
  const [showDateInicio, setShowDateInicio] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDateFim, setShowDateFim] = useState(false);
  const [showDateRecorrenciaFim, setShowDateRecorrenciaFim] = useState(false);
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

  const addAlerta = () => {
    // Adiciona com valor padrão de 24h (1 dia antes)
    setForm((prev) => ({
      ...prev,
      alertas: [...prev.alertas, { horas_antes: 24 }],
    }));
  };

  const removeAlerta = (index: number) => {
    setForm((prev) => ({
      ...prev,
      alertas: prev.alertas.filter((_, i) => i !== index),
    }));
  };

  const updateAlerta = (index: number, horas_antes: number) => {
    setForm((prev) => ({
      ...prev,
      alertas: prev.alertas.map((a, i) =>
        i === index ? { ...a, horas_antes } : a
      ),
    }));
  };

  const isEditing = eventoToEdit !== null;

  useEffect(() => {
    if (eventoToEdit) {
      setForm({
        titulo: eventoToEdit.titulo,
        tipo: eventoToEdit.tipo,
        descricao: eventoToEdit.descricao || "",
        localizacao_id: eventoToEdit.localizacao_id,
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

  const toggleCargo = (cargoId: string) => {
    setForm((prev) => ({
      ...prev,
      cargos_visiveis: prev.cargos_visiveis.includes(cargoId)
        ? prev.cargos_visiveis.filter((id) => id !== cargoId)
        : [...prev.cargos_visiveis, cargoId],
    }));
  };

  const addEventoVinculado = () => {
    setEventosVinculados((prev) => [
      ...prev,
      {
        titulo: "",
        horario: new Date(form.data_inicio),
        dias_antes: 0,
        cargos_visiveis: [...form.cargos_visiveis],
      },
    ]);
  };

  const removeEventoVinculado = (index: number) => {
    setEventosVinculados((prev) => prev.filter((_, i) => i !== index));
  };

  const updateEventoVinculado = (index: number, field: string, value: any) => {
    setEventosVinculados((prev) =>
      prev.map((ev, i) => (i === index ? { ...ev, [field]: value } : ev))
    );
  };

  const handleSave = async () => {
    const params = {
      titulo: form.titulo,
      tipo: form.tipo,
      descricao: form.descricao.trim() || null,
      localizacao_id: form.localizacao_id,
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
      recorrencia_fim: form.recorrente && form.recorrencia_fim ? form.recorrencia_fim.toISOString().split("T")[0] : null,
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
      // Salva eventos vinculados
      for (const vinculado of eventosVinculados) {
        if (!vinculado.titulo.trim()) continue;
        await createEvento({
          titulo: vinculado.titulo,
          tipo: form.tipo,
          descricao: null,
          localizacao_id: form.localizacao_id,
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
          recorrencia_fim: form.recorrencia_fim ? form.recorrencia_fim.toISOString().split("T")[0] : null,
          recorrencia_total: form.recorrencia_total,
          evento_referencia_id: result.id,
          dias_antes_referencia: vinculado.dias_antes,
        });
      }
      onClose();
    } else if (state.error) {
      Alert.alert("Erro", state.error);
    }
  };

  const formatDate = (date: Date): string =>
    date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const formatTime = (date: Date): string =>
    date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isEditing ? "Editar Evento" : "Criar Evento"}
        </Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.headerClose}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* TÍTULO */}
        <Text style={styles.label}>Título *</Text>
        <TextInput
          style={styles.input}
          value={form.titulo}
          onChangeText={(v) => setForm((p) => ({ ...p, titulo: v }))}
          placeholder="Ex: Reunião Mensal"
        />

        {/* TIPO */}
        <Text style={styles.label}>Tipo *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={form.tipo}
            onValueChange={(v) => setForm((p) => ({ ...p, tipo: v as EventoTipo }))}
          >
            {EVENTO_TIPOS_LISTA.map((tipo) => (
              <Picker.Item key={tipo} label={tipo} value={tipo} />
            ))}
          </Picker>
        </View>

        {/* DESCRIÇÃO */}
        <Text style={styles.label}>Descrição</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.descricao}
          onChangeText={(v) => setForm((p) => ({ ...p, descricao: v }))}
          placeholder="Detalhes do evento (opcional)"
          multiline
          numberOfLines={3}
        />

        {/* LOCALIZAÇÃO */}
        <Text style={styles.label}>Localização *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={form.localizacao_id}
            onValueChange={(v) => setForm((p) => ({ ...p, localizacao_id: v }))}
          >
            <Picker.Item label="Selecione a localização..." value={null} color="#999" />
            {localizacoesDisponiveis.map((loc) => (
              <Picker.Item key={loc.id} label={`${loc.nome} (${loc.tipo})`} value={loc.id} />
            ))}
          </Picker>
        </View>

        {/* DATA INÍCIO */}
        <Text style={styles.label}>Data de Início *</Text>
        <View style={styles.dateRow}>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowDateInicio(true)}>
            <Text style={styles.dateButtonText}>📅 {formatDate(form.data_inicio)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowTimePicker(true)}>
            <Text style={styles.dateButtonText}>🕐 {formatTime(form.data_inicio)}</Text>
          </TouchableOpacity>
        </View>

        {showDateInicio && (
          <DateTimePicker
            value={form.data_inicio}
            mode="date"
            display="default"
            onChange={(_, date) => {
              setShowDateInicio(false);
              if (date) {
                const updated = new Date(form.data_inicio);
                updated.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                setForm((p) => ({ ...p, data_inicio: updated }));
              }
            }}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={form.data_inicio}
            mode="time"
            display="default"
            onChange={(_, date) => {
              setShowTimePicker(false);
              if (date) {
                const updated = new Date(form.data_inicio);
                updated.setHours(date.getHours(), date.getMinutes());
                setForm((p) => ({ ...p, data_inicio: updated }));
              }
            }}
          />
        )}

        {/* DATA FIM */}
        <Text style={styles.label}>Data de Fim (opcional)</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDateFim(true)}
        >
          <Text style={styles.dateButtonText}>
            📅 {form.data_fim ? formatDate(form.data_fim) : "Não definida"}
          </Text>
        </TouchableOpacity>
        {form.data_fim && (
          <TouchableOpacity onPress={() => setForm((p) => ({ ...p, data_fim: null }))}>
            <Text style={styles.clearText}>Remover data fim</Text>
          </TouchableOpacity>
        )}

        {showDateFim && (
          <DateTimePicker
            value={form.data_fim || new Date()}
            mode="date"
            display="default"
            onChange={(_, date) => {
              setShowDateFim(false);
              if (date) setForm((p) => ({ ...p, data_fim: date }));
            }}
          />
        )}

        {/* CARGOS VISÍVEIS */}
        <Text style={styles.sectionTitle}>Cargos que podem visualizar *</Text>
        <View style={styles.cargosContainer}>
          {cargosDisponiveis.map((cargo) => {
            const selected = form.cargos_visiveis.includes(cargo.id);
            return (
              <TouchableOpacity
                key={cargo.id}
                style={[styles.cargoChip, selected && styles.cargoChipSelected]}
                onPress={() => toggleCargo(cargo.id)}
              >
                <Text style={[styles.cargoChipText, selected && styles.cargoChipTextSelected]}>
                  {cargo.nome}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* RSVP */}
        <View style={styles.switchRow}>
          <Text style={styles.label}>Habilitar Confirmação de Presença (RSVP)</Text>
          <Switch
            value={form.rsvp_habilitado}
            onValueChange={(v) => setForm((p) => ({ ...p, rsvp_habilitado: v }))}
            trackColor={{ false: "#767577", true: "#0A3D62" }}
          />
        </View>

        {/* RECORRÊNCIA */}
        <View style={styles.switchRow}>
          <Text style={styles.label}>Evento Recorrente</Text>
          <Switch
            value={form.recorrente}
            onValueChange={(v) => setForm((p) => ({ ...p, recorrente: v }))}
            trackColor={{ false: "#767577", true: "#0A3D62" }}
          />
        </View>

        {form.recorrente && (
          <View style={styles.recorrenciaBox}>

            {/* Tipo de recorrência */}
            <Text style={styles.label}>Frequência</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={form.recorrencia_tipo}
                onValueChange={(v) => setForm((p) => ({ ...p, recorrencia_tipo: v }))}
              >
                <Picker.Item label="Selecione..." value={null} color="#999" />
                <Picker.Item label="Semanal (toda semana)" value="semanal" />
                <Picker.Item label="Mensal (todo mês)" value="mensal" />
                <Picker.Item label="Bimestral (a cada 2 meses)" value="bimestral" />
                <Picker.Item label="Trimestral (a cada 3 meses)" value="trimestral" />
                <Picker.Item label="Personalizado (a cada X meses)" value="personalizado" />
              </Picker>
            </View>

            {/* Intervalo personalizado */}
            {form.recorrencia_tipo === "personalizado" && (
              <View>
                <Text style={styles.label}>Repetir a cada quantos meses?</Text>
                <TextInput
                  style={styles.input}
                  value={form.recorrencia_intervalo ? String(form.recorrencia_intervalo) : ""}
                  onChangeText={(v) => setForm((p) => ({ ...p, recorrencia_intervalo: v ? parseInt(v) : null }))}
                  placeholder="Ex: 4"
                  keyboardType="numeric"
                />
              </View>
            )}

            {/* Dia da semana (para semanal) */}
            {form.recorrencia_tipo === "semanal" && (
              <View>
                <Text style={styles.label}>Dia da semana</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={form.recorrencia_dia_semana}
                    onValueChange={(v) => setForm((p) => ({ ...p, recorrencia_dia_semana: v }))}
                  >
                    <Picker.Item label="Selecione..." value={null} color="#999" />
                    {DIAS_SEMANA.map((dia) => (
                      <Picker.Item key={dia.value} label={dia.label} value={dia.value} />
                    ))}
                  </Picker>
                </View>
              </View>
            )}

            {/* Semana do mês + dia da semana (para mensal/bimestral/trimestral/personalizado) */}
            {form.recorrencia_tipo && form.recorrencia_tipo !== "semanal" && (
              <View>
                <Text style={styles.label}>Qual semana do mês?</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={form.recorrencia_semana_do_mes}
                    onValueChange={(v) => setForm((p) => ({ ...p, recorrencia_semana_do_mes: v }))}
                  >
                    <Picker.Item label="Selecione..." value={null} color="#999" />
                    {SEMANAS_DO_MES.map((s) => (
                      <Picker.Item key={s.value} label={s.label} value={s.value} />
                    ))}
                  </Picker>
                </View>

                <Text style={styles.label}>Dia da semana</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={form.recorrencia_dia_semana}
                    onValueChange={(v) => setForm((p) => ({ ...p, recorrencia_dia_semana: v }))}
                  >
                    <Picker.Item label="Selecione..." value={null} color="#999" />
                    {DIAS_SEMANA.map((dia) => (
                      <Picker.Item key={dia.value} label={dia.label} value={dia.value} />
                    ))}
                  </Picker>
                </View>
              </View>
            )}

            {/* Data fim da recorrência */}
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
              <DateTimePicker
                value={form.recorrencia_fim || new Date()}
                mode="date"
                display="default"
                onChange={(_, date) => {
                  setShowDateRecorrenciaFim(false);
                  if (date) setForm((p) => ({ ...p, recorrencia_fim: date }));
                }}
              />
            )}

            {showVinculadoTimePicker && editingVinculadoIndex !== null && (
              <DateTimePicker
                value={eventosVinculados[editingVinculadoIndex]?.horario || new Date()}
                mode="time"
                display="default"
                onChange={(_, date) => {
                  setShowVinculadoTimePicker(false);
                  if (date && editingVinculadoIndex !== null) {
                    updateEventoVinculado(editingVinculadoIndex, "horario", date);
                  }
                  setEditingVinculadoIndex(null);
                }}
              />
            )}

            {/* Ou número de repetições */}
            <Text style={styles.label}>Ou repetir quantas vezes</Text>
            <TextInput
              style={styles.input}
              value={form.recorrencia_total ? String(form.recorrencia_total) : ""}
              onChangeText={(v) => setForm((p) => ({ ...p, recorrencia_total: v ? parseInt(v) : null }))}
              placeholder="Ex: 12"
              keyboardType="numeric"
            />

          </View>
        )}

        {/* EVENTOS VINCULADOS */}
        {form.recorrente && (
          <View>
            <Text style={styles.sectionTitle}>Eventos Vinculados</Text>
            <Text style={styles.infoText}>
              Eventos que ocorrem antes deste (ex: véspera, antevéspera)
            </Text>

            {eventosVinculados.map((vinculado, index) => (
              <View key={index} style={styles.vinculadoBox}>
                <View style={styles.vinculadoHeader}>
                  <Text style={styles.vinculadoTitle}>Evento {index + 1}</Text>
                  <TouchableOpacity onPress={() => removeEventoVinculado(index)}>
                    <Text style={styles.removeText}>✕ Remover</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>Título:</Text>
                <TextInput
                  style={styles.input}
                  value={vinculado.titulo}
                  onChangeText={(v) => updateEventoVinculado(index, "titulo", v)}
                  placeholder="Ex: Reunião de véspera"
                />

                <Text style={styles.label}>Dias antes do evento principal:</Text>
                <TextInput
                  style={styles.input}
                  value={vinculado.dias_antes === 0 ? "" : String(vinculado.dias_antes)}
                  onChangeText={(v) => {
                    const num = v.replace(/[^0-9]/g, "");
                    updateEventoVinculado(index, "dias_antes", num === "" ? 0 : parseInt(num));
                  }}
                  keyboardType="numeric"
                  placeholder="Ex: 1 (véspera)"
                />

                <Text style={styles.label}>Horário:</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => {
                    // Abre picker de hora para este vinculado
                    setEditingVinculadoIndex(index);
                    setShowVinculadoTimePicker(true);
                  }}
                >
                  <Text style={styles.dateButtonText}>
                    🕐 {vinculado.horario.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.label}>Cargos que podem visualizar:</Text>
                <View style={styles.cargosContainer}>
                  {cargosDisponiveis.map((cargo) => {
                    const selected = vinculado.cargos_visiveis.includes(cargo.id);
                    return (
                      <TouchableOpacity
                        key={cargo.id}
                        style={[styles.cargoChip, selected && styles.cargoChipSelected]}
                        onPress={() => {
                          const novos = selected
                            ? vinculado.cargos_visiveis.filter((id) => id !== cargo.id)
                            : [...vinculado.cargos_visiveis, cargo.id];
                          updateEventoVinculado(index, "cargos_visiveis", novos);
                        }}
                      >
                        <Text style={[styles.cargoChipText, selected && styles.cargoChipTextSelected]}>
                          {cargo.nome}
                        </Text>
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
        <Text style={styles.infoText}>
          Envie notificações automáticas antes do evento para os cargos visíveis.
        </Text>

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
              <Picker
                selectedValue={alerta.horas_antes}
                onValueChange={(v) => updateAlerta(index, Number(v))}
              >
                {OPCOES_ALERTA.map((op) => (
                  <Picker.Item key={op.value} label={op.label} value={op.value} />
                ))}
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
          disabled={state.isSubmitting}
        >
          {state.isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isEditing ? "Salvar Alterações" : "Criar Evento"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#DCE0E6",
    backgroundColor: "#0A3D62",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  headerClose: {
    fontSize: 22,
    color: "#fff",
    padding: 5,
  },
  content: {
    padding: 20,
    backgroundColor: "#F0F4F8",
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0A3D62",
    marginTop: 20,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#DCE0E6",
    paddingBottom: 5,
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
    marginTop: 12,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#DCE0E6",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#DCE0E6",
    borderRadius: 8,
    overflow: "hidden",
  },
  dateRow: {
    flexDirection: "row",
    gap: 10,
  },
  dateButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#DCE0E6",
    borderRadius: 8,
    padding: 12,
    marginTop: 5,
    flex: 1,
  },
  dateButtonText: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
  },
  clearText: {
    color: "#DC3545",
    fontSize: 12,
    marginTop: 4,
    textAlign: "right",
  },
  cargosContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  cargoChip: {
    borderWidth: 1,
    borderColor: "#0A3D62",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
  },
  cargoChipSelected: {
    backgroundColor: "#0A3D62",
  },
  cargoChipText: {
    color: "#0A3D62",
    fontSize: 13,
  },
  cargoChipTextSelected: {
    color: "#fff",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#DCE0E6",
  },
  recorrenciaBox: {
    backgroundColor: "#E8F4F8",
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
  },
  footer: {
    flexDirection: "row",
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#DCE0E6",
    backgroundColor: "#fff",
    gap: 10,
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#0A3D62",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#A0B4C8",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#6C757D",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  infoText: {
    fontSize: 12,
    color: "#6C757D",
    marginBottom: 10,
  },
  vinculadoBox: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#DCE0E6",
  },
  vinculadoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  vinculadoTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0A3D62",
  },
  removeText: {
    color: "#DC3545",
    fontSize: 13,
  },
  addVinculadoButton: {
    borderWidth: 1,
    borderColor: "#17A2B8",
    borderRadius: 8,
    borderStyle: "dashed",
    padding: 12,
    alignItems: "center",
    marginTop: 5,
  },
  addVinculadoButtonText: {
    color: "#17A2B8",
    fontSize: 14,
    fontWeight: "600",
  },
});
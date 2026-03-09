import React, { useEffect, useState } from 'react';
import {
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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ICompromissoPessoal } from '../../../../domain/models/ICompromissoPessoal';
import {
  CreateCompromissoParams,
  UpdateCompromissoParams,
} from '../../../../domain/use_cases/compromissos/types';

interface Props {
  isVisible: boolean;
  onClose: () => void;
  onSave: (data: CreateCompromissoParams | UpdateCompromissoParams) => Promise<void>;
  compromissoToEdit?: ICompromissoPessoal | null;
  isSubmitting: boolean;
}

// -----------------------------------------------------------
// Helpers
// -----------------------------------------------------------
const toLocalDatetime = (iso: string): Date => new Date(iso);

const formatDateLabel = (date: Date): string =>
  date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

const formatTimeLabel = (date: Date): string =>
  date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const SEMANAS_MES = [
  { label: '1ª', value: 1 },
  { label: '2ª', value: 2 },
  { label: '3ª', value: 3 },
  { label: '4ª', value: 4 },
  { label: '5ª', value: 5 },
];

// Retorna qual é a Nª semana do mês para uma data
const semanaDoMesParaData = (date: Date): number => Math.ceil(date.getDate() / 7);

// -----------------------------------------------------------
// Sub-componente: seletor de data+hora
// -----------------------------------------------------------
type DateTimePickerMode = 'date' | 'time';

const DateTimeField: React.FC<{
  label: string;
  value: Date;
  onChange: (date: Date) => void;
}> = ({ label, value, onChange }) => {
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState<DateTimePickerMode>('date');

  const openPicker = (m: DateTimePickerMode) => {
    setMode(m);
    setShow(true);
  };

  const handleChange = (_: any, selected?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (selected) onChange(selected);
  };

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.dateTimeRow}>
        <TouchableOpacity style={styles.dateTimeButton} onPress={() => openPicker('date')}>
          <Text style={styles.dateTimeButtonText}>📅 {formatDateLabel(value)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateTimeButton} onPress={() => openPicker('time')}>
          <Text style={styles.dateTimeButtonText}>🕐 {formatTimeLabel(value)}</Text>
        </TouchableOpacity>
      </View>
      {show && (
        <DateTimePicker
          value={value}
          mode={mode}
          is24Hour
          display="default"
          onChange={handleChange}
        />
      )}
    </View>
  );
};

// -----------------------------------------------------------
// Constantes
// -----------------------------------------------------------
const HORAS_OPCOES = [
  { label: '15 min antes', value: 0.25 },
  { label: '30 min antes', value: 0.5 },
  { label: '1h antes', value: 1 },
  { label: '2h antes', value: 2 },
  { label: '6h antes', value: 6 },
  { label: '12h antes', value: 12 },
  { label: '1 dia antes', value: 24 },
  { label: '2 dias antes', value: 48 },
];

const RECORRENCIA_OPCOES: { label: string; value: 'semanal' | 'mensal' }[] = [
  { label: 'Semanal', value: 'semanal' },
  { label: 'Mensal', value: 'mensal' },
];

type ModoMensal = 'dia_fixo' | 'dia_semana';

// -----------------------------------------------------------
// Modal principal
// -----------------------------------------------------------
export const CompromissoFormModal: React.FC<Props> = ({
  isVisible,
  onClose,
  onSave,
  compromissoToEdit,
  isSubmitting,
}) => {
  const isEditing = !!compromissoToEdit;

  // ------- Estado do formulário -------
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataInicio, setDataInicio] = useState(new Date());
  const [temDataFim, setTemDataFim] = useState(false);
  const [dataFim, setDataFim] = useState(new Date());
  const [recorrente, setRecorrente] = useState(false);
  const [recorrenciaTipo, setRecorrenciaTipo] = useState<'semanal' | 'mensal'>('semanal');

  // Mensal
  const [modoMensal, setModoMensal] = useState<ModoMensal>('dia_fixo');
  const [semanaSelecionada, setSemanaSelecionada] = useState<number>(1);
  const [diaSemana, setDiaSemana] = useState<number>(1);

  const [temRecorrenciaFim, setTemRecorrenciaFim] = useState(false);
  const [recorrenciaFim, setRecorrenciaFim] = useState(new Date());
  const [showRecorrenciaFimPicker, setShowRecorrenciaFimPicker] = useState(false);
  const [alertasSelecionados, setAlertasSelecionados] = useState<number[]>([]);

  // ------- Preenche formulário ao editar -------
  useEffect(() => {
    if (isVisible) {
      if (compromissoToEdit) {
        setTitulo(compromissoToEdit.titulo);
        setDescricao(compromissoToEdit.descricao ?? '');
        setDataInicio(toLocalDatetime(compromissoToEdit.data_inicio));

        if (compromissoToEdit.data_fim) {
          setTemDataFim(true);
          setDataFim(toLocalDatetime(compromissoToEdit.data_fim));
        } else {
          setTemDataFim(false);
          setDataFim(new Date());
        }

        setRecorrente(compromissoToEdit.recorrente);
        setRecorrenciaTipo(compromissoToEdit.recorrencia_tipo ?? 'semanal');

        // Modo mensal
        if (
          compromissoToEdit.recorrencia_semana_do_mes !== null &&
          compromissoToEdit.recorrencia_dia_semana !== null
        ) {
          setModoMensal('dia_semana');
          setSemanaSelecionada(compromissoToEdit.recorrencia_semana_do_mes ?? 1);
          setDiaSemana(compromissoToEdit.recorrencia_dia_semana ?? 1);
        } else {
          setModoMensal('dia_fixo');
          setSemanaSelecionada(semanaDoMesParaData(toLocalDatetime(compromissoToEdit.data_inicio)));
          setDiaSemana(toLocalDatetime(compromissoToEdit.data_inicio).getDay());
        }

        if (compromissoToEdit.recorrencia_fim) {
          setTemRecorrenciaFim(true);
          setRecorrenciaFim(new Date(compromissoToEdit.recorrencia_fim));
        } else {
          setTemRecorrenciaFim(false);
          setRecorrenciaFim(new Date());
        }

        setAlertasSelecionados(compromissoToEdit.alertas.map((a) => a.horas_antes));
      } else {
        // Novo — reset
        setTitulo('');
        setDescricao('');
        const agora = new Date();
        setDataInicio(agora);
        setTemDataFim(false);
        setDataFim(new Date());
        setRecorrente(false);
        setRecorrenciaTipo('semanal');
        setModoMensal('dia_fixo');
        setSemanaSelecionada(semanaDoMesParaData(agora));
        setDiaSemana(agora.getDay());
        setTemRecorrenciaFim(false);
        setRecorrenciaFim(new Date());
        setAlertasSelecionados([]);
      }
    }
  }, [isVisible, compromissoToEdit]);

  // Atualiza semana/dia quando dataInicio muda e modo é dia_fixo
  useEffect(() => {
    if (modoMensal === 'dia_fixo') {
      setSemanaSelecionada(semanaDoMesParaData(dataInicio));
      setDiaSemana(dataInicio.getDay());
    }
  }, [dataInicio, modoMensal]);

  // ------- Label de resumo da recorrência -------
  const labelRecorrencia = (): string => {
    if (recorrenciaTipo === 'semanal') {
      return `Toda ${DIAS_SEMANA[dataInicio.getDay()]}`;
    }
    if (modoMensal === 'dia_fixo') {
      return `Todo dia ${dataInicio.getDate()} do mês`;
    }
    const semanaLabel = SEMANAS_MES.find((s) => s.value === semanaSelecionada)?.label ?? '1ª';
    return `Toda ${semanaLabel} ${DIAS_SEMANA[diaSemana]} do mês`;
  };

  // ------- Toggles de alerta -------
  const toggleAlerta = (horas: number) => {
    setAlertasSelecionados((prev) =>
      prev.includes(horas) ? prev.filter((h) => h !== horas) : [...prev, horas],
    );
  };

  // ------- Submit -------
  const handleSave = async () => {
    if (!titulo.trim()) {
      Alert.alert('Atenção', 'O título é obrigatório.');
      return;
    }
    if (temDataFim && dataFim <= dataInicio) {
      Alert.alert('Atenção', 'A data de término deve ser após a data de início.');
      return;
    }
    if (recorrente && temRecorrenciaFim && recorrenciaFim <= dataInicio) {
      Alert.alert('Atenção', 'A data de fim da recorrência deve ser após a data de início.');
      return;
    }

    // Monta campos de recorrência mensal
    const recorrenciaSemanaDoMes =
      recorrente && recorrenciaTipo === 'mensal' && modoMensal === 'dia_semana'
        ? semanaSelecionada
        : null;

    const recorrenciaDiaSemana =
      recorrente && recorrenciaTipo === 'mensal' && modoMensal === 'dia_semana'
        ? diaSemana
        : null;

    const params: CreateCompromissoParams = {
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      data_inicio: dataInicio.toISOString(),
      data_fim: temDataFim ? dataFim.toISOString() : null,
      recorrente,
      recorrencia_tipo: recorrente ? recorrenciaTipo : null,
      recorrencia_fim:
        recorrente && temRecorrenciaFim
          ? recorrenciaFim.toISOString().split('T')[0]
          : null,
      recorrencia_semana_do_mes: recorrenciaSemanaDoMes,
      recorrencia_dia_semana: recorrenciaDiaSemana,
      alertas: alertasSelecionados.map((h) => ({ horas_antes: h })),
    };

    if (isEditing) {
      await onSave({ ...params, id: compromissoToEdit!.id } as UpdateCompromissoParams);
    } else {
      await onSave(params);
    }
  };

  // ------- Render -------
  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>

        {/* Cabeçalho */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Editar Compromisso' : 'Novo Compromisso'}
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.headerButton, isSubmitting && styles.headerButtonDisabled]}
            disabled={isSubmitting}
          >
            <Text style={[styles.headerButtonText, styles.headerButtonSave]}>
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

          {/* Título */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Título *</Text>
            <TextInput
              style={styles.input}
              value={titulo}
              onChangeText={setTitulo}
              placeholder="Ex: Consulta médica"
              placeholderTextColor="#AAA"
              maxLength={100}
            />
          </View>

          {/* Descrição */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Descrição (opcional)</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={descricao}
              onChangeText={setDescricao}
              placeholder="Observações sobre o compromisso..."
              placeholderTextColor="#AAA"
              multiline
              numberOfLines={3}
              maxLength={500}
            />
          </View>

          {/* Data de início */}
          <DateTimeField
            label="Data e hora de início *"
            value={dataInicio}
            onChange={setDataInicio}
          />

          {/* Data de fim */}
          <View style={styles.fieldGroup}>
            <View style={styles.switchRow}>
              <Text style={styles.label}>Definir horário de término</Text>
              <Switch
                value={temDataFim}
                onValueChange={setTemDataFim}
                trackColor={{ false: '#CCC', true: '#17A2B8' }}
                thumbColor="#fff"
              />
            </View>
            {temDataFim && (
              <DateTimeField
                label="Data e hora de término"
                value={dataFim}
                onChange={setDataFim}
              />
            )}
          </View>

          {/* Recorrência */}
          <View style={styles.fieldGroup}>
            <View style={styles.switchRow}>
              <Text style={styles.label}>Compromisso recorrente</Text>
              <Switch
                value={recorrente}
                onValueChange={setRecorrente}
                trackColor={{ false: '#CCC', true: '#17A2B8' }}
                thumbColor="#fff"
              />
            </View>

            {recorrente && (
              <View style={styles.recorrenciaBox}>

                {/* Tipo: Semanal / Mensal */}
                <Text style={styles.subLabel}>Repetir:</Text>
                <View style={styles.chipRow}>
                  {RECORRENCIA_OPCOES.map((op) => (
                    <TouchableOpacity
                      key={op.value}
                      style={[styles.chip, recorrenciaTipo === op.value && styles.chipSelected]}
                      onPress={() => setRecorrenciaTipo(op.value)}
                    >
                      <Text style={[styles.chipText, recorrenciaTipo === op.value && styles.chipTextSelected]}>
                        {op.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Modo mensal */}
                {recorrenciaTipo === 'mensal' && (
                  <View style={styles.modoMensalBox}>
                    <Text style={styles.subLabel}>Modo de repetição mensal:</Text>

                    {/* Radio: Dia fixo vs Dia da semana */}
                    <View style={styles.radioRow}>
                      <TouchableOpacity
                        style={styles.radioOption}
                        onPress={() => setModoMensal('dia_fixo')}
                      >
                        <View style={[styles.radioCircle, modoMensal === 'dia_fixo' && styles.radioCircleSelected]} />
                        <Text style={styles.radioLabel}>
                          Todo dia {dataInicio.getDate()} do mês
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.radioOption}
                        onPress={() => setModoMensal('dia_semana')}
                      >
                        <View style={[styles.radioCircle, modoMensal === 'dia_semana' && styles.radioCircleSelected]} />
                        <Text style={styles.radioLabel}>Dia da semana</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Seletor de Nª semana + dia da semana */}
                    {modoMensal === 'dia_semana' && (
                      <View style={styles.diaSemanaBox}>
                        <Text style={styles.subLabel}>Qual semana do mês?</Text>
                        <View style={styles.chipRow}>
                          {SEMANAS_MES.map((s) => (
                            <TouchableOpacity
                              key={s.value}
                              style={[styles.chipSmall, semanaSelecionada === s.value && styles.chipSelected]}
                              onPress={() => setSemanaSelecionada(s.value)}
                            >
                              <Text style={[styles.chipTextSmall, semanaSelecionada === s.value && styles.chipTextSelected]}>
                                {s.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        <Text style={[styles.subLabel, { marginTop: 10 }]}>Qual dia da semana?</Text>
                        <View style={styles.chipRow}>
                          {DIAS_SEMANA.map((dia, idx) => (
                            <TouchableOpacity
                              key={idx}
                              style={[styles.chipSmall, diaSemana === idx && styles.chipSelected]}
                              onPress={() => setDiaSemana(idx)}
                            >
                              <Text style={[styles.chipTextSmall, diaSemana === idx && styles.chipTextSelected]}>
                                {dia}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* Resumo da recorrência */}
                <View style={styles.resumoBox}>
                  <Text style={styles.resumoText}>🔁 {labelRecorrencia()}</Text>
                </View>

                {/* Fim da recorrência */}
                <View style={styles.switchRow}>
                  <Text style={styles.subLabel}>Definir data de fim</Text>
                  <Switch
                    value={temRecorrenciaFim}
                    onValueChange={setTemRecorrenciaFim}
                    trackColor={{ false: '#CCC', true: '#17A2B8' }}
                    thumbColor="#fff"
                  />
                </View>

                {temRecorrenciaFim && (
                  <View>
                    <TouchableOpacity
                      style={styles.dateTimeButton}
                      onPress={() => setShowRecorrenciaFimPicker(true)}
                    >
                      <Text style={styles.dateTimeButtonText}>
                        📅 Repetir até: {formatDateLabel(recorrenciaFim)}
                      </Text>
                    </TouchableOpacity>
                    {showRecorrenciaFimPicker && (
                      <DateTimePicker
                        value={recorrenciaFim}
                        mode="date"
                        display="default"
                        minimumDate={dataInicio}
                        onChange={(_, date) => {
                          if (Platform.OS === 'android') setShowRecorrenciaFimPicker(false);
                          if (date) setRecorrenciaFim(date);
                        }}
                      />
                    )}
                  </View>
                )}

              </View>
            )}
          </View>

          {/* Alertas */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>🔔 Alertas (opcional)</Text>
            <Text style={styles.subLabel}>Selecione quando deseja ser lembrado:</Text>
            <View style={styles.alertasGrid}>
              {HORAS_OPCOES.map((op) => {
                const selecionado = alertasSelecionados.includes(op.value);
                return (
                  <TouchableOpacity
                    key={op.value}
                    style={[styles.alertaChip, selecionado && styles.alertaChipSelected]}
                    onPress={() => toggleAlerta(op.value)}
                  >
                    <Text style={[styles.alertaChipText, selecionado && styles.alertaChipTextSelected]}>
                      {op.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

        </ScrollView>
      </View>
    </Modal>
  );
};

// -----------------------------------------------------------
// Estilos
// -----------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0A3D62',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  headerButton: {
    paddingVertical: 6,
    paddingHorizontal: 4,
    minWidth: 70,
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  headerButtonText: {
    fontSize: 15,
    color: '#BEE5EB',
  },
  headerButtonSave: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'right',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0A3D62',
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 13,
    color: '#555',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#333",
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateTimeButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  dateTimeButtonText: {
    fontSize: 14,
    color: '#0A3D62',
    fontWeight: '500',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recorrenciaBox: {
    backgroundColor: '#EEF6FF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BEE5EB',
    gap: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#17A2B8',
    backgroundColor: '#fff',
  },
  chipSelected: {
    backgroundColor: '#17A2B8',
  },
  chipText: {
    fontSize: 14,
    color: '#17A2B8',
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#fff',
  },
  chipSmall: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#17A2B8',
    backgroundColor: '#fff',
  },
  chipTextSmall: {
    fontSize: 12,
    color: '#17A2B8',
    fontWeight: '600',
  },
  modoMensalBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    gap: 6,
  },
  radioRow: {
    gap: 10,
    marginBottom: 4,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#17A2B8',
    backgroundColor: '#fff',
  },
  radioCircleSelected: {
    backgroundColor: '#17A2B8',
  },
  radioLabel: {
    fontSize: 14,
    color: '#333',
  },
  diaSemanaBox: {
    marginTop: 6,
    padding: 10,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
  },
  resumoBox: {
    backgroundColor: '#0A3D62',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  resumoText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  alertasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  alertaChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CCC',
    backgroundColor: '#fff',
  },
  alertaChipSelected: {
    backgroundColor: '#0A3D62',
    borderColor: '#0A3D62',
  },
  alertaChipText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  alertaChipTextSelected: {
    color: '#fff',
  },
});
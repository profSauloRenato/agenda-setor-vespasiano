import React from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ICompromissoPessoal } from '../../../../domain/models/ICompromissoPessoal';

interface Props {
  isVisible: boolean;
  onClose: () => void;
  compromisso: ICompromissoPessoal | null;
  onEdit: (compromisso: ICompromissoPessoal) => void;
  onDelete: (id: string) => Promise<void>;
}

// -----------------------------------------------------------
// Helpers
// -----------------------------------------------------------
const formatDataCompleta = (iso: string): string =>
  new Date(iso).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

const formatHora = (iso: string): string =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

const formatDataCurta = (iso: string): string =>
  new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

const recorrenciaLabel = (compromisso: ICompromissoPessoal): string => {
  if (!compromisso.recorrente || !compromisso.recorrencia_tipo) return '';
  const tipo = compromisso.recorrencia_tipo === 'semanal' ? 'Semanal' : 'Mensal';
  const fim = compromisso.recorrencia_fim
    ? ` · Até ${formatDataCurta(compromisso.recorrencia_fim)}`
    : ' · sem data de fim';
  return `${tipo}${fim}`;
};

const alertaLabel = (horas: number): string => {
  if (horas === 0.25) return '15 minutos antes';
  if (horas === 0.5) return '30 minutos antes';
  if (horas === 1) return '1 hora antes';
  if (horas === 24) return '1 dia antes';
  if (horas === 48) return '2 dias antes';
  return `${horas}h antes`;
};

// -----------------------------------------------------------
// Linha de detalhe reutilizável
// -----------------------------------------------------------
const DetalheRow: React.FC<{ icon: string; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <View style={styles.detalheRow}>
    <Text style={styles.detalheIcon}>{icon}</Text>
    <View style={styles.detalheTextos}>
      <Text style={styles.detalheLabel}>{label}</Text>
      <Text style={styles.detalheValue}>{value}</Text>
    </View>
  </View>
);

// -----------------------------------------------------------
// Modal principal
// -----------------------------------------------------------
const CompromissoDetailsModal: React.FC<Props> = ({
  isVisible,
  onClose,
  compromisso,
  onEdit,
  onDelete,
}) => {
  const insets = useSafeAreaInsets();

  if (!compromisso) return null;

  const handleDelete = () => {
    Alert.alert(
      'Excluir compromisso',
      `Deseja excluir "${compromisso.titulo}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            onClose();
            await onDelete(compromisso.id);
          },
        },
      ],
    );
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>

        {/* Cabeçalho */}
        <View style={styles.header}>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>🔒 Pessoal</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

          {/* Título */}
          <Text style={styles.titulo}>{compromisso.titulo}</Text>

          {/* Data e hora */}
          <DetalheRow
            icon="📅"
            label="Data"
            value={formatDataCompleta(compromisso.data_inicio)}
          />
          <DetalheRow
            icon="🕐"
            label="Horário"
            value={
              compromisso.data_fim
                ? `${formatHora(compromisso.data_inicio)} – ${formatHora(compromisso.data_fim)}`
                : formatHora(compromisso.data_inicio)
            }
          />

          {/* Recorrência */}
          {compromisso.recorrente && (
            <DetalheRow
              icon="🔁"
              label="Recorrência"
              value={recorrenciaLabel(compromisso)}
            />
          )}

          {/* Descrição */}
          {compromisso.descricao ? (
            <View style={styles.descricaoBox}>
              <Text style={styles.descricaoLabel}>📝 Observações</Text>
              <Text style={styles.descricaoTexto}>{compromisso.descricao}</Text>
            </View>
          ) : null}

          {/* Alertas */}
          {compromisso.alertas.length > 0 && (
            <View style={styles.alertasBox}>
              <Text style={styles.alertasLabel}>🔔 Lembretes configurados</Text>
              {compromisso.alertas.map((alerta) => (
                <View key={alerta.id} style={styles.alertaItem}>
                  <Text style={styles.alertaItemText}>
                    · {alertaLabel(alerta.horas_antes)}
                    {alerta.enviado && (
                      <Text style={styles.alertaEnviado}> ✓ enviado</Text>
                    )}
                  </Text>
                </View>
              ))}
            </View>
          )}

        </ScrollView>

        {/* Ações */}
        <View style={[styles.actions, { paddingBottom: insets.bottom || 16 }]}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => onEdit(compromisso)}
          >
            <Text style={styles.editButtonText}>✏️ Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Text style={styles.deleteButtonText}>🗑️ Excluir</Text>
          </TouchableOpacity>
        </View>

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
    backgroundColor: '#4A4A6A',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 16,
  },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  closeButton: {
    padding: 6,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  titulo: {
    fontSize: 22,
    fontWeight: '800',
    color: '#222',
    marginBottom: 20,
  },
  detalheRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    elevation: 1,
  },
  detalheIcon: {
    fontSize: 18,
    marginRight: 12,
    marginTop: 1,
  },
  detalheTextos: {
    flex: 1,
  },
  detalheLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detalheValue: {
    fontSize: 15,
    color: '#222',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  descricaoBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  descricaoLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4A4A6A',
    marginBottom: 8,
  },
  descricaoTexto: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  alertasBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  alertasLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4A4A6A',
    marginBottom: 10,
  },
  alertaItem: {
    marginBottom: 4,
  },
  alertaItemText: {
    fontSize: 14,
    color: '#444',
  },
  alertaEnviado: {
    color: '#28A745',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#DEE2E6',
  },
  editButton: {
    flex: 1,
    backgroundColor: '#17A2B8',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#DC3545',
  },
  deleteButtonText: {
    color: '#DC3545',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default CompromissoDetailsModal;
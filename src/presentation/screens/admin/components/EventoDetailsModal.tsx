// src/presentation/screens/admin/components/EventoDetailsModal.tsx

import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { IEvento } from "../../../../domain/models/IEvento";
import { DIAS_SEMANA, SEMANAS_DO_MES } from "../../../../domain/models/IEvento";

interface EventoDetailsModalProps {
  isVisible: boolean;
  onClose: () => void;
  evento: IEvento | null;
  onEdit: (evento: IEvento) => void;
  onDelete: (eventoId: string) => void;
  showAdminActions?: boolean;
}

const formatarDataHora = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatarData = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getNomeDiaSemana = (value: number | null): string => {
  if (value === null) return "Não definido";
  return DIAS_SEMANA.find((d) => d.value === value)?.label ?? "Não definido";
};

const getNomeSemanaMes = (value: number | null): string => {
  if (value === null) return "Não definido";
  return SEMANAS_DO_MES.find((s) => s.value === value)?.label ?? "Não definido";
};

const getNomeRecorrencia = (tipo: string | null, intervalo: number | null): string => {
  switch (tipo) {
    case "semanal": return "Semanal (toda semana)";
    case "mensal": return "Mensal (todo mês)";
    case "bimestral": return "Bimestral (a cada 2 meses)";
    case "trimestral": return "Trimestral (a cada 3 meses)";
    case "personalizado": return `Personalizado (a cada ${intervalo ?? "?"} meses)`;
    default: return "Não definido";
  }
};

const EventoDetailsModal: React.FC<EventoDetailsModalProps> = ({
  isVisible,
  onClose,
  evento,
  onEdit,
  onDelete,
  showAdminActions = false,
}) => {
  if (!evento) return null;

  const renderDetalhe = (titulo: string, valor: string | null | undefined) => (
    <View style={styles.detailItem}>
      <Text style={styles.detailTitle}>{titulo}:</Text>
      <Text style={styles.detailValue}>{valor || "Não informado"}</Text>
    </View>
  );

  const handleDelete = () => {
    onDelete(evento.id);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>

          <Text style={styles.modalTitle}>{evento.titulo}</Text>
          <Text style={styles.modalSubtitle}>{evento.tipo}</Text>

          <ScrollView style={{ maxHeight: 450, width: "100%" }}>

            {/* Seção 1: Informações Gerais */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>📋 Informações Gerais</Text>
              {renderDetalhe("Local", [
                evento.nome_localizacao,
                evento.endereco_rua ? `${evento.endereco_rua}, ${evento.endereco_numero || "s/n"}` : null,
                evento.endereco_bairro,
                evento.endereco_cidade && evento.endereco_estado ? `${evento.endereco_cidade} - ${evento.endereco_estado}` : null,
                evento.endereco_cep,
              ].filter(Boolean).join("\n") || "Não informado")}
              {evento.descricao ? renderDetalhe("Descrição", evento.descricao) : null}
              {renderDetalhe("Confirmação de Presença", evento.rsvp_habilitado ? "Solicitada" : "Não solicitada")}
            </View>

            {/* Seção 2: Data e Horário */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>📅 Data e Horário</Text>
              {renderDetalhe("Início", formatarDataHora(evento.data_inicio))}
              {evento.data_fim
                ? renderDetalhe("Fim", formatarDataHora(evento.data_fim))
                : null}
            </View>

            {/* Seção 3: Recorrência */}
            {evento.recorrente && (
              <View style={styles.section}>
                <Text style={styles.sectionHeader}>🔁 Recorrência</Text>
                {renderDetalhe("Frequência", getNomeRecorrencia(evento.recorrencia_tipo, evento.recorrencia_intervalo))}

                {evento.recorrencia_tipo === "semanal"
                  ? renderDetalhe("Dia da semana", getNomeDiaSemana(evento.recorrencia_dia_semana))
                  : null}

                {evento.recorrencia_tipo !== "semanal" && evento.recorrencia_semana_do_mes !== null
                  ? renderDetalhe("Semana do mês", getNomeSemanaMes(evento.recorrencia_semana_do_mes))
                  : null}

                {evento.recorrencia_tipo !== "semanal" && evento.recorrencia_dia_semana !== null
                  ? renderDetalhe("Dia da semana", getNomeDiaSemana(evento.recorrencia_dia_semana))
                  : null}

                {evento.recorrencia_fim
                  ? renderDetalhe("Repete até", formatarData(evento.recorrencia_fim))
                  : null}

                {evento.recorrencia_total
                  ? renderDetalhe("Total de repetições", String(evento.recorrencia_total))
                  : null}
              </View>
            )}

            {/* Seção 4: Cargos */}
            {evento.nomes_cargos && evento.nomes_cargos.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionHeader}>👥 Cargos com Acesso</Text>
                {evento.nomes_cargos.map((nome, index) => (
                  <Text key={index} style={styles.cargoItem}>• {nome}</Text>
                ))}
              </View>
            )}

          </ScrollView>

          {/* Botões de Ação */}
          {showAdminActions && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.editButton]}
                onPress={() => {
                  onClose();
                  onEdit(evento);
                }}
              >
                <Text style={styles.textStyle}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.deleteButton]}
                onPress={handleDelete}
              >
                <Text style={styles.textStyle}>Excluir</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Fechar</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalView: {
    width: "90%",
    maxHeight: "90%",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    alignItems: "stretch",
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0A3D62",
    textAlign: "center",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#6C757D",
    textAlign: "center",
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  section: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#17A2B8",
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: "row",
    marginBottom: 6,
  },
  detailTitle: {
    fontWeight: "600",
    color: "#343A40",
    width: 130,
  },
  detailValue: {
    flex: 1,
    color: "#333",
  },
  cargoItem: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
    paddingLeft: 5,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 10,
  },
  button: {
    borderRadius: 8,
    padding: 12,
    flex: 1,
    alignItems: "center",
    marginHorizontal: 5,
  },
  editButton: { backgroundColor: "#FFC107" },
  deleteButton: { backgroundColor: "#DC3545" },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    fontSize: 15,
  },
  closeButton: {
    marginTop: 5,
    padding: 10,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#6C757D",
    fontWeight: "bold",
    fontSize: 15,
  },
});

export default EventoDetailsModal;
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
import { Feather } from "@expo/vector-icons";
import { IEvento, IEventoAlerta } from "../../../../domain/models/IEvento";
import { DIAS_SEMANA, SEMANAS_DO_MES } from "../../../../domain/models/IEvento";

interface EventoDetailsModalProps {
  isVisible: boolean;
  onClose: () => void;
  evento: IEvento | null;
  onEdit: (evento: IEvento) => void;
  onDelete: (eventoId: string) => void;
  showAdminActions?: boolean;
}

const TZ = "America/Sao_Paulo";

const formatarDataHora = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: TZ,
  });
};

const formatarData = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", timeZone: TZ,
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

const getLabelAlerta = (horas: number): string => {
  if (horas < 24) return `${horas}h antes`;
  const dias = horas / 24;
  return dias === 1 ? "1 dia antes" : `${dias} dias antes`;
};

const AlertaStatus: React.FC<{ alerta: IEventoAlerta }> = ({ alerta }) => {
  if (alerta.enviado) {
    const quando = alerta.enviado_em
      ? formatarDataHora(alerta.enviado_em)
      : null;
    return (
      <View style={styles.alertaRow}>
        <View style={[styles.alertaBadge, styles.alertaEnviado]}>
          <Feather name="check-circle" size={12} color="#155724" />
          <Text style={[styles.alertaBadgeText, { color: "#155724" }]}>Enviado</Text>
        </View>
        <Text style={styles.alertaLabel}>{getLabelAlerta(alerta.horas_antes)}</Text>
        {quando && <Text style={styles.alertaData}>{quando}</Text>}
      </View>
    );
  }

  // Verifica se o horário de envio já passou (alerta atrasado)
  const dataEvento = alerta.evento_id ? null : null; // sem data aqui, usamos só o badge
  return (
    <View style={styles.alertaRow}>
      <View style={[styles.alertaBadge, styles.alertaPendente]}>
        <Feather name="clock" size={12} color="#856404" />
        <Text style={[styles.alertaBadgeText, { color: "#856404" }]}>Pendente</Text>
      </View>
      <Text style={styles.alertaLabel}>{getLabelAlerta(alerta.horas_antes)}</Text>
    </View>
  );
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

  const enderecoCompleto = [
    evento.endereco_rua
      ? `${evento.endereco_rua}, ${evento.endereco_numero || "s/n"}`
      : null,
    evento.endereco_bairro,
    evento.endereco_cidade && evento.endereco_estado
      ? `${evento.endereco_cidade} - ${evento.endereco_estado}`
      : null,
    evento.endereco_cep,
  ].filter(Boolean).join("\n");

  const alertasEnviados = (evento.alertas ?? []).filter(a => a.enviado).length;
  const alertasPendentes = (evento.alertas ?? []).filter(a => !a.enviado).length;

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>

          {/* Título */}
          <Text style={styles.modalTitle}>{evento.titulo}</Text>
          <Text style={styles.modalSubtitle}>{evento.tipo}</Text>

          <ScrollView style={{ maxHeight: 460, width: "100%" }} showsVerticalScrollIndicator={false}>

            {/* INFORMAÇÕES GERAIS */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>📋 Informações Gerais</Text>
              {renderDetalhe("Local", evento.nome_localizacao || "Não informado")}
              {enderecoCompleto ? renderDetalhe("Endereço", enderecoCompleto) : null}
              {evento.descricao ? renderDetalhe("Descrição", evento.descricao) : null}
            </View>

            {/* DATA E HORÁRIO */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>📅 Data e Horário</Text>
              {renderDetalhe("Início", formatarDataHora(evento.data_inicio))}
              {evento.data_fim ? renderDetalhe("Fim", formatarDataHora(evento.data_fim)) : null}
            </View>

            {/* RECORRÊNCIA */}
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

            {/* SEÇÕES EXCLUSIVAS DO ADMIN */}
            {showAdminActions && (
              <>
                {/* ABRANGÊNCIA */}
                <View style={styles.section}>
                  <Text style={styles.sectionHeader}>📣 Abrangência</Text>
                  {renderDetalhe(
                    evento.tipo_abrangencia ?? "Nível",
                    evento.nome_abrangencia ?? "Não informado"
                  )}
                </View>

                {/* CARGOS COM ACESSO */}
                <View style={styles.section}>
                  <Text style={styles.sectionHeader}>👥 Cargos com Acesso</Text>
                  {evento.nomes_cargos && evento.nomes_cargos.length > 0 ? (
                    <View style={styles.chipsRow}>
                      {evento.nomes_cargos.map((nome, index) => (
                        <View key={index} style={styles.cargoChip}>
                          <Text style={styles.cargoChipText}>{nome}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.semAlertas}>Nenhum cargo definido</Text>
                  )}
                </View>

                {/* ALERTAS */}
                <View style={styles.section}>
                  <Text style={styles.sectionHeader}>🔔 Alertas Push</Text>
                  {(!evento.alertas || evento.alertas.length === 0) ? (
                    <Text style={styles.semAlertas}>Nenhum alerta configurado</Text>
                  ) : (
                    <>
                      <View style={styles.alertaResumoRow}>
                        <View style={[styles.alertaResumoBadge, { backgroundColor: "#D4EDDA" }]}>
                          <Text style={[styles.alertaResumoText, { color: "#155724" }]}>
                            {alertasEnviados} enviado{alertasEnviados !== 1 ? "s" : ""}
                          </Text>
                        </View>
                        {alertasPendentes > 0 && (
                          <View style={[styles.alertaResumoBadge, { backgroundColor: "#FFF3CD" }]}>
                            <Text style={[styles.alertaResumoText, { color: "#856404" }]}>
                              {alertasPendentes} pendente{alertasPendentes !== 1 ? "s" : ""}
                            </Text>
                          </View>
                        )}
                      </View>
                      {evento.alertas.map((alerta, index) => (
                        <AlertaStatus key={alerta.id ?? index} alerta={alerta} />
                      ))}
                    </>
                  )}
                </View>
              </>
            )}

          </ScrollView>

          {/* BOTÕES ADMIN */}
          {showAdminActions && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.editButton]}
                onPress={() => { onClose(); onEdit(evento); }}
              >
                <Text style={styles.textStyle}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDelete}>
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
    fontSize: 15,
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
    width: 120,
  },
  detailValue: {
    flex: 1,
    color: "#333",
  },

  // Cargos chips
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  cargoChip: {
    backgroundColor: "#EEF6FF",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#BDD9F5",
  },
  cargoChipText: {
    fontSize: 12,
    color: "#0A3D62",
    fontWeight: "600",
  },

  // Alertas
  semAlertas: {
    fontSize: 13,
    color: "#ADB5BD",
    fontStyle: "italic",
  },
  alertaResumoRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  alertaResumoBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  alertaResumoText: {
    fontSize: 12,
    fontWeight: "700",
  },
  alertaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 8,
  },
  alertaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  alertaEnviado: { backgroundColor: "#D4EDDA" },
  alertaPendente: { backgroundColor: "#FFF3CD" },
  alertaBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  alertaLabel: {
    fontSize: 13,
    color: "#333",
    fontWeight: "600",
    flex: 1,
  },
  alertaData: {
    fontSize: 11,
    color: "#6C757D",
  },

  // Botões
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
  textStyle: { color: "white", fontWeight: "bold", fontSize: 15 },
  closeButton: { marginTop: 5, padding: 10, alignItems: "center" },
  closeButtonText: { color: "#6C757D", fontWeight: "bold", fontSize: 15 },
});

export default EventoDetailsModal;
// src/presentation/screens/admin/EventosManagerScreen.tsx

import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { IEvento } from "../../../domain/models/IEvento";
import { ICargo } from "../../../domain/models/ICargo";
import { ILocalizacao } from "../../../domain/models/ILocalizacao";
import { EventoUseCases, useEventosViewModel } from "../../view_models/EventosViewModel";
import { useAuth } from "../../context/AuthContext";
import { useCargoUseCases, useLocalizacaoUseCases } from "../../../config/serviceLocator";
import { EventoFormModal } from "./components/EventoFormModal";
import EventoDetailsModal from "./components/EventoDetailsModal";

interface EventosManagerScreenProps {
  eventoUseCases: EventoUseCases;
}

const formatarData = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const EventoItem: React.FC<{
  evento: IEvento;
  onViewDetails: (evento: IEvento) => void;
}> = ({ evento, onViewDetails }) => {
  return (
    <TouchableOpacity style={styles.eventoItem} onPress={() => onViewDetails(evento)}>
      <View style={styles.eventoInfo}>
        <Text style={styles.eventoTitulo}>{evento.titulo}</Text>
        {/* <Text style={styles.eventoTipo}>{evento.tipo}</Text> */}
        <Text style={styles.eventoData}>{formatarData(evento.data_inicio)}</Text>
        {evento.nome_localizacao && (
          <Text style={styles.eventoLocal}>📍 {evento.nome_localizacao}</Text>
        )}
      </View>
      <View style={styles.eventoIconCol}>
        {evento.recorrente && <Text style={styles.eventoRecorrenteIcon}>🔁</Text>}
      </View>
      <View style={styles.eventoDetailsCol}>
        <Text style={styles.viewDetailsText}>Ver{"\n"}detalhes ›</Text>
      </View>
    </TouchableOpacity>
  );
};

export const EventosManagerScreen: React.FC<EventosManagerScreenProps> = ({
  eventoUseCases,
}) => {
  const { user } = useAuth();
  const { state, deleteEvento, refreshEventos } = useEventosViewModel(eventoUseCases);
  const cargoUseCases = useCargoUseCases();
  const localizacaoUseCases = useLocalizacaoUseCases();

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [eventoToEdit, setEventoToEdit] = useState<IEvento | null>(null);
  const [cargosDisponiveis, setCargosDisponiveis] = useState<ICargo[]>([]);
  const [localizacoesDisponiveis, setLocalizacoesDisponiveis] = useState<ILocalizacao[]>([]);
  const [isLoadingRefs, setIsLoadingRefs] = useState(true);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [eventoToDetail, setEventoToDetail] = useState<IEvento | null>(null);

  // Carrega cargos e localizações ao montar a tela
  useEffect(() => {
    const loadReferenceData = async () => {
      if (!user) return;
      try {
        const [cargos, localizacoes] = await Promise.all([
          cargoUseCases.getCargos.execute(user),
          localizacaoUseCases.getLocalizacoes.execute(user),
        ]);
        setCargosDisponiveis(cargos);
        setLocalizacoesDisponiveis(localizacoes);
      } catch (e) {
        Alert.alert("Erro", "Falha ao carregar dados de referência.");
      } finally {
        setIsLoadingRefs(false);
      }
    };
    loadReferenceData();
  }, [user]);

  useEffect(() => {
    if (state.error) {
      Alert.alert("Erro", state.error);
    }
  }, [state.error]);

  const handleEdit = (evento: IEvento) => {
    setIsDetailsModalVisible(false);
    setEventoToDetail(null);
    setEventoToEdit(evento);
    setIsFormVisible(true);
  };

  const handleDelete = async (eventoId: string) => {
    await deleteEvento(eventoId);
  };

  const handleOpenCreate = () => {
    setEventoToEdit(null);
    setIsFormVisible(true);
  };

  const handleOpenDetails = (evento: IEvento) => {
    setEventoToDetail(evento);
    setIsDetailsModalVisible(true);
  };

  const handleFormClose = () => {
    setIsFormVisible(false);
    setEventoToEdit(null);
    refreshEventos();
  };

  if (isLoadingRefs) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#17A2B8" />
        <Text style={styles.loadingText}>Carregando dados...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Gerenciamento de Eventos</Text>

      <TouchableOpacity style={styles.addButton} onPress={handleOpenCreate}>
        <Text style={styles.addButtonText}>+ Criar Novo Evento</Text>
      </TouchableOpacity>

      {state.isLoading && (
        <ActivityIndicator size="large" color="#17A2B8" style={{ marginTop: 20 }} />
      )}

      {!state.isLoading && state.eventos.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhum evento cadastrado.</Text>
        </View>
      )}

      {!state.isLoading && state.eventos.length > 0 && (
        <FlatList
          data={state.eventos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EventoItem
              evento={item}
              onViewDetails={handleOpenDetails}
            />
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {isFormVisible && (
        <EventoFormModal
          isVisible={isFormVisible}
          onClose={handleFormClose}
          eventoToEdit={eventoToEdit}
          eventoUseCases={eventoUseCases}
          cargosDisponiveis={cargosDisponiveis}
          localizacoesDisponiveis={localizacoesDisponiveis}
        />
      )}

      <EventoDetailsModal
        isVisible={isDetailsModalVisible}
        onClose={() => {
          setIsDetailsModalVisible(false);
          setEventoToDetail(null);
        }}
        evento={eventoToDetail}
        onEdit={handleEdit}
        onDelete={handleDelete}
        showAdminActions={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 60,
    padding: 15,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#6C757D",
    fontSize: 15,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#0A3D62",
  },
  addButton: {
    backgroundColor: "#17A2B8",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
    elevation: 2,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  eventoItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 1,
  },
  eventoInfo: {
    flex: 3,
  },
  eventoIconCol: {
    // flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  eventoRecorrenteIcon: {
    fontSize: 14,
  },
  eventoDetailsCol: {
    flex: 2,
    alignItems: "center",
    // justifyContent: "center",
  },
  eventoTitulo: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0A3D62",
  },
  eventoTipo: {
    fontSize: 13,
    color: "#6C757D",
    marginTop: 2,
  },
  eventoData: {
    fontSize: 13,
    color: "#333",
    marginTop: 2,
  },
  eventoLocal: {
    fontSize: 12,
    color: "#555",
    marginTop: 2,
  },
  eventoRight: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  eventoActions: {
    alignItems: "center",
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
    minWidth: 60,
    alignItems: "center",
  },
  actionButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#6C757D",
  },
  viewDetailsText: {
    fontSize: 13,
    color: "#007BFF",
    fontWeight: "600",
    textAlign: "center",
  },
});
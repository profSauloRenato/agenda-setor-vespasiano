// src/presentation/screens/admin/EventoModelosManagerScreen.tsx

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
import { IEventoModelo, CategoriaEventoModelo } from "../../../domain/models/IEventoModelo";
import { useEventoModeloUseCases } from "../../../config/serviceLocator";
import SafeScreen from "../../components/SafeScreen";
import ModeloFormModal from "./components/ModeloFormModal";

// -------------------------------------------
// HELPERS
// -------------------------------------------
const CATEGORIA_LABELS: Record<CategoriaEventoModelo, string> = {
  evento: "Evento",
  reuniao_fixa: "Reunião",
};

const CATEGORIA_CORES: Record<CategoriaEventoModelo, string> = {
  evento: "#6F42C1",
  reuniao_fixa: "#17A2B8",
};

// -------------------------------------------
// ITEM DA LISTA
// -------------------------------------------
const ModeloItem: React.FC<{
  modelo: IEventoModelo;
  onEdit: (modelo: IEventoModelo) => void;
  onToggleAtivo: (modelo: IEventoModelo) => void;
  onDelete: (modelo: IEventoModelo) => void;
}> = ({ modelo, onEdit, onToggleAtivo, onDelete }) => {
  const cor = CATEGORIA_CORES[modelo.categoria];
  return (
    <View style={[styles.item, !modelo.ativo && styles.itemInativo]}>
      <View style={styles.itemInfo}>
        <View style={styles.itemTituloRow}>
          <Text style={[styles.itemNome, !modelo.ativo && styles.itemNomeInativo]}>
            {modelo.nome}
          </Text>
          {!modelo.ativo && (
            <View style={styles.inativoBadge}>
              <Text style={styles.inativoBadgeText}>Inativo</Text>
            </View>
          )}
        </View>
        <View style={[styles.categoriaBadge, { backgroundColor: cor }]}>
          <Text style={styles.categoriaBadgeText}>{CATEGORIA_LABELS[modelo.categoria]}</Text>
        </View>
      </View>
      <View style={styles.itemAcoes}>
        <TouchableOpacity style={styles.acaoButton} onPress={() => onEdit(modelo)}>
          <Text style={styles.acaoEditar}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.acaoButton} onPress={() => onToggleAtivo(modelo)}>
          <Text style={styles.acaoToggle}>{modelo.ativo ? "🔴" : "🟢"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.acaoButton} onPress={() => onDelete(modelo)}>
          <Text style={styles.acaoDeletar}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// -------------------------------------------
// TELA PRINCIPAL
// -------------------------------------------
const EventoModelosManagerScreen: React.FC = () => {
  const useCases = useEventoModeloUseCases();

  const [modelos, setModelos] = useState<IEventoModelo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [modeloToEdit, setModeloToEdit] = useState<IEventoModelo | null>(null);
  const [mostrarInativos, setMostrarInativos] = useState(false);

  const loadModelos = async () => {
    setIsLoading(true);
    try {
      const data = await useCases.getAll.execute(mostrarInativos ? false : true);
      setModelos(data);
    } catch (err) {
      Alert.alert("Erro", "Falha ao carregar modelos.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadModelos(); }, [mostrarInativos]);

  const handleSave = async (nome: string, categoria: CategoriaEventoModelo) => {
    setIsSaving(true);
    try {
      if (modeloToEdit) {
        await useCases.update.execute({ id: modeloToEdit.id, nome, categoria, ativo: modeloToEdit.ativo });
      } else {
        await useCases.create.execute({ nome, categoria });
      }
      setIsFormVisible(false);
      setModeloToEdit(null);
      await loadModelos();
    } catch (err) {
      Alert.alert("Erro", err instanceof Error ? err.message : "Falha ao salvar modelo.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAtivo = (modelo: IEventoModelo) => {
    const acao = modelo.ativo ? "desativar" : "ativar";
    Alert.alert(
      `${modelo.ativo ? "Desativar" : "Ativar"} modelo`,
      `Deseja ${acao} "${modelo.nome}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: modelo.ativo ? "Desativar" : "Ativar",
          onPress: async () => {
            try {
              await useCases.update.execute({ id: modelo.id, nome: modelo.nome, categoria: modelo.categoria, ativo: !modelo.ativo });
              await loadModelos();
            } catch {
              Alert.alert("Erro", "Falha ao atualizar modelo.");
            }
          },
        },
      ]
    );
  };

  const handleDelete = (modelo: IEventoModelo) => {
    Alert.alert(
      "Excluir modelo",
      `Deseja excluir "${modelo.nome}"? Esta ação não pode ser desfeita.\n\nSe houver eventos vinculados, prefira desativar.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await useCases.delete.execute(modelo.id);
              await loadModelos();
            } catch (err) {
              Alert.alert("Erro", err instanceof Error ? err.message : "Falha ao excluir.");
            }
          },
        },
      ]
    );
  };

  const eventos = modelos.filter((m) => m.categoria === "evento");
  const reunioes = modelos.filter((m) => m.categoria === "reuniao_fixa");

  return (
    <SafeScreen style={styles.container}>

      <View style={styles.barra}>
        <TouchableOpacity style={styles.addButton} onPress={() => { setModeloToEdit(null); setIsFormVisible(true); }}>
          <Text style={styles.addButtonText}>+ Novo Modelo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, mostrarInativos && styles.toggleButtonAtivo]}
          onPress={() => setMostrarInativos((prev) => !prev)}
        >
          <Text style={[styles.toggleButtonText, mostrarInativos && styles.toggleButtonTextAtivo]}>
            {mostrarInativos ? "Ocultar inativos" : "Ver inativos"}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading && <ActivityIndicator size="large" color="#17A2B8" style={{ marginTop: 20 }} />}

      {!isLoading && (
        <FlatList
          data={[]}
          keyExtractor={() => ""}
          renderItem={null}
          ListHeaderComponent={
            <>
              {eventos.length > 0 && (
                <>
                  <Text style={styles.secaoTitulo}>🎯 Eventos</Text>
                  {eventos.map((m) => (
                    <ModeloItem key={m.id} modelo={m}
                      onEdit={(mod) => { setModeloToEdit(mod); setIsFormVisible(true); }}
                      onToggleAtivo={handleToggleAtivo}
                      onDelete={handleDelete}
                    />
                  ))}
                </>
              )}
              {reunioes.length > 0 && (
                <>
                  <Text style={[styles.secaoTitulo, { marginTop: 16 }]}>📋 Reuniões</Text>
                  {reunioes.map((m) => (
                    <ModeloItem key={m.id} modelo={m}
                      onEdit={(mod) => { setModeloToEdit(mod); setIsFormVisible(true); }}
                      onToggleAtivo={handleToggleAtivo}
                      onDelete={handleDelete}
                    />
                  ))}
                </>
              )}
              {eventos.length === 0 && reunioes.length === 0 && (
                <View style={styles.vazio}>
                  <Text style={styles.vazioText}>Nenhum modelo cadastrado.</Text>
                </View>
              )}
            </>
          }
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}

      <ModeloFormModal
        isVisible={isFormVisible}
        onClose={() => { setIsFormVisible(false); setModeloToEdit(null); }}
        onSave={handleSave}
        modeloToEdit={modeloToEdit}
        isSaving={isSaving}
      />

    </SafeScreen>
  );
};

// -------------------------------------------
// ESTILOS
// -------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA", padding: 15 },
  barra: { flexDirection: "row", gap: 10, marginBottom: 16 },
  addButton: { flex: 1, backgroundColor: "#17A2B8", borderRadius: 8, padding: 12, alignItems: "center", elevation: 2 },
  addButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  toggleButton: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 8, borderWidth: 1.5, borderColor: "#CCC", backgroundColor: "#fff", justifyContent: "center" },
  toggleButtonAtivo: { borderColor: "#17A2B8", backgroundColor: "#EEF9FB" },
  toggleButtonText: { fontSize: 13, color: "#666", fontWeight: "600" },
  toggleButtonTextAtivo: { color: "#17A2B8" },
  secaoTitulo: { fontSize: 13, fontWeight: "700", color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  item: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 8, padding: 12, marginBottom: 8, elevation: 1 },
  itemInativo: { opacity: 0.5 },
  itemInfo: { flex: 1, gap: 6 },
  itemTituloRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  itemNome: { fontSize: 15, fontWeight: "700", color: "#222", flex: 1 },
  itemNomeInativo: { color: "#999" },
  inativoBadge: { backgroundColor: "#EEE", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  inativoBadgeText: { fontSize: 11, color: "#888", fontWeight: "600" },
  categoriaBadge: { alignSelf: "flex-start", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  categoriaBadgeText: { fontSize: 11, color: "#fff", fontWeight: "700" },
  itemAcoes: { flexDirection: "row", gap: 4 },
  acaoButton: { padding: 6 },
  acaoEditar: { fontSize: 16 },
  acaoToggle: { fontSize: 16 },
  acaoDeletar: { fontSize: 16 },
  vazio: { alignItems: "center", marginTop: 40 },
  vazioText: { fontSize: 15, color: "#6C757D" },
});

export default EventoModelosManagerScreen;
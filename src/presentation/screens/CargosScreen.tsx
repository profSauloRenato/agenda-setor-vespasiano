// src/presentation/screens/CargosScreen.tsx

import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ICargo } from '../../domain/models/ICargo';

// Importa todos os hooks de conveniência do serviceLocator
import {
  useCreateCargoUseCase, // Novo
  useDeleteCargoUseCase // Novo
  ,
  useGetCargosUseCase, // Novo
  useUpdateCargoUseCase
} from '../../config/serviceLocator';

// Importa o ViewModel e o tipo de Use Cases
import { CargoUseCases, useCargosViewModel } from '../view_models/CargosViewModel';

/**
 * Componente funcional para renderizar um item individual da lista de Cargos.
 */
const CargoItem: React.FC<{ cargo: ICargo; onDelete: (id: string) => Promise<boolean> }> = ({ cargo, onDelete }) => {
    
    const handleDelete = () => {
        Alert.alert(
            "Confirmar Exclusão",
            `Tem certeza que deseja excluir o cargo "${cargo.nome}"?`,
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "Excluir", 
                    style: "destructive", 
                    onPress: () => {
                        // Chama a função de exclusão do ViewModel
                        onDelete(cargo.id); 
                    }
                }
            ]
        );
    };

    // Placeholder simples para visualização do item
    return (
        <View style={styles.cargoItem}>
            <View style={styles.textContainer}>
                <Text style={styles.cargoName}>{cargo.nome}</Text>
                <Text style={styles.cargoDescription}>{cargo.descricao || 'Sem descrição.'}</Text>
            </View>
            <View style={styles.actionsContainer}>
                {/* Botão de Edição (Placeholder) */}
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#FFC107' }]}>
                    <Text style={styles.actionButtonText}>Editar</Text>
                </TouchableOpacity>
                {/* Botão de Exclusão */}
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#DC3545', marginLeft: 10 }]} onPress={handleDelete}>
                    <Text style={styles.actionButtonText}>Excluir</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};


/**
 * Tela de Gerenciamento de Cargos (Exclusivo para Administradores).
 */
const CargosManagerScreen: React.FC = () => {
    const navigation = useNavigation();

    // 1. OBTÉM OS USE CASES NECESSÁRIOS
    const getCargos = useGetCargosUseCase();
    const createCargo = useCreateCargoUseCase();
    const updateCargo = useUpdateCargoUseCase();
    const deleteCargo = useDeleteCargoUseCase();

    // Cria o objeto completo de Use Cases para injetar no ViewModel
    const cargoUseCases: CargoUseCases = {
        getCargos,
        createCargo,
        updateCargo,
        deleteCargo,
    };

    // 2. INJETA DEPENDÊNCIA E OBTÉM O ESTADO
    const { state, refreshCargos, deleteCargo: handleDeleteCargo } = useCargosViewModel(cargoUseCases);

    // --- RENDERIZAÇÃO CONDICIONAL ---

    if (state.isLoading && state.cargos.length === 0 && !state.error) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#0A3D62" />
                <Text style={styles.loadingText}>Carregando cargos...</Text>
            </View>
        );
    }
    
    if (state.error) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>{state.error}</Text>
                <TouchableOpacity style={styles.refreshButton} onPress={refreshCargos}>
                    <Text style={styles.refreshButtonText}>Tentar Novamente</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Gerenciamento de Cargos</Text>
            
            {/* Botão para adicionar novo cargo (Placeholder) */}
            <TouchableOpacity style={styles.addButton} onPress={() => { /* Navegar para tela de Criação */ }}>
                <Text style={styles.addButtonText}>+ Adicionar Novo Cargo</Text>
            </TouchableOpacity>

            <FlatList
                data={state.cargos}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <CargoItem 
                        cargo={item} 
                        // Passa a função de exclusão diretamente do ViewModel
                        onDelete={handleDeleteCargo} 
                    />
                )}
                contentContainerStyle={styles.listContent}
            />
            {state.isLoading && state.cargos.length > 0 && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="small" color="#0A3D62" />
                </View>
            )}
        </View>
    );
};

// --- ESTILOS ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#F0F4F8',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0F4F8',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    errorText: {
        fontSize: 18,
        color: '#DC3545',
        textAlign: 'center',
        marginBottom: 20,
    },
    refreshButton: {
        backgroundColor: '#0A3D62',
        padding: 10,
        borderRadius: 5,
    },
    refreshButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0A3D62',
        marginBottom: 15,
    },
    addButton: {
        backgroundColor: '#17A2B8',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 20,
        elevation: 2,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    listContent: {
        paddingBottom: 20,
    },
    cargoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        marginBottom: 10,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
    },
    textContainer: {
        flex: 1,
        marginRight: 10,
    },
    cargoName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    cargoDescription: {
        fontSize: 14,
        color: '#6C757D',
        marginTop: 4,
    },
    actionsContainer: {
        flexDirection: 'row',
    },
    actionButton: {
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 5,
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    loadingOverlay: {
        position: 'absolute',
        bottom: 0,
        alignSelf: 'center',
        padding: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 10,
    }
});

export default CargosManagerScreen;
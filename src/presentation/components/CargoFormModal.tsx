// src/presentation/components/CargoFormModal.tsx

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { ICargo } from '../../domain/models/ICargo';
import { CreateCargoParams } from '../../domain/use_cases/cargos/CreateCargo';

// ------------------------------------------
// DEFINIÇÃO DO ESTADO INTERNO DO FORMULÁRIO
// ------------------------------------------
interface FormState {
    nome: string;
    descricao: string;
    pode_enviar_push: boolean; // Propriedade do ICargo
}

// ------------------------------------------
// PROPRIEDADES DO MODAL (PROPS)
// ------------------------------------------
interface CargoFormModalProps {
    isVisible: boolean;
    onClose: () => void;
    
    // Se 'cargo' for fornecido, é uma edição; caso contrário, é uma criação.
    cargo?: ICargo; 

    // Funções de manipulação (ViewModel)
    onSubmit: (data: ICargo | CreateCargoParams) => Promise<ICargo | undefined>;
    
    // Estado de carregamento global do ViewModel
    isLoading: boolean;
    
    // Erro do ViewModel
    error?: string | null;
}

/**
 * Modal reutilizável para criar ou editar um cargo.
 */
const CargoFormModal: React.FC<CargoFormModalProps> = ({ 
    isVisible, 
    onClose, 
    cargo, 
    onSubmit,
    isLoading,
    error 
}) => {
    
    // Define o estado inicial padrão
    const initialState: FormState = {
        nome: '',
        descricao: '',
        pode_enviar_push: false,
    };

    const [form, setForm] = useState<FormState>(initialState);
    const isEditing = !!cargo; // True se houver um objeto cargo

    // Carrega os dados do cargo no formulário quando ele é passado para edição
    useEffect(() => {
        if (cargo) {
            setForm({
                nome: cargo.nome,
                descricao: cargo.descricao || '',
                pode_enviar_push: cargo.pode_enviar_push,
            });
        } else {
            // Limpa o formulário se for uma criação nova
            setForm(initialState);
        }
    }, [cargo, isVisible]); // Recarrega quando o cargo ou a visibilidade muda

    const handleChange = (name: keyof FormState, value: string | boolean) => {
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        // Objeto de dados a ser enviado
        const dataToSend = isEditing 
            ? { ...form, id: cargo.id, pode_enviar_push: form.pode_enviar_push } as ICargo // Se edição, precisa do ID
            : form as CreateCargoParams; // Se criação, é apenas o payload

        // Envia para o ViewModel
        const result = await onSubmit(dataToSend);
        
        // Se o resultado for bem-sucedido e não houver erro, fecha o modal
        if (result && !error) {
            onClose();
        }
        // Se houver erro (ex: nome duplicado), o modal permanece aberto, exibindo o erro
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
                    <Text style={styles.modalTitle}>
                        {isEditing ? 'Editar Cargo' : 'Criar Novo Cargo'}
                    </Text>

                    {/* Campo de Nome */}
                    <TextInput
                        style={styles.input}
                        placeholder="Nome do Cargo (Ex: Diácono)"
                        value={form.nome}
                        onChangeText={(text) => handleChange('nome', text)}
                        maxLength={50}
                    />

                    {/* Campo de Descrição */}
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Descrição (Opcional)"
                        value={form.descricao}
                        onChangeText={(text) => handleChange('descricao', text)}
                        multiline
                        numberOfLines={3}
                        maxLength={255}
                    />
                    
                    {/* Campo de Permissão Push */}
                    <View style={styles.switchContainer}>
                        <Text style={styles.switchLabel}>Pode Enviar Notificações Push?</Text>
                        <Switch
                            onValueChange={(value) => handleChange('pode_enviar_push', value)}
                            value={form.pode_enviar_push}
                            trackColor={{ false: "#767577", true: "#0A3D62" }}
                            thumbColor={form.pode_enviar_push ? "#17A2B8" : "#f4f3f4"}
                        />
                    </View>

                    {/* Exibição de Erros */}
                    {error && <Text style={styles.errorText}>{error}</Text>}

                    {/* Botões de Ação */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity 
                            style={[styles.button, styles.cancelButton]} 
                            onPress={onClose}
                            disabled={isLoading}
                        >
                            <Text style={styles.textStyle}>Cancelar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.submitButton]}
                            onPress={handleSubmit}
                            disabled={isLoading || form.nome.trim() === ''} // Desabilita se carregando ou nome vazio
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.textStyle}>{isEditing ? 'Salvar Alterações' : 'Criar Cargo'}</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// ------------------------------------------
// ESTILOS
// ------------------------------------------
const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
        width: '90%',
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 25,
        alignItems: 'stretch',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        marginBottom: 15,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0A3D62',
    },
    input: {
        height: 45,
        borderColor: '#DDDDDD',
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        marginBottom: 15,
        fontSize: 16,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingVertical: 5,
    },
    switchLabel: {
        fontSize: 16,
        color: '#333',
    },
    errorText: {
        color: '#DC3545',
        textAlign: 'center',
        marginBottom: 15,
        fontWeight: 'bold',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    button: {
        borderRadius: 8,
        padding: 12,
        elevation: 2,
        flex: 1,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#6C757D',
        marginRight: 10,
    },
    submitButton: {
        backgroundColor: '#17A2B8',
        marginLeft: 10,
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 16,
    },
});

export default CargoFormModal;
// src/presentation/screens/HomeScreen.tsx

import { NavigationProp, useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// --- TIPAGEM DA NAVEGAÇÃO ---
// Define o nome das rotas que esta tela pode chamar (CargosManager é a rota do Admin)
type RootStackParamList = {
    CargosManager: undefined; 
};

const HomeScreen: React.FC = () => {
    // Hook para acessar a navegação, com tipagem para evitar erros
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Tela Principal (Agenda)</Text>
            <Text style={styles.text}>Se você está vendo esta tela, a navegação funciona!</Text>
            
            {/* BOTÃO PARA NAVEGAR PARA A TELA DE CARGOS */}
            {/* O nome da rota é 'CargosManager', conforme definido em AppNavigator.tsx */}
            <TouchableOpacity 
                style={styles.adminButton}
                onPress={() => navigation.navigate('CargosManager')}
            >
                <Text style={styles.adminButtonText}>Ir para Gerenciar Cargos (Admin)</Text>
            </TouchableOpacity>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E6E6FA', 
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333'
    },
    text: {
        fontSize: 16,
        margin: 10,
        color: '#666'
    },
    // Estilos do Botão Admin
    adminButton: {
        marginTop: 30,
        backgroundColor: '#0A3D62', // Azul Marinho
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 8,
    },
    adminButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    }
});

export default HomeScreen;
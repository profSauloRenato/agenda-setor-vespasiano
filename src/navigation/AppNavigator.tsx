// src/navigation/AppNavigator.tsx

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

// Importações de Telas
import CargosScreen from '../presentation/screens/CargosScreen';
import HomeScreen from '../presentation/screens/HomeScreen';
import LoginScreen from '../presentation/screens/LoginScreen';

// Importações de Contexto
import { useAuth } from '../presentation/context/AuthContext';

// Cria o tipo de Navegador Stack
const Stack = createNativeStackNavigator();
const AdminStack = createNativeStackNavigator();

// --- STACK DE ADMINISTRAÇÃO (Cargos, Localização, Usuários) ---
const AdminStackComponent = () => {
    return (
        <AdminStack.Navigator screenOptions={{ headerShown: true }}> 
            {/* Rota inicial do Painel Administrativo */}
            <AdminStack.Screen 
                name="ListaCargos" 
                component={CargosScreen} 
                options={{ 
                    title: 'Gerenciar Cargos', 
                    headerStyle: { backgroundColor: '#0A3D62' }, // Azul Marinho
                    headerTintColor: '#FFFFFF' // Texto Branco
                }} 
            />
            {/* Rotas futuras como: CadastrarCargo, EditarCargo, GerenciarLocalizacao */}
        </AdminStack.Navigator>
    );
};

// --- STACK PRINCIPAL (Home e rotas do App) ---
const MainStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            
            {/* 1. Tela Home/Agenda */}
            <Stack.Screen 
                name="Home" 
                component={HomeScreen} 
            />
            
            {/* 2. Rota de Gerenciamento de Cargos (Diretamente na MainStack) */}
            <Stack.Screen
                name="CargosManager" // Nome da Rota: CargosManager
                component={CargosScreen} 
                options={{ 
                    headerShown: true, // Mostra o cabeçalho
                    title: 'Gerenciar Cargos', 
                    headerStyle: { backgroundColor: '#0A3D62' },
                    headerTintColor: '#FFFFFF'
                }}
            />
            
            {/* Rotas futuras de Localização e Usuários virão aqui */}
        </Stack.Navigator>
    );
};


// --- STACK DE AUTENTICAÇÃO ---
const AuthStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
    );
};


// --- NAVIGATOR PRINCIPAL (Switch Navigator) ---
export const AppNavigator = () => {
    const { user, isLoading } = useAuth();
    
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0A3D62" />
            </View>
        );
    }
    
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {user ? (
                <Stack.Screen name="Main" component={MainStack} />
            ) : (
                <Stack.Screen name="Auth" component={AuthStack} />
            )}
        </Stack.Navigator>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
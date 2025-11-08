// src/presentation/screens/LoginScreen.tsx

import React from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// Importa o ViewModel e o Use Case
import { useLoginUseCase } from '../../config/serviceLocator';
import { useLoginViewModel } from '../view_models/LoginViewModel';

// --- DEFINIÇÕES DE ESTILO TEMÁTICO ---
const COLORS = {
  primaryBlue: '#0A3D62', // Azul Marinho (Identidade Visual)
  lightGray: '#F0F0F0',
  white: '#FFFFFF',
  errorRed: '#DC3545',
};

// Componente Principal da Tela de Login
const LoginScreen: React.FC = () => {
  // Injeção do Use Case via Service Locator
  const loginUserUseCase = useLoginUseCase();
  
  // Criação do ViewModel (com a dependência injetada)
  const { state, setField, handleLogin } = useLoginViewModel(loginUserUseCase);

  return (
    <View style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.keyboardView}
      >
        <View style={styles.container}>
          
          {/* LOGO E TÍTULO */}
          {/* Substitua esta imagem pela imagem oficial da Congregação/Setor */}
          <Image
            source={require('../assets/icon.png')} // Usando o ícone do projeto como placeholder
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Agenda Setor Vespasiano</Text>
          <Text style={styles.subtitle}>Acesso Restrito</Text>

          {/* CAMPO EMAIL */}
          <TextInput
            style={styles.input}
            placeholder="E-mail"
            placeholderTextColor="#888"
            keyboardType="email-address"
            autoCapitalize="none"
            value={state.email}
            onChangeText={(text) => setField('email', text)}
            editable={!state.isLoading}
          />

          {/* CAMPO SENHA */}
          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor="#888"
            secureTextEntry
            value={state.password}
            onChangeText={(text) => setField('password', text)}
            editable={!state.isLoading}
          />

          {/* MENSAGEM DE ERRO (Tratada pelo ViewModel) */}
          {state.error && (
            <Text style={styles.errorText}>{state.error}</Text>
          )}

          {/* BOTÃO DE LOGIN */}
          <TouchableOpacity
            style={[styles.button, state.isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={state.isLoading}
          >
            {state.isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </TouchableOpacity>
          
          {/* Opção para Cadastro/Recuperação (Funcionalidade futura) */}
          <TouchableOpacity style={styles.linkButton} disabled={state.isLoading}>
            <Text style={styles.linkText}>Esqueceu a senha?</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primaryBlue,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: COLORS.lightGray,
    borderRadius: 10, // Cantos arredondados
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: COLORS.primaryBlue,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    width: '100%',
    color: COLORS.errorRed,
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 14,
  },
  linkButton: {
    marginTop: 20,
  },
  linkText: {
    color: COLORS.primaryBlue,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
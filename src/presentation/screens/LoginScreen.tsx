// src/presentation/screens/LoginScreen.tsx

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLoginUseCase, useNotificationService } from '../../config/serviceLocator';
import { useLoginViewModel } from '../view_models/LoginViewModel';
import { supabase } from '../../config/supabaseClient';
import { RESET_PASSWORD_REDIRECT } from '../../config/env'

const COLORS = {
  primaryBlue: '#0A3D62',
  lightGray: '#F0F0F0',
  white: '#FFFFFF',
  errorRed: '#DC3545',
};

const LoginScreen: React.FC = () => {
  const loginUserUseCase = useLoginUseCase();
  const notificationService = useNotificationService();
  const { state, setField, handleLogin } = useLoginViewModel(loginUserUseCase, notificationService);
  const [isRecuperando, setIsRecuperando] = useState(false);

  const handleEsqueceuSenha = async () => {
    if (isRecuperando) return;
    if (!state.email.trim()) {
      Alert.alert("Atenção", "Digite seu e-mail no campo acima antes de continuar.");
      return;
    }
    setIsRecuperando(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        state.email.trim(),
        { redirectTo: RESET_PASSWORD_REDIRECT }
      );
      if (error) throw error;
      Alert.alert(
        "E-mail enviado",
        "Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha."
      );
    } catch (e: any) {
      Alert.alert("Erro", e?.message ?? "Falha ao enviar e-mail de recuperação.");
    } finally {
      setIsRecuperando(false);
    }
  };

  const isAnyLoading = state.isLoading || isRecuperando;

  return (
    <View style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.container}>

          <Image
            source={require('../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Agenda Setor</Text>
          <Text style={styles.subtitle}>Acesso Restrito</Text>

          <TextInput
            style={styles.input}
            placeholder="E-mail"
            placeholderTextColor="#888"
            keyboardType="email-address"
            autoCapitalize="none"
            value={state.email}
            onChangeText={(text) => setField('email', text)}
            editable={!isAnyLoading}
          />

          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor="#888"
            secureTextEntry
            value={state.password}
            onChangeText={(text) => setField('password', text)}
            editable={!isAnyLoading}
          />

          {state.error && (
            <Text style={styles.errorText}>{state.error}</Text>
          )}

          <TouchableOpacity
            style={[styles.button, isAnyLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isAnyLoading}
          >
            {state.isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.forgotButton, isRecuperando && styles.forgotButtonDisabled]}
            onPress={handleEsqueceuSenha}
            disabled={isRecuperando}
          >
            {isRecuperando ? (
              <View style={styles.forgotLoadingRow}>
                <ActivityIndicator size="small" color={COLORS.primaryBlue} />
                <Text style={styles.forgotTextLoading}>Enviando e-mail...</Text>
              </View>
            ) : (
              <Text style={styles.forgotText}>Esqueceu a senha?</Text>
            )}
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  keyboardView: { flex: 1 },
  container: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white },
  logo: { width: 150, height: 150, marginBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.primaryBlue, marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 40 },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: COLORS.lightGray,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#DDD',
    color: "#333",
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
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  errorText: { width: '100%', color: COLORS.errorRed, textAlign: 'center', marginBottom: 10, fontSize: 14 },
  forgotButton: { marginTop: 20, padding: 8 },
  forgotButtonDisabled: { opacity: 0.7 },
  forgotText: { color: COLORS.primaryBlue, fontSize: 14, textDecorationLine: 'underline' },
  forgotLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  forgotTextLoading: { color: COLORS.primaryBlue, fontSize: 14 },
});

export default LoginScreen;
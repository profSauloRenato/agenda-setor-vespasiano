// src/navigation/AppNavigator.tsx

import { ParamListBase, RouteProp } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { supabase } from "../config/supabaseClient";

// Importações de Telas
import CargosScreen from "../presentation/screens/CargosScreen";
import HomeScreen from "../presentation/screens/HomeScreen";
import LoginScreen from "../presentation/screens/LoginScreen";
import AgendaScreen from "../presentation/screens/AgendaScreen";
import { EventosManagerScreen } from "../presentation/screens/admin/EventosManagerScreen";
import { useEventoUseCases } from "../config/serviceLocator";
import AdminPanelScreen from "../presentation/screens/AdminPanelScreen";
import VersiculosManagerScreen from "../presentation/screens/admin/VersiculosManagerScreen";
import PerfilScreen from "../presentation/screens/PerfilScreen";
import EventoModelosManagerScreen from "../presentation/screens/admin/EventoModelosManagerScreen";
import BuscaScreen from "../presentation/screens/BuscaScreen";

import LocalizacaoTypeSelectionScreen from "../presentation/screens/admin/LocalizacaoTypeSelectionScreen";
import {
  LocalizacoesManagerScreen,
  LocalizacoesManagerScreenProps,
} from "../presentation/screens/admin/LocalizacoesManagerScreen";
import { UsuariosManagerScreen } from "../presentation/screens/admin/UsuariosManagerScreen";

import { useAuth } from "../presentation/context/AuthContext";
import {
  useCargoUseCases,
  useLocalizacaoUseCases,
  useUsuariosViewModel,
} from "../config/serviceLocator";
import { LocalizacaoUseCases } from "../presentation/view_models/LocalizacoesViewModel";

const Stack = createNativeStackNavigator();

// ------------------------------------------
// TELA DE REDEFINIÇÃO DE SENHA (deep link)
// ------------------------------------------
const ResetPasswordScreen: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const handleSalvar = async () => {
    if (!novaSenha || !confirmarSenha) {
      Alert.alert("Atenção", "Preencha todos os campos.");
      return;
    }
    if (novaSenha.length < 6) {
      Alert.alert("Atenção", "A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      Alert.alert("Atenção", "As senhas não coincidem.");
      return;
    }

    setSalvando(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: novaSenha });
      if (error) throw error;

      Alert.alert(
        "✅ Senha redefinida",
        "Sua senha foi atualizada! Faça login com a nova senha.",
        [{ text: "Ir para o login", onPress: onDone }],
      );
    } catch (e) {
      Alert.alert("Erro", (e as Error).message || "Falha ao redefinir senha.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#F8F9FA" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={resetStyles.content}>
        <View style={resetStyles.iconContainer}>
          <Feather name="lock" size={40} color="#0A3D62" />
        </View>
        <Text style={resetStyles.title}>Criar nova senha</Text>
        <Text style={resetStyles.subtitle}>
          Digite e confirme sua nova senha abaixo.
        </Text>

        <Text style={resetStyles.label}>Nova senha</Text>
        <View style={resetStyles.senhaContainer}>
          <TextInput
            style={resetStyles.senhaInput}
            value={novaSenha}
            onChangeText={setNovaSenha}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor="#999"
            secureTextEntry={!senhaVisivel}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setSenhaVisivel(v => !v)} style={resetStyles.senhaToggle}>
            <Feather name={senhaVisivel ? "eye-off" : "eye"} size={20} color="#0A3D62" />
          </TouchableOpacity>
        </View>

        <Text style={resetStyles.label}>Confirmar nova senha</Text>
        <TextInput
          style={resetStyles.input}
          value={confirmarSenha}
          onChangeText={setConfirmarSenha}
          placeholder="Repita a nova senha"
          placeholderTextColor="#999"
          secureTextEntry={!senhaVisivel}
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[resetStyles.btn, salvando && { opacity: 0.6 }]}
          onPress={handleSalvar}
          disabled={salvando}
        >
          {salvando
            ? <ActivityIndicator color="#fff" />
            : <Text style={resetStyles.btnText}>Salvar nova senha</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const resetStyles = StyleSheet.create({
  content: { padding: 24, paddingTop: 60 },
  iconContainer: { alignItems: "center", marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "700", color: "#0A3D62", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#6C757D", textAlign: "center", marginTop: 8, marginBottom: 24, lineHeight: 20 },
  label: { fontSize: 14, fontWeight: "600", color: "#343A40", marginBottom: 6, marginTop: 14 },
  input: { borderWidth: 1, borderColor: "#CED4DA", borderRadius: 8, padding: 12, fontSize: 15, color: "#333", backgroundColor: "#fff" },
  senhaContainer: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#CED4DA", borderRadius: 8, backgroundColor: "#fff" },
  senhaInput: { flex: 1, padding: 12, fontSize: 15, color: "#333" },
  senhaToggle: { padding: 12 },
  btn: { backgroundColor: "#0A3D62", borderRadius: 10, padding: 15, alignItems: "center", marginTop: 28 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});

// ------------------------------------------
// MAIN STACK
// ------------------------------------------
const MainStack = () => {
  const usuariosViewModel = useUsuariosViewModel();
  const cargoUseCases = useCargoUseCases();
  const localizacaoUseCasesDeps = useLocalizacaoUseCases();
  const eventoUseCases = useEventoUseCases();

  const localizacaoUseCases: LocalizacaoUseCases = useMemo(
    () => ({
      getLocalizacoes: localizacaoUseCasesDeps.getLocalizacoes,
      createLocalizacao: localizacaoUseCasesDeps.createLocalizacao,
      updateLocalizacao: localizacaoUseCasesDeps.updateLocalizacao,
      deleteLocalizacao: localizacaoUseCasesDeps.deleteLocalizacao,
    }),
    [localizacaoUseCasesDeps]
  );

  const adminHeaderOptions = {
    headerShown: true,
    headerStyle: { backgroundColor: "#0A3D62" },
    headerTintColor: "#FFFFFF",
  };

  const pluralizeLocationType = (type: string | undefined): string => {
    if (!type) return "Localizações";
    switch (type) {
      case "Congregação": return "Congregações";
      case "Administração": return "Administrações";
      case "Setor": return "Setores";
      case "Regional": return "Regionais";
      default: return `${type}s`;
    }
  };

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Agenda" component={AgendaScreen} options={{ ...adminHeaderOptions, title: "Agenda" }} />
      <Stack.Screen name="CargosManager" component={CargosScreen} options={{ ...adminHeaderOptions, title: "Gerenciar Cargos" }} />
      <Stack.Screen name="UsuariosManager" options={{ ...adminHeaderOptions, title: "Gerenciar Membros" }}>
        {(props) => <UsuariosManagerScreen {...props} usuariosViewModel={usuariosViewModel} cargoUseCases={cargoUseCases} />}
      </Stack.Screen>
      <Stack.Screen name="LocalizacaoTypeSelection" component={LocalizacaoTypeSelectionScreen} options={{ ...adminHeaderOptions, title: "Seleção de Localização" }} />
      <Stack.Screen
        name="LocalizacoesManager"
        options={({ route }: { route: RouteProp<ParamListBase, "LocalizacoesManager"> }) => {
          const locationType = (route.params as any)?.locationType;
          return { ...adminHeaderOptions, title: `Gerenciar ${pluralizeLocationType(locationType)}` };
        }}
      >
        {(props) => (
          <LocalizacoesManagerScreen
            {...(props as Omit<LocalizacoesManagerScreenProps, "localizacaoUseCases">)}
            localizacaoUseCases={localizacaoUseCases}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="EventosManager" options={{ ...adminHeaderOptions, title: "Gerenciar Eventos" }}>
        {(props) => <EventosManagerScreen {...props} eventoUseCases={eventoUseCases} />}
      </Stack.Screen>
      <Stack.Screen name="AdminPanel" component={AdminPanelScreen} options={{ ...adminHeaderOptions, title: "Painel Administrativo" }} />
      <Stack.Screen name="VersiculosManager" component={VersiculosManagerScreen} options={{ ...adminHeaderOptions, title: "Versículos e Mensagens" }} />
      <Stack.Screen name="Perfil" component={PerfilScreen} options={{ ...adminHeaderOptions, title: "Meu Perfil" }} />
      <Stack.Screen name="EventoModelosManager" component={EventoModelosManagerScreen} options={{ ...adminHeaderOptions, title: "Modelos de Eventos" }} />
      <Stack.Screen name="Busca" component={BuscaScreen} options={{ ...adminHeaderOptions, title: "Buscar Eventos e Reuniões" }} />
    </Stack.Navigator>
  );
};

// ------------------------------------------
// AUTH STACK
// ------------------------------------------
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
  </Stack.Navigator>
);

// ------------------------------------------
// NAVIGATOR PRINCIPAL
// ------------------------------------------
export const AppNavigator = () => {
  const { user, isLoading, isPasswordRecovery, clearPasswordRecovery } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0A3D62" />
      </View>
    );
  }

  // Deep link de recuperação de senha — tem prioridade sobre tudo
  if (isPasswordRecovery) {
    return <ResetPasswordScreen onDone={clearPasswordRecovery} />;
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
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
});
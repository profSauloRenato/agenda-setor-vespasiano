// src\navigation\AppNavigator.tsx

import { ParamListBase, RouteProp } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useMemo } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

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

// Importações do Admin Stack
import LocalizacaoTypeSelectionScreen from "../presentation/screens/admin/LocalizacaoTypeSelectionScreen";
import {
  LocalizacoesManagerScreen,
  LocalizacoesManagerScreenProps,
} from "../presentation/screens/admin/LocalizacoesManagerScreen";
import { UsuariosManagerScreen } from "../presentation/screens/admin/UsuariosManagerScreen";

// Importações de Contexto
import { useAuth } from "../presentation/context/AuthContext";

// Importação dos Hooks do Service Locator para injeção
import {
  useCargoUseCases,
  useLocalizacaoUseCases,
  useUsuariosViewModel,
} from "../config/serviceLocator";

import { LocalizacaoUseCases } from "../presentation/view_models/LocalizacoesViewModel";

// Cria o tipo de Navegador Stack
const Stack = createNativeStackNavigator();

// ------------------------------------------
// --- STACK PRINCIPAL (Home e rotas do App) ---
// ------------------------------------------
const MainStack = () => {
  // 1. INJEÇÃO DE DEPENDÊNCIA: Obtemos as instâncias únicas do Service Locator
  const usuariosViewModel = useUsuariosViewModel();
  const cargoUseCases = useCargoUseCases();
  const localizacaoUseCasesDeps = useLocalizacaoUseCases();
  const eventoUseCases = useEventoUseCases();

  // 2. Criando o objeto de Use Cases de Localização com useMemo
  const localizacaoUseCases: LocalizacaoUseCases = useMemo(
    () => ({
      getLocalizacoes: localizacaoUseCasesDeps.getLocalizacoes,
      createLocalizacao: localizacaoUseCasesDeps.createLocalizacao,
      updateLocalizacao: localizacaoUseCasesDeps.updateLocalizacao,
      deleteLocalizacao: localizacaoUseCasesDeps.deleteLocalizacao,
    }),
    [localizacaoUseCasesDeps]
  );

  // Opções de cabeçalho padrão para as telas de gerenciamento
  const adminHeaderOptions = {
    headerShown: true,
    headerStyle: { backgroundColor: "#0A3D62" },
    headerTintColor: "#FFFFFF",
  };

  // FUNÇÃO DE PLURALIZAÇÃO PARA O HEADER
  const pluralizeLocationType = (type: string | undefined): string => {
    if (!type) return "Localizações";

    switch (type) {
      case "Congregação":
        return "Congregações";
      case "Administração":
        return "Administrações";
      case "Setor":
        return "Setores";
      case "Regional":
        return "Regionais";
      default:
        return `${type}s`;
    }
  };

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* 1. Tela Home/Agenda */}
      <Stack.Screen name="Home" component={HomeScreen} />

      {/* 2. Tela da Agenda */}
      <Stack.Screen
        name="Agenda"
        component={AgendaScreen}
        options={{
          ...adminHeaderOptions,
          title: "Agenda",
        }}
      />

      {/* 3. Rota de Gerenciamento de Cargos */}
      <Stack.Screen
        name="CargosManager"
        component={CargosScreen}
        options={{
          ...adminHeaderOptions,
          title: "Gerenciar Cargos",
        }}
      />

      {/* 3. Rota de Gerenciamento de Usuários */}
      <Stack.Screen
        name="UsuariosManager"
        options={{
          ...adminHeaderOptions,
          title: "Gerenciar Membros",
        }}
      >
        {/* Usamos uma função render para injetar as dependências no componente */}
        {(props) => (
          <UsuariosManagerScreen
            {...props}
            usuariosViewModel={usuariosViewModel}
            cargoUseCases={cargoUseCases}
          />
        )}
      </Stack.Screen>

      {/* 4. Rota de SELEÇÃO DE TIPO (NÃO precisa de props customizadas) */}
      <Stack.Screen
        name="LocalizacaoTypeSelection"
        component={LocalizacaoTypeSelectionScreen}
        options={{
          ...adminHeaderOptions,
          title: "Seleção de Localização",
        }}
      />

      {/* 5. Rota de GERENCIAMENTO DE LISTA (CORRIGIDO: Pluralização do Title) */}
      <Stack.Screen
        name="LocalizacoesManager"
        options={({
          route,
        }: {
          route: RouteProp<ParamListBase, "LocalizacoesManager">;
        }) => {
          const locationType = (route.params as any)?.locationType;
          const pluralTitle = pluralizeLocationType(locationType);

          return {
            ...adminHeaderOptions,
            // Usa o resultado correto da pluralização
            title: `Gerenciar ${pluralTitle}`,
          };
        }}
      >
        {/* INJETAMOS os Use Cases de Localização APENAS AQUI */}
        {(props) => (
          <LocalizacoesManagerScreen
            // Aqui fazemos um cast forçado, informando ao TS que essas 'props'
            // correspondem à interface de props da nossa tela (exceto o localizacaoUseCases)
            {...(props as Omit<
              LocalizacoesManagerScreenProps,
              "localizacaoUseCases"
            >)}
            // Injeta a dependência localizacaoUseCases
            localizacaoUseCases={localizacaoUseCases}
          />
        )}
      </Stack.Screen>

      {/* 6. Rota de Gerenciamento de Eventos */}
      <Stack.Screen
        name="EventosManager"
        options={{
          ...adminHeaderOptions,
          title: "Gerenciar Eventos",
        }}
      >
        {(props) => (
          <EventosManagerScreen
            {...props}
            eventoUseCases={eventoUseCases}
          />
        )}
      </Stack.Screen>

      {/* 7. Rota de Painel Administrativo */}
      <Stack.Screen
        name="AdminPanel"
        component={AdminPanelScreen}
        options={{
          ...adminHeaderOptions,
          title: "Painel Administrativo",
        }}
      />

      {/* 8. Rota de Versículos e Mensagens */}
      <Stack.Screen
        name="VersiculosManager"
        component={VersiculosManagerScreen}
        options={{
          ...adminHeaderOptions,
          title: "Versículos e Mensagens",
        }}
      />

      {/* 9. Rota de Painel do Usuário */}
      <Stack.Screen
        name="Perfil"
        component={PerfilScreen}
        options={{
          ...adminHeaderOptions,
          title: "Meu Perfil",
        }}
      />

      {/* 10. Rota de Nomes dos Eventos/Reuniões */}
      <Stack.Screen
        name="EventoModelosManager"
        component={EventoModelosManagerScreen}
        options={{
          ...adminHeaderOptions,
          title: "Modelos de Eventos",
        }}
      />

      {/* 11. Rota de Tela de Busca/Filtros */}
      <Stack.Screen
        name="Busca"
        component={BuscaScreen}
        options={{
          ...adminHeaderOptions,
          title: "Buscar Eventos",
        }}
      />
    </Stack.Navigator>
  );
};

// ------------------------------------------
// --- STACK DE AUTENTICAÇÃO (MANTIDO) ---
// ------------------------------------------
const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
};

// ------------------------------------------
// --- NAVIGATOR PRINCIPAL (Switch Navigator) ---
// ------------------------------------------
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
        // Se o usuário estiver logado, vai para a MainStack
        <Stack.Screen name="Main" component={MainStack} />
      ) : (
        // Caso contrário, vai para a AuthStack (Login)
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

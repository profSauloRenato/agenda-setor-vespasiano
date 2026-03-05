// src/presentation/screens/admin/LocalizacaoTypeSelectionScreen.tsx

import { NavigationProp, useNavigation } from "@react-navigation/native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LocalizacaoTipo } from "../../../domain/models/ILocalizacao"; // Importa o tipo

// ------------------------------------------
// DEFINIÇÃO DE TIPOS DE ROTA
// ------------------------------------------
// Mapeamento das rotas do Admin Stack
type AdminStackParamList = {
  // Rota que exibe a lista, que precisa do parâmetro locationType
  LocalizacoesManager: { locationType: LocalizacaoTipo };
  // Inclua outras rotas aqui, se necessário (ex: Home)
};

type LocalizacaoTypeSelectionNavigationProp = NavigationProp<
  AdminStackParamList,
  "LocalizacoesManager"
>;

// ------------------------------------------
// MAPA DE PLURALIZAÇÃO CORRIGIDA
// ------------------------------------------
const PLURAL_NAMES: Record<LocalizacaoTipo, string> = {
  Regional: "Regionais",
  Administração: "Administrações", // CORRIGIDO
  Setor: "Setores", // CORRIGIDO
  Congregação: "Congregações", // CORRIGIDO
};

// ------------------------------------------
// COMPONENTE PRINCIPAL
// ------------------------------------------
const LocalizacaoTypeSelectionScreen: React.FC = () => {
  const navigation = useNavigation<LocalizacaoTypeSelectionNavigationProp>();

  // Tipos de localização disponíveis (Os mesmos valores do ENUM e do PLURAL_NAMES)
  const availableTypes: LocalizacaoTipo[] = [
    "Regional",
    "Administração",
    "Setor",
    "Congregação",
  ];

  const handleNavigate = (type: LocalizacaoTipo) => {
    // Navega para a tela de gerenciamento, passando o tipo como parâmetro
    navigation.navigate("LocalizacoesManager", { locationType: type });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Selecione o Tipo para Gerenciar</Text>

      {availableTypes.map((type) => (
        <TouchableOpacity
          key={type}
          style={styles.button}
          onPress={() => handleNavigate(type)}
        >
          {/* CORREÇÃO APLICADA AQUI: Usa o mapa de PLURAL_NAMES */}
          <Text style={styles.buttonText}>Gerenciar {PLURAL_NAMES[type]}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ------------------------------------------
// ESTILOS
// ------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F8F9FA",
    alignItems: "center",
    paddingTop: 50,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#0A3D62",
  },
  button: {
    backgroundColor: "#17A2B8",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginVertical: 10,
    width: "80%",
    alignItems: "center",
    elevation: 3,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default LocalizacaoTypeSelectionScreen;

// src/presentation/screens/AdminPanelScreen.tsx

import { NavigationProp, useNavigation } from "@react-navigation/native";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type RootStackParamList = {
  CargosManager: undefined;
  UsuariosManager: undefined;
  LocalizacaoTypeSelection: undefined;
  EventosManager: undefined;
  VersiculosManager: undefined;
  EventoModelosManager: undefined;
};

const AdminPanelScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const menuItems = [
    { icon: "📋", label: "Eventos", rota: "EventosManager" },
    { icon: "🗂️", label: "Modelos de Eventos", rota: "EventoModelosManager" },
    { icon: "👥", label: "Membros", rota: "UsuariosManager" },
    { icon: "📍", label: "Localizações", rota: "LocalizacaoTypeSelection" },
    { icon: "🏷️", label: "Cargos", rota: "CargosManager" },
    { icon: "📖", label: "Versículos e Mensagens", rota: "VersiculosManager" },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Painel Administrativo</Text>
      <View style={styles.grid}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.rota}
            style={styles.gridButton}
            onPress={() => navigation.navigate(item.rota as any)}
          >
            <Text style={styles.gridIcon}>{item.icon}</Text>
            <Text style={styles.gridText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    padding: 15,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0A3D62",
    marginBottom: 20,
    marginTop: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridButton: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DEE2E6",
    elevation: 2,
  },
  gridIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  gridText: {
    fontSize: 14,
    color: "#0A3D62",
    fontWeight: "600",
    textAlign: "center",
  },
});

export default AdminPanelScreen;
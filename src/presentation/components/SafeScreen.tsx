// src/presentation/components/SafeScreen.tsx
import React from "react";
import { StyleSheet, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface SafeScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const SafeScreen: React.FC<SafeScreenProps> = ({ children, style }) => (
  <SafeAreaView style={[styles.container, style]} edges={["top", "bottom"]}>
    {children}
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SafeScreen;
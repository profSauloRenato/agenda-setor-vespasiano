// src/presentation/components/SelectPicker.tsx
// Substituto do @react-native-picker/picker — sem dependência nativa, sem crash, dark mode friendly

import React, { useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface SelectPickerItem {
  label: string;
  value: string | null;
  color?: string;
}

interface SelectPickerProps {
  selectedValue: string | null;
  onValueChange: (value: string | null) => void;
  items: SelectPickerItem[];
  enabled?: boolean;
  placeholder?: string;
  style?: object;
  dropdownIconColor?: string;
}

export const SelectPicker: React.FC<SelectPickerProps> = ({
  selectedValue,
  onValueChange,
  items,
  enabled = true,
  placeholder,
  style,
  dropdownIconColor = "#17A2B8",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const selectedItem = items.find((i) => i.value === selectedValue);
  const displayLabel = selectedItem?.label ?? placeholder ?? "Selecione...";

  const handleSelect = (value: string | null) => {
    onValueChange(value);
    setIsOpen(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.trigger, !enabled && styles.triggerDisabled, style]}
        onPress={() => enabled && setIsOpen(true)}
        activeOpacity={enabled ? 0.7 : 1}
      >
        <Text
          style={[
            styles.triggerText,
            !selectedItem && styles.triggerPlaceholder,
            !enabled && styles.triggerTextDisabled,
          ]}
          numberOfLines={1}
        >
          {displayLabel}
        </Text>
        <Feather
          name="chevron-down"
          size={16}
          color={enabled ? dropdownIconColor : "#CCC"}
        />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHandle} />
            </View>
            <FlatList
              data={items}
              keyExtractor={(item, index) => `${item.value ?? "null"}-${index}`}
              renderItem={({ item }) => {
                const isSelected = item.value === selectedValue;
                return (
                  <TouchableOpacity
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() => handleSelect(item.value)}
                    activeOpacity={0.6}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                        item.color && !isSelected ? { color: item.color } : {},
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                    {isSelected && (
                      <Feather name="check" size={16} color="#17A2B8" />
                    )}
                  </TouchableOpacity>
                );
              }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    minHeight: 44,
  },
  triggerDisabled: {
    backgroundColor: "#F8F9FA",
  },
  triggerText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    marginRight: 8,
  },
  triggerPlaceholder: {
    color: "#999",
  },
  triggerTextDisabled: {
    color: "#AAA",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "60%",
    paddingHorizontal: 4,
  },
  sheetHeader: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#DEE2E6",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F4F8",
  },
  optionSelected: {
    backgroundColor: "#EEF9FB",
  },
  optionText: {
    fontSize: 15,
    color: "#333",
    flex: 1,
    marginRight: 8,
  },
  optionTextSelected: {
    color: "#17A2B8",
    fontWeight: "600",
  },
});
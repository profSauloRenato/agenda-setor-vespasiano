// src/presentation/components/CargoFormModal.tsx

import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Keyboard,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ICargo } from "../../domain/models/ICargo";
import { CreateCargoParams } from "../../domain/use_cases/cargos/CreateCargo";

interface CargoFormModalProps {
    isVisible: boolean;
    onClose: () => void;
    cargo?: ICargo; // undefined = criar, ICargo = editar
    onSubmit: (data: ICargo | CreateCargoParams) => Promise<boolean>;
    isLoading: boolean;
    error: string | null;
}

const CargoFormModal: React.FC<CargoFormModalProps> = ({
    isVisible,
    onClose,
    cargo,
    onSubmit,
    isLoading,
    error,
}) => {
    const isEditing = !!cargo;
    const [nome, setNome] = useState("");
    const [descricao, setDescricao] = useState("");

    const insets = useSafeAreaInsets();
    const screenHeight = Dimensions.get("window").height;
    const keyboardOffset = useRef(new Animated.Value(0)).current;
    const maxModalHeight = useRef(new Animated.Value(screenHeight * 0.9)).current;

    useEffect(() => {
        const show = Keyboard.addListener("keyboardDidShow", (e) => {
            const kh = e.endCoordinates.height;
            const available = screenHeight - kh - insets.top - 16;
            Animated.parallel([
                Animated.timing(keyboardOffset, { toValue: kh, duration: e.duration || 250, useNativeDriver: false }),
                Animated.timing(maxModalHeight, { toValue: available, duration: e.duration || 250, useNativeDriver: false }),
            ]).start();
        });
        const hide = Keyboard.addListener("keyboardDidHide", () => {
            Animated.parallel([
                Animated.timing(keyboardOffset, { toValue: 0, duration: 250, useNativeDriver: false }),
                Animated.timing(maxModalHeight, { toValue: screenHeight * 0.9, duration: 250, useNativeDriver: false }),
            ]).start();
        });
        return () => { show.remove(); hide.remove(); };
    }, [keyboardOffset, maxModalHeight]);

    useEffect(() => {
        if (isVisible) {
            setNome(cargo?.nome ?? "");
            setDescricao(cargo?.descricao ?? "");
        }
    }, [isVisible, cargo]);

    const handleSubmit = async () => {
        if (!nome.trim()) {
            Alert.alert("Campo obrigatório", "O nome do cargo é obrigatório.");
            return;
        }

        let success: boolean;
        if (isEditing) {
            success = await onSubmit({ ...cargo!, nome: nome.trim(), descricao: descricao.trim() || null } as ICargo);
        } else {
            success = await onSubmit({ nome: nome.trim(), descricao: descricao.trim() || undefined } as CreateCargoParams);
        }

        if (success) onClose();
    };

    return (
        <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={onClose} />
                <Animated.View style={[styles.modalView, { marginBottom: keyboardOffset, maxHeight: maxModalHeight }]}>

                    <Text style={styles.modalTitle}>
                        {isEditing ? "Editar Cargo" : "Criar Novo Cargo"}
                    </Text>

                    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

                        {error && (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        <Text style={styles.label}>Nome do Cargo *</Text>
                        <TextInput
                            style={styles.input}
                            value={nome}
                            onChangeText={setNome}
                            placeholder="Ex: Diácono"
                            placeholderTextColor="#AAA"
                            autoCapitalize="words"
                            editable={!isLoading}
                        />

                        <Text style={styles.label}>Descrição (Opcional)</Text>
                        <TextInput
                            style={[styles.input, styles.inputMultiline]}
                            value={descricao}
                            onChangeText={setDescricao}
                            placeholder="Descrição do cargo..."
                            placeholderTextColor="#AAA"
                            multiline
                            numberOfLines={3}
                            editable={!isLoading}
                        />

                    </ScrollView>

                    <View style={[styles.buttonContainer, { paddingBottom: insets.bottom || 12 }]}>
                        <TouchableOpacity style={[styles.button, styles.buttonCancel]} onPress={onClose} disabled={isLoading}>
                            <Text style={styles.buttonText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, isEditing ? styles.buttonEdit : styles.buttonCreate, isLoading && styles.buttonDisabled]}
                            onPress={handleSubmit}
                            disabled={isLoading}
                        >
                            {isLoading
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={styles.buttonText}>{isEditing ? "Salvar Cargo" : "Criar Cargo"}</Text>}
                        </TouchableOpacity>
                    </View>

                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    dismissArea: { flex: 1 },
    modalView: { backgroundColor: "white", borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingHorizontal: 20, paddingTop: 20 },
    modalTitle: { fontSize: 20, fontWeight: "bold", color: "#0A3D62", marginBottom: 15 },
    content: { paddingBottom: 8 },
    errorBox: { backgroundColor: "#FDE8E8", borderRadius: 8, padding: 10, marginBottom: 12 },
    errorText: { color: "#C0392B", fontSize: 13 },
    label: { fontSize: 13, fontWeight: "600", color: "#0A3D62", marginBottom: 5, marginTop: 12 },
    input: { backgroundColor: "#F9F9F9", borderWidth: 1, borderColor: "#CCC", borderRadius: 8, padding: 10, fontSize: 14, color: "#333" },
    inputMultiline: { minHeight: 80, textAlignVertical: "top" },
    buttonContainer: { flexDirection: "row", gap: 10, marginTop: 16, marginBottom: 14 },
    button: { flex: 1, borderRadius: 8, padding: 13, alignItems: "center" },
    buttonCancel: { backgroundColor: "#6C757D" },
    buttonCreate: { backgroundColor: "#3CB371" },
    buttonEdit: { backgroundColor: "#3CB371" },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: "#fff", fontSize: 15, fontWeight: "bold" },
});

export default CargoFormModal;
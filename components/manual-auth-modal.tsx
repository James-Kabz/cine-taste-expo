"use client"

import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, Modal, Alert, StyleSheet } from "react-native"
import { CameraView, useCameraPermissions } from "expo-camera"
import { MaterialIcons } from "@expo/vector-icons"
import { COLORS } from "@/utils/constants"

interface ManualAuthModalProps {
    visible: boolean
    onClose: () => void
    onTokenSubmit: (token: string) => void
}

export default function ManualAuthModal({ visible, onClose, onTokenSubmit }: ManualAuthModalProps) {
    const [token, setToken] = useState("")
    const [showScanner, setShowScanner] = useState(false)
    const [permission, requestPermission] = useCameraPermissions()

    const requestCameraPermission = async () => {
        if (!permission) {
            return
        }

        if (!permission.granted) {
            const response = await requestPermission()
            if (!response.granted) {
                Alert.alert("Permission Required", "Camera permission is needed to scan QR codes.")
                return
            }
        }
        setShowScanner(true)
    }

    const handleBarCodeScanned = ({ data }: { data: string }) => {
        setShowScanner(false)
        setToken(data)
        onTokenSubmit(data)
    }

    const handleManualSubmit = () => {
        if (token.trim()) {
            onTokenSubmit(token.trim())
        } else {
            Alert.alert("Error", "Please enter a valid token.")
        }
    }

    if (showScanner) {
        if (!permission?.granted) {
            return (
                <View style={styles.permissionContainer}>
                    <Text style={styles.permissionText}>We need your permission to show the camera</Text>
                    <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                        <Text style={styles.permissionButtonText}>Grant Permission</Text>
                    </TouchableOpacity>
                </View>
            )
        }

        return (
            <Modal visible={visible} animationType="slide">
                <View style={styles.scannerContainer}>
                    <CameraView
                        onBarcodeScanned={handleBarCodeScanned}
                        style={StyleSheet.absoluteFillObject}
                        barcodeScannerSettings={{
                            barcodeTypes: ["qr"]
                        }}
                    />
                    <View style={styles.scannerOverlay}>
                        <View style={styles.scannerHeader}>
                            <TouchableOpacity style={styles.scannerCloseButton} onPress={() => setShowScanner(false)}>
                                <MaterialIcons name="close" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.scannerContent}>
                            <Text style={styles.scannerText}>Scan the QR code from your browser</Text>
                            <View style={styles.scannerFrame} />
                        </View>
                    </View>
                </View>
            </Modal>
        )
    }

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Complete Authentication</Text>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialIcons name="close" size={24} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.modalSubtitle}>Enter the token from your browser or scan the QR code</Text>

                    <TextInput
                        style={styles.tokenInput}
                        placeholder="Paste your authentication token here..."
                        placeholderTextColor={COLORS.textSecondary}
                        value={token}
                        onChangeText={setToken}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={[styles.button, styles.scanButton]} onPress={requestCameraPermission}>
                            <MaterialIcons name="qr-code-scanner" size={20} color="white" />
                            <Text style={styles.buttonText}>Scan QR Code</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.button, styles.submitButton]} onPress={handleManualSubmit}>
                            <MaterialIcons name="check" size={20} color="white" />
                            <Text style={styles.buttonText}>Submit Token</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalContent: {
        backgroundColor: COLORS.background,
        borderRadius: 16,
        padding: 24,
        width: "100%",
        maxWidth: 400,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "600",
        color: COLORS.text,
    },
    modalSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 24,
        lineHeight: 20,
    },
    tokenInput: {
        borderWidth: 1,
        borderColor: COLORS.card,
        borderRadius: 12,
        padding: 16,
        fontSize: 14,
        fontFamily: "monospace",
        marginBottom: 20,
        minHeight: 100,
        backgroundColor: COLORS.card,
        color: COLORS.text,
    },
    buttonContainer: {
        flexDirection: "row",
        gap: 12,
    },
    button: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    scanButton: {
        backgroundColor: COLORS.primary,
    },
    submitButton: {
        backgroundColor: "#10b981",
    },
    buttonText: {
        color: "white",
        fontSize: 14,
        fontWeight: "600",
        marginLeft: 4,
    },
    scannerContainer: {
        flex: 1,
    },
    scannerOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    scannerHeader: {
        flexDirection: "row",
        justifyContent: "flex-end",
        padding: 20,
        paddingTop: 60,
    },
    scannerCloseButton: {
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        padding: 8,
        borderRadius: 20,
    },
    scannerContent: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    scannerText: {
        color: "white",
        fontSize: 18,
        textAlign: "center",
        marginBottom: 40,
        paddingHorizontal: 20,
    },
    scannerFrame: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: "white",
        borderRadius: 12,
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    permissionText: {
        textAlign: 'center',
        fontSize: 16,
        marginBottom: 20,
        color: COLORS.text,
    },
    permissionButton: {
        backgroundColor: COLORS.primary,
        padding: 15,
        borderRadius: 10,
    },
    permissionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
})
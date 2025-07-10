"use client"

import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, Modal, Alert, StyleSheet } from "react-native"
import { Camera } from "expo-camera"

interface ManualAuthModalProps {
  visible: boolean
  onClose: () => void
  onTokenSubmit: (token: string) => void
}

export default function ManualAuthModal({ visible, onClose, onTokenSubmit }: ManualAuthModalProps) {
  const [token, setToken] = useState("")
  const [showScanner, setShowScanner] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync()
    setHasPermission(status === "granted")
    if (status === "granted") {
      setShowScanner(true)
    } else {
      Alert.alert("Permission Required", "Camera permission is needed to scan QR codes.")
    }
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
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.scannerContainer}>
          {/* <BarCode onBarCodeScanned={handleBarCodeScanned} style={StyleSheet.absoluteFillObject} /> */}
          <View style={styles.scannerOverlay}>
            <Text style={styles.scannerText}>Scan the QR code from your browser</Text>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowScanner(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    )
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Complete Authentication</Text>
          <Text style={styles.modalSubtitle}>Enter the token from your browser or scan the QR code</Text>

          <TextInput
            style={styles.tokenInput}
            placeholder="Paste your authentication token here..."
            value={token}
            onChangeText={setToken}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.scanButton]} onPress={requestCameraPermission}>
              <Text style={styles.buttonText}>Scan QR Code</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.submitButton]} onPress={handleManualSubmit}>
              <Text style={styles.buttonText}>Submit Token</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
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
    backgroundColor: "white",
    borderRadius: 12,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
    color: "#1f2937",
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#6b7280",
    marginBottom: 24,
  },
  tokenInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: "monospace",
    marginBottom: 20,
    minHeight: 100,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  scanButton: {
    backgroundColor: "#3b82f6",
  },
  submitButton: {
    backgroundColor: "#10b981",
  },
  buttonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  closeButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  closeButtonText: {
    color: "#6b7280",
    fontSize: 14,
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  scannerText: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  cancelButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
})

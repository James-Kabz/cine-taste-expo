"use client"

import { useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native"
import ManualAuthModal from "@/components/manual-auth-modal"
import { useSession } from "@/hooks/useSession"

export default function AuthScreen() {
  const { signIn, signInWithToken, loading } = useSession()
  const [showManualAuth, setShowManualAuth] = useState(false)

  const handleGoogleSignIn = async () => {
    try {
      const result = await signIn("google")
      if (result === "manual") {
        // Show instructions for manual token entry
        Alert.alert(
          "Complete Authentication",
          "A browser window has opened. Copy the token from the page or scan the QR code, then tap 'Enter Token Manually' below.",
          [{ text: "OK" }],
        )
      }
    } catch (error) {
      console.log(error)
      Alert.alert("Error", "Failed to sign in. Please try again.")
    }
  }

  const handleManualToken = async (token: string) => {
    try {
      await signInWithToken(token)
      setShowManualAuth(false)
    } catch (error) {
      console.log(error)
      Alert.alert("Error", "Invalid token. Please try again.")
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Cinetaste</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <TouchableOpacity style={[styles.button, styles.googleButton]} onPress={handleGoogleSignIn} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "Signing in..." : "Sign in with Google"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.manualButton]} onPress={() => setShowManualAuth(true)}>
          <Text style={[styles.buttonText, styles.manualButtonText]}>Enter Token Manually</Text>
        </TouchableOpacity>
      </View>

      <ManualAuthModal
        visible={showManualAuth}
        onClose={() => setShowManualAuth(false)}
        onTokenSubmit={handleManualToken}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 48,
    textAlign: "center",
  },
  button: {
    width: "100%",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  googleButton: {
    backgroundColor: "#3b82f6",
  },
  manualButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  manualButtonText: {
    color: "#374151",
  },
})

"use client"

import { useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native"
import { useRouter } from "expo-router"
import { MaterialIcons } from "@expo/vector-icons"
import { COLORS } from "@/utils/constants"
import { useAuth } from "@/context/AuthContext"
import ManualAuthModal from "@/components/manual-auth-modal"

export default function AuthScreen() {
  const { signIn, signInWithToken, loading } = useAuth()
  const router = useRouter()
  const [showManualAuth, setShowManualAuth] = useState(false)

  const handleGoogleSignIn = async () => {
    try {
      const result = await signIn("google")
      if (result === "manual") {
        Alert.alert(
          "Complete Authentication",
          "A browser window has opened. Copy the token from the page or scan the QR code, then tap 'Enter Token Manually' below.",
          [{ text: "OK" }],
        )
      } else if (result === true) {
        // Authentication successful, go back
        if (router.canGoBack()) {
          router.back()
        } else {
          router.replace("/(tabs)/(home)")
        }
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
      // Authentication successful, go back
      if (router.canGoBack()) {
        router.back()
      } else {
        router.replace("/(tabs)/(home)")
      }
    } catch (error) {
      console.log(error)
      Alert.alert("Error", "Invalid token. Please try again.")
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back()
            } else {
              router.replace("/(tabs)/(home)")
            }
          }}
        >
          <MaterialIcons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <MaterialIcons name="movie" size={80} color={COLORS.primary} />
        <Text style={styles.title}>Welcome to Cinetaste</Text>
        <Text style={styles.subtitle}>
          Sign in to personalize your experience, create watchlists, and get recommendations.
        </Text>

        <TouchableOpacity style={[styles.button, styles.googleButton]} onPress={handleGoogleSignIn} disabled={loading}>
          <MaterialIcons name="login" size={20} color="white" />
          <Text style={styles.buttonText}>{loading ? "Signing in..." : "Sign in with Google"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.manualButton]} onPress={() => setShowManualAuth(true)}>
          <MaterialIcons name="qr-code-scanner" size={20} color={COLORS.primary} />
          <Text style={[styles.buttonText, styles.manualButtonText]}>Enter Token Manually</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>By signing in, you agree to our Terms of Service and Privacy Policy.</Text>
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
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 20,
    paddingTop: 60,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 48,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
  },
  googleButton: {
    backgroundColor: COLORS.primary,
  },
  manualButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginLeft: 8,
  },
  manualButtonText: {
    color: COLORS.primary,
  },
  disclaimer: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 32,
    lineHeight: 18,
  },
})

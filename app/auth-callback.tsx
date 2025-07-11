"use client"

import { useEffect, useState } from "react"
import { useRouter, useLocalSearchParams } from "expo-router"
import { View, Text, ActivityIndicator, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { MaterialIcons } from "@expo/vector-icons"
import { COLORS } from "@/utils/constants"

export default function AuthCallback() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const [manualToken, setManualToken] = useState("")
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Handle automatic token processing from params
  useEffect(() => {
    const processToken = async () => {
      try {
        const { success, token, error } = params

        if (error) {
          throw new Error(error as string)
        }

        if (success === "true" && token) {
          await handleToken(token as string)
        } else {
          // No valid params, show manual entry
          setShowManualEntry(true)
        }
      } catch (err: any) {
        setError(err.message || "Authentication failed")
        setShowManualEntry(true)
      } finally {
        setLoading(false)
      }
    }

    // Add a small delay to ensure the app is fully loaded
    const timer = setTimeout(processToken, 100)
    return () => clearTimeout(timer)
  }, [params])

  const handleToken = async (token: string) => {
    try {
      setLoading(true)
      await AsyncStorage.setItem("auth_token", token)
      await fetchSessionWithToken(token)

      // Small delay to ensure session is processed
      setTimeout(() => {
        router.replace("/(tabs)/profile")
      }, 500)
    } catch (err: any) {
      setError("Failed to authenticate with token")
      setShowManualEntry(true)
    } finally {
      setLoading(false)
    }
  }

  const fetchSessionWithToken = async (token: string) => {
    try {
      const response = await fetch("https://cinetaste-254.vercel.app/api/auth/session-mobile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ token }),
      })

      if (!response.ok) {
        throw new Error("Session fetch failed")
      }

      const sessionData = await response.json()
      if (sessionData?.user) {
        await AsyncStorage.setItem("session", JSON.stringify(sessionData))
      }
    } catch (err) {
      console.error("Session fetch error:", err)
      throw err
    }
  }

  const handleManualSubmit = () => {
    if (manualToken.trim()) {
      handleToken(manualToken.trim())
    } else {
      Alert.alert("Error", "Please enter a valid token")
    }
  }

  if (loading && !showManualEntry) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.title}>Completing sign in...</Text>
        <Text style={styles.subtitle}>Please wait while we finish setting up your account.</Text>
      </View>
    )
  }

  if (error && !showManualEntry) {
    return (
      <View style={styles.container}>
        <MaterialIcons name="error" size={60} color={COLORS.error} />
        <Text style={styles.errorTitle}>Authentication Failed</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.replace("/(tabs)/(home)")}>
          <Text style={styles.buttonText}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (showManualEntry) {
    return (
      <View style={styles.container}>
        <MaterialIcons name="vpn-key" size={60} color={COLORS.primary} />
        <Text style={styles.title}>Enter Authentication Token</Text>
        <Text style={styles.subtitle}>Paste the authentication token from your browser or QR code scan.</Text>

        <TextInput
          style={styles.input}
          value={manualToken}
          onChangeText={setManualToken}
          placeholder="Paste your authentication token here..."
          placeholderTextColor={COLORS.textSecondary}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={[styles.button, !manualToken.trim() && styles.buttonDisabled]}
          onPress={handleManualSubmit}
          disabled={!manualToken.trim()}
        >
          <MaterialIcons name="check" size={20} color="white" />
          <Text style={styles.buttonText}>Submit Token</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace("/(tabs)/(home)")}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return null
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    color: COLORS.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
  },
  input: {
    width: "100%",
    minHeight: 100,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    backgroundColor: COLORS.card,
    color: COLORS.text,
    fontSize: 14,
    fontFamily: "monospace",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    minWidth: 200,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  secondaryButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.error,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    color: COLORS.textSecondary,
    marginBottom: 24,
    textAlign: "center",
  },
})

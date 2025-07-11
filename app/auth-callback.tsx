"use client"

import { useEffect } from "react"
import { useRouter, useLocalSearchParams } from "expo-router"
import { View, Text, ActivityIndicator } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"

export default function AuthCallback() {
  const router = useRouter()
  const params = useLocalSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log("Auth callback received with params:", params)

        const { success, token, error } = params

        if (error) {
          console.error("Authentication error:", error)
          // Navigate to home instead of root to avoid deep linking issues
          router.replace("/(tabs)/(home)")
          return
        }

        if (success === "true" && token) {
          console.log("Processing authentication token...")

          // Store the token
          await AsyncStorage.setItem("auth_token", token as string)

          // Fetch session data
          await fetchSessionWithToken(token as string)

          // Small delay to ensure session is processed
          setTimeout(() => {
            // Navigate to profile tab to show the authenticated state
            router.replace("/(tabs)/profile")
          }, 500)
        } else {
          console.log("No valid auth data received, redirecting to home")
          router.replace("/(tabs)/(home)")
        }
      } catch (error) {
        console.error("Auth callback error:", error)
        router.replace("/(tabs)/(home)")
      }
    }

    // Add a small delay to ensure the app is fully loaded
    const timer = setTimeout(handleCallback, 100)

    return () => clearTimeout(timer)
  }, [params, router])

  const fetchSessionWithToken = async (token: string) => {
    try {
      console.log("Fetching session with token...")

      const response = await fetch("https://cinetaste-254.vercel.app/api/auth/session-mobile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ token }),
      })

      console.log("Response status:", response.status)
      const responseText = await response.text()

      if (response.ok) {
        const sessionData = JSON.parse(responseText)
        if (sessionData && sessionData.user) {
          await AsyncStorage.setItem("session", JSON.stringify(sessionData))
          console.log("Session stored successfully")
        }
      } else {
        console.error("Session fetch failed:", response.status, responseText)
      }
    } catch (error) {
      console.error("Session fetch error:", error)
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f9fafb" }}>
      <ActivityIndicator size="large" color="#3b82f6" />
      <Text style={{ marginTop: 16, fontSize: 18, fontWeight: "600", color: "#374151" }}>Completing sign in...</Text>
      <Text style={{ marginTop: 8, fontSize: 14, color: "#6b7280", textAlign: "center", paddingHorizontal: 32 }}>
        Please wait while we finish setting up your account.
      </Text>
    </View>
  )
}

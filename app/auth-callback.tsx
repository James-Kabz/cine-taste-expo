"use client"

import { useEffect } from "react"
import { useRouter } from "expo-router"
import { View, Text } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Small delay to ensure the auth process completes
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Check if we have session data in storage
        const session = await AsyncStorage.getItem("session")
        const token = await AsyncStorage.getItem("auth_token")

        if (session || token) {
          console.log("Auth successful, redirecting to home")
          router.replace("/")
        } else {
          console.log("No session found, redirecting to login")
          router.replace("/(tabs)/(home)")
        }
      } catch (error) {
        console.error("Auth callback error:", error)
        router.replace("/(tabs)/(home)")
      }
    }

    handleCallback()
  }, [router])

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Completing sign in...</Text>
    </View>
  )
}

"use client"

import { useRouter } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import { useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

WebBrowser.maybeCompleteAuthSession()

export const useSession = () => {
    const router = useRouter()
    const [session, setSession] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const signIn = async (provider = "google") => {
        try {
            setLoading(true)

            // Use the web-based callback URL that Google OAuth accepts
            const callbackUrl = "https://cinetaste-254.vercel.app/auth/mobile-callback"

            const authUrl = `https://cinetaste-254.vercel.app/api/auth/signin/${provider}?callbackUrl=${encodeURIComponent(callbackUrl)}`

            console.log("Auth URL:", authUrl)

            // Open browser for authentication
            const result = await WebBrowser.openAuthSessionAsync(
                authUrl,
                "cinetaste://auth-callback", // This is just for the WebBrowser to know when to close
            )

            console.log("Auth result:", result)

            if (result.type === "success" && result.url) {
                console.log("Success! Redirect URL:", result.url)

                // Parse the URL to extract the token
                const url = new URL(result.url)
                const searchParams = url.searchParams

                const success = searchParams.get("success")
                const token = searchParams.get("token")
                const error = searchParams.get("error")

                if (error) {
                    console.error("Authentication error from callback:", error)
                    throw new Error(`Authentication failed: ${error}`)
                }

                if (success === "true" && token) {
                    console.log("Got success and token, fetching session...")
                    await AsyncStorage.setItem("auth_token", token)
                    await fetchSessionWithToken(token)
                    router.replace("/(tabs)/(home)")
                    return true
                }
            } else if (result.type === "cancel") {
                console.log("User cancelled authentication")
                return false
            }

            return false
        } catch (error) {
            console.error("Authentication error:", error)
            throw error
        } finally {
            setLoading(false)
        }
    }

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
                    setSession(sessionData)
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

    const checkSession = async () => {
        try {
            const storedSession = await AsyncStorage.getItem("session")
            const storedToken = await AsyncStorage.getItem("auth_token")

            if (storedSession) {
                const sessionData = JSON.parse(storedSession)
                setSession(sessionData)
                setLoading(false)
                return
            }

            if (storedToken) {
                await fetchSessionWithToken(storedToken)
                return
            }

            setSession(null)
        } catch (error) {
            console.error("Session check error:", error)
            setSession(null)
        } finally {
            setLoading(false)
        }
    }

    const signOut = async () => {
        try {
            await AsyncStorage.multiRemove(["session", "auth_token"])
            setSession(null)
            router.replace("/")
        } catch (error) {
            console.error("Sign out error:", error)
            throw error
        }
    }

    useEffect(() => {
        checkSession()
    }, [])

    return {
        data: session,
        session,
        status: loading ? "loading" : session ? "authenticated" : "unauthenticated",
        loading,
        signIn,
        signOut,
    }
}

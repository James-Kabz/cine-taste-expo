"use client"

import { useRouter } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import { useState, useEffect, useCallback } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as Linking from "expo-linking"

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

            // Open browser for authentication - this will show the manual token/QR code page
            const result = await WebBrowser.openAuthSessionAsync(
                authUrl,
                "cinetaste://auth-callback", // This might not work, but the manual method will
            )

            console.log("Auth result:", result)

            // The browser will stay open showing the token/QR code
            // User will manually copy the token or scan the QR code
            return "manual" // Indicate that manual completion is needed
        } catch (error) {
            console.error("Authentication error:", error)
            throw error
        } finally {
            setLoading(false)
        }
    }


    const fetchSessionWithToken = useCallback(async (token: string) => {
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
                throw new Error("Failed to fetch session")
            }
        } catch (error) {
            console.error("Session fetch error:", error)
            throw error
        }
    }, [setSession])

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

    const signInWithToken = useCallback(async (token: string) => {
        try {
            setLoading(true)
            console.log("Signing in with manual token...")

            await AsyncStorage.setItem("auth_token", token)
            await fetchSessionWithToken(token)
            router.replace("/(tabs)/(home)")
            return true
        } catch (error) {
            console.error("Token authentication error:", error)
            throw error
        } finally {
            setLoading(false)
        }
    }, [router, setLoading, fetchSessionWithToken])

    // Handle deep links (still keep this in case deep linking works)
    useEffect(() => {

        const handleDeepLink = (url: string) => {
            console.log("Deep link received:", url)

            if (url.includes("auth-callback")) {
                const urlObj = new URL(url)
                const success = urlObj.searchParams.get("success")
                const token = urlObj.searchParams.get("token")

                if (success === "true" && token) {
                    console.log("Processing deep link authentication...")
                    signInWithToken(token)
                }
            }
        }

        const subscription = Linking.addEventListener("url", ({ url }) => {
            handleDeepLink(url)
        })

        Linking.getInitialURL().then((url) => {
            if (url) {
                handleDeepLink(url)
            }
        })

        return () => {
            subscription?.remove()
        }
    }, [router, signInWithToken])

    useEffect(() => {
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
        checkSession()
    }, [fetchSessionWithToken])

    return {
        data: session,
        session,
        status: loading ? "loading" : session ? "authenticated" : "unauthenticated",
        loading,
        signIn,
        signInWithToken,
        signOut,
    }
}

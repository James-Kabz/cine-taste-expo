"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as WebBrowser from "expo-web-browser"

WebBrowser.maybeCompleteAuthSession()

interface User {
  id: string
  name: string
  email: string
  image?: string
}

interface Session {
  user: User
  expires: string
  token: string
}

interface AuthContextType {
  session: Session | null
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  signIn: (provider?: string) => Promise<string | boolean>
  signInWithToken: (token: string) => Promise<boolean>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_BASE_URL = "https://cinetaste-254.vercel.app"
const SESSION_REFRESH_INTERVAL = 5 * 60 * 1000 // 5 minutes
const SESSION_CHECK_INTERVAL = 30 * 1000 // 30 seconds

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)


  const signOut = useCallback(async () => {
    try {
      setLoading(true)
      await AsyncStorage.multiRemove(["session", "auth_token"])
      setSession(null)
      console.log("Signed out successfully")
    } catch (error) {
      console.error("Sign out error:", error)
    } finally {
      setLoading(false)
    }
  }, [])
  const fetchSessionWithToken = async (token: string): Promise<Session | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/session-mobile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ token }),
      })

      if (response.ok) {
        const sessionData = await response.json()
        if (sessionData && sessionData.user) {
          return sessionData
        }
      } else {
        const errorText = await response.text()
        console.error("Session fetch failed:", response.status, errorText)
      }

      return null
    } catch (error) {
      console.error("Session fetch error:", error)
      return null
    }
  }

  const refreshSession = useCallback(async () => {
    try {
      const storedToken = await AsyncStorage.getItem("auth_token")
      if (storedToken) {
        console.log("Refreshing session with stored token...")
        const sessionData = await fetchSessionWithToken(storedToken)

        if (sessionData) {
          setSession(sessionData)
          await AsyncStorage.setItem("session", JSON.stringify(sessionData))
          console.log("Session refreshed successfully")
        } else {
          console.log("Session refresh failed, signing out...")
          await signOut()
        }
      }
    } catch (error) {
      console.error("Session refresh error:", error)
      await signOut()
    }
  }, [signOut])


  const checkSessionValidity = useCallback(async () => {
    try {
      const storedSession = await AsyncStorage.getItem("session")
      if (storedSession) {
        const sessionData = JSON.parse(storedSession)
        const expiryTime = new Date(sessionData.expires).getTime()
        const currentTime = new Date().getTime()

        // If session expires in less than 10 minutes, refresh it
        if (expiryTime - currentTime < 10 * 60 * 1000) {
          console.log("Session expiring soon, refreshing...")
          await refreshSession()
        }
      }
    } catch (error) {
      console.error("Session validity check error:", error)
    }
  }, [refreshSession])


  // Auto-refresh session periodically
  useEffect(() => {
    let refreshInterval: number
    let checkInterval: number

    const startAutoRefresh = () => {
      // Refresh session every 5 minutes
      refreshInterval = setInterval(() => {
        if (session) {
          console.log("Auto-refreshing session...")
          refreshSession()
        }
      }, SESSION_REFRESH_INTERVAL)

      // Check session validity every 30 seconds
      checkInterval = setInterval(() => {
        if (session) {
          checkSessionValidity()
        }
      }, SESSION_CHECK_INTERVAL)
    }

    if (session) {
      startAutoRefresh()
    }

    return () => {
      if (refreshInterval) clearInterval(refreshInterval)
      if (checkInterval) clearInterval(checkInterval)
    }
  }, [session, checkSessionValidity, refreshSession])

  const signIn = async (provider = "google") => {
    try {
      setLoading(true)

      const callbackUrl = `${API_BASE_URL}/auth/mobile-callback`
      const authUrl = `${API_BASE_URL}/api/auth/signin/${provider}?callbackUrl=${encodeURIComponent(callbackUrl)}`

      console.log("Opening auth URL:", authUrl)

      const result = await WebBrowser.openAuthSessionAsync(authUrl, "cinetaste://auth-callback")

      console.log("Auth result:", result)

      if (result.type === "success" && result.url) {
        const url = new URL(result.url)
        const searchParams = url.searchParams

        const success = searchParams.get("success")
        const token = searchParams.get("token")
        const error = searchParams.get("error")

        if (error) {
          throw new Error(`Authentication failed: ${error}`)
        }

        if (success === "true" && token) {
          await signInWithToken(token)
          return true
        }
      }

      // Return "manual" to indicate manual token entry is needed
      return "manual"
    } catch (error) {
      console.error("Authentication error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signInWithToken = async (token: string) => {
    try {
      setLoading(true)
      console.log("Signing in with token...")

      await AsyncStorage.setItem("auth_token", token)
      const sessionData = await fetchSessionWithToken(token)

      if (sessionData) {
        setSession(sessionData)
        await AsyncStorage.setItem("session", JSON.stringify(sessionData))
        console.log("Session established successfully")
        return true
      }

      throw new Error("Failed to establish session")
    } catch (error) {
      console.error("Token authentication error:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const checkStoredSession = useCallback(async () => {
    try {
      const storedSession = await AsyncStorage.getItem("session")
      const storedToken = await AsyncStorage.getItem("auth_token")

      if (storedSession) {
        const sessionData = JSON.parse(storedSession)
        const expiryTime = new Date(sessionData.expires).getTime()
        const currentTime = new Date().getTime()

        if (expiryTime > currentTime) {
          setSession(sessionData)
          console.log("Restored session from storage")
          return
        } else {
          console.log("Stored session expired")
          await AsyncStorage.removeItem("session")
        }
      }

      if (storedToken) {
        console.log("Attempting to refresh session with stored token...")
        await refreshSession()
        return
      }

      setSession(null)
    } catch (error) {
      console.error("Session check error:", error)
      setSession(null)
    } finally {
      setLoading(false)
    }
  }, [refreshSession])

  // Initialize session on app start
  useEffect(() => {
    checkStoredSession()
  }, [checkStoredSession])

  const value: AuthContextType = {
    session,
    user: session?.user || null,
    loading,
    isAuthenticated: !!session,
    signIn,
    signInWithToken,
    signOut,
    refreshSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
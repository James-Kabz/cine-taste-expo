"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as WebBrowser from "expo-web-browser"
// import { useRouter } from "expo-router"

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
  showWebView: boolean
  webViewUrl: string
  handleWebViewNavigation: (event: any) => void
  setShowWebView: (show: boolean) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_BASE_URL = "https://cinetaste-254.vercel.app"
const SESSION_REFRESH_INTERVAL = 5 * 60 * 1000 // 5 minutes
const SESSION_CHECK_INTERVAL = 30 * 1000 // 30 seconds

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  // const router = useRouter()
  const [showWebView, setShowWebView] = useState(false)
  const [webViewUrl, setWebViewUrl] = useState("")

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
  }, [session])

  const checkSessionValidity = async () => {
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
  }

  const signIn = async (provider = "google") => {
    try {
      setLoading(true)
      const callbackUrl = `${API_BASE_URL}/auth/mobile-callback`
      const authUrl = `${API_BASE_URL}/api/auth/signin/${provider}?callbackUrl=${encodeURIComponent(callbackUrl)}`

      console.log("Opening auth URL in WebView:", authUrl)

      // Show WebView instead of opening external browser
      setWebViewUrl(authUrl)
      setShowWebView(true)

      return "in-app" // Indicate we're handling auth in-app
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
      // https://cinetaste-254.vercel.app/api/auth/signin/google?callbackUrl=https%3A%2F%2Fcinetaste-254.vercel.app%2Fauth%2Fmobile-callback
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

  const refreshSession = async () => {
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
  }

  const checkStoredSession = async () => {
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
  }

  const signOut = async () => {
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
  }

  // Initialize session on app start
  useEffect(() => {
    checkStoredSession()
  }, [])

  const handleWebViewNavigation = (event: any) => {
    const url = event.url
    console.log("WebView navigating to:", url)

    if (url.includes("auth-callback")) {
      try {
        const urlObj = new URL(url)
        const success = urlObj.searchParams.get("success")
        const token = urlObj.searchParams.get("token")
        const error = urlObj.searchParams.get("error")

        if (error) {
          setShowWebView(false)
          throw new Error(error)
        }

        if (success === "true" && token) {
          console.log("Token received from WebView:", token)
          setShowWebView(false)
          signInWithToken(token)
        }
      } catch (error) {
        console.error("WebView navigation error:", error)
        setShowWebView(false)
      }
    }
  }

  const value: AuthContextType = {
    session,
    user: session?.user || null,
    loading,
    isAuthenticated: !!session,
    signIn,
    signInWithToken,
    signOut,
    refreshSession,
    showWebView,
    webViewUrl,
    handleWebViewNavigation,
    setShowWebView,
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

"use client"
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, RefreshControl, TextInput } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { Image } from "expo-image"
import { COLORS } from "@/utils/constants"
import { useAuth } from "@/context/AuthContext"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "expo-router"

interface UserStats {
  watchlistTotal: number
  watchlistWatched: number
  watchlistUnwatched: number
  watchlistMovies: number
  watchlistTvShows: number
  recentlyViewedTotal: number
  recentlyViewedMovies: number
  recentlyViewedTvShows: number
}

// Add this component before the main Profile component:

function ManualTokenInput({ onTokenSubmit }: { onTokenSubmit: (token: string) => void }) {
  const [token, setToken] = useState("")

  const handleSubmit = () => {
    if (token.trim()) {
      onTokenSubmit(token.trim())
      setToken("")
    } else {
      Alert.alert("Error", "Please enter a valid token.")
    }
  }

  return (
    <View>
      <TextInput
        style={styles.tokenInput}
        placeholder="Paste your authentication token here..."
        placeholderTextColor={COLORS.textSecondary}
        value={token}
        onChangeText={setToken}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <MaterialIcons name="check" size={20} color="white" />
        <Text style={styles.submitButtonText}>Submit Token</Text>
      </TouchableOpacity>
    </View>
  )
}

// Auth Component (inline)
function AuthComponent() {
  const { signIn, signInWithToken, loading } = useAuth()
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
    <View style={styles.authContainer}>
      <View style={styles.authContent}>
        <MaterialIcons name="movie" size={80} color={COLORS.primary} />
        <Text style={styles.authTitle}>Welcome to Cinetaste</Text>
        <Text style={styles.authSubtitle}>
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

      {/* Complete Manual Auth Modal */}
      {showManualAuth && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Complete Authentication</Text>
              <TouchableOpacity onPress={() => setShowManualAuth(false)}>
                <MaterialIcons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Enter the token from your browser</Text>

            <ManualTokenInput onTokenSubmit={handleManualToken} />
          </View>
        </View>
      )}
    </View>
  )
}

export default function Profile() {
  const { isAuthenticated, session, signOut, refreshSession } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<UserStats>({
    watchlistTotal: 0,
    watchlistWatched: 0,
    watchlistUnwatched: 0,
    watchlistMovies: 0,
    watchlistTvShows: 0,
    recentlyViewedTotal: 0,
    recentlyViewedMovies: 0,
    recentlyViewedTvShows: 0,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const getStoredToken = async () => {
    try {
      const AsyncStorage = await import("@react-native-async-storage/async-storage")
      return await AsyncStorage.default.getItem("auth_token")
    } catch (error) {
      console.error("Error getting stored token:", error)
      return null
    }
  }

  const fetchUserStats = useCallback(async () => {
    if (!session?.user) return

    try {
      const token = await getStoredToken()
      if (!token) return

      // Fetch watchlist and recently viewed data in parallel
      const [watchlistResponse, recentlyViewedResponse] = await Promise.all([
        fetch("https://cinetaste-254.vercel.app/api/watchlist", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch("https://cinetaste-254.vercel.app/api/recently-viewed", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
      ])

      let watchlistData = []
      let recentlyViewedData = []

      if (watchlistResponse.ok) {
        watchlistData = await watchlistResponse.json()
      }

      if (recentlyViewedResponse.ok) {
        recentlyViewedData = await recentlyViewedResponse.json()
      }

      // Calculate stats
      const newStats: UserStats = {
        watchlistTotal: watchlistData.length,
        watchlistWatched: watchlistData.filter((item: any) => item.watched).length,
        watchlistUnwatched: watchlistData.filter((item: any) => !item.watched).length,
        watchlistMovies: watchlistData.filter((item: any) => item.mediaType === "movie").length,
        watchlistTvShows: watchlistData.filter((item: any) => item.mediaType === "tv").length,
        recentlyViewedTotal: recentlyViewedData.length,
        recentlyViewedMovies: recentlyViewedData.filter((item: any) => item.mediaType === "movie").length,
        recentlyViewedTvShows: recentlyViewedData.filter((item: any) => item.mediaType === "tv").length,
      }

      setStats(newStats)
    } catch (error) {
      console.error("Error fetching user stats:", error)
    } finally {
      setLoading(false)
    }
  }, [session])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([fetchUserStats(), refreshSession()])
    setRefreshing(false)
  }, [fetchUserStats, refreshSession])

  useEffect(() => {
    if (session?.user) {
      fetchUserStats()
    } else {
      setLoading(false)
    }
  }, [session, fetchUserStats])

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut()
          } catch (error) {
            console.log(error)
            Alert.alert("Error", "Failed to sign out")
          }
        },
      },
    ])
  }

  // If not authenticated, show auth screen
  if (!isAuthenticated) {
    return <AuthComponent />
  }

  const menuItems = [
    {
      icon: "bookmark",
      title: "My Watchlist",
      subtitle: `${stats.watchlistTotal} items in your watchlist`,
      onPress: () => router.push("/(tabs)/watchlist"),
    },
    {
      icon: "history",
      title: "Recently Viewed",
      subtitle: `${stats.recentlyViewedTotal} recently viewed items`,
      onPress: () => router.push("/(tabs)/watchlist"),
    },
    {
      icon: "notifications",
      title: "Notifications",
      subtitle: "Manage your notification preferences",
      onPress: () => Alert.alert("Coming Soon", "Notifications settings will be available soon"),
    },
    {
      icon: "help",
      title: "Help & Support",
      subtitle: "Get help and contact support",
      onPress: () => Alert.alert("Coming Soon", "Help section will be available soon"),
    },
  ]

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* User Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          {session?.user.image ? (
            <Image style={styles.avatar} source={{ uri: session.user.image }} contentFit="cover" />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialIcons name="person" size={40} color={COLORS.textSecondary} />
            </View>
          )}
        </View>
        <Text style={styles.userName}>{session?.user.name || "Unknown User"}</Text>
        <Text style={styles.userEmail}>{session?.user.email || "No email"}</Text>
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <TouchableOpacity style={styles.statItem} onPress={() => router.push("/(tabs)/watchlist")}>
          <Text style={styles.statNumber}>{loading ? "..." : stats.watchlistTotal}</Text>
          <Text style={styles.statLabel}>Total Watchlist</Text>
        </TouchableOpacity>
        <View style={styles.statDivider} />
        <TouchableOpacity style={styles.statItem} onPress={() => router.push("/(tabs)/watchlist")}>
          <Text style={styles.statNumber}>{loading ? "..." : stats.watchlistWatched}</Text>
          <Text style={styles.statLabel}>Watched</Text>
        </TouchableOpacity>
        <View style={styles.statDivider} />
        <TouchableOpacity style={styles.statItem} onPress={() => router.push("/(tabs)/watchlist")}>
          <Text style={styles.statNumber}>{loading ? "..." : stats.recentlyViewedTotal}</Text>
          <Text style={styles.statLabel}>Recently Viewed</Text>
        </TouchableOpacity>
      </View>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
            <View style={styles.menuItemLeft}>
              <MaterialIcons name={item.icon as any} size={24} color={COLORS.textSecondary} />
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
                <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Sign Out Button */}
      <View style={styles.signOutSection}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <MaterialIcons name="logout" size={20} color={COLORS.primary} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 16,
    paddingTop: 60,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.card,
    justifyContent: "center",
    alignItems: "center",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  statsSection: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    borderRadius: 12,
    paddingVertical: 20,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.textSecondary,
    opacity: 0.3,
  },
  menuSection: {
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuItemText: {
    marginLeft: 16,
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  signOutSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  signOutText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
  },
  // Auth styles
  authContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  authContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  authTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 12,
  },
  authSubtitle: {
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
  // Modal styles
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  tokenInput: {
    borderWidth: 1,
    borderColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    fontFamily: "monospace",
    marginBottom: 20,
    minHeight: 100,
    backgroundColor: COLORS.card,
    color: COLORS.text,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10b981",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  submitButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
})

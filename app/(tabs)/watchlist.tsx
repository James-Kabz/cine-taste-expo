"use client"
import { useAuth } from "@/context/AuthContext"
import { COLORS } from "@/utils/constants"
import { Ionicons, MaterialIcons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useCallback, useEffect, useState } from "react"
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native"

interface WatchlistItem {
  id: string
  movieId: number
  mediaType: "movie" | "tv"
  movieTitle: string
  moviePoster: string
  movieYear: string
  rating: number
  genre: string
  addedAt: string
  watched?: boolean
  watchedAt?: string | null
}

interface RecentlyViewedItem {
  id: string
  movieId: number
  mediaType: "movie" | "tv"
  movieTitle: string
  moviePoster: string
  movieYear: string
  rating: number
  genre: string
  viewedAt: string
}

type FilterType = "all" | "unwatched" | "watched"
type TabType = "watchlist" | "recently-viewed"

export default function WatchlistScreen() {
  const { isAuthenticated, session, refreshSession } = useAuth()
  const router = useRouter()
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const [activeTab, setActiveTab] = useState<TabType>("watchlist")

  const fetchWatchlist = useCallback(async () => {
    if (!session?.user) return

    try {
      const token = await getStoredToken()
      if (!token) return

      console.log("Fetching watchlist...")
      const response = await fetch("https://cinetaste-254.vercel.app/api/watchlist", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Watchlist fetched:", data.length, "items")
        setWatchlist(data)
      } else {
        console.error("Failed to fetch watchlist:", response.status)
      }
    } catch (error) {
      console.error("Error fetching watchlist:", error)
    }
  }, [session])

  const fetchRecentlyViewed = useCallback(async () => {
    if (!session?.user) return

    try {
      const token = await getStoredToken()
      if (!token) return

      console.log("Fetching recently viewed...")
      const response = await fetch("https://cinetaste-254.vercel.app/api/recently-viewed", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Recently viewed fetched:", data.length, "items")
        setRecentlyViewed(data)
      } else {
        console.error("Failed to fetch recently viewed:", response.status)
      }
    } catch (error) {
      console.error("Error fetching recently viewed:", error)
    }
  }, [session])

  const getStoredToken = async () => {
    try {
      const AsyncStorage = await import("@react-native-async-storage/async-storage")
      return await AsyncStorage.default.getItem("auth_token")
    } catch (error) {
      console.error("Error getting stored token:", error)
      return null
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([fetchWatchlist(), fetchRecentlyViewed(), refreshSession()])
    setRefreshing(false)
  }, [fetchWatchlist, fetchRecentlyViewed, refreshSession])

  useEffect(() => {
    if (isAuthenticated) {
      Promise.all([fetchWatchlist(), fetchRecentlyViewed()]).finally(() => setLoading(false))
    }
  }, [isAuthenticated, fetchWatchlist, fetchRecentlyViewed])

  const handleRemoveFromWatchlist = async (item: WatchlistItem) => {
    try {
      const token = await getStoredToken()
      if (!token) return

      const response = await fetch("https://cinetaste-254.vercel.app/api/watchlist", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          movieId: item.movieId,
          mediaType: item.mediaType,
        }),
      })

      if (response.ok) {
        setWatchlist((prev) => prev.filter((w) => w.id !== item.id))
      }
    } catch (error) {
      console.error("Error removing from watchlist:", error)
    }
  }

  const handleToggleWatched = async (item: WatchlistItem) => {
    try {
      const token = await getStoredToken()
      if (!token) return

      const response = await fetch(`https://cinetaste-254.vercel.app/api/watchlist/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          watched: !item.watched,
        }),
      })

      if (response.ok) {
        const updatedItem = await response.json()
        setWatchlist((prev) => prev.map((w) => (w.id === item.id ? updatedItem : w)))
      }
    } catch (error) {
      console.error("Error updating watched status:", error)
    }
  }

  const handleClearAllWatchlist = () => {
    Alert.alert(
      "Clear Watchlist",
      "Are you sure you want to clear your entire watchlist? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getStoredToken()
              if (!token) return

              // Delete all items
              const deletePromises = watchlist.map((item) =>
                fetch("https://cinetaste-254.vercel.app/api/watchlist", {
                  method: "DELETE",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    movieId: item.movieId,
                    mediaType: item.mediaType,
                  }),
                }),
              )

              await Promise.all(deletePromises)
              setWatchlist([])
            } catch (error) {
              console.error("Error clearing watchlist:", error)
            }
          },
        },
      ],
    )
  }

  const handleClearRecentlyViewed = () => {
    Alert.alert("Clear History", "Are you sure you want to clear your recently viewed history?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear History",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await getStoredToken()
            if (!token) return

            const response = await fetch("https://cinetaste-254.vercel.app/api/recently-viewed", {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            })

            if (response.ok) {
              setRecentlyViewed([])
            }
          } catch (error) {
            console.error("Error clearing recently viewed:", error)
          }
        },
      },
    ])
  }

  const filteredWatchlist = watchlist.filter((item) => {
    if (activeFilter === "watched") return item.watched
    if (activeFilter === "unwatched") return !item.watched
    return true
  })

  const stats = {
    total: watchlist.length,
    watched: watchlist.filter((item) => item.watched).length,
    unwatched: watchlist.filter((item) => !item.watched).length,
    movies: watchlist.filter((item) => item.mediaType === "movie").length,
    tvShows: watchlist.filter((item) => item.mediaType === "tv").length,
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.unauthenticatedContainer}>
          <MaterialIcons name="bookmark-outline" size={80} color={COLORS.textSecondary} />
          <Text style={styles.unauthenticatedTitle}>Sign In Required</Text>
          <Text style={styles.unauthenticatedSubtitle}>Sign in to create and manage your personal watchlist.</Text>
          <TouchableOpacity style={styles.signInButton} onPress={() => router.push("/(tabs)/profile")}>
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const renderWatchlistItem = ({ item }: { item: WatchlistItem }) => (
    <TouchableOpacity
      style={[styles.watchlistItem, item.watched && styles.watchedItem]}
      onPress={() => {
        if (item.mediaType === "movie") {
          router.push(`/(tabs)/(home)/movies/${item.movieId}`)
        } else {
          router.push(`/(tabs)/(home)/tv/${item.movieId}`)
        }
      }}
    >
      <Image
        source={{
          uri: item.moviePoster || "https://via.placeholder.com/500x750?text=No+Poster",
        }}
        style={styles.posterImage}
      />
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <View style={styles.titleRow}>
            <Ionicons
              name={item.mediaType === "movie" ? "film" : "tv"}
              size={16}
              color={item.mediaType === "movie" ? "#3b82f6" : "#10b981"}
            />
            <Text style={styles.itemTitle} numberOfLines={2}>
              {item.movieTitle}
            </Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, item.watched ? styles.watchedButton : styles.unwatchedButton]}
              onPress={() => handleToggleWatched(item)}
            >
              <MaterialIcons name={item.watched ? "check" : "check-box-outline-blank"} size={18} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveFromWatchlist(item)}>
              <MaterialIcons name="delete-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.itemDetails}>
          <Text style={styles.itemYear}>{item.movieYear}</Text>
          <Text style={styles.itemSeparator}>•</Text>
          <Text style={styles.itemGenre}>{item.genre}</Text>
        </View>

        {item.rating > 0 && (
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          </View>
        )}

        <Text style={styles.addedDate}>
          Added {new Date(item.addedAt).toLocaleDateString()}
          {item.watched && item.watchedAt && (
            <Text style={styles.watchedDate}> • Watched {new Date(item.watchedAt).toLocaleDateString()}</Text>
          )}
        </Text>
      </View>
    </TouchableOpacity>
  )

  const renderRecentlyViewedItem = ({ item }: { item: RecentlyViewedItem }) => (
    <TouchableOpacity
      style={styles.watchlistItem}
      onPress={() => {
        if (item.mediaType === "movie") {
          router.push(`/(tabs)/(home)/movies/${item.movieId}`)
        } else {
          router.push(`/(tabs)/(home)/tv/${item.movieId}`)
        }
      }}
    >
      <Image
        source={{
          uri: item.moviePoster || "https://via.placeholder.com/500x750?text=No+Poster",
        }}
        style={styles.posterImage}
      />
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <View style={styles.titleRow}>
            <Ionicons
              name={item.mediaType === "movie" ? "film" : "tv"}
              size={16}
              color={item.mediaType === "movie" ? "#3b82f6" : "#10b981"}
            />
            <Text style={styles.itemTitle} numberOfLines={2}>
              {item.movieTitle}
            </Text>
          </View>
        </View>

        <View style={styles.itemDetails}>
          <Text style={styles.itemYear}>{item.movieYear}</Text>
          <Text style={styles.itemSeparator}>•</Text>
          <Text style={styles.itemGenre}>{item.genre}</Text>
        </View>

        {item.rating > 0 && (
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          </View>
        )}

        <View style={styles.viewedContainer}>
          <MaterialIcons name="access-time" size={14} color={COLORS.textSecondary} />
          <Text style={styles.viewedDate}>Viewed {new Date(item.viewedAt).toLocaleDateString()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Lists</Text>
      </View>

      {/* Main Tabs */}
      <View style={styles.mainTabContainer}>
        <TouchableOpacity
          style={[styles.mainTab, activeTab === "watchlist" && styles.activeMainTab]}
          onPress={() => setActiveTab("watchlist")}
        >
          <Text style={[styles.mainTabText, activeTab === "watchlist" && styles.activeMainTabText]}>
            Watchlist ({watchlist.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mainTab, activeTab === "recently-viewed" && styles.activeMainTab]}
          onPress={() => setActiveTab("recently-viewed")}
        >
          <Text style={[styles.mainTabText, activeTab === "recently-viewed" && styles.activeMainTabText]}>
            Recently Viewed ({recentlyViewed.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : activeTab === "watchlist" ? (
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {watchlist.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="bookmark-outline" size={80} color={COLORS.textSecondary} />
              <Text style={styles.emptyTitle}>Your watchlist is empty</Text>
              <Text style={styles.emptySubtitle}>
                Start adding movies and TV shows to keep track of what you want to watch.
              </Text>
              <TouchableOpacity style={styles.exploreButton} onPress={() => router.push("/(tabs)/search")}>
                <Text style={styles.exploreButtonText}>Explore Content</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Stats */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{stats.total}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{stats.unwatched}</Text>
                  <Text style={styles.statLabel}>To Watch</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{stats.watched}</Text>
                  <Text style={styles.statLabel}>Watched</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{stats.movies}</Text>
                  <Text style={styles.statLabel}>Movies</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{stats.tvShows}</Text>
                  <Text style={styles.statLabel}>TV Shows</Text>
                </View>
              </ScrollView>

              {/* Filter Tabs and Clear Button */}
              <View style={styles.filterHeader}>
                <View style={styles.filterContainer}>
                  <TouchableOpacity
                    style={[styles.filterTab, activeFilter === "all" && styles.activeFilterTab]}
                    onPress={() => setActiveFilter("all")}
                  >
                    <Text style={[styles.filterText, activeFilter === "all" && styles.activeFilterText]}>All</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterTab, activeFilter === "unwatched" && styles.activeFilterTab]}
                    onPress={() => setActiveFilter("unwatched")}
                  >
                    <Text style={[styles.filterText, activeFilter === "unwatched" && styles.activeFilterText]}>
                      To Watch
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterTab, activeFilter === "watched" && styles.activeFilterTab]}
                    onPress={() => setActiveFilter("watched")}
                  >
                    <Text style={[styles.filterText, activeFilter === "watched" && styles.activeFilterText]}>
                      Watched
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.clearButton} onPress={handleClearAllWatchlist}>
                  <Text style={styles.clearButtonText}>Clear All</Text>
                </TouchableOpacity>
              </View>

              {filteredWatchlist.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="bookmark-outline" size={80} color={COLORS.textSecondary} />
                  <Text style={styles.emptyTitle}>
                    {activeFilter === "all"
                      ? "Your watchlist is empty"
                      : `No ${activeFilter === "watched" ? "watched" : "unwatched"} items`}
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    {activeFilter === "all"
                      ? "Start adding movies and TV shows to keep track of what you want to watch."
                      : `You don't have any ${activeFilter === "watched" ? "watched" : "unwatched"} items yet.`}
                  </Text>
                  <TouchableOpacity style={styles.exploreButton} onPress={() => router.push("/(tabs)/search")}>
                    <Text style={styles.exploreButtonText}>Explore Content</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <FlatList
                  data={filteredWatchlist}
                  renderItem={renderWatchlistItem}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.listContainer}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false}
                />
              )}
            </>
          )}
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {recentlyViewed.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="access-time" size={80} color={COLORS.textSecondary} />
              <Text style={styles.emptyTitle}>No recently viewed items</Text>
              <Text style={styles.emptySubtitle}>
                Start browsing movies and TV shows to see your viewing history here.
              </Text>
              <TouchableOpacity style={styles.exploreButton} onPress={() => router.push("/(tabs)/search")}>
                <Text style={styles.exploreButtonText}>Explore Content</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.recentlyViewedHeader}>
                <Text style={styles.recentlyViewedSubtitle}>Your recently viewed movies and TV shows</Text>
                <TouchableOpacity style={styles.clearButton} onPress={handleClearRecentlyViewed}>
                  <Text style={styles.clearButtonText}>Clear History</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={recentlyViewed}
                renderItem={renderRecentlyViewedItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
              />
            </>
          )}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.text,
  },
  mainTabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  mainTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeMainTab: {
    borderBottomColor: COLORS.primary,
  },
  mainTabText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  activeMainTabText: {
    color: COLORS.primary,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statItem: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 80,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: "row",
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.card,
  },
  activeFilterTab: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  activeFilterText: {
    color: "white",
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  clearButtonText: {
    fontSize: 12,
    color: "#ef4444",
    fontWeight: "600",
  },
  recentlyViewedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  recentlyViewedSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  unauthenticatedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  unauthenticatedTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 12,
  },
  unauthenticatedSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  signInButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  signInButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    minHeight: 300,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 12,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  exploreButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  exploreButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  watchlistItem: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  watchedItem: {
    opacity: 0.6,
  },
  posterImage: {
    width: 60,
    height: 90,
    borderRadius: 8,
    backgroundColor: "#e5e7eb",
  },
  itemContent: {
    flex: 1,
    marginLeft: 12,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    marginRight: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginLeft: 8,
    flex: 1,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 6,
    borderRadius: 6,
  },
  watchedButton: {
    backgroundColor: "#10b981",
  },
  unwatchedButton: {
    backgroundColor: COLORS.textSecondary,
  },
  removeButton: {
    padding: 6,
  },
  itemDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  itemYear: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  itemSeparator: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginHorizontal: 8,
  },
  itemGenre: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 4,
  },
  addedDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  watchedDate: {
    color: "#10b981",
  },
  viewedContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewedDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
})

"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  StyleSheet,
  FlatList,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { Image } from "expo-image"
import { HelloWave } from "@/components/HelloWave"
import { ThemedText } from "@/components/ThemedText"
import { ThemedView } from "@/components/ThemedView"
import type { Movie } from "@/types"
import { useAuth } from "@/context/AuthContext"

export default function HomeScreen() {
  const { session, refreshSession } = useAuth()
  const router = useRouter()
  const params = useLocalSearchParams()
  const [movies, setMovies] = useState<Movie[]>([])
  const [watchlist, setWatchlist] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [, setTotalResults] = useState(0)
  const [activeCategory, setActiveCategory] = useState("popular")

  // Memoize categories to prevent recreation on every render
  const categories = useMemo(
    () => [
      { key: "popular", label: "Popular", description: "Most popular movies right now" },
      { key: "top_rated", label: "Top Rated", description: "Highest rated movies of all time" },
      { key: "now_playing", label: "Now Playing", description: "Currently playing in theaters" },
      { key: "upcoming", label: "Upcoming", description: "Coming soon to theaters" },
    ],
    [],
  )

  const fetchMovies = useCallback(async (category: string, page: number) => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`https://cinetaste-254.vercel.app/api/movies?category=${category}&page=${page}`)
      if (!response.ok) {
        throw new Error("Failed to fetch movies")
      }
      const data = await response.json()
      setMovies(data.results || [])
      setTotalPages(Math.min(data.total_pages || 1, 500)) // TMDB limits to 500 pages
      setTotalResults(data.total_results || 0)
    } catch (error) {
      console.error("Error fetching movies:", error)
      setError("Failed to load movies")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchWatchlist = useCallback(async () => {
    if (!session?.user) {
      return
    }

    try {
      
      const response = await fetch("https://cinetaste-254.vercel.app/api/watchlist", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Use the stored auth token instead of user.id
          "Authorization": `Bearer ${await getStoredToken()}`,
        },
      })

      
      if (!response.ok) {
        const errorText = await response.text()
        console.error("Watchlist fetch failed:", response.status, errorText)
        return
      }

      const data = await response.json()
      setWatchlist(data.map((item: any) => item.movieId))
    } catch (error) {
      console.error("Error fetching watchlist:", error)
    }
  }, [session])

  // Helper function to get stored token
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
    const category = (params.category as string) || activeCategory
    const page = Number(params.page) || 1
    await Promise.all([fetchMovies(category, page), fetchWatchlist(), refreshSession()])
    setRefreshing(false)
  }, [params.category, params.page, activeCategory, fetchMovies, fetchWatchlist, refreshSession])

  // Initialize activeCategory from params only once
  useEffect(() => {
    const category = (params.category as string) || "popular"
    setActiveCategory(category)
  }, [params.category])

  // Handle data fetching when category or page changes
  useEffect(() => {
    const category = (params.category as string) || activeCategory
    const page = Number(params.page) || 1
    setCurrentPage(page)
    fetchMovies(category, page)
  }, [params.category, params.page, activeCategory, fetchMovies])

  // Fetch watchlist when session changes
  useEffect(() => {
    fetchWatchlist()
  }, [fetchWatchlist])

  const handleAddToWatchlist = useCallback(
    async (movieId: number) => {
      if (!session?.user) {
        router.push("/(tabs)/profile")
        return
      }

      try {
        const token = await getStoredToken()
        if (!token) {
          console.error("No auth token available")
          router.push("/(tabs)/profile")
          return
        }

        const response = await fetch("https://cinetaste-254.vercel.app/api/watchlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            movieId, 
            sendEmail: false,
            mediaType: "movie"
          }),
        })

        console.log("Add to watchlist response status:", response.status)

        if (response.ok) {
          setWatchlist((prev) => [...prev, movieId])
          console.log("Movie added to watchlist successfully")
        } else {
          const errorData = await response.json()
          console.error("Failed to add to watchlist:", errorData)
          throw new Error(errorData.error || "Failed to add to watchlist")
        }
      } catch (error) {
        console.error("Error adding to watchlist:", error)
      }
    },
    [session, router],
  )

  const handleCategoryChange = useCallback(
    (category: string) => {
      if (category === activeCategory) return // Prevent unnecessary changes
      setActiveCategory(category)
      setCurrentPage(1)
      router.setParams({ category, page: "1" })
    },
    [activeCategory, router],
  )

  const handlePageChange = useCallback(
    (page: number) => {
      if (page === currentPage) return // Prevent unnecessary changes
      setCurrentPage(page)
      router.setParams({ ...params, page: page.toString() })
    },
    [currentPage, params, router],
  )

  // Memoize current category info
  const currentCategoryInfo = useMemo(
    () => categories.find((cat) => cat.key === activeCategory),
    [categories, activeCategory],
  )

  const renderMovieItem = useCallback(
    ({ item }: { item: Movie }) => (
      <TouchableOpacity style={styles.movieCard} onPress={() => router.push(`/(tabs)/(home)/movies/${item.id}`)}>
        <Image
          source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster_path}` }}
          style={styles.movieImage}
          contentFit="cover"
          placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
          cachePolicy="memory-disk" // Add caching to reduce image flashing
        />
        <ThemedText style={styles.movieTitle} numberOfLines={1}>
          {item.title}
        </ThemedText>
        <View style={styles.movieFooter}>
          <ThemedText style={styles.movieRating}>⭐ {item.vote_average.toFixed(1)}</ThemedText>
          {session?.user && (
            <TouchableOpacity onPress={() => handleAddToWatchlist(item.id)}>
              <ThemedText style={styles.watchlistButton}>
                {watchlist.includes(item.id) ? "✓ Watchlist" : "+ Watchlist"}
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    ),
    [router, session, watchlist, handleAddToWatchlist],
  )

  // Memoize key extractor
  const keyExtractor = useCallback((item: Movie) => item.id.toString(), [])

  if (error) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText type="title">Something went wrong</ThemedText>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchMovies(activeCategory, currentPage)}>
          <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    )
  }

  return (
    <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <ThemedView style={styles.container}>
        {/* Welcome Header */}
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="subtitle">
            {session?.user ? `Welcome back, ${session.user.name?.split(" ")[0]}!` : "Welcome!"}
          </ThemedText>
          <HelloWave />
        </ThemedView>

        {/* Authentication Prompt */}
        {!session?.user && (
          <TouchableOpacity style={styles.authPrompt} onPress={() => router.push("/(tabs)/profile")}>
            <ThemedText style={styles.authPromptText}>Sign in to personalize your experience</ThemedText>
          </TouchableOpacity>
        )}

        {/* Movies Section */}
        <ThemedView style={styles.sectionContainer}>
          <ThemedText type="subtitle">Movies</ThemedText>
          <ThemedText style={styles.categoryDescription}>{currentCategoryInfo?.description}</ThemedText>

          {/* Category Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.key}
                style={[styles.tabButton, activeCategory === category.key && styles.activeTabButton]}
                onPress={() => handleCategoryChange(category.key)}
              >
                <ThemedText style={[styles.tabText, activeCategory === category.key && styles.activeTabText]}>
                  {category.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Movies Grid */}
          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
              <ThemedText style={{ marginTop: 16 }}>Loading movies...</ThemedText>
            </View>
          ) : (
            <>
              <FlatList
                data={movies}
                renderItem={renderMovieItem}
                keyExtractor={keyExtractor}
                numColumns={2}
                columnWrapperStyle={styles.movieRow}
                scrollEnabled={false}
                removeClippedSubviews={true}
                initialNumToRender={6}
                maxToRenderPerBatch={6}
                windowSize={10}
                getItemLayout={(data, index) => ({
                  length: 200, // Approximate item height
                  offset: 200 * Math.floor(index / 2),
                  index,
                })}
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <View style={styles.paginationContainer}>
                  <TouchableOpacity
                    style={[styles.paginationButton, currentPage === 1 && styles.disabledButton]}
                    onPress={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ThemedText style={[styles.paginationText, currentPage === 1 && styles.disabledText]}>
                      Previous
                    </ThemedText>
                  </TouchableOpacity>
                  <ThemedText style={styles.pageInfo}>
                    Page {currentPage} of {totalPages}
                  </ThemedText>
                  <TouchableOpacity
                    style={[styles.paginationButton, currentPage === totalPages && styles.disabledButton]}
                    onPress={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ThemedText style={[styles.paginationText, currentPage === totalPages && styles.disabledText]}>
                      Next
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </ThemedView>
      </ThemedView>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    marginTop: 36,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  authPrompt: {
    backgroundColor: "#3b82f6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  authPromptText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  sectionContainer: {
    gap: 12,
    marginBottom: 24,
  },
  categoryDescription: {
    color: "#666",
    marginBottom: 12,
  },
  tabContainer: {
    marginBottom: 16,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: "#e1e1e1",
  },
  activeTabButton: {
    backgroundColor: "#007AFF",
  },
  tabText: {
    color: "#333",
    fontWeight: "600",
  },
  activeTabText: {
    color: "white",
  },
  movieRow: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  movieCard: {
    width: "48%",
    marginBottom: 16,
  },
  movieImage: {
    width: "100%",
    aspectRatio: 2 / 3,
    borderRadius: 8,
    backgroundColor: "#ddd",
  },
  movieTitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "bold",
  },
  movieFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  movieRating: {
    fontSize: 12,
    color: "#888",
  },
  watchlistButton: {
    fontSize: 12,
    color: "#007AFF",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    gap: 16,
  },
  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#e1e1e1",
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  paginationText: {
    fontWeight: "600",
  },
  disabledText: {
    color: "#999",
  },
  pageInfo: {
    color: "#666",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    color: "#ff3b30",
    marginVertical: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
  },
})

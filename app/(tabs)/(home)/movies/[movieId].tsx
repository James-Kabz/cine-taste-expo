"use client"

import { ThemedText } from "@/components/ThemedText"
import { ThemedView } from "@/components/ThemedView"
import { useAuth } from "@/context/AuthContext"
import type { CastMember, MovieDetails, Video } from "@/types"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native"

interface MovieData {
  movie: MovieDetails
  credits: {
    cast: CastMember[]
    crew: {
      id: number
      name: string
      job: string
    }[]
  }
  recommendations: {
    results: any[]
  }
}

export default function MovieDetailsScreen() {
  const { movieId } = useLocalSearchParams()
  const router = useRouter()
  const { session, refreshSession } = useAuth()
  const [movieData, setMovieData] = useState<MovieData | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInWatchlist, setIsInWatchlist] = useState(false)
  const [watchlistLoading] = useState(false)

  const checkWatchlistStatus = useCallback(async () => {
    if (!session?.user) return

    try {
      const token = await getStoredToken()
      if (!token) return

      const response = await fetch("https://cinetaste-254.vercel.app/api/watchlist", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const watchlist = await response.json()
        setIsInWatchlist(watchlist.some((item: any) => item.movieId === Number(movieId)))
      }
    } catch (error) {
      console.error("Error checking watchlist:", error)
    }
  }, [movieId, session])


  const fetchMovieData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all movie data in parallel
      const [movieResponse, videosResponse] = await Promise.all([
        fetch(`https://cinetaste-254.vercel.app/api/movies/${movieId}`),
        fetch(`https://cinetaste-254.vercel.app/api/movies/${movieId}/videos`),
      ])

      if (!movieResponse.ok) throw new Error("Failed to fetch movie details")

      const data = await movieResponse.json()
      const videosData = videosResponse.ok ? await videosResponse.json() : { results: [] }

      // Normalize the data structure to match web version
      const normalizedData = {
        movie: data.movie || data.movieDetails || data,
        credits: data.credits || { cast: [], crew: [] },
        recommendations: data.recommendations || { results: [] },
      }

      setMovieData(normalizedData)
      setVideos(videosData.results?.filter((v: Video) => v.site === "YouTube") || [])

      // Check watchlist if user is logged in
      if (session?.user) {
        await checkWatchlistStatus()
      }
    } catch (error) {
      console.error("Error fetching movie details:", error)
      setError("Failed to load movie details")
    } finally {
      setLoading(false)
    }
  }, [movieId, session, checkWatchlistStatus])



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

  const onRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchMovieData(), refreshSession()])
    setRefreshing(false)
  }

  useEffect(() => {
    if (movieId) {
      fetchMovieData()
    }
  }, [movieId, fetchMovieData])

  const handleAddToWatchlist = useCallback(async () => {
    if (!session?.user?.id) {
      router.push("/(tabs)/profile");
      return;
    }

    try {
      const token = await getStoredToken();
      if (!token) {
        console.log("No token found");
        router.push("/(tabs)/profile");
        return;
      }

      console.log("Attempting to", isInWatchlist ? "remove from" : "add to", "watchlist");

      const response = await fetch("https://cinetaste-254.vercel.app/api/watchlist", {
        method: isInWatchlist ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          movieId: Number(movieId),
          mediaType: "movie",
        }),
      });

      console.log("Watchlist response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Watchlist error:", errorData);
        throw new Error(errorData.message || "Failed to update watchlist");
      }

      setIsInWatchlist(!isInWatchlist);
    } catch (error) {
      console.error("Error updating watchlist:", error);
      Alert.alert("Error", "Failed to update watchlist. Please try again.");
    }
  }, [session, movieId, isInWatchlist, router]);

  const openTrailer = (key: string) => {
    Linking.openURL(`https://www.youtube.com/watch?v=${key}`)
  }

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <ThemedText style={{ marginTop: 16 }}>Loading movie details...</ThemedText>
      </ThemedView>
    )
  }

  if (error) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText type="title">Error</ThemedText>
        <ThemedText>{error}</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={fetchMovieData}>
          <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    )
  }

  if (!movieData?.movie) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText>Movie not found</ThemedText>
      </ThemedView>
    )
  }

  const { movie, credits, recommendations } = movieData
  const director = credits?.crew?.find((person) => person.job === "Director")
  const mainCast = credits?.cast?.slice(0, 8) || []

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Backdrop Image with Gradient Overlay */}
      <View style={styles.backdropContainer}>
        {movie.backdrop_path && (
          <Image
            source={{ uri: `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` }}
            style={styles.backdropImage}
            resizeMode="cover"
          />
        )}
        <LinearGradient colors={["rgba(0,0,0,0.7)", "transparent"]} style={styles.backdropGradient} />
      </View>

      {/* Movie Poster and Basic Info */}
      <View style={styles.posterRow}>
        <Image
          source={{
            uri: movie.poster_path
              ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
              : "https://via.placeholder.com/500x750?text=No+Poster",
          }}
          style={styles.posterImage}
          resizeMode="contain"
        />
        <View style={styles.posterInfo}>
          <ThemedText type="title" style={styles.title}>
            {movie.title}
          </ThemedText>
          {movie.tagline && <ThemedText style={styles.tagline}>`{movie.tagline}`</ThemedText>}
          <ThemedText style={styles.subtitle}>
            {movie.release_date?.split("-")[0] || "N/A"} • {movie.runtime || "N/A"} min
          </ThemedText>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <ThemedText style={styles.ratingText}>{movie.vote_average?.toFixed(1) || "N/A"}/10</ThemedText>
            <ThemedText style={styles.voteCount}>({movie.vote_count?.toLocaleString() || 0} votes)</ThemedText>
          </View>
          {movie.genres?.length > 0 && (
            <View style={styles.genreContainer}>
              {movie.genres.map((genre) => (
                <View key={genre.id} style={styles.genrePill}>
                  <ThemedText style={styles.genreText}>{genre.name}</ThemedText>
                </View>
              ))}
            </View>
          )}
          {director && <ThemedText style={styles.directorText}>Director: {director.name}</ThemedText>}
          <TouchableOpacity
            style={[
              styles.watchlistButton,
              isInWatchlist && styles.watchlistButtonActive,
              watchlistLoading && styles.watchlistButtonLoading,
            ]}
            onPress={handleAddToWatchlist}
            disabled={watchlistLoading}
          >
            {watchlistLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name={isInWatchlist ? "bookmark" : "bookmark-outline"} size={20} color="white" />
            )}
            <ThemedText style={styles.watchlistText}>
              {watchlistLoading ? "Processing..." : isInWatchlist ? "In Watchlist" : "Add to Watchlist"}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Movie Details */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Overview</ThemedText>
        <ThemedText style={styles.overview}>{movie.overview || "No overview available"}</ThemedText>
      </ThemedView>

      {/* Trailers */}
      {videos.length > 0 && (
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Trailers</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {videos.map((video) => (
              <TouchableOpacity key={video.key} style={styles.trailerCard} onPress={() => openTrailer(video.key)}>
                <Image
                  source={{ uri: `https://img.youtube.com/vi/${video.key}/0.jpg` }}
                  style={styles.trailerThumbnail}
                />
                <View style={styles.playButton}>
                  <Ionicons name="play-circle" size={48} color="white" />
                </View>
                <ThemedText style={styles.trailerTitle}>{video.name}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ThemedView>
      )}

      {/* Cast */}
      {mainCast.length > 0 && (
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Cast</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {mainCast.map((person) => (
              <View key={person.id} style={styles.castCard}>
                <Image
                  source={{
                    uri: person.profile_path
                      ? `https://image.tmdb.org/t/p/w200${person.profile_path}`
                      : "https://via.placeholder.com/200x300?text=No+Image",
                  }}
                  style={styles.castImage}
                />
                <ThemedText style={styles.castName} numberOfLines={1}>
                  {person.name}
                </ThemedText>
                <ThemedText style={styles.castCharacter} numberOfLines={1}>
                  {person.character}
                </ThemedText>
              </View>
            ))}
          </ScrollView>
        </ThemedView>
      )}

      {/* Recommendations */}
      {recommendations?.results?.length > 0 && (
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">You might also like</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recommendations.results.slice(0, 10).map((movie) => (
              <TouchableOpacity
                key={movie.id}
                style={styles.recommendationCard}
                onPress={() => router.push(`/(tabs)/(home)/movies/${movie.id}`)}
              >
                <Image
                  source={{
                    uri: movie.poster_path
                      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                      : "https://via.placeholder.com/500x750?text=No+Poster",
                  }}
                  style={styles.recommendationImage}
                />
                <ThemedText style={styles.recommendationTitle} numberOfLines={1}>
                  {movie.title || movie.name}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ThemedView>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  retryButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
  },
  backdropContainer: {
    height: 250,
    width: "100%",
    position: "relative",
  },
  backdropImage: {
    width: "100%",
    height: "100%",
  },
  backdropGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 100,
  },
  posterRow: {
    flexDirection: "row",
    padding: 16,
    marginTop: -80,
  },
  posterImage: {
    width: 120,
    height: 180,
    borderRadius: 8,
    marginRight: 16,
  },
  posterInfo: {
    flex: 1,
    justifyContent: "flex-end",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#888",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#888",
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
  },
  voteCount: {
    marginLeft: 4,
    fontSize: 12,
    color: "#888",
  },
  genreContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  genrePill: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  genreText: {
    fontSize: 12,
  },
  directorText: {
    fontSize: 12,
    color: "#888",
    marginBottom: 12,
  },
  watchlistButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  watchlistButtonActive: {
    backgroundColor: "#34C759",
  },
  watchlistText: {
    color: "white",
    marginLeft: 6,
    fontWeight: "600",
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  overview: {
    marginTop: 8,
    lineHeight: 22,
  },
  trailerCard: {
    width: 280,
    marginRight: 16,
    marginTop: 12,
  },
  trailerThumbnail: {
    width: "100%",
    height: 160,
    borderRadius: 8,
  },
  playButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -24 }, { translateY: -24 }],
  },
  trailerTitle: {
    marginTop: 8,
    fontWeight: "500",
  },
  castCard: {
    width: 100,
    marginRight: 16,
    marginTop: 12,
  },
  castImage: {
    width: 100,
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  castName: {
    fontWeight: "500",
    fontSize: 12,
  },
  castCharacter: {
    fontSize: 11,
    color: "#888",
  },
  recommendationCard: {
    width: 120,
    marginRight: 16,
    marginTop: 12,
  },
  recommendationImage: {
    width: 120,
    height: 180,
    borderRadius: 8,
    marginBottom: 8,
  },
  recommendationTitle: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  watchlistButtonLoading: {
  opacity: 0.7,
},
})

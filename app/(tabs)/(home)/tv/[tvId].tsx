import { useState, useEffect, useCallback } from 'react';
import { 
  ScrollView, 
  View, 
  Image, 
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';

interface TVShowData {
  tv: {
    id: number;
    name: string;
    poster_path: string;
    backdrop_path: string;
    vote_average: number;
    vote_count: number;
    first_air_date: string;
    number_of_seasons: number;
    tagline?: string;
    overview: string;
    genres: { id: number; name: string }[];
    created_by?: { id: number; name: string }[];
  };
  credits: {
    cast: {
      id: number;
      name: string;
      character: string;
      profile_path?: string;
    }[];
  };
  recommendations: {
    results: any[];
  };
}

export default function TVShowDetailScreen() {
  const { tvId } = useLocalSearchParams();
  const router = useRouter();
  const { session } = useAuth();
  const [tvData, setTvData] = useState<TVShowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);


  const fetchTVData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [tvResponse] = await Promise.all([
        fetch(`https://cinetaste-254.vercel.app/api/tv/${tvId}`),
        fetch(`https://cinetaste-254.vercel.app/api/tv/${tvId}/credits`)
      ]);

      if (!tvResponse.ok) throw new Error('Failed to fetch TV show details');
      
      const tvData = await tvResponse.json();

      setTvData({
        tv: tvData.tv || tvData,
        credits: tvData.credits,
        recommendations: tvData.recommendations || { results: [] }
      });

      // Check watchlist if user is logged in
      if (session) {
        const watchlistResponse = await fetch(
          'https://cinetaste-254.vercel.app/api/watchlist',
          {
            headers: {
              Authorization: `Bearer ${session.token}`,
            },
          }
        );
        
        if (watchlistResponse.ok) {
          const watchlist = await watchlistResponse.json();
          setIsInWatchlist(watchlist.some((item: any) => item.movieId === Number(tvId)));
        }
      }
    } catch (error) {
      console.error('Error fetching TV show details:', error);
      setError('Failed to load TV show details');
    } finally {
      setLoading(false);
    }
  }, [tvId, session]);

  useEffect(() => {
    if (tvId) {
      fetchTVData();
    }
  }, [tvId, fetchTVData]);
  const handleAddToWatchlist = async () => {
    if (!session) {
      // router.push('/login');
      return;
    }

    try {
      const response = await fetch(
        'https://cinetaste-254.vercel.app/api/watchlist',
        {
          method: isInWatchlist ? 'DELETE' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify({ 
            movieId: Number(tvId),
            mediaType: "tv"
          }),
        }
      );

      if (response.ok) {
        setIsInWatchlist(!isInWatchlist);
      }
    } catch (error) {
      console.error('Error updating watchlist:', error);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText type="title">Error</ThemedText>
        <ThemedText>{error}</ThemedText>
        <TouchableOpacity onPress={fetchTVData} style={styles.retryButton}>
          <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  if (!tvData?.tv) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText>TV show not found</ThemedText>
      </ThemedView>
    );
  }

  const { tv, credits, recommendations } = tvData;
  const creator = tv.created_by?.[0];
  const mainCast = credits?.cast?.slice(0, 8) || [];

  return (
    <ScrollView style={styles.container}>
      {/* Backdrop Image with Gradient Overlay */}
      <View style={styles.backdropContainer}>
        {tv.backdrop_path && (
          <Image
            source={{ uri: `https://image.tmdb.org/t/p/w1280${tv.backdrop_path}` }}
            style={styles.backdropImage}
            resizeMode="cover"
          />
        )}
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'transparent']}
          style={styles.backdropGradient}
        />
      </View>

      {/* TV Show Poster and Basic Info */}
      <View style={styles.posterRow}>
        <Image
          source={{ 
            uri: tv.poster_path 
              ? `https://image.tmdb.org/t/p/w500${tv.poster_path}`
              : 'https://via.placeholder.com/500x750?text=No+Poster'
          }}
          style={styles.posterImage}
          resizeMode="contain"
        />

        <View style={styles.posterInfo}>
          <ThemedText type="title" style={styles.title}>
            {tv.name}
          </ThemedText>
          
          {tv.tagline && (
            <ThemedText style={styles.tagline}>`{tv.tagline}`</ThemedText>
          )}

          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <ThemedText style={styles.ratingText}>
              {tv.vote_average?.toFixed(1) || 'N/A'}/10
            </ThemedText>
            <ThemedText style={styles.voteCount}>
              ({tv.vote_count?.toLocaleString() || 0} votes)
            </ThemedText>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={16} color="#888" />
            <ThemedText style={styles.detailText}>
              {tv.first_air_date ? new Date(tv.first_air_date).getFullYear() : 'N/A'}
            </ThemedText>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="tv" size={16} color="#888" />
            <ThemedText style={styles.detailText}>
              {tv.number_of_seasons} Season{tv.number_of_seasons !== 1 ? 's' : ''}
            </ThemedText>
          </View>

          {tv.genres?.length > 0 && (
            <View style={styles.genreContainer}>
              {tv.genres.map((genre) => (
                <View key={genre.id} style={styles.genrePill}>
                  <ThemedText style={styles.genreText}>{genre.name}</ThemedText>
                </View>
              ))}
            </View>
          )}

          {creator && (
            <ThemedText style={styles.directorText}>
              Creator: {creator.name}
            </ThemedText>
          )}

          <TouchableOpacity
            style={[
              styles.watchlistButton,
              isInWatchlist && styles.watchlistButtonActive
            ]}
            onPress={handleAddToWatchlist}
          >
            <Ionicons
              name={isInWatchlist ? "bookmark" : "bookmark-outline"}
              size={20}
              color="white"
            />
            <ThemedText style={styles.watchlistText}>
              {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* TV Show Details */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Overview</ThemedText>
        <ThemedText style={styles.overview}>
          {tv.overview || 'No overview available'}
        </ThemedText>
      </ThemedView>

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
                      : 'https://via.placeholder.com/200x300?text=No+Image',
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
            {recommendations.results.slice(0, 10).map((show) => (
              <TouchableOpacity 
                key={show.id} 
                style={styles.recommendationCard}
                onPress={() => router.push(`/(tabs)/(home)/tv/${show.id}`) }
              >
                <Image
                  source={{
                    uri: show.poster_path
                      ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
                      : 'https://via.placeholder.com/500x750?text=No+Poster',
                  }}
                  style={styles.recommendationImage}
                />
                <ThemedText style={styles.recommendationTitle} numberOfLines={1}>
                  {show.name}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ThemedView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  retryButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  backdropContainer: {
    height: 250,
    width: '100%',
    position: 'relative',
  },
  backdropImage: {
    width: '100%',
    height: '100%',
  },
  backdropGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 100,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  posterRow: {
    flexDirection: 'row',
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
    justifyContent: 'flex-end',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#888',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
  },
  voteCount: {
    marginLeft: 4,
    fontSize: 12,
    color: '#888',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#888',
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  genrePill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
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
    color: '#888',
    marginBottom: 12,
  },
  watchlistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  watchlistButtonActive: {
    backgroundColor: '#34C759',
  },
  watchlistText: {
    color: 'white',
    marginLeft: 6,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  overview: {
    marginTop: 8,
    lineHeight: 22,
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
    fontWeight: '500',
    fontSize: 12,
  },
  castCharacter: {
    fontSize: 11,
    color: '#888',
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
    fontWeight: '500',
    textAlign: 'center',
  },
});
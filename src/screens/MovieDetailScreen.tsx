
import React, { useState } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useMovieDetails } from '../hooks/useMovies';
import { recentlyViewedService } from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';
import { COLORS, TMDB_IMAGE_BASE_URL, TMDB_BACKDROP_BASE_URL } from '../utils/constants';
import WatchListButton from '../components/WatchListButton';

const { width, height } = Dimensions.get('window');

const MovieDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { movieId, mediaType } = route.params as { movieId: number; mediaType: 'movie' | 'tv' };
  const { movie, isLoading, error } = useMovieDetails(movieId, mediaType);
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  React.useEffect(() => {
    if (movie) {
      // Add to recently viewed
      recentlyViewedService.addToRecentlyViewed(movie.id, mediaType);
    }
  }, [movie, mediaType]);

  if (isLoading) {
    return <LoadingSpinner text="Loading details..." />;
  }

  if (error || !movie) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Movie not found'}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const title = movie.title || movie.name || 'Unknown Title';
  const year = movie.release_date || movie.first_air_date || '';
  const backdropUrl = movie.backdrop_path 
    ? `${TMDB_BACKDROP_BASE_URL}${movie.backdrop_path}`
    : `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`;
  const posterUrl = movie.poster_path 
    ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`
    : null;

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const genreNames = movie.genres?.map(g => g.name).join(', ') || 'Unknown';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Backdrop Image */}
      <View style={styles.backdropContainer}>
        <Image
          style={styles.backdrop}
          source={{ uri: backdropUrl }}
          contentFit="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)', COLORS.background]}
          style={styles.gradient}
        />
        
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButtonOverlay}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Poster and Basic Info */}
        <View style={styles.headerSection}>
          {posterUrl && (
            <Image
              style={styles.poster}
              source={{ uri: posterUrl }}
              contentFit="cover"
            />
          )}
          
          <View style={styles.basicInfo}>
            <Text style={styles.title}>{title}</Text>
            
            <View style={styles.metaInfo}>
              <Text style={styles.year}>
                {year ? new Date(year).getFullYear() : 'Unknown'}
              </Text>
              {movie.runtime && (
                <>
                  <Text style={styles.separator}> • </Text>
                  <Text style={styles.runtime}>
                    {formatRuntime(movie.runtime)}
                  </Text>
                </>
              )}
            </View>
            
            <Text style={styles.genres}>{genreNames}</Text>
            
            <View style={styles.ratingContainer}>
              <MaterialIcons name="star" size={20} color={COLORS.accent} />
              <Text style={styles.rating}>
                {movie.vote_average.toFixed(1)}
              </Text>
              <Text style={styles.voteCount}>
                ({movie.vote_count.toLocaleString()} votes)
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <WatchListButton
            movieId={movie.id}
            mediaType={mediaType}
            isInWatchlist={isInWatchlist}
            onToggle={setIsInWatchlist}
          />
        </View>

        {/* Tagline */}
        {movie.tagline && (
          <View style={styles.section}>
            <Text style={styles.tagline}>"{movie.tagline}"</Text>
          </View>
        )}

        {/* Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.overview}>
            {movie.overview || 'No overview available.'}
          </Text>
        </View>

        {/* Additional Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={styles.detailValue}>{movie.status || 'Unknown'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Language:</Text>
            <Text style={styles.detailValue}>
              {movie.original_language?.toUpperCase() || 'Unknown'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Popularity:</Text>
            <Text style={styles.detailValue}>
              {movie.popularity.toFixed(0)}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backdropContainer: {
    height: height * 0.3,
    position: 'relative',
  },
  backdrop: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  backButtonOverlay: {
    position: 'absolute',
    top: 50,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  content: {
    flex: 1,
    marginTop: -60,
    paddingHorizontal: 16,
  },
  headerSection: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  poster: {
    width: 120,
    height: 180,
    borderRadius: 12,
    marginRight: 16,
  },
  basicInfo: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  year: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  separator: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  runtime: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  genres: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: 4,
  },
  voteCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  actionButtons: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 16,
    fontStyle: 'italic',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  overview: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.text,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MovieDetailScreen;

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Image } from 'expo-image';
import { Movie } from '../types';
import { TMDB_IMAGE_BASE_URL, COLORS } from '../utils/constants';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');
const cardWidth = (width - 40) / 2 - 10; // 2 columns with margins

interface MovieCardProps {
  movie: Movie & {
    name?: string // For TV shows
    first_air_date?: string // For TV shows
    media_type?: "movie" | "tv" | "person"
  }
  isInWatchlist?: boolean;
  onPress: () => void;
  onAddToWatchlist?: (movieId: number, sendEmail: boolean) => void;
  onRemoveFromWatchlist?: (movieId: number) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ 
  movie, 
  isInWatchlist = false, 
  onPress,
  onAddToWatchlist,
  onRemoveFromWatchlist
}) => {
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailOption, setShowEmailOption] = useState(false);

  // Helper functions to handle both movies and TV shows
  const getTitle = () => {
    return movie.title || movie.title || 'Unknown Title';
  };

  const getReleaseDate = () => {
    return movie.release_date;
  };

  const getYear = () => {
    const date = getReleaseDate();
    return date ? new Date(date).getFullYear() : 'TBA';
  };

  const getMediaType = () => {
    if (movie.media_type === 'tv' || (!movie.media_type && movie.name)) {
      return 'TV Show';
    }
    return 'Movie';
  };

  const handleWatchlistAction = async (sendEmail = false) => {
    if (!session) {
      Toast.show({
        type: 'info',
        text1: 'Sign in required',
        text2: 'Please sign in to add content to your watchlist.',
      });
      return;
    }

    setIsLoading(true);
    setShowEmailOption(false);
    try {
      if (isInWatchlist && onRemoveFromWatchlist) {
        await onRemoveFromWatchlist(movie.id);
        Toast.show({
          type: 'success',
          text1: 'Removed from watchlist',
          text2: `${getTitle()} removed from your watchlist.`,
        });
      } else if (onAddToWatchlist) {
        await onAddToWatchlist(movie.id, sendEmail);
      } else {
        // Default watchlist action when no custom handler is provided
        const mediaType = movie.media_type === 'tv' || (!movie.media_type && movie.name) ? 'tv' : 'movie';

        const response = await fetch('https://cinetaste-254.vercel.app/api/watchlist', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify({
            movieId: movie.id,
            mediaType,
            sendEmail,
          }),
        });

        if (response.ok) {
          Toast.show({
            type: 'success',
            text1: `${getMediaType()} added to watchlist!`,
            text2: `${getTitle()} ${sendEmail ? 'added and email sent!' : 'added to your watchlist!'}`,
          });
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to add to watchlist');
        }
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Something went wrong',
        text2: error instanceof Error ? error.message : 'Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating / 2);
    const hasHalfStar = rating % 2 >= 1;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Ionicons key={i} name="star" size={14} color="#FFD700" style={styles.starIcon} />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Ionicons key={i} name="star-half" size={14} color="#FFD700" style={styles.starIcon} />
        );
      } else {
        stars.push(
          <Ionicons key={i} name="star-outline" size={14} color="#FFD700" style={styles.starIcon} />
        );
      }
    }
    return stars;
  };

  const posterUrl = movie.poster_path 
    ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`
    : 'https://via.placeholder.com/500x750?text=No+Image';

  return (
    <View style={[styles.container, { width: cardWidth }]}>
      <TouchableOpacity onPress={onPress}>
        <Image
          style={styles.poster}
          source={{ uri: posterUrl }}
          contentFit="cover"
          transition={200}
        />
      </TouchableOpacity>

      <View style={styles.info}>
        <TouchableOpacity onPress={onPress}>
          <Text style={styles.title} numberOfLines={2}>
            {getTitle()}
          </Text>
        </TouchableOpacity>

        <View style={styles.metaContainer}>
          <View style={styles.ratingContainer}>
            {movie.vote_average !== undefined && (
              <>
                {renderStars(movie.vote_average)}
                <Text style={styles.ratingText}>({movie.vote_average.toFixed(1)})</Text>
              </>
            )}
          </View>

          <View style={styles.yearContainer}>
            <Text style={styles.year}>{getYear()}</Text>
            {movie.media_type && (
              <Text style={styles.mediaType}>
                {movie.media_type === 'tv' ? 'TV' : movie.media_type === 'movie' ? 'Movie' : 'Person'}
              </Text>
            )}
          </View>
        </View>

        {session && movie.media_type !== 'person' && (
          <View style={styles.watchlistContainer}>
            {!showEmailOption ? (
              <TouchableOpacity
                onPress={() => {
                  if (isInWatchlist) {
                    handleWatchlistAction();
                  } else {
                    setShowEmailOption(true);
                  }
                }}
                disabled={isLoading}
                style={[
                  styles.watchlistButton,
                  isInWatchlist ? styles.watchlistButtonActive : styles.watchlistButtonInactive,
                  isLoading && styles.disabledButton
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={COLORS.text} />
                ) : (
                  <>
                    <Ionicons 
                      name={isInWatchlist ? 'bookmark' : 'bookmark-outline'} 
                      size={16} 
                      color={isInWatchlist ? COLORS.text : COLORS.textSecondary} 
                    />
                    <Text style={styles.watchlistText}>
                      {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.emailOptionsContainer}>
                <TouchableOpacity
                  onPress={() => handleWatchlistAction(false)}
                  disabled={isLoading}
                  style={[styles.emailOptionButton, isLoading && styles.disabledButton]}
                >
                  <Text style={styles.emailOptionText}>Add To Watchlist</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowEmailOption(false)}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  poster: {
    width: '100%',
    height: cardWidth * 1.5,
  },
  info: {
    padding: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    marginRight: 2,
  },
  ratingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  yearContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  year: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginRight: 6,
  },
  mediaType: {
    fontSize: 10,
    color: COLORS.accent,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  watchlistContainer: {
    marginTop: 8,
  },
  watchlistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 6,
    width: '100%',
  },
  watchlistButtonActive: {
    backgroundColor: COLORS.success,
  },
  watchlistButtonInactive: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.background,
  },
  watchlistText: {
    fontSize: 12,
    marginLeft: 6,
    color: COLORS.text,
  },
  disabledButton: {
    opacity: 0.6,
  },
  emailOptionsContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 6,
    padding: 8,
  },
  emailOptionButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 6,
  },
  emailOptionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  cancelButton: {
    alignItems: 'center',
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
});

export default MovieCard;
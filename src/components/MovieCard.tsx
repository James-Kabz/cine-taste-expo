import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Movie } from '../types';
import { TMDB_IMAGE_BASE_URL, COLORS } from '../utils/constants';

const { width } = Dimensions.get('window');
const cardWidth = (width - 40) / 2 - 10; // 2 columns with margins

interface MovieCardProps {
  movie: Movie;
  onPress: () => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie, onPress }) => {
  const title = movie.title || movie.name || 'Unknown Title';
  const year = movie.release_date || movie.first_air_date || '';
  const posterUrl = movie.poster_path 
    ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`
    : 'https://via.placeholder.com/500x750?text=No+Image';

  return (
    <TouchableOpacity style={[styles.container, { width: cardWidth }]} onPress={onPress}>
      <Image
        style={styles.poster}
        source={{ uri: posterUrl }}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.year}>
          {year ? new Date(year).getFullYear() : ''}
        </Text>
        <Text style={styles.rating}>
          ★ {movie.vote_average.toFixed(1)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    overflow: 'hidden',
  },
  poster: {
    width: '100%',
    height: cardWidth * 1.5,
  },
  info: {
    padding: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  year: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  rating: {
    fontSize: 12,
    color: COLORS.accent,
  },
});

export default MovieCard;

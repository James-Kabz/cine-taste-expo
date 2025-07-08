
import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMovieSearch } from '../hooks/useMovies';
import SearchBar from '../components/SearchBar';
import MovieCard from '../components/MovieCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { COLORS } from '../utils/constants';
import { Movie } from '../types';

const SearchScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const { movies, isLoading, error, searchMovies, clearSearch } = useMovieSearch();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    searchMovies(query);
  };

  const handleClear = () => {
    setSearchQuery('');
    clearSearch();
  };

  const handleMoviePress = (movie: Movie) => {
    (navigation as any).navigate('MovieDetail' as never, { 
      movieId: movie.id, 
      mediaType: movie.media_type || 'movie' 
    } as never);
  };

  const renderEmptyState = () => {
    if (searchQuery && !isLoading && movies.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No results found for "{searchQuery}"
          </Text>
          <Text style={styles.emptySubtext}>
            Try searching with different keywords
          </Text>
        </View>
      );
    }

    if (!searchQuery) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Search for movies and TV shows
          </Text>
          <Text style={styles.emptySubtext}>
            Discover your next favorite watch
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <SearchBar
        onSearch={handleSearch}
        onClear={handleClear}
        placeholder="Search movies and TV shows..."
      />

      {isLoading ? (
        <LoadingSpinner text="Searching..." />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={movies}
          renderItem={({ item }) => (
            <MovieCard
              movie={item}
              onPress={() => handleMoviePress(item)}
            />
          )}
          keyExtractor={(item) => `${item.id}-${item.media_type}`}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 100,
  },
  emptyText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default SearchScreen;

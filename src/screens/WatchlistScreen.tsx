
import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useWatchlist } from '../hooks/useWatchlist';
import LoadingSpinner from '../components/LoadingSpinner';
import { Image } from 'expo-image';
import { COLORS, TMDB_IMAGE_BASE_URL } from '../utils/constants';
import { WatchlistItem } from '../types';

const WatchlistScreen = () => {
  const navigation = useNavigation();
  const { watchlist, isLoading, error, refetch, removeFromWatchlist, markAsWatched } = useWatchlist();
  const [filter, setFilter] = useState<'all' | 'watched' | 'unwatched'>('all');

  const filteredWatchlist = watchlist.filter(item => {
    if (filter === 'watched') return item.watched;
    if (filter === 'unwatched') return !item.watched;
    return true;
  });

  const handleMoviePress = (item: WatchlistItem) => {
    (navigation as any).navigate('MovieDetail' as never, { 
      movieId: item.movieId, 
      mediaType: item.mediaType 
    } as never);
  };

  const handleRemove = (item: WatchlistItem) => {
    Alert.alert(
      "Remove from Watchlist",
      `Remove "${item.movieTitle}" from your watchlist?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeFromWatchlist(item.id);
            } catch (error) {
              Alert.alert("Error", "Failed to remove from watchlist");
            }
          }
        }
      ]
    );
  };

  const handleMarkAsWatched = async (item: WatchlistItem) => {
    try {
      await markAsWatched(item.id);
    } catch (error) {
      Alert.alert("Error", "Failed to mark as watched");
    }
  };

  const renderWatchlistItem = ({ item }: { item: WatchlistItem }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => handleMoviePress(item)}
    >
      <Image
        style={styles.poster}
        source={{ 
          uri: item.moviePoster.startsWith('http') 
            ? item.moviePoster 
            : `${TMDB_IMAGE_BASE_URL}${item.moviePoster}` 
        }}
        contentFit="cover"
      />
      
      <View style={styles.itemInfo}>
        <Text style={styles.title} numberOfLines={2}>
          {item.movieTitle}
        </Text>
        <Text style={styles.year}>{item.movieYear}</Text>
        <Text style={styles.genre}>{item.genre}</Text>
        <Text style={styles.rating}>★ {item.rating}</Text>
        
        {item.watched && (
          <View style={styles.watchedBadge}>
            <MaterialIcons name="check-circle" size={16} color={COLORS.accent} />
            <Text style={styles.watchedText}>Watched</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        {!item.watched && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleMarkAsWatched(item)}
          >
            <MaterialIcons name="check" size={20} color={COLORS.accent} />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleRemove(item)}
        >
          <MaterialIcons name="delete" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="bookmark-border" size={64} color={COLORS.textSecondary} />
      <Text style={styles.emptyText}>Your watchlist is empty</Text>
      <Text style={styles.emptySubtext}>
        Add movies and TV shows to keep track of what you want to watch
      </Text>
    </View>
  );

  if (isLoading && watchlist.length === 0) {
    return <LoadingSpinner text="Loading watchlist..." />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {[
          { key: 'all', label: 'All' },
          { key: 'unwatched', label: 'To Watch' },
          { key: 'watched', label: 'Watched' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.filterTab,
              filter === tab.key && styles.activeFilterTab
            ]}
            onPress={() => setFilter(tab.key as any)}
          >
            <Text style={[
              styles.filterText,
              filter === tab.key && styles.activeFilterText
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredWatchlist}
        renderItem={renderWatchlistItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    alignItems: 'center',
  },
  activeFilterTab: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  activeFilterText: {
    color: COLORS.background,
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  poster: {
    width: 60,
    height: 90,
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  year: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  genre: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  rating: {
    fontSize: 12,
    color: COLORS.accent,
    marginBottom: 8,
  },
  watchedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  watchedText: {
    marginLeft: 4,
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '600',
  },
  actions: {
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
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
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WatchlistScreen;


import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { watchlistService } from '../services/apiService';
import { COLORS } from '../utils/constants';

interface WatchlistButtonProps {
  movieId: number;
  mediaType: 'movie' | 'tv';
  isInWatchlist: boolean;
  onToggle: (isAdded: boolean) => void;
}

const WatchListButton: React.FC<WatchlistButtonProps> = ({
  movieId,
  mediaType,
  isInWatchlist,
  onToggle,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handlePress = async () => {
    setIsLoading(true);
    try {
      if (isInWatchlist) {
        // Remove from watchlist - you'd need to implement this based on your API
        Alert.alert("Remove from Watchlist", "This feature needs implementation");
      } else {
        await watchlistService.addToWatchlist(movieId, mediaType);
        onToggle(true);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update watchlist");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isInWatchlist ? styles.inWatchlist : styles.notInWatchlist
      ]}
      onPress={handlePress}
      disabled={isLoading}
    >
      <MaterialIcons
        name={isInWatchlist ? "bookmark" : "bookmark-border"}
        size={20}
        color={isInWatchlist ? COLORS.background : COLORS.text}
      />
      <Text style={[
        styles.text,
        isInWatchlist ? styles.textInWatchlist : styles.textNotInWatchlist
      ]}>
        {isInWatchlist ? "In Watchlist" : "Add to Watchlist"}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  inWatchlist: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  notInWatchlist: {
    backgroundColor: 'transparent',
    borderColor: COLORS.text,
  },
  text: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  textInWatchlist: {
    color: COLORS.background,
  },
  textNotInWatchlist: {
    color: COLORS.text,
  },
});

export default WatchListButton;


import { useState, useEffect } from 'react';
import { watchlistService } from '../services/apiService';
import { WatchlistItem } from '../types';

export const useWatchlist = () => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await watchlistService.getWatchlist();
      setWatchlist(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load watchlist');
    } finally {
      setIsLoading(false);
    }
  };

  const addToWatchlist = async (movieId: number, mediaType: 'movie' | 'tv') => {
    try {
      await watchlistService.addToWatchlist(movieId, mediaType);
      await fetchWatchlist(); // Refresh list
    } catch (err) {
      throw err;
    }
  };

  const removeFromWatchlist = async (itemId: string) => {
    try {
      await watchlistService.removeFromWatchlist(itemId);
      setWatchlist(prev => prev.filter(item => item.id !== itemId));
    } catch (err) {
      throw err;
    }
  };

  const markAsWatched = async (itemId: string) => {
    try {
      await watchlistService.markAsWatched(itemId);
      setWatchlist(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { ...item, watched: true, watchedAt: new Date().toISOString() }
            : item
        )
      );
    } catch (err) {
      throw err;
    }
  };

  return {
    watchlist,
    isLoading,
    error,
    refetch: fetchWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    markAsWatched,
  };
};

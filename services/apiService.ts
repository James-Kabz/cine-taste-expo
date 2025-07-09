import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../utils/constants';
import { Movie, WatchlistItem } from '../types';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add auth token to requests
apiClient.interceptors.request.use(async (config) => {
  try {
    const sessionString = await AsyncStorage.getItem('authSession');
    if (sessionString) {
      const session = JSON.parse(sessionString);
      config.headers.Authorization = `Bearer ${session.token}`;
    }
  } catch (error) {
    console.error('Error adding auth token:', error);
  }
  return config;
});

export const movieService = {
  getMovies: async (category: string, type: 'movie' | 'tv' = 'movie', page: number = 1): Promise<Movie[]> => {
    const response = await apiClient.get(`/movies?category=${category}&type=${type}&page=${page}`);
    return response.data.results || response.data;
  },

  searchMovies: async (query: string, page: number = 1): Promise<Movie[]> => {
    const response = await apiClient.get(`/movies?q=${encodeURIComponent(query)}&type=multi&page=${page}`);
    // Ensure each movie has at least default values for required fields
    return response.data.results?.map((movie: any) => ({
      ...movie,
      vote_average: movie.vote_average || 0,
      vote_count: movie.vote_count || 0,
      overview: movie.overview || '',
      poster_path: movie.poster_path || '',
      backdrop_path: movie.backdrop_path || '',
      genre_ids: movie.genre_ids || [],
      adult: movie.adult || false,
      original_language: movie.original_language || 'en',
      popularity: movie.popularity || 0,
      media_type: movie.media_type || 'movie'
    })) || [];
  },

  getMovieDetails: async (movieId: number, mediaType: 'movie' | 'tv' = 'movie') => {
    const endpoint = mediaType === 'movie' ? `/movies/${movieId}` : `/tv/${movieId}`;
    const response = await apiClient.get(endpoint);
    return response.data;
  },

  getSearchSuggestions: async (query: string) => {
    const response = await apiClient.get(`/search/suggestions?q=${encodeURIComponent(query)}`);
    return response.data;
  },
};

export const watchlistService = {
  getWatchlist: async (): Promise<WatchlistItem[]> => {
    const response = await apiClient.get('/watchlist');
    return response.data;
  },

  addToWatchlist: async (movieId: number, mediaType: 'movie' | 'tv', sendEmail: boolean = false) => {
    const response = await apiClient.post('/watchlist', {
      movieId,
      mediaType,
      sendEmail,
    });
    return response.data;
  },

  removeFromWatchlist: async (itemId: string) => {
    const response = await apiClient.delete(`/watchlist/${itemId}`);
    return response.data;
  },

  markAsWatched: async (itemId: string) => {
    const response = await apiClient.patch(`/watchlist/${itemId}`, {
      watched: true,
    });
    return response.data;
  },
};

export const recentlyViewedService = {
  getRecentlyViewed: async () => {
    const response = await apiClient.get('/recently-viewed');
    return response.data;
  },

  addToRecentlyViewed: async (movieId: number, mediaType: 'movie' | 'tv') => {
    const response = await apiClient.post('/recently-viewed', {
      movieId,
      mediaType,
    });
    return response.data;
  },

  clearRecentlyViewed: async () => {
    const response = await apiClient.delete('/recently-viewed');
    return response.data;
  },
};

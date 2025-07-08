
import { useState, useEffect } from 'react';
import { movieService } from '../services/apiService';
import { Movie } from '../types';

export const useMovies = (category: string, type: 'movie' | 'tv' = 'movie') => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMovies();
  }, [category, type]);

  const fetchMovies = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await movieService.getMovies(category, type);
      setMovies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = () => {
    fetchMovies();
  };

  return { movies, isLoading, error, refetch };
};

export const useMovieSearch = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchMovies = async (query: string) => {
    if (!query.trim()) {
      setMovies([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await movieService.searchMovies(query);
      setMovies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  const clearSearch = () => {
    setMovies([]);
    setError(null);
  };

  return { movies, isLoading, error, searchMovies, clearSearch };
};

export const useMovieDetails = (movieId: number, mediaType: 'movie' | 'tv') => {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMovieDetails();
  }, [movieId, mediaType]);

  const fetchMovieDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await movieService.getMovieDetails(movieId, mediaType);
      setMovie(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load details');
    } finally {
      setIsLoading(false);
    }
  };

  return { movie, isLoading, error, refetch: fetchMovieDetails };
};

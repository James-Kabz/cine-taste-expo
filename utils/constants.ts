import Constants from 'expo-constants';

export const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'https://cinetaste-254.vercel.app/api';
export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
export const TMDB_BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/w1280';

export const MOVIE_CATEGORIES = {
  POPULAR: 'popular' as const,
  TOP_RATED: 'top_rated' as const,
  NOW_PLAYING: 'now_playing' as const,
  UPCOMING: 'upcoming' as const,
};

export type MovieCategory = typeof MOVIE_CATEGORIES[keyof typeof MOVIE_CATEGORIES];

export const COLORS = {
  primary: '#e50914',
  background: '#000000',
  card: '#181818',
  text: '#ffffff',
  textSecondary: '#b3b3b3',
  accent: '#46d369',
  error: '#ff6b6b',
  warning: '#ffa726',
  success: '#4caf50',
  // success_light: 'rgba(76, 175, 80, 0.1)',

};

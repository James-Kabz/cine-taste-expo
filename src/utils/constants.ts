import Constants from 'expo-constants';

export const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'https://cinetaste-254.vercel.app/api';
export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
export const TMDB_BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/w1280';

export const MOVIE_CATEGORIES = {
  POPULAR: 'popular',
  TOP_RATED: 'top_rated',
  NOW_PLAYING: 'now_playing',
  UPCOMING: 'upcoming',
} as const;

export const COLORS = {
  primary: '#e50914',
  background: '#000000',
  card: '#181818',
  text: '#ffffff',
  textSecondary: '#b3b3b3',
  accent: '#46d369',
};

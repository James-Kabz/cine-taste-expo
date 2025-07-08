
export interface Movie {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  genres?: Genre[];
  adult: boolean;
  original_language: string;
  popularity: number;
  media_type: 'movie' | 'tv';
  runtime?: number;
  tagline?: string;
  status?: string;
}

export interface Genre {
  id: number;
  name: string;
}

export interface WatchlistItem {
  id: string;
  movieId: number;
  mediaType: 'movie' | 'tv';
  movieTitle: string;
  moviePoster: string;
  movieYear: string;
  rating: number;
  genre: string;
  addedAt: string;
  watched: boolean;
  watchedAt: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export interface AuthSession {
  user: User;
  token: string;
}

export interface Cast {
  id: number;
  name: string;
  character: string;
  profile_path: string;
  order: number;
}

export interface Crew {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string;
}

export interface Credits {
  cast: Cast[];
  crew: Crew[];
}

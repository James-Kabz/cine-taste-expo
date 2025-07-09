export interface Movie {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  genre_ids: number[]
  adult: boolean
  original_language: string
  popularity: number
}

export interface MovieDetails extends Movie {
  genres: { id: number; name: string }[]
  runtime: number
  budget: number
  revenue: number
  production_companies: { id: number; name: string; logo_path: string | null }[]
  production_countries: { iso_3166_1: string; name: string }[]
  spoken_languages: { iso_639_1: string; name: string }[]
  status: string
  tagline: string
}


export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}


export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
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
export interface AuthSession {
  user: User;
  token: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
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

export interface TVShow {
  id: number
  name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string
  vote_average: number
  vote_count: number
  genre_ids: number[]
  adult: boolean
  original_language: string
  popularity: number
  origin_country: string[]
}

export interface Person {
  id: number
  name: string
  profile_path: string | null
  adult: boolean
  known_for: (Movie | TVShow)[]
  known_for_department: string
  popularity: number
}

export interface MultiSearchResult {
  id: number
  media_type: "movie" | "tv" | "person"
  title?: string // for movies
  name?: string // for TV shows and people
  overview?: string
  poster_path?: string | null
  profile_path?: string | null
  backdrop_path?: string | null
  release_date?: string // for movies
  first_air_date?: string // for TV shows
  vote_average?: number
  vote_count?: number
  genre_ids?: number[]
  adult?: boolean
  original_language?: string
  popularity: number
  known_for?: (Movie | TVShow)[] // for people
  known_for_department?: string // for people
  origin_country?: string[] // for TV shows
}


export type TmdbDetailsResponse = {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  last_air_date: string | null;
  runtime: number;
  rating: number;
  status: string;
  country: string | null;
  original_language: string;
  tagline: string | null;
  genres: Genre[];
  imdb_id: string | null;
  seasons: SeasonsType[];
  poster_path: string;
  backdrop_paths: string[];
  logo_paths: string[];
  trailer: string | null;
  cast: CastMember[];
  cache: boolean;
};

export type SeasonsType = {
  season_number: number;
  name: string;
  episode_count: number;
};

export type Genre = {
  id: number;
  name: string;
};

export type CastMember = {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
};

//
export interface SeasonTypes {
  _id: string;
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  air_date: string;
  vote_average: number;
  episodes: EpisodeTypes[];
  networks: NetworkTypes[];
}

export interface EpisodeTypes {
  id: number;
  name: string;
  overview: string;
  air_date: string;
  episode_number: number;
  episode_type: string;
  runtime: number;
  season_number: number;
  show_id: number;
  still_path: string | null;
  vote_average: number;
  vote_count: number;
  production_code: string;
  crew: CrewMemberTypes[];
  guest_stars: GuestStarTypes[];
}
export interface CrewMemberTypes {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}
export interface GuestStarTypes {
  id: number;
  name: string;
  original_name: string;
  character: string;
  credit_id: string;
  order: number;
  adult: boolean;
  gender: number;
  known_for_department: string;
  popularity: number;
  profile_path: string | null;
}
export interface NetworkTypes {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

//
export type TmdbPopularMoviesResponse = {
  page: number;
  results: TmdbMovie[];
  total_pages: number;
  total_results: number;
};

export type TmdbMovie = {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
};
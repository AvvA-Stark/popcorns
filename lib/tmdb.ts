/**
 * TMDB API Client
 * The Movie Database API wrapper for Popcorns
 */

import axios, { AxiosInstance } from 'axios';
import { Config } from '../constants/Config';

export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  popularity: number;
  original_language: string;
  adult: boolean;
}

export interface MovieDetails extends Movie {
  genres: { id: number; name: string }[];
  runtime: number;
  budget: number;
  revenue: number;
  status: string;
  tagline: string;
  homepage: string;
  production_companies: Array<{
    id: number;
    name: string;
    logo_path: string | null;
  }>;
}

export interface WatchProvider {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority: number;
}

export interface WatchProviders {
  [countryCode: string]: {
    link: string;
    flatrate?: WatchProvider[];
    rent?: WatchProvider[];
    buy?: WatchProvider[];
  };
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface Credits {
  cast: CastMember[];
  crew: CrewMember[];
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  published_at: string;
}

export interface MovieDetailsComplete extends MovieDetails {
  credits?: Credits;
  videos?: Video[];
  watchProviders?: WatchProviders;
}

class TMDBClient {
  private client: AxiosInstance;
  private imageBaseUrl: string;

  constructor() {
    this.client = axios.create({
      baseURL: Config.tmdb.baseUrl,
      params: {
        api_key: Config.tmdb.apiKey,
      },
    });
    this.imageBaseUrl = Config.tmdb.imageBaseUrl;
  }

  /**
   * Get full image URL from path
   */
  getImageUrl(path: string | null, size: string = 'w500'): string | null {
    if (!path) return null;
    return `${this.imageBaseUrl}/${size}${path}`;
  }

  /**
   * Get poster URL
   */
  getPosterUrl(path: string | null, size: keyof typeof Config.tmdb.posterSizes = 'medium'): string | null {
    const sizeString = Config.tmdb.posterSizes[size];
    return this.getImageUrl(path, sizeString);
  }

  /**
   * Get backdrop URL
   */
  getBackdropUrl(path: string | null, size: keyof typeof Config.tmdb.backdropSizes = 'medium'): string | null {
    const sizeString = Config.tmdb.backdropSizes[size];
    return this.getImageUrl(path, sizeString);
  }

  /**
   * Fetch trending movies
   */
  async getTrendingMovies(timeWindow: 'day' | 'week' = 'week', page: number = 1): Promise<Movie[]> {
    try {
      const response = await this.client.get(`/trending/movie/${timeWindow}`, {
        params: { page },
      });
      return response.data.results;
    } catch (error) {
      console.error('Error fetching trending movies:', error);
      throw error;
    }
  }

  /**
   * Fetch movie details by ID
   */
  async getMovieDetails(movieId: number): Promise<MovieDetails> {
    try {
      const response = await this.client.get(`/movie/${movieId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching movie details for ${movieId}:`, error);
      throw error;
    }
  }

  /**
   * Search movies by query
   */
  async searchMovies(query: string, page: number = 1): Promise<Movie[]> {
    try {
      const response = await this.client.get('/search/movie', {
        params: {
          query,
          page,
          include_adult: false,
        },
      });
      return response.data.results;
    } catch (error) {
      console.error('Error searching movies:', error);
      throw error;
    }
  }

  /**
   * Get watch providers (streaming availability) for a movie
   */
  async getWatchProviders(movieId: number): Promise<WatchProviders> {
    try {
      const response = await this.client.get(`/movie/${movieId}/watch/providers`);
      return response.data.results;
    } catch (error) {
      console.error(`Error fetching watch providers for ${movieId}:`, error);
      throw error;
    }
  }

  /**
   * Discover movies with filters
   */
  async discoverMovies(params: {
    page?: number;
    sortBy?: string;
    withGenres?: string;
    releaseYearMin?: number;
    releaseYearMax?: number;
    voteAverageMin?: number;
  } = {}): Promise<Movie[]> {
    try {
      const response = await this.client.get('/discover/movie', {
        params: {
          page: params.page || 1,
          sort_by: params.sortBy || 'popularity.desc',
          with_genres: params.withGenres,
          'primary_release_date.gte': params.releaseYearMin ? `${params.releaseYearMin}-01-01` : undefined,
          'primary_release_date.lte': params.releaseYearMax ? `${params.releaseYearMax}-12-31` : undefined,
          'vote_average.gte': params.voteAverageMin,
          include_adult: false,
        },
      });
      return response.data.results;
    } catch (error) {
      console.error('Error discovering movies:', error);
      throw error;
    }
  }

  /**
   * Get popular movies
   */
  async getPopularMovies(page: number = 1): Promise<Movie[]> {
    try {
      const response = await this.client.get('/movie/popular', {
        params: { page },
      });
      return response.data.results;
    } catch (error) {
      console.error('Error fetching popular movies:', error);
      throw error;
    }
  }

  /**
   * Get top rated movies
   */
  async getTopRatedMovies(page: number = 1): Promise<Movie[]> {
    try {
      const response = await this.client.get('/movie/top_rated', {
        params: { page },
      });
      return response.data.results;
    } catch (error) {
      console.error('Error fetching top rated movies:', error);
      throw error;
    }
  }

  /**
   * Get movie credits (cast & crew)
   */
  async getMovieCredits(movieId: number): Promise<Credits> {
    try {
      const response = await this.client.get(`/movie/${movieId}/credits`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching credits for ${movieId}:`, error);
      throw error;
    }
  }

  /**
   * Get movie videos (trailers, teasers, etc.)
   */
  async getVideos(movieId: number): Promise<Video[]> {
    try {
      const response = await this.client.get(`/movie/${movieId}/videos`);
      return response.data.results;
    } catch (error) {
      console.error(`Error fetching videos for ${movieId}:`, error);
      throw error;
    }
  }

  /**
   * Get complete movie details with credits, videos, and watch providers
   * This is the main method to use for the detail modal
   */
  async getMovieDetailsComplete(movieId: number): Promise<MovieDetailsComplete> {
    try {
      // Fetch all data in parallel
      const [details, credits, videos, watchProviders] = await Promise.all([
        this.getMovieDetails(movieId),
        this.getMovieCredits(movieId).catch(() => ({ cast: [], crew: [] })),
        this.getVideos(movieId).catch(() => []),
        this.getWatchProviders(movieId).catch(() => ({})),
      ]);

      return {
        ...details,
        credits,
        videos,
        watchProviders,
      };
    } catch (error) {
      console.error(`Error fetching complete details for ${movieId}:`, error);
      throw error;
    }
  }

  /**
   * Get profile image URL for cast/crew
   */
  getProfileUrl(path: string | null, size: string = 'w185'): string | null {
    return this.getImageUrl(path, size);
  }

  /**
   * Extract YouTube trailer from videos array
   * Returns the first official YouTube trailer, or any YouTube video if no official trailer
   */
  getYouTubeTrailer(videos: Video[]): Video | null {
    // First, try to find an official trailer
    const officialTrailer = videos.find(
      (v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official
    );
    if (officialTrailer) return officialTrailer;

    // Fallback: any YouTube trailer
    const anyTrailer = videos.find(
      (v) => v.site === 'YouTube' && v.type === 'Trailer'
    );
    if (anyTrailer) return anyTrailer;

    // Last resort: any YouTube video
    const anyVideo = videos.find((v) => v.site === 'YouTube');
    return anyVideo || null;
  }
}

// Export singleton instance
export const tmdb = new TMDBClient();
export default tmdb;

/**
 * Supabase client setup
 * Backend for user authentication, watchlists, and reviews
 */

import { createClient } from '@supabase/supabase-js';
import { Config } from '../constants/Config';

// Initialize Supabase client
export const supabase = createClient(
  Config.supabase.url,
  Config.supabase.anonKey
);

// Database types (to be expanded)
export interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  created_at: string;
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  movie_id: number;
  movie_title: string;
  movie_poster: string;
  added_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  movie_id: number;
  rating: number;
  review_text?: string;
  created_at: string;
}

// Helper functions (to be implemented)
export const supabaseHelpers = {
  async addToWatchlist(movieId: number, movieTitle: string, moviePoster: string) {
    // TODO: Implement
    console.log('Adding to watchlist:', movieId);
  },

  async removeFromWatchlist(movieId: number) {
    // TODO: Implement
    console.log('Removing from watchlist:', movieId);
  },

  async getWatchlist() {
    // TODO: Implement
    console.log('Fetching watchlist');
    return [];
  },

  async submitReview(movieId: number, rating: number, reviewText?: string) {
    // TODO: Implement
    console.log('Submitting review:', movieId, rating);
  },
};

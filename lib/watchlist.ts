/**
 * Watchlist Service
 * Manages persistent storage of user's saved movies
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Movie } from './tmdb';

const WATCHLIST_KEY = '@popcorns:watchlist';

export interface WatchlistItem {
  id: number;
  title: string;
  posterPath: string | null;
  addedAt: number;
  priority: 'normal' | 'super'; // normal = right swipe, super = up swipe
  overview?: string;
  releaseDate?: string;
  voteAverage?: number;
}

/**
 * Add a movie to the watchlist
 */
export async function addToWatchlist(
  movie: Movie,
  priority: 'normal' | 'super' = 'normal'
): Promise<void> {
  try {
    const currentWatchlist = await getWatchlist();
    
    // Check if movie already exists
    const exists = currentWatchlist.some(item => item.id === movie.id);
    if (exists) {
      console.log(`Movie ${movie.title} already in watchlist`);
      return;
    }

    const newItem: WatchlistItem = {
      id: movie.id,
      title: movie.title,
      posterPath: movie.poster_path,
      addedAt: Date.now(),
      priority,
      overview: movie.overview,
      releaseDate: movie.release_date,
      voteAverage: movie.vote_average,
    };

    const updatedWatchlist = [newItem, ...currentWatchlist];
    await AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(updatedWatchlist));
    console.log(`✅ Added ${movie.title} to watchlist (${priority})`);
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    throw error;
  }
}

/**
 * Remove a movie from the watchlist
 */
export async function removeFromWatchlist(movieId: number): Promise<void> {
  try {
    const currentWatchlist = await getWatchlist();
    const updatedWatchlist = currentWatchlist.filter(item => item.id !== movieId);
    await AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(updatedWatchlist));
    console.log(`🗑️ Removed movie ${movieId} from watchlist`);
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    throw error;
  }
}

/**
 * Get the full watchlist
 */
export async function getWatchlist(): Promise<WatchlistItem[]> {
  try {
    const data = await AsyncStorage.getItem(WATCHLIST_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading watchlist:', error);
    return [];
  }
}

/**
 * Check if a movie is in the watchlist
 */
export async function isInWatchlist(movieId: number): Promise<boolean> {
  try {
    const watchlist = await getWatchlist();
    return watchlist.some(item => item.id === movieId);
  } catch (error) {
    console.error('Error checking watchlist:', error);
    return false;
  }
}

/**
 * Clear the entire watchlist
 */
export async function clearWatchlist(): Promise<void> {
  try {
    await AsyncStorage.removeItem(WATCHLIST_KEY);
    console.log('🧹 Watchlist cleared');
  } catch (error) {
    console.error('Error clearing watchlist:', error);
    throw error;
  }
}

/**
 * Get watchlist statistics
 */
export async function getWatchlistStats(): Promise<{
  total: number;
  normal: number;
  super: number;
}> {
  try {
    const watchlist = await getWatchlist();
    return {
      total: watchlist.length,
      normal: watchlist.filter(item => item.priority === 'normal').length,
      super: watchlist.filter(item => item.priority === 'super').length,
    };
  } catch (error) {
    console.error('Error getting watchlist stats:', error);
    return { total: 0, normal: 0, super: 0 };
  }
}

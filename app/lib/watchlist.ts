/**
 * Watchlist Service
 * Manages persistent storage of user's saved movies and TV series
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Movie, TVSeries } from './tmdb';

const WATCHLIST_KEY = '@popcorns:watchlist';

export type MediaType = 'movie' | 'tv';

export interface WatchlistItem {
  id: number;
  title: string;
  posterPath: string | null;
  addedAt: number;
  priority: 'normal' | 'super'; // normal = right swipe, super = up swipe
  mediaType: MediaType; // 'movie' or 'tv'
  overview?: string;
  releaseDate?: string;
  voteAverage?: number;
}

/**
 * Add a movie or TV series to the watchlist
 */
export async function addToWatchlist(
  item: Movie | TVSeries,
  priority: 'normal' | 'super' = 'normal',
  mediaType: MediaType = 'movie'
): Promise<void> {
  try {
    const currentWatchlist = await getWatchlist();
    
    // Check if item already exists (check both id and mediaType)
    const exists = currentWatchlist.some(w => w.id === item.id && w.mediaType === mediaType);
    if (exists) {
      const title = 'title' in item ? item.title : item.name;
      console.log(`${mediaType === 'movie' ? 'Movie' : 'Series'} ${title} already in watchlist`);
      return;
    }

    const title = 'title' in item ? item.title : item.name;
    const releaseDate = 'release_date' in item ? item.release_date : item.first_air_date;

    const newItem: WatchlistItem = {
      id: item.id,
      title,
      posterPath: item.poster_path,
      addedAt: Date.now(),
      priority,
      mediaType,
      overview: item.overview,
      releaseDate,
      voteAverage: item.vote_average,
    };

    const updatedWatchlist = [newItem, ...currentWatchlist];
    await AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(updatedWatchlist));
    console.log(`✅ Added ${title} to watchlist (${priority}, ${mediaType})`);
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    throw error;
  }
}

/**
 * Remove a movie or TV series from the watchlist
 */
export async function removeFromWatchlist(id: number, mediaType: MediaType = 'movie'): Promise<void> {
  try {
    const currentWatchlist = await getWatchlist();
    const updatedWatchlist = currentWatchlist.filter(item => !(item.id === id && item.mediaType === mediaType));
    await AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(updatedWatchlist));
    console.log(`🗑️ Removed ${mediaType} ${id} from watchlist`);
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
    
    const watchlist = JSON.parse(data);
    
    // Deduplicate: keep only the first occurrence of each id+mediaType combination
    const seen = new Set<string>();
    const deduped = watchlist.filter((item: WatchlistItem) => {
      const key = `${item.id}-${item.mediaType}`;
      if (seen.has(key)) {
        console.log(`⚠️ Found duplicate watchlist entry: ${item.title} (${key})`);
        return false;
      }
      seen.add(key);
      return true;
    });
    
    // If duplicates were found, save the cleaned list back to storage
    if (deduped.length < watchlist.length) {
      console.log(`🧹 Removed ${watchlist.length - deduped.length} duplicate(s) from watchlist`);
      await AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(deduped));
    }
    
    return deduped;
  } catch (error) {
    console.error('Error loading watchlist:', error);
    return [];
  }
}

/**
 * Check if a movie or TV series is in the watchlist
 */
export async function isInWatchlist(id: number, mediaType: MediaType = 'movie'): Promise<boolean> {
  try {
    const watchlist = await getWatchlist();
    return watchlist.some(item => item.id === id && item.mediaType === mediaType);
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

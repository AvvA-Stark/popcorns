/**
 * User Stats Service
 * Tracks user activity and preferences for the profile screen
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Movie, TVSeries } from '../lib/tmdb';

const STATS_KEY = '@popcorns:user_stats';
const ACCOUNT_CREATED_KEY = '@popcorns:account_created';

export interface UserStats {
  totalSwipes: number;
  likes: number;
  passes: number;
  superLikes: number;
  genres: { [genreId: number]: { name: string; count: number } };
}

const DEFAULT_STATS: UserStats = {
  totalSwipes: 0,
  likes: 0,
  passes: 0,
  superLikes: 0,
  genres: {},
};

/**
 * Initialize stats on first app launch
 */
export async function initializeStats(): Promise<void> {
  try {
    const stats = await getStats();
    const accountCreated = await AsyncStorage.getItem(ACCOUNT_CREATED_KEY);
    
    if (!accountCreated) {
      // First time user - set account creation date
      await AsyncStorage.setItem(ACCOUNT_CREATED_KEY, Date.now().toString());
      console.log('✨ New user account initialized');
    }
    
    // Ensure stats object exists
    if (!stats) {
      await resetStats();
    }
  } catch (error) {
    console.error('Error initializing stats:', error);
  }
}

/**
 * Get current user stats
 */
export async function getStats(): Promise<UserStats> {
  try {
    const data = await AsyncStorage.getItem(STATS_KEY);
    if (!data) {
      return DEFAULT_STATS;
    }
    const parsed = JSON.parse(data);
    // Ensure all required fields are present by merging with defaults
    return { ...DEFAULT_STATS, ...parsed };
  } catch (error) {
    console.error('Error loading stats:', error);
    return DEFAULT_STATS;
  }
}

/**
 * Track a left swipe (pass)
 */
export async function trackPass(): Promise<void> {
  try {
    const stats = await getStats();
    stats.totalSwipes += 1;
    stats.passes += 1;
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Error tracking pass:', error);
  }
}

/**
 * Track a right swipe (like)
 */
export async function trackLike(item: Movie | TVSeries): Promise<void> {
  try {
    const stats = await getStats();
    stats.totalSwipes += 1;
    stats.likes += 1;
    
    // Track genres
    if (item.genre_ids && item.genre_ids.length > 0) {
      for (const genreId of item.genre_ids) {
        if (!stats.genres[genreId]) {
          stats.genres[genreId] = { name: '', count: 0 };
        }
        stats.genres[genreId].count += 1;
      }
    }
    
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Error tracking like:', error);
  }
}

/**
 * Track a super like (up swipe)
 */
export async function trackSuperLike(item: Movie | TVSeries): Promise<void> {
  try {
    const stats = await getStats();
    stats.totalSwipes += 1;
    stats.likes += 1; // Super likes also count as likes
    stats.superLikes += 1;
    
    // Track genres (weight super likes more)
    if (item.genre_ids && item.genre_ids.length > 0) {
      for (const genreId of item.genre_ids) {
        if (!stats.genres[genreId]) {
          stats.genres[genreId] = { name: '', count: 0 };
        }
        // Add 2 points for super likes to give them more weight
        stats.genres[genreId].count += 2;
      }
    }
    
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Error tracking super like:', error);
  }
}

/**
 * Update genre names (called when genres are fetched from API)
 */
export async function updateGenreNames(genreMap: { [id: number]: string }): Promise<void> {
  try {
    const stats = await getStats();
    let updated = false;
    
    for (const genreId in stats.genres) {
      const id = parseInt(genreId, 10);
      if (genreMap[id] && stats.genres[id].name !== genreMap[id]) {
        stats.genres[id].name = genreMap[id];
        updated = true;
      }
    }
    
    if (updated) {
      await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
    }
  } catch (error) {
    console.error('Error updating genre names:', error);
  }
}

/**
 * Get top genres by like count
 */
export async function getTopGenres(limit: number = 3): Promise<Array<{ name: string; count: number }>> {
  try {
    const stats = await getStats();
    
    // Convert to array and sort by count
    const genreArray = Object.values(stats.genres)
      .filter(genre => genre.name) // Only include genres with names
      .sort((a, b) => b.count - a.count);
    
    return genreArray.slice(0, limit);
  } catch (error) {
    console.error('Error getting top genres:', error);
    return [];
  }
}

/**
 * Get account age in days
 */
export async function getAccountAge(): Promise<number> {
  try {
    const createdAt = await AsyncStorage.getItem(ACCOUNT_CREATED_KEY);
    if (!createdAt) return 0;
    
    const created = parseInt(createdAt, 10);
    const now = Date.now();
    const ageInMs = now - created;
    const ageInDays = Math.floor(ageInMs / (1000 * 60 * 60 * 24));
    
    return ageInDays;
  } catch (error) {
    console.error('Error getting account age:', error);
    return 0;
  }
}

/**
 * Get account creation date
 */
export async function getAccountCreatedDate(): Promise<Date | null> {
  try {
    const createdAt = await AsyncStorage.getItem(ACCOUNT_CREATED_KEY);
    if (!createdAt) return null;
    
    return new Date(parseInt(createdAt, 10));
  } catch (error) {
    console.error('Error getting account creation date:', error);
    return null;
  }
}

/**
 * Reset all stats (for testing or user request)
 */
export async function resetStats(): Promise<void> {
  try {
    const emptyStats: UserStats = {
      totalSwipes: 0,
      likes: 0,
      passes: 0,
      superLikes: 0,
      genres: {},
    };
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(emptyStats));
    console.log('🧹 Stats reset');
  } catch (error) {
    console.error('Error resetting stats:', error);
  }
}

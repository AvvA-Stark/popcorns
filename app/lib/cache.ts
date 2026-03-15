/**
 * Cache Utility
 * AsyncStorage-based caching with TTL (Time To Live) support
 * Used for TMDB API responses to reduce network requests
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
}

const CACHE_PREFIX = '@popcorns_cache_';

/**
 * Cache configuration for different data types
 */
export const CacheTTL = {
  MOVIE_DETAILS: 24 * 60 * 60 * 1000, // 24 hours
  WATCH_PROVIDERS: 7 * 24 * 60 * 60 * 1000, // 7 days
  SIMILAR_MOVIES: 24 * 60 * 60 * 1000, // 24 hours
  CREDITS: 7 * 24 * 60 * 60 * 1000, // 7 days (cast rarely changes)
  VIDEOS: 24 * 60 * 60 * 1000, // 24 hours
  SEARCH_RESULTS: 1 * 60 * 60 * 1000, // 1 hour (search results can change frequently)
  TRENDING: 6 * 60 * 60 * 1000, // 6 hours (trending changes often)
  GENRES: 30 * 24 * 60 * 60 * 1000, // 30 days (genres rarely change)
} as const;

/**
 * Get cached data if valid
 * @param key - Cache key
 * @returns Cached data or null if expired/not found
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!cached) {
      return null;
    }

    const entry: CacheEntry<T> = JSON.parse(cached);
    const now = Date.now();
    const age = now - entry.timestamp;

    // Check if expired
    if (age > entry.ttl) {
      // Clean up expired entry
      await AsyncStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

/**
 * Set cached data with TTL
 * @param key - Cache key
 * @param data - Data to cache
 * @param ttl - Time to live in milliseconds
 */
export async function setCached<T>(key: string, data: T, ttl: number): Promise<void> {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

/**
 * Invalidate (remove) cached data
 * @param key - Cache key
 */
export async function invalidateCache(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_PREFIX + key);
  } catch (error) {
    console.error('Cache invalidate error:', error);
  }
}

/**
 * Clear all cached data with the cache prefix
 */
export async function clearAllCache(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const cacheKeys = allKeys.filter(key => key.startsWith(CACHE_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
    console.log(`✅ Cleared ${cacheKeys.length} cache entries`);
  } catch (error) {
    console.error('Cache clear error:', error);
  }
}

/**
 * Helper to generate cache keys
 */
export const CacheKey = {
  movieDetails: (id: number) => `movie_details_${id}`,
  watchProviders: (id: number, region?: string) => `watch_providers_${id}_${region || 'all'}`,
  similarMovies: (id: number, page: number = 1) => `similar_movies_${id}_${page}`,
  credits: (id: number) => `credits_${id}`,
  videos: (id: number) => `videos_${id}`,
  searchResults: (query: string, page: number = 1) => `search_${query.toLowerCase().trim()}_${page}`,
  trending: (timeWindow: string, page: number = 1) => `trending_${timeWindow}_${page}`,
  genres: () => `genres`,
} as const;

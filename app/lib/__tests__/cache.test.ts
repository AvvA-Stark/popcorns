/**
 * Tests for cache.ts
 * Testing cache get/set/invalidate with TTL functionality
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getCached,
  setCached,
  invalidateCache,
  clearAllCache,
  CacheTTL,
  CacheKey,
} from '../cache';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');

describe('cache.ts', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('setCached', () => {
    it('should store data with TTL in AsyncStorage', async () => {
      const testData = { name: 'Test Movie', id: 123 };
      const testKey = 'test_key';
      const testTTL = 1000;

      await setCached(testKey, testData, testTTL);

      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
      const [key, value] = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      
      expect(key).toBe('@popcorns_cache_test_key');
      
      const parsedValue = JSON.parse(value);
      expect(parsedValue.data).toEqual(testData);
      expect(parsedValue.ttl).toBe(testTTL);
      expect(parsedValue.timestamp).toBeDefined();
      expect(typeof parsedValue.timestamp).toBe('number');
    });

    it('should handle errors gracefully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));
      
      // Should not throw
      await expect(setCached('test', { data: 'test' }, 1000)).resolves.not.toThrow();
    });
  });

  describe('getCached', () => {
    it('should return cached data if not expired', async () => {
      const testData = { name: 'Test Movie', id: 123 };
      const cacheEntry = {
        data: testData,
        timestamp: Date.now() - 500, // 0.5 seconds ago
        ttl: 1000, // 1 second TTL
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cacheEntry));

      const result = await getCached<typeof testData>('test_key');
      
      expect(result).toEqual(testData);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@popcorns_cache_test_key');
    });

    it('should return null if cache entry is expired', async () => {
      const testData = { name: 'Test Movie', id: 123 };
      const cacheEntry = {
        data: testData,
        timestamp: Date.now() - 2000, // 2 seconds ago
        ttl: 1000, // 1 second TTL (expired)
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(cacheEntry));

      const result = await getCached<typeof testData>('test_key');
      
      expect(result).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@popcorns_cache_test_key');
    });

    it('should return null if no cached data exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await getCached('nonexistent_key');
      
      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));
      
      const result = await getCached('test_key');
      expect(result).toBeNull();
    });
  });

  describe('invalidateCache', () => {
    it('should remove cache entry from AsyncStorage', async () => {
      await invalidateCache('test_key');

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@popcorns_cache_test_key');
    });

    it('should handle errors gracefully', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));
      
      await expect(invalidateCache('test_key')).resolves.not.toThrow();
    });
  });

  describe('clearAllCache', () => {
    it('should clear all cache entries with the cache prefix', async () => {
      const mockKeys = [
        '@popcorns_cache_movie_1',
        '@popcorns_cache_movie_2',
        '@other_key',
        '@popcorns_cache_trending',
      ];

      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValueOnce(mockKeys);

      await clearAllCache();

      expect(AsyncStorage.getAllKeys).toHaveBeenCalled();
      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        '@popcorns_cache_movie_1',
        '@popcorns_cache_movie_2',
        '@popcorns_cache_trending',
      ]);
    });

    it('should handle errors gracefully', async () => {
      (AsyncStorage.getAllKeys as jest.Mock).mockRejectedValueOnce(new Error('Storage error'));
      
      await expect(clearAllCache()).resolves.not.toThrow();
    });
  });

  describe('CacheTTL constants', () => {
    it('should have all expected TTL values', () => {
      expect(CacheTTL.MOVIE_DETAILS).toBe(24 * 60 * 60 * 1000);
      expect(CacheTTL.WATCH_PROVIDERS).toBe(7 * 24 * 60 * 60 * 1000);
      expect(CacheTTL.SIMILAR_MOVIES).toBe(24 * 60 * 60 * 1000);
      expect(CacheTTL.CREDITS).toBe(7 * 24 * 60 * 60 * 1000);
      expect(CacheTTL.VIDEOS).toBe(24 * 60 * 60 * 1000);
      expect(CacheTTL.SEARCH_RESULTS).toBe(1 * 60 * 60 * 1000);
      expect(CacheTTL.TRENDING).toBe(6 * 60 * 60 * 1000);
      expect(CacheTTL.GENRES).toBe(30 * 24 * 60 * 60 * 1000);
    });
  });

  describe('CacheKey helpers', () => {
    it('should generate correct cache keys', () => {
      expect(CacheKey.movieDetails(123)).toBe('movie_details_123');
      expect(CacheKey.watchProviders(456, 'US')).toBe('watch_providers_456_US');
      expect(CacheKey.watchProviders(456)).toBe('watch_providers_456_all');
      expect(CacheKey.similarMovies(789, 2)).toBe('similar_movies_789_2');
      expect(CacheKey.credits(111)).toBe('credits_111');
      expect(CacheKey.videos(222)).toBe('videos_222');
      expect(CacheKey.searchResults('The Matrix', 1)).toBe('search_the matrix_1');
      expect(CacheKey.trending('week', 3)).toBe('trending_week_3');
      expect(CacheKey.genres()).toBe('genres');
    });

    it('should normalize search queries to lowercase', () => {
      expect(CacheKey.searchResults('THE MATRIX')).toBe('search_the matrix_1');
      expect(CacheKey.searchResults('  Inception  ')).toBe('search_inception_1');
    });
  });
});

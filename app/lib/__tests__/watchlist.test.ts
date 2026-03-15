/**
 * Tests for watchlist.ts
 * Testing watchlist CRUD operations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addToWatchlist,
  removeFromWatchlist,
  getWatchlist,
  isInWatchlist,
  clearWatchlist,
  getWatchlistStats,
} from '../watchlist';
import { Movie } from '../tmdb';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');

describe('watchlist.ts', () => {
  const mockMovie: Movie = {
    id: 550,
    title: 'Fight Club',
    poster_path: '/path/to/poster.jpg',
    overview: 'An insomniac office worker...',
    release_date: '1999-10-15',
    vote_average: 8.4,
    backdrop_path: '/backdrop.jpg',
    genre_ids: [18, 53],
    adult: false,
    original_language: 'en',
    original_title: 'Fight Club',
    popularity: 100,
    video: false,
    vote_count: 20000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addToWatchlist', () => {
    it('should add a movie to an empty watchlist', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      await addToWatchlist(mockMovie, 'normal');

      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
      const [key, value] = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      
      expect(key).toBe('@popcorns:watchlist');
      
      const savedData = JSON.parse(value);
      expect(savedData).toHaveLength(1);
      expect(savedData[0]).toMatchObject({
        id: 550,
        title: 'Fight Club',
        posterPath: '/path/to/poster.jpg',
        priority: 'normal',
        overview: 'An insomniac office worker...',
        releaseDate: '1999-10-15',
        voteAverage: 8.4,
      });
      expect(savedData[0].addedAt).toBeDefined();
    });

    it('should add a movie with super priority', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      await addToWatchlist(mockMovie, 'super');

      const [, value] = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      const savedData = JSON.parse(value);
      
      expect(savedData[0].priority).toBe('super');
    });

    it('should prepend new movies to the watchlist', async () => {
      const existingWatchlist = [
        {
          id: 100,
          title: 'Existing Movie',
          posterPath: '/existing.jpg',
          addedAt: Date.now() - 10000,
          priority: 'normal',
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(existingWatchlist)
      );

      await addToWatchlist(mockMovie, 'normal');

      const [, value] = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      const savedData = JSON.parse(value);
      
      expect(savedData).toHaveLength(2);
      expect(savedData[0].id).toBe(550); // New movie first
      expect(savedData[1].id).toBe(100); // Existing movie second
    });

    it('should not add duplicate movies', async () => {
      const existingWatchlist = [
        {
          id: 550,
          title: 'Fight Club',
          posterPath: '/path/to/poster.jpg',
          addedAt: Date.now(),
          priority: 'normal',
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(existingWatchlist)
      );

      await addToWatchlist(mockMovie, 'normal');

      // Should not call setItem since movie already exists
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      // Mock getWatchlist to succeed but setItem to fail
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(
        new Error('Storage error')
      );

      await expect(addToWatchlist(mockMovie, 'normal')).rejects.toThrow('Storage error');
    });
  });

  describe('removeFromWatchlist', () => {
    it('should remove a movie from the watchlist', async () => {
      const existingWatchlist = [
        {
          id: 550,
          title: 'Fight Club',
          posterPath: '/poster.jpg',
          addedAt: Date.now(),
          priority: 'normal',
        },
        {
          id: 100,
          title: 'Another Movie',
          posterPath: '/another.jpg',
          addedAt: Date.now(),
          priority: 'super',
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(existingWatchlist)
      );

      await removeFromWatchlist(550);

      const [, value] = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      const savedData = JSON.parse(value);
      
      expect(savedData).toHaveLength(1);
      expect(savedData[0].id).toBe(100);
    });

    it('should handle errors', async () => {
      // Mock getWatchlist to succeed but setItem to fail
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify([{ id: 550, title: 'Test', posterPath: '/test.jpg', addedAt: Date.now(), priority: 'normal' }])
      );
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(
        new Error('Storage error')
      );

      await expect(removeFromWatchlist(550)).rejects.toThrow('Storage error');
    });
  });

  describe('getWatchlist', () => {
    it('should return the watchlist', async () => {
      const mockWatchlist = [
        {
          id: 550,
          title: 'Fight Club',
          posterPath: '/poster.jpg',
          addedAt: Date.now(),
          priority: 'normal',
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockWatchlist)
      );

      const result = await getWatchlist();

      expect(result).toEqual(mockWatchlist);
    });

    it('should return empty array if no watchlist exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await getWatchlist();

      expect(result).toEqual([]);
    });

    it('should return empty array on error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
        new Error('Storage error')
      );

      const result = await getWatchlist();

      expect(result).toEqual([]);
    });
  });

  describe('isInWatchlist', () => {
    it('should return true if movie is in watchlist', async () => {
      const mockWatchlist = [
        {
          id: 550,
          title: 'Fight Club',
          posterPath: '/poster.jpg',
          addedAt: Date.now(),
          priority: 'normal',
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockWatchlist)
      );

      const result = await isInWatchlist(550);

      expect(result).toBe(true);
    });

    it('should return false if movie is not in watchlist', async () => {
      const mockWatchlist = [
        {
          id: 100,
          title: 'Another Movie',
          posterPath: '/poster.jpg',
          addedAt: Date.now(),
          priority: 'normal',
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockWatchlist)
      );

      const result = await isInWatchlist(550);

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
        new Error('Storage error')
      );

      const result = await isInWatchlist(550);

      expect(result).toBe(false);
    });
  });

  describe('clearWatchlist', () => {
    it('should clear the watchlist', async () => {
      await clearWatchlist();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@popcorns:watchlist');
    });

    it('should handle errors', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(
        new Error('Storage error')
      );

      await expect(clearWatchlist()).rejects.toThrow('Storage error');
    });
  });

  describe('getWatchlistStats', () => {
    it('should return correct stats', async () => {
      const mockWatchlist = [
        {
          id: 1,
          title: 'Movie 1',
          posterPath: '/1.jpg',
          addedAt: Date.now(),
          priority: 'normal',
        },
        {
          id: 2,
          title: 'Movie 2',
          posterPath: '/2.jpg',
          addedAt: Date.now(),
          priority: 'super',
        },
        {
          id: 3,
          title: 'Movie 3',
          posterPath: '/3.jpg',
          addedAt: Date.now(),
          priority: 'normal',
        },
        {
          id: 4,
          title: 'Movie 4',
          posterPath: '/4.jpg',
          addedAt: Date.now(),
          priority: 'super',
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(mockWatchlist)
      );

      const stats = await getWatchlistStats();

      expect(stats).toEqual({
        total: 4,
        normal: 2,
        super: 2,
      });
    });

    it('should return zero stats for empty watchlist', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const stats = await getWatchlistStats();

      expect(stats).toEqual({
        total: 0,
        normal: 0,
        super: 0,
      });
    });

    it('should return zero stats on error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
        new Error('Storage error')
      );

      const stats = await getWatchlistStats();

      expect(stats).toEqual({
        total: 0,
        normal: 0,
        super: 0,
      });
    });
  });
});

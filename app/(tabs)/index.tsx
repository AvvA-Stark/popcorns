/**
 * Discovery Screen (Main Swipe Screen)
 * Tinder-style movie swiping interface
 */

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/Colors';
import { tmdb, Movie } from '../../lib/tmdb';
import SwipeStack from '../../components/SwipeStack';
import { addToWatchlist } from '../../lib/watchlist';

export default function DiscoveryScreen() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [swipedCount, setSwipedCount] = useState(0);

  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async (page: number = 1) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      
      const trending = await tmdb.getTrendingMovies('week', page);
      
      if (page === 1) {
        setMovies(trending);
      } else {
        setMovies(prev => [...prev, ...trending]);
      }
      
      // TMDB typically returns 20 results per page
      // If we get less than 20, we've reached the end
      if (trending.length < 20) {
        setHasMore(false);
      }
      
      setCurrentPage(page);
      console.log(`✅ Loaded ${trending.length} movies (page ${page})`);
    } catch (err) {
      setError('Failed to load movies');
      console.error('Error loading movies:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSwipeLeft = (movie: Movie) => {
    console.log('👎 Disliked:', movie.title);
    const newCount = swipedCount + 1;
    setSwipedCount(newCount);
    checkIfNeedMoreMovies(newCount);
  };

  const handleSwipeRight = async (movie: Movie) => {
    console.log('❤️ Liked:', movie.title);
    try {
      await addToWatchlist(movie, 'normal');
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
    }
    const newCount = swipedCount + 1;
    setSwipedCount(newCount);
    checkIfNeedMoreMovies(newCount);
  };

  const handleSwipeUp = async (movie: Movie) => {
    console.log('⭐ Super Liked:', movie.title);
    try {
      await addToWatchlist(movie, 'super');
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
    }
    const newCount = swipedCount + 1;
    setSwipedCount(newCount);
    checkIfNeedMoreMovies(newCount);
  };

  const checkIfNeedMoreMovies = (currentSwipedCount: number) => {
    // When user has 3 or fewer movies remaining, load more
    // remainingMovies = total loaded - swiped through
    const remainingMovies = movies.length - currentSwipedCount;
    
    if (remainingMovies <= 3 && hasMore && !loadingMore) {
      console.log(`🔄 Only ${remainingMovies} movies left, loading more...`);
      loadMovies(currentPage + 1);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading movies...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🍿 Popcorns</Text>
        <Text style={styles.subtitle}>Swipe to discover</Text>
      </View>
      
      <SwipeStack
        movies={movies}
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
        onSwipeUp={handleSwipeUp}
      />

      <View style={styles.footer}>
        {loadingMore ? (
          <View style={styles.loadingMore}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingMoreText}>Loading more...</Text>
          </View>
        ) : (
          <>
            <View style={styles.actionHint}>
              <Text style={styles.actionIcon}>👈</Text>
              <Text style={styles.actionText}>Dislike</Text>
            </View>
            <View style={styles.actionHint}>
              <Text style={styles.actionIcon}>👆</Text>
              <Text style={styles.actionText}>Super Like</Text>
            </View>
            <View style={styles.actionHint}>
              <Text style={styles.actionIcon}>👉</Text>
              <Text style={styles.actionText}>Like</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
    paddingHorizontal: 40,
  },
  actionHint: {
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});

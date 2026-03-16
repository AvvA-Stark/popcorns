/**
 * MovieCard Component
 * Swipeable card for displaying movie or TV series information
 */

import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/Colors';
import { Movie, TVSeries } from '../lib/tmdb';
import { tmdb } from '../lib/tmdb';
import CachedImage from './CachedImage';
import { addToWatchlist, removeFromWatchlist, isInWatchlist, MediaType } from '../lib/watchlist';
import { useToast } from '../lib/toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.9;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

interface MovieCardProps {
  movie: Movie | TVSeries;
}

// Type guard to check if item is a Movie
function isMovie(item: Movie | TVSeries): item is Movie {
  return 'title' in item;
}

export default function MovieCard({ movie }: MovieCardProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const posterUrl = tmdb.getPosterUrl(movie.poster_path, 'large');
  const rating = movie.vote_average.toFixed(1);
  
  // Handle both Movie and TVSeries types
  const title = isMovie(movie) ? movie.title : movie.name;
  const releaseDate = isMovie(movie) ? movie.release_date : movie.first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
  const mediaType: MediaType = isMovie(movie) ? 'movie' : 'tv';

  // Watchlist state
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  // Check watchlist status on mount
  useEffect(() => {
    checkWatchlistStatus();
  }, [movie.id, mediaType]);

  const checkWatchlistStatus = async () => {
    try {
      const status = await isInWatchlist(movie.id, mediaType);
      setInWatchlist(status);
    } catch (error) {
      console.error('Error checking watchlist status:', error);
    }
  };

  const handleInfoPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/${mediaType === 'movie' ? 'movie' : 'series'}/${movie.id}` as any);
  };

  const handleWatchlistToggle = async () => {
    if (watchlistLoading) return;

    setWatchlistLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      if (inWatchlist) {
        // Remove from watchlist
        await removeFromWatchlist(movie.id, mediaType);
        setInWatchlist(false);
        showToast({
          message: `Removed "${title}" from watchlist`,
          type: 'info',
        });
      } else {
        // Add to watchlist
        await addToWatchlist(movie, 'normal', mediaType);
        setInWatchlist(true);
        showToast({
          message: `Added "${title}" to watchlist`,
          type: 'success',
        });
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
      showToast({
        message: 'Failed to update watchlist',
        type: 'error',
      });
    } finally {
      setWatchlistLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.posterTouchable}
        onPress={handleInfoPress}
        activeOpacity={0.9}
      >
        <CachedImage
          source={posterUrl}
          style={styles.poster}
          contentFit="cover"
          fallback={
            <View style={[styles.poster, styles.posterPlaceholder]}>
              <Text style={styles.placeholderText}>🎬</Text>
            </View>
          }
        />
      </TouchableOpacity>
      
      {/* Action buttons overlay */}
      <View style={styles.actionButtons}>
        {/* Watchlist button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleWatchlistToggle}
          activeOpacity={0.8}
          disabled={watchlistLoading}
        >
          <View style={[
            styles.actionIconContainer,
            inWatchlist && styles.watchlistActiveContainer
          ]}>
            <Text style={styles.actionIcon}>
              {inWatchlist ? '❤️' : '🤍'}
            </Text>
          </View>
        </TouchableOpacity>
        
        {/* Info button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleInfoPress}
          activeOpacity={0.8}
        >
          <View style={styles.actionIconContainer}>
            <Text style={styles.actionIcon}>ℹ️</Text>
          </View>
        </TouchableOpacity>
      </View>
      
      <View style={styles.gradient}>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          
          <View style={styles.metaRow}>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>⭐ {rating}</Text>
            </View>
            <Text style={styles.year}>{year}</Text>
          </View>
          
          <Text style={styles.overview} numberOfLines={3}>
            {movie.overview}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  posterTouchable: {
    width: '100%',
    height: '100%',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  posterPlaceholder: {
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 64,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '35%',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 0,
  },
  info: {
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  ratingContainer: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.background,
  },
  year: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  overview: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  actionButtons: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
  },
  actionButton: {
    // Container for individual button
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  watchlistActiveContainer: {
    backgroundColor: 'rgba(255, 0, 80, 0.2)',
    borderColor: 'rgba(255, 0, 80, 0.5)',
  },
  actionIcon: {
    fontSize: 20,
  },
});

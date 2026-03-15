/**
 * MovieCard Component
 * Swipeable card for displaying movie information
 */

import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/Colors';
import { Movie } from '../lib/tmdb';
import { tmdb } from '../lib/tmdb';
import CachedImage from './CachedImage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.9;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

interface MovieCardProps {
  movie: Movie;
}

export default function MovieCard({ movie }: MovieCardProps) {
  const router = useRouter();
  const posterUrl = tmdb.getPosterUrl(movie.poster_path, 'large');
  const rating = movie.vote_average.toFixed(1);
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';

  const handleInfoPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/movie/${movie.id}`);
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
      
      {/* Info button overlay */}
      <TouchableOpacity
        style={styles.infoButton}
        onPress={handleInfoPress}
        activeOpacity={0.8}
      >
        <View style={styles.infoIconContainer}>
          <Text style={styles.infoIcon}>ℹ️</Text>
        </View>
      </TouchableOpacity>
      
      <View style={styles.gradient}>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {movie.title}
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
  infoButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  infoIcon: {
    fontSize: 20,
  },
});

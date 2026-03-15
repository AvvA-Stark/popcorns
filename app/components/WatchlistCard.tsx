/**
 * WatchlistCard Component
 * Displays a movie in the user's watchlist with delete option
 */

import { View, Text, StyleSheet, TouchableOpacity, Image, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors as colors } from '../constants/Colors';
import { FontAwesome } from '@expo/vector-icons';

interface WatchlistCardProps {
  item: {
    id: number;
    title: string;
    overview?: string;
    posterPath?: string | null;
    releaseDate?: string;
    voteAverage?: number;
    addedAt: number;
    priority?: 'normal' | 'super';
  };
  onRemove: (id: number) => void;
}

export default function WatchlistCard({ item: movie, onRemove: onDelete }: WatchlistCardProps) {
  const router = useRouter();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(scale.value, { damping: 15, stiffness: 300 }) }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handleCardPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/movie/${movie.id}`);
  };

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <Pressable 
        style={styles.content}
        onPress={handleCardPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.posterContainer}>
          {movie.posterPath ? (
            <Image
              source={{ uri: `https://image.tmdb.org/t/p/w200${movie.posterPath}` }}
              style={styles.poster}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.posterPlaceholder}>🎬</Text>
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{movie.title}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.year}>{new Date(movie.releaseDate || '').getFullYear()}</Text>
            <View style={styles.ratingContainer}>
              <FontAwesome name="star" size={12} color="#FFD700" />
              <Text style={styles.rating}>{movie.voteAverage?.toFixed(1)}</Text>
            </View>
          </View>
          <Text style={styles.overview} numberOfLines={2}>
            {movie.overview || 'No description available.'}
          </Text>
          <View style={styles.footer}>
            <Text style={styles.addedDate}>
              Added: {new Date(movie.addedAt).toLocaleDateString()}
            </Text>
            {movie.priority === 'super' && (
              <View style={styles.superBadge}>
                <Text style={styles.superBadgeText}>★ SUPER LIKE</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={(e) => {
            e?.stopPropagation?.();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onDelete(movie.id);
          }}
          activeOpacity={0.7}
        >
          <FontAwesome name="trash" size={20} color={colors.error} />
        </TouchableOpacity>
      </Pressable>
    </Animated.View>
  );
}

const POSTER_SIZE = 100;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginHorizontal: 0,
    marginVertical: 6,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  content: {
    flexDirection: 'row',
    padding: 16,
  },
  posterContainer: {
    width: POSTER_SIZE,
    height: POSTER_SIZE,
    borderRadius: 8,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  posterPlaceholder: {
    fontSize: 32,
  },
  info: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  year: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  overview: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  addedDate: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  superBadge: {
    backgroundColor: colors.superLike || '#FF69B4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  superBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
});

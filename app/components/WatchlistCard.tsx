/**
 * WatchlistCard Component
 * Displays a movie in the user's watchlist with delete option
 */

import { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming } from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { Colors as colors } from '../constants/Colors';
import { FontAwesome } from '@expo/vector-icons';
import CachedImage from './CachedImage';

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
    mediaType?: string;
  };
  onRemove: (id: number, skipConfirmation?: boolean) => void;
  isHighlighted?: boolean;
}

export default function WatchlistCard({ item: movie, onRemove: onDelete, isHighlighted = false }: WatchlistCardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const swipeableRef = useRef<Swipeable>(null);
  const scale = useSharedValue(1);
  const borderOpacity = useSharedValue(0);

  // Highlight animation when isHighlighted becomes true
  useEffect(() => {
    if (isHighlighted) {
      borderOpacity.value = withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(1, { duration: 350 }),
        withTiming(0, { duration: 150 })
      );
    }
  }, [isHighlighted]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(scale.value, { damping: 15, stiffness: 300 }) }],
      borderWidth: 3,
      borderColor: `rgba(255, 215, 0, ${borderOpacity.value})`,
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

  const handleSwipeDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDelete(movie.id, true); // Skip confirmation for swipe gesture
  };

  const renderRightActions = () => (
    <View style={styles.swipeActionContainer}>
      <TouchableOpacity 
        style={styles.deleteSwipeButton}
        onPress={handleSwipeDelete}
        activeOpacity={0.8}
      >
        <FontAwesome name="trash" size={24} color="#fff" />
        <Text style={styles.deleteSwipeText}>{t('common.delete')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
      enableTrackpadTwoFingerGesture={false}
    >
      <Animated.View style={[styles.card, animatedStyle]}>
        <Pressable
          style={styles.content}
          onPress={handleCardPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
        <View style={styles.posterContainer}>
          <CachedImage
            source={movie.posterPath ? `https://image.tmdb.org/t/p/w200${movie.posterPath}` : null}
            style={styles.poster}
            contentFit="cover"
            fallback={<Text style={styles.posterPlaceholder}>🎬</Text>}
          />
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
            {movie.overview || t('movieDetail.noOverview')}
          </Text>
          <View style={styles.footer}>
            <Text style={styles.addedDate}>
              {t('watchlist.addedDate', { date: new Date(movie.addedAt).toLocaleDateString() })}
            </Text>
            {movie.priority === 'super' && (
              <View style={styles.superBadge}>
                <Text style={styles.superBadgeText}>★ {t('profile.superLikes')}</Text>
              </View>
            )}
          </View>
        </View>
        </Pressable>
      </Animated.View>
    </Swipeable>
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
  swipeActionContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginVertical: 6,
  },
  deleteSwipeButton: {
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
    height: '100%',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  deleteSwipeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
});
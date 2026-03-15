/**
 * SkeletonCard - Loading placeholder for MovieCard
 * Dark cinematic theme with animated shimmer effect
 */

import { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Colors } from '../constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.9;

export default function SkeletonCard() {
  const shimmerTranslate = useSharedValue(-1);

  useEffect(() => {
    shimmerTranslate.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerTranslate.value,
      [-1, 1],
      [-CARD_WIDTH, CARD_WIDTH]
    );

    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View style={styles.card}>
      {/* Poster skeleton */}
      <View style={styles.posterSkeleton}>
        <Animated.View style={[styles.shimmer, shimmerStyle]} />
      </View>

      {/* Content skeleton */}
      <View style={styles.content}>
        {/* Title */}
        <View style={styles.titleSkeleton}>
          <Animated.View style={[styles.shimmer, shimmerStyle]} />
        </View>

        {/* Metadata row */}
        <View style={styles.metadataRow}>
          <View style={styles.metadataSkeleton}>
            <Animated.View style={[styles.shimmer, shimmerStyle]} />
          </View>
          <View style={styles.metadataSkeleton}>
            <Animated.View style={[styles.shimmer, shimmerStyle]} />
          </View>
          <View style={styles.metadataSkeleton}>
            <Animated.View style={[styles.shimmer, shimmerStyle]} />
          </View>
        </View>

        {/* Overview */}
        <View style={styles.overviewSkeleton}>
          <View style={styles.overviewLine}>
            <Animated.View style={[styles.shimmer, shimmerStyle]} />
          </View>
          <View style={[styles.overviewLine, { width: '85%' }]}>
            <Animated.View style={[styles.shimmer, shimmerStyle]} />
          </View>
          <View style={[styles.overviewLine, { width: '70%' }]}>
            <Animated.View style={[styles.shimmer, shimmerStyle]} />
          </View>
        </View>
      </View>
    </View>
  );
}

export function SkeletonCastItem() {
  const shimmerTranslate = useSharedValue(-1);

  useEffect(() => {
    shimmerTranslate.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerTranslate.value,
      [-1, 1],
      [-100, 100]
    );

    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View style={styles.castItem}>
      <View style={styles.castImageSkeleton}>
        <Animated.View style={[styles.shimmer, shimmerStyle]} />
      </View>
      <View style={styles.castNameSkeleton}>
        <Animated.View style={[styles.shimmer, shimmerStyle]} />
      </View>
    </View>
  );
}

export function SkeletonSimilarMovie() {
  const shimmerTranslate = useSharedValue(-1);

  useEffect(() => {
    shimmerTranslate.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerTranslate.value,
      [-1, 1],
      [-120, 120]
    );

    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View style={styles.similarMovie}>
      <View style={styles.similarPosterSkeleton}>
        <Animated.View style={[styles.shimmer, shimmerStyle]} />
      </View>
      <View style={styles.similarTitleSkeleton}>
        <Animated.View style={[styles.shimmer, shimmerStyle]} />
      </View>
    </View>
  );
}

export function SkeletonSearchCard() {
  const shimmerTranslate = useSharedValue(-1);

  useEffect(() => {
    shimmerTranslate.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerTranslate.value,
      [-1, 1],
      [-300, 300]
    );

    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View style={styles.searchCard}>
      <View style={styles.searchPosterSkeleton}>
        <Animated.View style={[styles.shimmer, shimmerStyle]} />
      </View>
      <View style={styles.searchInfo}>
        <View style={styles.searchTitleSkeleton}>
          <Animated.View style={[styles.shimmer, shimmerStyle]} />
        </View>
        <View style={styles.searchMetaSkeleton}>
          <Animated.View style={[styles.shimmer, shimmerStyle]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.5,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  posterSkeleton: {
    width: '100%',
    height: '60%',
    backgroundColor: '#1a1a1a',
    overflow: 'hidden',
  },
  content: {
    padding: 20,
  },
  titleSkeleton: {
    width: '70%',
    height: 24,
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  metadataRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metadataSkeleton: {
    width: 60,
    height: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  overviewSkeleton: {
    gap: 8,
  },
  overviewLine: {
    width: '100%',
    height: 14,
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  shimmer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  // Cast item skeleton
  castItem: {
    alignItems: 'center',
    marginRight: 12,
  },
  castImageSkeleton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a1a1a',
    overflow: 'hidden',
    marginBottom: 8,
  },
  castNameSkeleton: {
    width: 60,
    height: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  // Similar movie skeleton
  similarMovie: {
    width: 120,
    marginRight: 12,
  },
  similarPosterSkeleton: {
    width: 120,
    height: 180,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    overflow: 'hidden',
    marginBottom: 8,
  },
  similarTitleSkeleton: {
    width: '100%',
    height: 14,
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  // Search card skeleton
  searchCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  searchPosterSkeleton: {
    width: 80,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    overflow: 'hidden',
    marginRight: 12,
  },
  searchInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  searchTitleSkeleton: {
    width: '80%',
    height: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  searchMetaSkeleton: {
    width: '40%',
    height: 14,
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
    overflow: 'hidden',
  },
});

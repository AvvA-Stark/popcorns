/**
 * SwipeStack Component
 * Tinder-style swipeable movie card stack
 * Uses react-native-gesture-handler and react-native-reanimated
 */

import { useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Movie, TVSeries } from '../lib/tmdb';
import MovieCard from './MovieCard';
import { Colors } from '../constants/Colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.9;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const ROTATION_MULTIPLIER = 15;
const SUPER_LIKE_THRESHOLD = -100;

interface SwipeStackProps {
  movies: (Movie | TVSeries)[];
  onSwipeLeft?: (item: Movie | TVSeries) => void;
  onSwipeRight?: (item: Movie | TVSeries) => void;
  onSwipeUp?: (item: Movie | TVSeries) => void;
}

export default function SwipeStack({
  movies,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
}: SwipeStackProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSwipeComplete = useCallback((direction: 'left' | 'right' | 'up') => {
    const currentMovie = movies[currentIndex];
    if (!currentMovie) return;

    if (direction === 'left' && onSwipeLeft) {
      onSwipeLeft(currentMovie);
    } else if (direction === 'right' && onSwipeRight) {
      onSwipeRight(currentMovie);
    } else if (direction === 'up' && onSwipeUp) {
      onSwipeUp(currentMovie);
    }

    setCurrentIndex((prev) => prev + 1);
  }, [movies, currentIndex, onSwipeLeft, onSwipeRight, onSwipeUp]);

  // Rapid shake haptic for super like
  const superLikeShake = async () => {
    for (let i = 0; i < 4; i++) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await new Promise(r => setTimeout(r, 60));
    }
  };

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      // Light haptic on swipe start
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      const isSwipedLeft = translateX.value < -SWIPE_THRESHOLD;
      const isSwipedRight = translateX.value > SWIPE_THRESHOLD;
      const isSwipedUp = translateY.value < SUPER_LIKE_THRESHOLD && Math.abs(translateX.value) < SWIPE_THRESHOLD;

      if (isSwipedUp) {
        // Rapid shake haptic for super like (stronger feedback)
        runOnJS(superLikeShake)();
        translateY.value = withTiming(-SCREEN_HEIGHT, { duration: 300 });
        translateX.value = withTiming(0, { duration: 300 }, () => {
          runOnJS(handleSwipeComplete)('up');
          translateX.value = 0;
          translateY.value = 0;
        });
      } else if (isSwipedLeft) {
        // Medium haptic on swipe completion
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
        translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 300 });
        translateY.value = withTiming(event.translationY, { duration: 300 }, () => {
          runOnJS(handleSwipeComplete)('left');
          translateX.value = 0;
          translateY.value = 0;
        });
      } else if (isSwipedRight) {
        // Medium haptic on swipe completion
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
        translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: 300 });
        translateY.value = withTiming(event.translationY, { duration: 300 }, () => {
          runOnJS(handleSwipeComplete)('right');
          translateX.value = 0;
          translateY.value = 0;
        });
      } else {
        translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
        translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      }
    });

  // Empty state
  if (movies.length === 0 || currentIndex >= movies.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🎬</Text>
        <Text style={styles.emptyText}>No more movies!</Text>
        <Text style={styles.emptySubtext}>Check back later for more</Text>
      </View>
    );
  }

  // Render up to 3 cards in the stack
  const cardsToRender = movies.slice(currentIndex, currentIndex + 3);

  return (
    <View style={styles.container}>
      {cardsToRender.reverse().map((movie, index, array) => {
        const cardIndex = array.length - 1 - index;
        const isTopCard = cardIndex === 0;

        return (
          <SwipeCard
            key={`${movie.id}-${currentIndex}`}
            movie={movie}
            index={cardIndex}
            isTopCard={isTopCard}
            translateX={translateX}
            translateY={translateY}
            panGesture={isTopCard ? panGesture : undefined}
          />
        );
      })}
    </View>
  );
}

interface SwipeCardProps {
  movie: Movie | TVSeries;
  index: number;
  isTopCard: boolean;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  panGesture?: ReturnType<typeof Gesture.Pan>;
}

function SwipeCard({
  movie,
  index,
  isTopCard,
  translateX,
  translateY,
  panGesture,
}: SwipeCardProps) {
  const cardAnimatedStyle = useAnimatedStyle(() => {
    if (!isTopCard) {
      const scale = interpolate(
        index,
        [0, 1, 2],
        [1, 0.95, 0.9],
        Extrapolation.CLAMP
      );
      const translateYValue = interpolate(
        index,
        [0, 1, 2],
        [0, -10, -20],
        Extrapolation.CLAMP
      );
      return {
        transform: [
          { scale },
          { translateY: translateYValue },
        ],
        opacity: 1,
      };
    }

    const rotation = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-ROTATION_MULTIPLIER, 0, ROTATION_MULTIPLIER],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation}deg` },
      ],
    };
  });

  const likeAnimatedStyle = useAnimatedStyle(() => {
    if (!isTopCard) return { opacity: 0 };
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD / 2],
      [0, 1],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0.8, 1.2],
      Extrapolation.CLAMP
    );
    return { opacity, transform: [{ scale }] };
  });

  const dislikeAnimatedStyle = useAnimatedStyle(() => {
    if (!isTopCard) return { opacity: 0 };
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD / 2, 0],
      [1, 0],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1.2, 0.8],
      Extrapolation.CLAMP
    );
    return { opacity, transform: [{ scale }] };
  });

  const superLikeAnimatedStyle = useAnimatedStyle(() => {
    if (!isTopCard) return { opacity: 0 };
    const opacity = interpolate(
      translateY.value,
      [-SUPER_LIKE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      translateY.value,
      [-SUPER_LIKE_THRESHOLD * 1.5, 0],
      [1.2, 0.8],
      Extrapolation.CLAMP
    );
    return { opacity, transform: [{ scale }] };
  });

  const cardContent = (
    <Animated.View style={[styles.card, cardAnimatedStyle]}>
      <MovieCard movie={movie} />

      <Animated.View style={[styles.overlayLabel, styles.likeLabel, likeAnimatedStyle]}>
        <Text style={styles.overlayText}>LIKE</Text>
      </Animated.View>

      <Animated.View style={[styles.overlayLabel, styles.dislikeLabel, dislikeAnimatedStyle]}>
        <Text style={styles.overlayText}>NOPE</Text>
      </Animated.View>

      <Animated.View style={[styles.overlayLabel, styles.superLikeLabel, superLikeAnimatedStyle]}>
        <Text style={styles.overlayText}>SUPER LIKE</Text>
      </Animated.View>
    </Animated.View>
  );

  return isTopCard && panGesture ? (
    <GestureDetector gesture={panGesture}>
      {cardContent}
    </GestureDetector>
  ) : (
    cardContent
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.5,
  },
  overlayLabel: {
    position: 'absolute',
    top: 60,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 4,
  },
  likeLabel: {
    right: 40,
    borderColor: Colors.like,
    transform: [{ rotate: '15deg' }],
  },
  dislikeLabel: {
    left: 40,
    borderColor: Colors.dislike,
    transform: [{ rotate: '-15deg' }],
  },
  superLikeLabel: {
    alignSelf: 'center',
    borderColor: Colors.superLike,
  },
  overlayText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.text,
    letterSpacing: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});

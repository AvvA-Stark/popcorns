/**
 * SwipeTutorialOverlay Component
 * Animation that demonstrates swipe gestures
 * Shows every time the tab is focused
 */

import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '../constants/Colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.35; // Smaller cards for tutorial
const CARD_HEIGHT = CARD_WIDTH * 1.5;

interface SwipeTutorialOverlayProps {
  onComplete?: () => void;
  trigger?: boolean; // When this changes to true, restart the animation
}

export default function SwipeTutorialOverlay({ onComplete, trigger = false }: SwipeTutorialOverlayProps) {
  const { t } = useTranslation();
  const overlayOpacity = useSharedValue(0);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Card positions and rotations
  const card1TranslateX = useSharedValue(0);
  const card1TranslateY = useSharedValue(SCREEN_HEIGHT);
  const card1Rotate = useSharedValue(0);
  const card1Opacity = useSharedValue(1);

  const card2TranslateX = useSharedValue(0);
  const card2TranslateY = useSharedValue(SCREEN_HEIGHT);
  const card2Rotate = useSharedValue(0);
  const card2Opacity = useSharedValue(1);

  const card3TranslateX = useSharedValue(0);
  const card3TranslateY = useSharedValue(SCREEN_HEIGHT);
  const card3Rotate = useSharedValue(0);
  const card3Opacity = useSharedValue(1);

  // Label opacities
  const nopeOpacity = useSharedValue(0);
  const likeOpacity = useSharedValue(0);
  const superLikeOpacity = useSharedValue(0);

  // Cleanup function for animation timeout
  const clearAnimationTimeout = () => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    console.log('🎬 SwipeTutorialOverlay: useEffect triggered with trigger =', trigger);
    
    if (trigger) {
      console.log('🎬 SwipeTutorialOverlay: TRIGGER IS TRUE - Starting tutorial animation...');
      
      // Clear any pending animation timeout
      clearAnimationTimeout();
      
      // Reset all values before starting
      resetAnimation();
      
      // Small delay to ensure render, then start animation
      animationTimeoutRef.current = setTimeout(() => {
        console.log('🎬 SwipeTutorialOverlay: Starting animation after delay');
        startAnimation();
      }, 50);
    } else {
      // If trigger becomes false, immediately stop and reset
      console.log('🎬 SwipeTutorialOverlay: Trigger became false - hiding overlay');
      clearAnimationTimeout();
      // Immediately hide by setting opacity to 0
      overlayOpacity.value = 0;
    }
  }, [trigger]);

  // Also cleanup on unmount
  useEffect(() => {
    return () => {
      clearAnimationTimeout();
    };
  }, []);

  const resetAnimation = () => {
    console.log('🔄 SwipeTutorialOverlay: Resetting animation values');
    // Reset all animated values to initial state
    // Start with tiny visible opacity so Modal renders properly
    overlayOpacity.value = 0.01;
    card1TranslateX.value = 0;
    card1TranslateY.value = SCREEN_HEIGHT;
    card1Rotate.value = 0;
    card1Opacity.value = 1;
    card2TranslateX.value = 0;
    card2TranslateY.value = SCREEN_HEIGHT;
    card2Rotate.value = 0;
    card2Opacity.value = 1;
    card3TranslateX.value = 0;
    card3TranslateY.value = SCREEN_HEIGHT;
    card3Rotate.value = 0;
    card3Opacity.value = 1;
    nopeOpacity.value = 0;
    likeOpacity.value = 0;
    superLikeOpacity.value = 0;
  };

  const startAnimation = () => {
    console.log('▶️ SwipeTutorialOverlay: startAnimation called');
    console.log('▶️ SwipeTutorialOverlay: overlayOpacity.value =', overlayOpacity.value);
    
    // Fade in overlay
    overlayOpacity.value = withTiming(1, { duration: 500 }, (finished) => {
      if (finished) {
        console.log('✅ SwipeTutorialOverlay: Fade-in completed');
      }
    });

    // 1. Slide cards up from bottom (stacked)
    card1TranslateY.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) });
    card2TranslateY.value = withTiming(-10, { duration: 500, easing: Easing.out(Easing.cubic) });
    card3TranslateY.value = withTiming(-20, { duration: 500, easing: Easing.out(Easing.cubic) });

    // 2. After 800ms, swipe card 1 left (NOPE)
    card1TranslateX.value = withDelay(
      800,
      withTiming(-SCREEN_WIDTH * 1.2, { duration: 400, easing: Easing.inOut(Easing.ease) })
    );
    card1Rotate.value = withDelay(800, withTiming(-15, { duration: 400 }));
    nopeOpacity.value = withDelay(800, withTiming(1, { duration: 200 }));
    card1Opacity.value = withDelay(1100, withTiming(0, { duration: 200 }));

    // Move card 2 to front position
    card2TranslateY.value = withDelay(1200, withTiming(0, { duration: 300 }));
    card3TranslateY.value = withDelay(1200, withTiming(-10, { duration: 300 }));

    // 3. After 1500ms, swipe card 2 right (LIKE)
    card2TranslateX.value = withDelay(
      1500,
      withTiming(SCREEN_WIDTH * 1.2, { duration: 400, easing: Easing.inOut(Easing.ease) })
    );
    card2Rotate.value = withDelay(1500, withTiming(15, { duration: 400 }));
    likeOpacity.value = withDelay(1500, withTiming(1, { duration: 200 }));
    card2Opacity.value = withDelay(1800, withTiming(0, { duration: 200 }));

    // Move card 3 to front position
    card3TranslateY.value = withDelay(1900, withTiming(0, { duration: 300 }));

    // 4. After 2200ms, swipe card 3 up (SUPER LIKE)
    card3TranslateY.value = withDelay(
      2200,
      withTiming(-SCREEN_HEIGHT, { duration: 400, easing: Easing.inOut(Easing.ease) })
    );
    superLikeOpacity.value = withDelay(2200, withTiming(1, { duration: 200 }));
    card3Opacity.value = withDelay(2500, withTiming(0, { duration: 200 }));

    // 5. Fade out overlay after 2800ms
    overlayOpacity.value = withDelay(
      2800,
      withTiming(0, { duration: 300 }, (finished) => {
        if (finished) {
          console.log('✅ SwipeTutorialOverlay: Animation complete, calling handleComplete');
          runOnJS(handleComplete)();
        }
      })
    );
  };

  const handleComplete = () => {
    clearAnimationTimeout();
    console.log('✅ Tutorial animation completed');
    onComplete?.();
  };

  const handleDismiss = () => {
    clearAnimationTimeout();
    console.log('👆 SwipeTutorialOverlay: User dismissed tutorial');
    overlayOpacity.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(handleComplete)();
      }
    });
  };

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const card1AnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: card1TranslateX.value },
        { translateY: card1TranslateY.value },
        { rotate: `${card1Rotate.value}deg` },
      ],
      opacity: card1Opacity.value,
    };
  });

  const card2AnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: card2TranslateX.value },
        { translateY: card2TranslateY.value },
        { rotate: `${card2Rotate.value}deg` },
      ],
      opacity: card2Opacity.value,
    };
  });

  const card3AnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: card3TranslateX.value },
        { translateY: card3TranslateY.value },
        { rotate: `${card3Rotate.value}deg` },
      ],
      opacity: card3Opacity.value,
    };
  });

  const nopeAnimatedStyle = useAnimatedStyle(() => ({
    opacity: nopeOpacity.value,
  }));

  const likeAnimatedStyle = useAnimatedStyle(() => ({
    opacity: likeOpacity.value,
  }));

  const superLikeAnimatedStyle = useAnimatedStyle(() => ({
    opacity: superLikeOpacity.value,
  }));

  console.log('🎬 SwipeTutorialOverlay: RENDER CALLED - trigger =', trigger);
  
  if (!trigger) {
    console.log('🎬 SwipeTutorialOverlay: Not rendering (trigger = false)');
    return null;
  }

  console.log('🎬 SwipeTutorialOverlay: RENDERING OVERLAY!');

  // Using Modal to ensure it's truly on top of everything
  return (
    <Modal
      visible={trigger}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleDismiss}
        style={styles.modalContainer}
      >
        <Animated.View style={[styles.overlay, overlayAnimatedStyle]}>
          <View style={styles.content}>
            <Text style={styles.title}>{t('tutorial.title')}</Text>

            {/* Card Stack */}
            <View style={styles.cardContainer}>
              {/* Card 3 (bottom/back) */}
              <Animated.View style={[styles.card, card3AnimatedStyle]}>
                <View style={styles.cardContent}>
                  <View style={styles.cardPoster} />
                  <Text style={styles.cardTitle}>Movie 3</Text>
                </View>
                <Animated.View style={[styles.label, styles.superLikeLabel, superLikeAnimatedStyle]}>
                  <Text style={styles.labelText}>{t('tutorial.superLike')}</Text>
                </Animated.View>
              </Animated.View>

              {/* Card 2 (middle) */}
              <Animated.View style={[styles.card, card2AnimatedStyle]}>
                <View style={styles.cardContent}>
                  <View style={styles.cardPoster} />
                  <Text style={styles.cardTitle}>Movie 2</Text>
                </View>
                <Animated.View style={[styles.label, styles.likeLabel, likeAnimatedStyle]}>
                  <Text style={styles.labelText}>{t('tutorial.like')}</Text>
                </Animated.View>
              </Animated.View>

              {/* Card 1 (top/front) */}
              <Animated.View style={[styles.card, card1AnimatedStyle]}>
                <View style={styles.cardContent}>
                  <View style={styles.cardPoster} />
                  <Text style={styles.cardTitle}>Movie 1</Text>
                </View>
                <Animated.View style={[styles.label, styles.nopeLabel, nopeAnimatedStyle]}>
                  <Text style={styles.labelText}>{t('tutorial.nope')}</Text>
                </Animated.View>
              </Animated.View>
            </View>

            <Text style={styles.hint}>{t('tutorial.hint')}</Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 60,
    letterSpacing: 1,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    position: 'relative',
    marginBottom: 60,
  },
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardContent: {
    flex: 1,
  },
  cardPoster: {
    width: '100%',
    height: '70%',
    backgroundColor: Colors.primary + '30',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    padding: 12,
    textAlign: 'center',
  },
  label: {
    position: 'absolute',
    top: 30,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 3,
  },
  nopeLabel: {
    left: 20,
    borderColor: Colors.dislike,
    transform: [{ rotate: '-15deg' }],
  },
  likeLabel: {
    right: 20,
    borderColor: Colors.like,
    transform: [{ rotate: '15deg' }],
  },
  superLikeLabel: {
    alignSelf: 'center',
    borderColor: Colors.superLike,
  },
  labelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    letterSpacing: 1,
  },
  hint: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 20,
  },
});
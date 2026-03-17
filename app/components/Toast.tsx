/**
 * Toast - Transient notification component
 * Displays brief messages with auto-dismiss
 * Dark cinematic theme with smooth animations
 */

import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Colors } from '../constants/Colors';

export type ToastType = 'success' | 'info' | 'error';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number; // milliseconds
  onDismiss?: () => void;
}

export default function Toast({ 
  message, 
  type = 'success', 
  duration = 2000,
  onDismiss 
}: ToastProps) {
  const { t } = useTranslation();
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Enter animation
    translateY.value = withSpring(0, {
      damping: 15,
      stiffness: 150,
    });
    opacity.value = withTiming(1, { duration: 200 });

    // Exit animation after duration
    const timer = setTimeout(() => {
      translateY.value = withTiming(100, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 }, () => {
        if (onDismiss) {
          runOnJS(onDismiss)();
        }
      });
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    };
  });

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'info':
      default:
        return 'ⓘ';
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#1a4d1a'; // Dark green
      case 'error':
        return '#4d1a1a'; // Dark red
      case 'info':
      default:
        return Colors.surface;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return '#2ecc71'; // Bright green
      case 'error':
        return '#e74c3c'; // Bright red
      case 'info':
      default:
        return Colors.primary;
    }
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        animatedStyle,
        { 
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
        }
      ]}
    >
      <Text style={styles.icon}>{getIcon()}</Text>
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  icon: {
    fontSize: 20,
    color: Colors.text,
    marginRight: 12,
    fontWeight: 'bold',
  },
  message: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
  },
});
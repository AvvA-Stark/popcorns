/**
 * CachedImage Component
 * High-performance image component with memory + disk caching via expo-image
 * Supports placeholders and automatic cache management
 */

import { Image, ImageProps } from 'expo-image';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/Colors';
import { useState } from 'react';

// Blurhash for common movie poster placeholder
// This is a generic dark gradient suitable for movie posters
const POSTER_BLURHASH = 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH';

interface CachedImageProps extends Omit<ImageProps, 'source'> {
  source: string | null | { uri: string | null };
  placeholder?: string; // Custom blurhash
  showLoadingIndicator?: boolean;
  fallback?: React.ReactNode; // Custom fallback for null sources
}

/**
 * CachedImage - Optimized image component with caching
 * 
 * Features:
 * - Memory + disk caching via expo-image
 * - Blurhash placeholders for smooth loading
 * - Automatic error handling
 * - Loading states
 */
export default function CachedImage({
  source,
  placeholder,
  showLoadingIndicator = false,
  fallback,
  style,
  contentFit = 'cover',
  ...props
}: CachedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Normalize source to URI string
  const uri = typeof source === 'string' ? source : source?.uri;

  // If no URI, show fallback or placeholder
  if (!uri || hasError) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <Image
        source={{ uri }}
        placeholder={placeholder || POSTER_BLURHASH}
        contentFit={contentFit}
        transition={200}
        cachePolicy="memory-disk" // Cache in memory and on disk
        style={StyleSheet.absoluteFill}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        {...props}
      />
      {showLoadingIndicator && isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={Colors.accent} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
});

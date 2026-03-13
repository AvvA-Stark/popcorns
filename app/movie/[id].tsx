/**
 * Movie Detail Screen
 * Full details, cast, trailers, and streaming availability
 */

import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Colors } from '../../constants/Colors';
import { tmdb, MovieDetailsComplete, CastMember, WatchProvider } from '../../lib/tmdb';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAST_IMAGE_SIZE = 80;

export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [movie, setMovie] = useState<MovieDetailsComplete | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);

  useEffect(() => {
    loadMovieDetails();
    checkWatchlistStatus();
  }, [id]);

  const loadMovieDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const details = await tmdb.getMovieDetailsComplete(Number(id));
      setMovie(details);
    } catch (err) {
      console.error('Error loading movie details:', err);
      setError('Failed to load movie details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkWatchlistStatus = async () => {
    try {
      const watchlistJson = await AsyncStorage.getItem('@popcorns_watchlist');
      if (watchlistJson) {
        const watchlist = JSON.parse(watchlistJson);
        setIsInWatchlist(watchlist.some((m: any) => m.id === Number(id)));
      }
    } catch (err) {
      console.error('Error checking watchlist:', err);
    }
  };

  const toggleWatchlist = async () => {
    if (!movie) return;

    try {
      const watchlistJson = await AsyncStorage.getItem('@popcorns_watchlist');
      let watchlist = watchlistJson ? JSON.parse(watchlistJson) : [];

      if (isInWatchlist) {
        // Remove from watchlist
        watchlist = watchlist.filter((m: any) => m.id !== movie.id);
      } else {
        // Add to watchlist
        watchlist.push({
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          release_date: movie.release_date,
          vote_average: movie.vote_average,
          overview: movie.overview,
          genre_ids: movie.genre_ids,
          addedAt: new Date().toISOString(),
        });
      }

      await AsyncStorage.setItem('@popcorns_watchlist', JSON.stringify(watchlist));
      setIsInWatchlist(!isInWatchlist);
    } catch (err) {
      console.error('Error toggling watchlist:', err);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Loading movie details...</Text>
      </View>
    );
  }

  if (error || !movie) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>😞</Text>
        <Text style={styles.errorText}>{error || 'Movie not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadMovieDetails}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const backdropUrl = tmdb.getBackdropUrl(movie.backdrop_path, 'large');
  const posterUrl = tmdb.getPosterUrl(movie.poster_path, 'large');
  const rating = movie.vote_average.toFixed(1);
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : null;
  
  const trailer = movie.videos ? tmdb.getYouTubeTrailer(movie.videos) : null;
  const topCast = movie.credits?.cast.slice(0, 10) || [];
  
  // Get streaming providers (prioritize US, fallback to first available)
  const providers = movie.watchProviders?.['US'] || Object.values(movie.watchProviders || {})[0];
  const streamingServices = providers?.flatrate || [];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with backdrop */}
        <View style={styles.header}>
          {backdropUrl ? (
            <Image source={{ uri: backdropUrl }} style={styles.backdrop} />
          ) : (
            <View style={[styles.backdrop, styles.backdropPlaceholder]} />
          )}
          <View style={styles.backdropGradient} />
          
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          {/* Poster + Title overlay */}
          <View style={styles.headerContent}>
            {posterUrl && (
              <Image source={{ uri: posterUrl }} style={styles.posterThumb} />
            )}
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>{movie.title}</Text>
              <View style={styles.metaRow}>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>⭐ {rating}</Text>
                </View>
                <Text style={styles.metaText}>{year}</Text>
                {runtime && <Text style={styles.metaText}>• {runtime}</Text>}
              </View>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Genres */}
          {movie.genres && movie.genres.length > 0 && (
            <View style={styles.genresContainer}>
              {movie.genres.map((genre) => (
                <View key={genre.id} style={styles.genrePill}>
                  <Text style={styles.genreText}>{genre.name}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Tagline */}
          {movie.tagline && (
            <Text style={styles.tagline}>"{movie.tagline}"</Text>
          )}

          {/* Overview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <Text style={styles.overview}>{movie.overview || 'No overview available.'}</Text>
          </View>

          {/* Cast */}
          {topCast.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cast</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.castScroll}
              >
                {topCast.map((actor) => {
                  const profileUrl = tmdb.getProfileUrl(actor.profile_path);
                  return (
                    <View key={actor.id} style={styles.castItem}>
                      {profileUrl ? (
                        <Image
                          source={{ uri: profileUrl }}
                          style={styles.castImage}
                        />
                      ) : (
                        <View style={[styles.castImage, styles.castImagePlaceholder]}>
                          <Text style={styles.castPlaceholderIcon}>👤</Text>
                        </View>
                      )}
                      <Text style={styles.castName} numberOfLines={2}>
                        {actor.name}
                      </Text>
                      <Text style={styles.castCharacter} numberOfLines={2}>
                        {actor.character}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Streaming Providers */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Where to Watch</Text>
            {streamingServices.length > 0 ? (
              <View style={styles.providersContainer}>
                {streamingServices.map((provider) => {
                  const logoUrl = tmdb.getImageUrl(provider.logo_path, 'w92');
                  return (
                    <View key={provider.provider_id} style={styles.providerItem}>
                      {logoUrl ? (
                        <Image
                          source={{ uri: logoUrl }}
                          style={styles.providerLogo}
                        />
                      ) : (
                        <View style={[styles.providerLogo, styles.providerLogoPlaceholder]}>
                          <Text style={styles.providerPlaceholderIcon}>📺</Text>
                        </View>
                      )}
                      <Text style={styles.providerName} numberOfLines={1}>
                        {provider.provider_name}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.noProviders}>Not available for streaming</Text>
            )}
          </View>

          {/* Trailer */}
          {trailer && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trailer</Text>
              <TouchableOpacity
                style={styles.trailerButton}
                onPress={() => {
                  setTrailerUrl(`https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0`);
                  setShowTrailer(true);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.trailerIcon}>▶️</Text>
                <Text style={styles.trailerButtonText}>Watch Trailer</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Watchlist Button */}
          <TouchableOpacity
            style={[styles.watchlistButton, isInWatchlist && styles.watchlistButtonActive]}
            onPress={toggleWatchlist}
            activeOpacity={0.8}
          >
            <Text style={styles.watchlistButtonText}>
              {isInWatchlist ? '✓ Remove from Watchlist' : '+ Add to Watchlist'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Trailer Modal */}
      {showTrailer && trailerUrl && (
        <Modal
          visible={showTrailer}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowTrailer(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowTrailer(false)}
          >
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setShowTrailer(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
              <WebView
                source={{ uri: trailerUrl }}
                style={{ flex: 1 }}
                allowsFullscreenVideo={true}
                javaScriptEnabled={true}
                domStorageEnabled={true}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.background,
  },
  header: {
    position: 'relative',
    height: 300,
  },
  backdrop: {
    width: '100%',
    height: '100%',
  },
  backdropPlaceholder: {
    backgroundColor: Colors.surface,
  },
  backdropGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: 'rgba(10, 10, 10, 0.85)',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 20,
    color: Colors.text,
    fontWeight: 'bold',
  },
  headerContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
  },
  posterThumb: {
    width: 100,
    height: 150,
    borderRadius: 8,
    backgroundColor: Colors.surface,
  },
  headerTextContainer: {
    flex: 1,
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    lineHeight: 28,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  ratingBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.background,
  },
  metaText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  content: {
    padding: 20,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  genrePill: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.textTertiary,
  },
  genreText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '600',
  },
  tagline: {
    fontSize: 14,
    fontStyle: 'italic',
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  overview: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  castScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  castItem: {
    width: CAST_IMAGE_SIZE + 20,
    marginRight: 12,
  },
  castImage: {
    width: CAST_IMAGE_SIZE,
    height: CAST_IMAGE_SIZE,
    borderRadius: CAST_IMAGE_SIZE / 2,
    backgroundColor: Colors.surface,
    marginBottom: 8,
  },
  castImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  castPlaceholderIcon: {
    fontSize: 32,
  },
  castName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  castCharacter: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  providersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  providerItem: {
    alignItems: 'center',
    width: 80,
  },
  providerLogo: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    marginBottom: 8,
  },
  providerLogoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerPlaceholderIcon: {
    fontSize: 24,
  },
  providerName: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  noProviders: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  trailerButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  trailerIcon: {
    fontSize: 20,
  },
  trailerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  watchlistButton: {
    backgroundColor: Colors.secondary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  watchlistButtonActive: {
    backgroundColor: Colors.success,
  },
  watchlistButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    width: '90%',
    height: '70%',
    backgroundColor: Colors.background,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalClose: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  modalCloseText: {
    fontSize: 24,
    color: Colors.text,
    fontWeight: 'bold',
  },
});

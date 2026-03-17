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
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Linking,
  TextInput,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import CachedImage from '../../components/CachedImage';
import { WebView } from 'react-native-webview';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/Colors';
import { tmdb, MovieDetailsComplete, CastMember, WatchProvider, Movie } from '../../lib/tmdb';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRegion } from '../../context/RegionContext';
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from '../../lib/watchlist';
import { renderPopcornRating } from '../../utils/popcornRating';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAST_IMAGE_SIZE = 80;

interface UserReview {
  movieId: number;
  rating: number; // 1-10
  text: string;
  date: string;
}

const PROVIDER_HOMEPAGE_URLS: Record<string, string> = {
  'Netflix': 'https://www.netflix.com/',
  'Amazon Prime Video': 'https://www.primevideo.com/',
  'Disney Plus': 'https://www.disneyplus.com/',
  'HBO Max': 'https://www.max.com/',
  'Apple TV Plus': 'https://tv.apple.com/',
  'Hulu': 'https://www.hulu.com/',
  'Peacock': 'https://www.peacocktv.com/',
  'Paramount Plus': 'https://www.paramountplus.com/',
  'Apple TV': 'https://tv.apple.com/',
  'Amazon Video': 'https://www.primevideo.com/',
  'Max': 'https://www.max.com/',
  'Paramount+ Amazon Channel': 'https://www.paramountplus.com/',
  'Showtime': 'https://www.showtime.com/',
  'Starz': 'https://www.starz.com/',
  'Crunchyroll': 'https://www.crunchyroll.com/',
  'YouTube Premium': 'https://www.youtube.com/premium',
  'Google Play Movies': 'https://play.google.com/store/movies',
  'Vudu': 'https://www.vudu.com/',
  'FuboTV': 'https://www.fubo.tv/',
  'Sling TV': 'https://www.sling.com/',
  'AMC+': 'https://www.amcplus.com/',
  'Discovery+': 'https://www.discoveryplus.com/',
  'ESPN+': 'https://www.espn.com/watch/espnplus/',
  'Tubi TV': 'https://tubitv.com/',
  'Pluto TV': 'https://pluto.tv/',
  'The Roku Channel': 'https://therokuchannel.roku.com/',
  'Shudder': 'https://www.shudder.com/',
  'Criterion Channel': 'https://www.criterionchannel.com/',
  'MUBI': 'https://mubi.com/',
  'Plex': 'https://www.plex.tv/',
};

export default function MovieDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { region } = useRegion();
  const [movie, setMovie] = useState<MovieDetailsComplete | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInWatchlistState, setIsInWatchlistState] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [trailerLoading, setTrailerLoading] = useState(true);
  
  // User Reviews state
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  
  // Similar Movies state
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [similarMoviesLoading, setSimilarMoviesLoading] = useState(false);

  useEffect(() => {
    loadMovieDetails();
    checkWatchlistStatus();
    loadReviews();
    loadSimilarMovies();
  }, [id]);

  const loadMovieDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      // Use region from context (already detected on app start)
      const details = await tmdb.getMovieDetailsComplete(Number(id), region);
      setMovie(details);
    } catch (err) {
      console.error('Error loading movie details:', err);
      setError(t('movieDetail.error'));
    } finally {
      setLoading(false);
    }
  };

  const checkWatchlistStatus = async () => {
    try {
      const inWatchlist = await isInWatchlist(Number(id), 'movie');
      setIsInWatchlistState(inWatchlist);
    } catch (err) {
      console.error('Error checking watchlist:', err);
    }
  };

  const toggleWatchlist = async () => {
    if (!movie) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      if (isInWatchlistState) {
        // Remove from watchlist
        await removeFromWatchlist(movie.id, 'movie');
      } else {
        // Add to watchlist with normal priority (from detail screen)
        await addToWatchlist(movie, 'normal', 'movie');
      }

      setIsInWatchlistState(!isInWatchlistState);
    } catch (err) {
      console.error('Error toggling watchlist:', err);
    }
  };

  const loadReviews = async () => {
    try {
      const reviewsJson = await AsyncStorage.getItem('@popcorns_reviews');
      if (reviewsJson) {
        const allReviews: UserReview[] = JSON.parse(reviewsJson);
        // Filter reviews for this movie
        const movieReviews = allReviews.filter(r => r.movieId === Number(id));
        setReviews(movieReviews);
      }
    } catch (err) {
      console.error('Error loading reviews:', err);
    }
  };

  const saveReview = async () => {
    if (!movie) return;

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const reviewsJson = await AsyncStorage.getItem('@popcorns_reviews');
      let allReviews: UserReview[] = reviewsJson ? JSON.parse(reviewsJson) : [];

      const newReview: UserReview = {
        movieId: movie.id,
        rating: reviewRating,
        text: reviewText.trim(),
        date: new Date().toISOString(),
      };

      allReviews.push(newReview);
      await AsyncStorage.setItem('@popcorns_reviews', JSON.stringify(allReviews));
      
      // Reload reviews for this movie
      await loadReviews();
      
      // Reset form
      setReviewRating(5);
      setReviewText('');
      setShowReviewForm(false);
    } catch (err) {
      console.error('Error saving review:', err);
    }
  };

  const renderStars = (rating: number, size: number = 16) => {
    const stars = [];
    const fullStars = Math.floor(rating / 2); // Convert 1-10 to 0-5 stars
    const hasHalfStar = (rating % 2) >= 1;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Text key={i} style={{ fontSize: size }}>⭐</Text>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Text key={i} style={{ fontSize: size }}>⭐</Text>);
      } else {
        stars.push(<Text key={i} style={{ fontSize: size, opacity: 0.3 }}>⭐</Text>);
      }
    }
    
    return <View style={{ flexDirection: 'row' }}>{stars}</View>;
  };

  const loadSimilarMovies = async () => {
    try {
      setSimilarMoviesLoading(true);
      const similar = await tmdb.getSimilarMovies(Number(id));
      setSimilarMovies(similar.slice(0, 10)); // Limit to 10 movies
    } catch (err) {
      console.error('Error loading similar movies:', err);
    } finally {
      setSimilarMoviesLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>{t('movieDetail.loading')}</Text>
      </View>
    );
  }

  if (error || !movie) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>😞</Text>
        <Text style={styles.errorText}>{error || t('movieDetail.notFound')}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadMovieDetails}>
          <Text style={styles.retryButtonText}>{t('movieDetail.tryAgain')}</Text>
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
  const providers = movie.watchProviders?.[region] || Object.values(movie.watchProviders || {})[0];
  
  // Combine all provider types (flatrate, rent, buy) for comprehensive display
  const allProviders = [
    ...(providers?.flatrate || []),
    ...(providers?.rent || []),
    ...(providers?.buy || []),
  ];
  
  // Remove duplicates based on provider_id
  const streamingServices = allProviders.filter((provider, index, self) =>
    index === self.findIndex((p) => p.provider_id === provider.provider_id)
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with backdrop */}
        <View style={styles.header}>
          <CachedImage
            source={backdropUrl}
            style={styles.backdrop}
            contentFit="cover"
            fallback={<View style={[styles.backdrop, styles.backdropPlaceholder]} />}
          />
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
            <CachedImage
              source={posterUrl}
              style={styles.posterThumb}
              contentFit="cover"
            />
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>{movie.title}</Text>
              <View style={styles.metaRow}>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>⭐ {rating}</Text>
                </View>
                {renderPopcornRating(movie.vote_average, 14)}
                <Text style={styles.metaText}>{year}</Text>
                {runtime && <Text style={styles.metaText}>• {runtime}</Text>}
              </View>
              {/* Tagline directly under title */}
              {movie.tagline && (
                <Text style={styles.headerTagline} numberOfLines={2}>
                  {movie.tagline}
                </Text>
              )}
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

          {/* Overview */}
          <Text style={styles.sectionTitle}>{t('movieDetail.overview')}</Text>
          <Text style={styles.overview}>
            {movie.overview || t('movieDetail.noOverview')}
          </Text>

          {/* Cast */}
          {topCast.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('movieDetail.cast')}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.castScroll}
              >
                {topCast.map((actor) => {
                  const profileUrl = tmdb.getProfileUrl(actor.profile_path);
                  return (
                    <View key={actor.id} style={styles.castItem}>
                      <CachedImage
                        source={profileUrl}
                        style={styles.castImage}
                        contentFit="cover"
                        fallback={
                          <View style={[styles.castImage, styles.castImagePlaceholder]}>
                            <Text style={styles.castPlaceholderIcon}>👤</Text>
                          </View>
                        }
                      />
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

          {/* Similar Movies */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('movieDetail.similarMovies')}</Text>
            {similarMoviesLoading ? (
              <View style={styles.similarMoviesLoading}>
                <ActivityIndicator size="small" color={Colors.accent} />
              </View>
            ) : similarMovies.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.similarMoviesScroll}
              >
                {similarMovies.map((similarMovie) => {
                  const posterUrl = tmdb.getPosterUrl(similarMovie.poster_path, 'medium');
                  return (
                    <TouchableOpacity
                      key={similarMovie.id}
                      style={styles.similarMovieCard}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        // Navigate to this movie's detail screen
                        router.push(`/movie/${similarMovie.id}`);
                      }}
                      activeOpacity={0.8}
                    >
                      <CachedImage
                        source={posterUrl}
                        style={styles.similarMoviePoster}
                        contentFit="cover"
                        fallback={
                          <View style={[styles.similarMoviePoster, styles.similarMoviePosterPlaceholder]}>
                            <Text style={styles.similarMoviePlaceholderIcon}>🎬</Text>
                          </View>
                        }
                      />
                      <Text style={styles.similarMovieTitle} numberOfLines={2}>
                        {similarMovie.title}
                      </Text>
                      <View style={styles.similarMovieRating}>
                        <Text style={styles.similarMovieRatingText}>
                          ⭐ {similarMovie.vote_average.toFixed(1)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <Text style={styles.noSimilarMovies}>{t('movieDetail.noSimilarMovies')}</Text>
            )}
          </View>

          {/* Streaming Providers */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('movieDetail.whereToWatch')}</Text>
            <Text style={styles.regionIndicator}>{t('movieDetail.availableIn', { region: t('regions.' + region), code: region })}</Text>
            {streamingServices.length > 0 ? (
              <View style={styles.providersContainer}>
                {streamingServices.map((provider) => {
                  const logoUrl = tmdb.getImageUrl(provider.logo_path, 'w92');
                  
                  return (
                    <TouchableOpacity 
                      key={provider.provider_id} 
                      style={styles.providerItem}
                      onPress={async () => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        
                        // Log the exact provider name for debugging
                        console.log('Provider pressed:', provider.provider_name);
                        
                        const homepageUrl = PROVIDER_HOMEPAGE_URLS[provider.provider_name];
                        if (homepageUrl) {
                          // Check if URL can be opened
                          const canOpen = await Linking.canOpenURL(homepageUrl);
                          if (canOpen) {
                            Linking.openURL(homepageUrl).catch(err => 
                              console.error('Failed to open provider URL:', err)
                            );
                          } else {
                            console.warn(`Cannot open URL for ${provider.provider_name}: ${homepageUrl}`);
                          }
                        } else {
                          console.warn(`No homepage URL configured for provider: ${provider.provider_name}`);
                          // Do nothing - no competitive linking
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <CachedImage
                        source={logoUrl}
                        style={styles.providerLogo}
                        contentFit="cover"
                        fallback={
                          <View style={[styles.providerLogo, styles.providerLogoPlaceholder]}>
                            <Text style={styles.providerPlaceholderIcon}>📺</Text>
                          </View>
                        }
                      />
                      <Text style={styles.providerName} numberOfLines={1}>
                        {provider.provider_name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.noProviders}>{t('movieDetail.notAvailable')}</Text>
            )}
          </View>

          {/* Trailer */}
          {trailer && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('movieDetail.trailer')}</Text>
              <TouchableOpacity
                style={styles.trailerButton}
                onPress={() => {
                  setTrailerUrl(`https://www.youtube.com/embed/${trailer.key}?autoplay=1&playsinline=1`);
                  setTrailerLoading(true);
                  setShowTrailer(true);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.trailerIcon}>▶️</Text>
                <Text style={styles.trailerButtonText}>{t('movieDetail.watchTrailer')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Watchlist Button */}
          <TouchableOpacity
            style={[styles.watchlistButton, isInWatchlistState && styles.watchlistButtonActive]}
            onPress={toggleWatchlist}
            activeOpacity={0.8}
          >
            <Text style={styles.watchlistButtonText}>
              {isInWatchlistState ? t('movieDetail.removeFromWatchlist') : t('movieDetail.addToWatchlist')}
            </Text>
          </TouchableOpacity>

          {/* User Reviews */}
          <View style={[styles.section, styles.reviewsSection]}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>{t('movieDetail.userReviews')}</Text>
              <TouchableOpacity
                style={styles.addReviewButton}
                onPress={() => setShowReviewForm(!showReviewForm)}
                activeOpacity={0.8}
              >
                <Text style={styles.addReviewButtonText}>
                  {showReviewForm ? t('movieDetail.cancelReview') : t('movieDetail.addReview')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Review Form */}
            {showReviewForm && (
              <View style={styles.reviewForm}>
                <Text style={styles.reviewFormLabel}>{t('movieDetail.yourRating')}</Text>
                <View style={styles.ratingSelector}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={[
                        styles.ratingButton,
                        reviewRating === num && styles.ratingButtonActive,
                      ]}
                      onPress={() => setReviewRating(num)}
                    >
                      <Text
                        style={[
                          styles.ratingButtonText,
                          reviewRating === num && styles.ratingButtonTextActive,
                        ]}
                      >
                        {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <Text style={styles.reviewFormLabel}>{t('movieDetail.yourReview')}</Text>
                <TextInput
                  style={styles.reviewInput}
                  placeholder={t('movieDetail.shareThoughts')}
                  placeholderTextColor={Colors.textTertiary}
                  value={reviewText}
                  onChangeText={setReviewText}
                  multiline
                  numberOfLines={4}
                />

                <TouchableOpacity
                  style={styles.submitReviewButton}
                  onPress={saveReview}
                  activeOpacity={0.8}
                >
                  <Text style={styles.submitReviewButtonText}>{t('movieDetail.submitReview')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Display Reviews */}
            {reviews.length > 0 ? (
              <View style={styles.reviewsList}>
                {reviews.map((review, index) => (
                  <View key={index} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      {renderStars(review.rating, 14)}
                      <Text style={styles.reviewRating}>{review.rating}/10</Text>
                      <Text style={styles.reviewDate}>
                        {new Date(review.date).toLocaleDateString()}
                      </Text>
                    </View>
                    {review.text && (
                      <Text style={styles.reviewText}>{review.text}</Text>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noReviewsContainer}>
                <Text style={styles.noReviewsIcon}>📝</Text>
                <Text style={styles.noReviews}>
                  {t('movieDetail.noReviews')}
                </Text>
                <Text style={styles.noReviewsSubtext}>
                  {t('movieDetail.beFirst')}
                </Text>
                <TouchableOpacity
                  style={styles.firstReviewButton}
                  onPress={() => setShowReviewForm(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.firstReviewButtonText}>{t('movieDetail.writeFirstReview')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
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
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                originWhitelist={['*']}
                startInLoadingState={true}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                onLoadEnd={() => setTrailerLoading(false)}
                onError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.error('Trailer loading failed:', nativeEvent);
                  setShowTrailer(false);
                  setTrailerLoading(false);
                  
                  // Show error alert
                  Alert.alert(t('movieDetail.trailerError'), '');
                  
                  // Fallback: Open in YouTube app
                  if (trailer) {
                    Linking.openURL(`https://www.youtube.com/watch?v=${trailer.key}`).catch(err =>
                      console.error('Failed to open YouTube app:', err)
                    );
                  }
                }}
              />
              {trailerLoading && (
                <View style={styles.trailerLoadingOverlay}>
                  <ActivityIndicator size="large" color={Colors.accent} />
                  <Text style={styles.trailerLoadingText}>{t('movieDetail.loadingTrailer')}</Text>
                </View>
              )}
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
  headerTagline: {
    fontSize: 13,
    fontStyle: 'italic',
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 6,
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
  regionIndicator: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: -12,
    marginBottom: 12,
  },
  overview: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginTop: 16,
    marginBottom: 16,
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
    marginTop: -16, // Compensate for section marginBottom (32 - 16 = 16px gap)
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
  trailerLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  trailerLoadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  // User Reviews styles
  reviewsSection: {
    marginTop: 40,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addReviewButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addReviewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  reviewForm: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  reviewFormLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  ratingSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  ratingButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingButtonActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  ratingButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  ratingButtonTextActive: {
    color: Colors.background,
  },
  reviewInput: {
    backgroundColor: Colors.background,
    color: Colors.text,
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top' as any,
    borderWidth: 1,
    borderColor: Colors.textTertiary,
  },
  submitReviewButton: {
    backgroundColor: Colors.accent,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitReviewButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.background,
  },
  reviewsList: {
    gap: 12,
  },
  reviewCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewRating: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent,
  },
  reviewDate: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginLeft: 'auto',
  },
  reviewText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  noReviewsContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noReviewsIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  noReviews: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
  },
  noReviewsSubtext: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginBottom: 16,
  },
  firstReviewButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  firstReviewButtonText: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  // Similar Movies styles
  similarMoviesLoading: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  similarMoviesScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  similarMovieCard: {
    width: 120,
    marginRight: 12,
  },
  similarMoviePoster: {
    width: 120,
    height: 180,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    marginBottom: 8,
  },
  similarMoviePosterPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  similarMoviePlaceholderIcon: {
    fontSize: 40,
  },
  similarMovieTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
    lineHeight: 16,
  },
  similarMovieRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  similarMovieRatingText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  noSimilarMovies: {
    fontSize: 14,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
});
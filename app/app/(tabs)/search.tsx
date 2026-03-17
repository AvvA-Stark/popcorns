/**
 * Search Screen
 * Search for movies using TMDB search API
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  ListRenderItem,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../constants/Colors';
import { tmdb, Movie } from '../../lib/tmdb';
import { FontAwesome } from '@expo/vector-icons';
import { SkeletonSearchCard } from '../../components/SkeletonCard';
import CachedImage from '../../components/CachedImage';
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from '../../lib/watchlist';
import { useToast } from '../../lib/toast';
import { renderPopcornRating } from '../../utils/popcornRating';

export default function SearchScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [watchlistStatus, setWatchlistStatus] = useState<{ [key: number]: boolean }>({});

  // Debounced search effect
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const movies = await tmdb.searchMovies(query.trim(), 1);
        setResults(movies);
        setHasSearched(true);
        console.log(`🔍 Found ${movies.length} results for "${query}"`);
        
        // Check watchlist status for all results
        const statusChecks = await Promise.all(
          movies.map(async (movie) => {
            const inWatchlist = await isInWatchlist(movie.id, 'movie');
            return { id: movie.id, inWatchlist };
          })
        );
        
        const statusMap: { [key: number]: boolean } = {};
        statusChecks.forEach(({ id, inWatchlist }) => {
          statusMap[id] = inWatchlist;
        });
        setWatchlistStatus(statusMap);
      } catch (error) {
        console.error('Error searching movies:', error);
        setResults([]);
        setHasSearched(true);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleMoviePress = (movieId: number) => {
    router.push(`/movie/${movieId}`);
  };

  const handleWatchlistToggle = async (movie: Movie, event: any) => {
    // Stop event propagation to prevent card press
    event.stopPropagation();
    
    const inWatchlist = watchlistStatus[movie.id] || false;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      if (inWatchlist) {
        await removeFromWatchlist(movie.id, 'movie');
        setWatchlistStatus(prev => ({ ...prev, [movie.id]: false }));
        showToast({
          message: t('watchlist.removedMessage', { title: movie.title }),
          type: 'info',
        });
      } else {
        await addToWatchlist(movie, 'normal', 'movie');
        setWatchlistStatus(prev => ({ ...prev, [movie.id]: true }));
        showToast({
          message: t('discovery.addedToWatchlist', { title: movie.title }),
          type: 'success',
        });
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
      showToast({
        message: t('discovery.failedToAddWatchlist'),
        type: 'error',
      });
    }
  };

  const renderMovieCard: ListRenderItem<Movie> = ({ item: movie }) => {
    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    const inWatchlist = watchlistStatus[movie.id] || false;

    return (
      <Pressable
        style={styles.card}
        onPress={() => handleMoviePress(movie.id)}
      >
        <View style={styles.posterContainer}>
          <CachedImage
            source={movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : null}
            style={styles.poster}
            contentFit="cover"
            fallback={
              <View style={styles.posterPlaceholder}>
                <Text style={styles.posterPlaceholderText}>🎬</Text>
              </View>
            }
          />
          
          {/* Watchlist button overlay */}
          <TouchableOpacity
            style={styles.watchlistButton}
            onPress={(e) => handleWatchlistToggle(movie, e)}
            activeOpacity={0.8}
          >
            <View style={[
              styles.watchlistIconContainer,
              inWatchlist && styles.watchlistActive
            ]}>
              <Text style={styles.watchlistIcon}>
                {inWatchlist ? '❤️' : '🤍'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {movie.title}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.year}>{year}</Text>
            <View style={styles.ratingContainer}>
              <FontAwesome name="star" size={12} color="#FFD700" />
              <Text style={styles.rating}>{rating}</Text>
            </View>
            {movie.vote_average > 0 && renderPopcornRating(movie.vote_average, 12)}
          </View>
        </View>
      </Pressable>
    );
  };

  const renderHeader = () => {
    if (loading) {
      return (
        <View>
          <Text style={styles.resultsCount}>{t('common.loading')}</Text>
          {[...Array(5)].map((_, index) => (
            <SkeletonSearchCard key={index} />
          ))}
        </View>
      );
    }
    
    if (!hasSearched) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔎</Text>
          <Text style={styles.emptyText}>{t('discovery.title')}</Text>
          <Text style={styles.emptySubtext}>
            {t('watchlist.emptyText')}
          </Text>
          <View style={styles.searchHintContainer}>
            <Text style={styles.searchHint}>💡 {t('movieDetail.notFound')}</Text>
          </View>
        </View>
      );
    }
    
    if (hasSearched && results.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>😕</Text>
          <Text style={styles.emptyText}>{t('discovery.noResults')}</Text>
          <Text style={styles.emptySubtext}>
            {t('watchlist.emptySubtext', { default: `We couldn't find any movies matching "${query}"` })}
          </Text>
          <View style={styles.searchHintContainer}>
            <Text style={styles.searchHint}>💡 {t('discovery.noResultsSubtext')}</Text>
          </View>
        </View>
      );
    }
    
    if (results.length > 0) {
      return (
        <Text style={styles.resultsCount}>
          {t('watchlist.stats', { count: results.length })}
        </Text>
      );
    }
    
    return null;
  };

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <FontAwesome name="search" size={18} color={Colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('tabs.search')}
            placeholderTextColor={Colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearButton}>
              <FontAwesome name="times-circle" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      <FlatList
        data={loading || !hasSearched ? [] : results}
        renderItem={renderMovieCard}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        windowSize={10}
        initialNumToRender={15}
      />
    </View>
  );
}

const POSTER_WIDTH = 80;
const POSTER_HEIGHT = 120;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.backgroundSecondary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginBottom: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 16,
  },
  searchHintContainer: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  searchHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  resultsContainer: {
    flex: 1,
  },
  resultsCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    fontWeight: '600',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  posterContainer: {
    width: POSTER_WIDTH,
    height: POSTER_HEIGHT,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
  },
  watchlistButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 10,
  },
  watchlistIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  watchlistActive: {
    backgroundColor: 'rgba(255, 0, 80, 0.2)',
    borderColor: 'rgba(255, 0, 80, 0.5)',
  },
  watchlistIcon: {
    fontSize: 16,
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  posterPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  posterPlaceholderText: {
    fontSize: 32,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  year: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
});
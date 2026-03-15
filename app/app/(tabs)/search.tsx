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
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { tmdb, Movie } from '../../lib/tmdb';
import { FontAwesome } from '@expo/vector-icons';
import { SkeletonSearchCard } from '../../components/SkeletonCard';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

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

  const renderMovieCard = (movie: Movie) => {
    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';

    return (
      <Pressable
        key={movie.id}
        style={styles.card}
        onPress={() => handleMoviePress(movie.id)}
      >
        <View style={styles.posterContainer}>
          {movie.poster_path ? (
            <Image
              source={{ uri: `https://image.tmdb.org/t/p/w200${movie.poster_path}` }}
              style={styles.poster}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.posterPlaceholder}>
              <Text style={styles.posterPlaceholderText}>🎬</Text>
            </View>
          )}
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
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <FontAwesome name="search" size={18} color={Colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for any movie..."
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {loading && (
          <View>
            <Text style={styles.resultsCount}>Searching...</Text>
            {[...Array(5)].map((_, index) => (
              <SkeletonSearchCard key={index} />
            ))}
          </View>
        )}

        {!loading && !hasSearched && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔎</Text>
            <Text style={styles.emptyText}>Discover your next favorite movie</Text>
            <Text style={styles.emptySubtext}>
              Search by title, actor, or director
            </Text>
            <View style={styles.searchHintContainer}>
              <Text style={styles.searchHint}>💡 Try "Inception" or "Tom Hanks"</Text>
            </View>
          </View>
        )}

        {!loading && hasSearched && results.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>😕</Text>
            <Text style={styles.emptyText}>No movies found</Text>
            <Text style={styles.emptySubtext}>
              We couldn't find any movies matching "{query}"
            </Text>
            <View style={styles.searchHintContainer}>
              <Text style={styles.searchHint}>💡 Check spelling or try a different title</Text>
            </View>
          </View>
        )}

        {!loading && results.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsCount}>
              {results.length} {results.length === 1 ? 'result' : 'results'}
            </Text>
            {results.map(renderMovieCard)}
          </View>
        )}
      </ScrollView>
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

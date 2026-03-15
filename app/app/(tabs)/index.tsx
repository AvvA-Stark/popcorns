/**
 * Discovery Screen (Main Swipe Screen)
 * Tinder-style movie swiping interface with comprehensive filters
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  FlatList,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Colors } from '../../constants/Colors';
import { tmdb, Movie, Genre, Person, PROVIDER_IDS } from '../../lib/tmdb';
import SwipeStack from '../../components/SwipeStack';
import { addToWatchlist } from '../../lib/watchlist';

interface Filters {
  genres: number[];
  year?: number;
  actorId?: number;
  actorName?: string;
  provider?: number;
  providerName?: string;
  ratingGte?: number;
}

export default function DiscoveryScreen() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [swipedCount, setSwipedCount] = useState(0);
  const [randomPage, setRandomPage] = useState(1);

  // Filter state
  const [filters, setFilters] = useState<Filters>({
    genres: [],
  });
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [tempFilters, setTempFilters] = useState<Filters>({ genres: [] });

  // Genre state
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loadingGenres, setLoadingGenres] = useState(false);

  // Actor search state
  const [actorSearchQuery, setActorSearchQuery] = useState('');
  const [actorSearchResults, setActorSearchResults] = useState<Person[]>([]);
  const [searchingActors, setSearchingActors] = useState(false);
  const actorSearchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Helper functions defined before effects
  const loadGenres = async () => {
    setLoadingGenres(true);
    try {
      const genreList = await tmdb.getGenres();
      setGenres(genreList);
    } catch (error) {
      console.error('Error loading genres:', error);
    } finally {
      setLoadingGenres(false);
    }
  };

  const hasActiveFilters = () => {
    return (
      filters.genres.length > 0 ||
      filters.year !== undefined ||
      filters.actorId !== undefined ||
      filters.provider !== undefined ||
      filters.ratingGte !== undefined
    );
  };

  const loadInitialMovies = async () => {
    const newRandomPage = Math.floor(Math.random() * 100) + 1;
    setRandomPage(newRandomPage);
    await loadMovies(1, newRandomPage);
  };

  // Effects
  useEffect(() => {
    loadInitialMovies();
  }, []);

  useEffect(() => {
    if (filterModalVisible && genres.length === 0) {
      loadGenres();
    }
  }, [filterModalVisible]);

  // Debounced actor search
  useEffect(() => {
    if (actorSearchTimeout.current) {
      clearTimeout(actorSearchTimeout.current);
    }

    if (actorSearchQuery.trim().length < 2) {
      setActorSearchResults([]);
      return;
    }

    actorSearchTimeout.current = setTimeout(async () => {
      setSearchingActors(true);
      try {
        const results = await tmdb.searchPerson(actorSearchQuery);
        setActorSearchResults(results.slice(0, 10));
      } catch (error) {
        console.error('Error searching actors:', error);
      } finally {
        setSearchingActors(false);
      }
    }, 500);

    return () => {
      if (actorSearchTimeout.current) {
        clearTimeout(actorSearchTimeout.current);
      }
    };
  }, [actorSearchQuery]);

  const loadMovies = async (page: number = 1, randomPageOverride?: number) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      let moviesData;

      if (hasActiveFilters()) {
        // Use filters
        const response = await tmdb.discoverMovies({
          genres: filters.genres.length > 0 ? filters.genres : undefined,
          year: filters.year,
          actor: filters.actorId,
          provider: filters.provider,
          rating_gte: filters.ratingGte,
          page,
        });
        moviesData = response.results;
        setHasMore(page < response.total_pages && response.total_pages > 0);
      } else {
        // Random mode - no filters (limit to last 40 years)
        const pageToUse = randomPageOverride !== undefined ? randomPageOverride : randomPage;
        const currentYear = new Date().getFullYear();
        const response = await tmdb.discoverMovies({ 
          page: pageToUse,
          year_gte: currentYear - 40
        });
        moviesData = response.results;
        setHasMore(true); // Always has more in random mode
      }

      if (page === 1) {
        setMovies(moviesData);
        setSwipedCount(0);
      } else {
        setMovies((prev) => [...prev, ...moviesData]);
      }

      setCurrentPage(page);
      console.log(`✅ Loaded ${moviesData.length} movies (page ${page})`);
    } catch (err) {
      setError('Failed to load movies');
      console.error('Error loading movies:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = async () => {
    if (hasActiveFilters()) {
      // Reset to page 1 with current filters
      await loadMovies(1);
    } else {
      // Random mode - pick new random page
      const newRandomPage = Math.floor(Math.random() * 100) + 1;
      setRandomPage(newRandomPage);
      await loadMovies(1, newRandomPage);
    }
  };

  const handleSwipeLeft = (movie: Movie) => {
    console.log('👎 Disliked:', movie.title);
    const newCount = swipedCount + 1;
    setSwipedCount(newCount);
    checkIfNeedMoreMovies(newCount);
  };

  const handleSwipeRight = async (movie: Movie) => {
    console.log('❤️ Liked:', movie.title);
    try {
      await addToWatchlist(movie, 'normal');
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
    }
    const newCount = swipedCount + 1;
    setSwipedCount(newCount);
    checkIfNeedMoreMovies(newCount);
  };

  const handleSwipeUp = async (movie: Movie) => {
    console.log('⭐ Super Liked:', movie.title);
    try {
      await addToWatchlist(movie, 'super');
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
    }
    const newCount = swipedCount + 1;
    setSwipedCount(newCount);
    checkIfNeedMoreMovies(newCount);
  };

  const checkIfNeedMoreMovies = (currentSwipedCount: number) => {
    const remainingMovies = movies.length - currentSwipedCount;

    if (remainingMovies <= 3 && hasMore && !loadingMore) {
      console.log(`🔄 Only ${remainingMovies} movies left, loading more...`);
      if (hasActiveFilters()) {
        loadMovies(currentPage + 1);
      } else {
        // In random mode, load a new random page
        const newRandomPage = Math.floor(Math.random() * 100) + 1;
        setRandomPage(newRandomPage);
        loadMovies(currentPage + 1, newRandomPage);
      }
    }
  };

  const openFilterModal = () => {
    setTempFilters({ ...filters });
    setActorSearchQuery(filters.actorName || '');
    setFilterModalVisible(true);
  };

  const applyFilters = async () => {
    setFilters({ ...tempFilters });
    setFilterModalVisible(false);
    setCurrentPage(1);
    await loadMovies(1);
  };

  const clearAllFilters = async () => {
    const emptyFilters: Filters = { genres: [] };
    setFilters(emptyFilters);
    setTempFilters(emptyFilters);
    setFilterModalVisible(false);
    setActorSearchQuery('');
    
    // Go back to random mode
    const newRandomPage = Math.floor(Math.random() * 100) + 1;
    setRandomPage(newRandomPage);
    await loadMovies(1, newRandomPage);
  };

  const removeFilter = async (filterKey: keyof Filters) => {
    const updatedFilters = { ...filters };
    if (filterKey === 'genres') {
      updatedFilters.genres = [];
    } else if (filterKey === 'actorId') {
      delete updatedFilters.actorId;
      delete updatedFilters.actorName;
    } else if (filterKey === 'provider') {
      delete updatedFilters.provider;
      delete updatedFilters.providerName;
    } else {
      delete updatedFilters[filterKey];
    }
    setFilters(updatedFilters);
    
    // Check if all filters are now empty
    const isEmpty = 
      updatedFilters.genres.length === 0 &&
      !updatedFilters.year &&
      !updatedFilters.actorId &&
      !updatedFilters.provider &&
      updatedFilters.ratingGte === undefined;
    
    if (isEmpty) {
      const newRandomPage = Math.floor(Math.random() * 100) + 1;
      setRandomPage(newRandomPage);
      await loadMovies(1, newRandomPage);
    } else {
      await loadMovies(1);
    }
  };

  const toggleGenre = (genreId: number) => {
    setTempFilters((prev) => {
      const genreIndex = prev.genres.indexOf(genreId);
      if (genreIndex > -1) {
        return {
          ...prev,
          genres: prev.genres.filter((id) => id !== genreId),
        };
      } else {
        return {
          ...prev,
          genres: [...prev.genres, genreId],
        };
      }
    });
  };

  const selectActor = (actor: Person) => {
    setTempFilters((prev) => ({
      ...prev,
      actorId: actor.id,
      actorName: actor.name,
    }));
    setActorSearchQuery(actor.name);
    setActorSearchResults([]);
  };

  const clearActor = () => {
    setTempFilters((prev) => {
      const updated = { ...prev };
      delete updated.actorId;
      delete updated.actorName;
      return updated;
    });
    setActorSearchQuery('');
    setActorSearchResults([]);
  };

  const selectProvider = (providerName: string, providerId: number) => {
    setTempFilters((prev) => ({
      ...prev,
      provider: providerId,
      providerName,
    }));
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading movies...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>🍿 Popcorns</Text>
          <TouchableOpacity onPress={openFilterModal} style={styles.filterButton}>
            <Text style={styles.filterIcon}>
              {hasActiveFilters() ? '🔍' : '⚙️'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
          {hasActiveFilters() ? 'Filtered results' : 'Random popular movies'}
        </Text>

        {/* Active filter pills */}
        {hasActiveFilters() && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterPillsContainer}
            contentContainerStyle={styles.filterPillsContent}
          >
            {filters.genres.length > 0 && (
              <TouchableOpacity
                style={styles.filterPill}
                onPress={() => removeFilter('genres')}
              >
                <Text style={styles.filterPillText}>
                  {filters.genres.map((id) => genres.find((g) => g.id === id)?.name).filter(Boolean).join(', ')}
                </Text>
                <Text style={styles.filterPillX}>✕</Text>
              </TouchableOpacity>
            )}
            {filters.year && (
              <TouchableOpacity
                style={styles.filterPill}
                onPress={() => removeFilter('year')}
              >
                <Text style={styles.filterPillText}>Year: {filters.year}</Text>
                <Text style={styles.filterPillX}>✕</Text>
              </TouchableOpacity>
            )}
            {filters.actorName && (
              <TouchableOpacity
                style={styles.filterPill}
                onPress={() => removeFilter('actorId')}
              >
                <Text style={styles.filterPillText}>Actor: {filters.actorName}</Text>
                <Text style={styles.filterPillX}>✕</Text>
              </TouchableOpacity>
            )}
            {filters.providerName && (
              <TouchableOpacity
                style={styles.filterPill}
                onPress={() => removeFilter('provider')}
              >
                <Text style={styles.filterPillText}>{filters.providerName}</Text>
                <Text style={styles.filterPillX}>✕</Text>
              </TouchableOpacity>
            )}
            {filters.ratingGte !== undefined && (
              <TouchableOpacity
                style={styles.filterPill}
                onPress={() => removeFilter('ratingGte')}
              >
                <Text style={styles.filterPillText}>Rating ≥ {filters.ratingGte.toFixed(1)}</Text>
                <Text style={styles.filterPillX}>✕</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}
      </View>

      <SwipeStack
        movies={movies}
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
        onSwipeUp={handleSwipeUp}
      />

      <View style={styles.footer}>
        {loadingMore ? (
          <View style={styles.loadingMore}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingMoreText}>Loading more...</Text>
          </View>
        ) : (
          <>
            <View style={styles.actionHint}>
              <Text style={styles.actionIcon}>👈</Text>
              <Text style={styles.actionText}>Dislike</Text>
            </View>
            <View style={styles.actionHint}>
              <Text style={styles.actionIcon}>👆</Text>
              <Text style={styles.actionText}>Super Like</Text>
            </View>
            <View style={styles.actionHint}>
              <Text style={styles.actionIcon}>👉</Text>
              <Text style={styles.actionText}>Like</Text>
            </View>
          </>
        )}
      </View>

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Movies</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Genres */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Genres</Text>
                {loadingGenres ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {genres.map((genre) => (
                      <TouchableOpacity
                        key={genre.id}
                        style={[
                          styles.genrePill,
                          tempFilters.genres.includes(genre.id) && styles.genrePillSelected,
                        ]}
                        onPress={() => toggleGenre(genre.id)}
                      >
                        <Text
                          style={[
                            styles.genrePillText,
                            tempFilters.genres.includes(genre.id) && styles.genrePillTextSelected,
                          ]}
                        >
                          {genre.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* Year */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Year</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., 2020"
                  placeholderTextColor={Colors.textSecondary}
                  keyboardType="numeric"
                  value={tempFilters.year?.toString() || ''}
                  onChangeText={(text) => {
                    const year = parseInt(text);
                    setTempFilters((prev) => ({
                      ...prev,
                      year: isNaN(year) ? undefined : year,
                    }));
                  }}
                />
              </View>

              {/* Actor */}
              <View style={styles.filterSection}>
                <View style={styles.actorHeader}>
                  <Text style={styles.filterLabel}>Actor</Text>
                  {tempFilters.actorId && (
                    <TouchableOpacity onPress={clearActor}>
                      <Text style={styles.clearButton}>Clear</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TextInput
                  style={styles.textInput}
                  placeholder="Search actor name..."
                  placeholderTextColor={Colors.textSecondary}
                  value={actorSearchQuery}
                  onChangeText={setActorSearchQuery}
                  editable={!tempFilters.actorId}
                />
                {searchingActors && (
                  <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 8 }} />
                )}
                {actorSearchResults.length > 0 && !tempFilters.actorId && (
                  <View style={styles.actorResults}>
                    {actorSearchResults.map((actor) => (
                      <TouchableOpacity
                        key={actor.id}
                        style={styles.actorResultItem}
                        onPress={() => selectActor(actor)}
                      >
                        <Text style={styles.actorResultName}>{actor.name}</Text>
                        <Text style={styles.actorResultDept}>{actor.known_for_department}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Provider */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Streaming Provider</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {Object.entries(PROVIDER_IDS).map(([name, id]) => (
                    <TouchableOpacity
                      key={id}
                      style={[
                        styles.providerPill,
                        tempFilters.provider === id && styles.providerPillSelected,
                      ]}
                      onPress={() => selectProvider(name, id)}
                    >
                      <Text
                        style={[
                          styles.providerPillText,
                          tempFilters.provider === id && styles.providerPillTextSelected,
                        ]}
                      >
                        {name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Rating */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>
                  Minimum Rating: {tempFilters.ratingGte?.toFixed(1) || '0.0'}
                </Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={10}
                  step={0.1}
                  value={tempFilters.ratingGte || 0}
                  onValueChange={(value) =>
                    setTempFilters((prev) => ({
                      ...prev,
                      ratingGte: value > 0 ? value : undefined,
                    }))
                  }
                  minimumTrackTintColor={Colors.primary}
                  maximumTrackTintColor={'#333333'}
                  thumbTintColor={Colors.primary}
                />
              </View>
            </ScrollView>

            {/* Action buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.clearAllButton} onPress={clearAllFilters}>
                <Text style={styles.clearAllButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
  },
  filterButton: {
    marginLeft: 12,
    padding: 8,
  },
  filterIcon: {
    fontSize: 24,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  filterPillsContainer: {
    marginTop: 12,
    maxHeight: 40,
  },
  filterPillsContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '20',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  filterPillText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  filterPillX: {
    color: Colors.primary,
    fontSize: 14,
    marginLeft: 6,
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 24,
    paddingHorizontal: 40,
  },
  actionHint: {
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalClose: {
    fontSize: 28,
    color: Colors.textSecondary,
    fontWeight: '300',
  },
  modalScroll: {
    paddingHorizontal: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  genrePill: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  genrePillSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  genrePillText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  genrePillTextSelected: {
    color: Colors.background,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: '#333333',
  },
  actorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearButton: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  actorResults: {
    marginTop: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actorResultItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  actorResultName: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  actorResultDept: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  providerPill: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  providerPillSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  providerPillText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  providerPillTextSelected: {
    color: Colors.background,
    fontWeight: '600',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  clearAllButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  clearAllButtonText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});

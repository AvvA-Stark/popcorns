/**
 * Series Screen (Main Swipe Screen for TV Series)
 * Tinder-style TV series swiping interface with comprehensive filters
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
import { useFocusEffect } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import { Colors } from '../../constants/Colors';
import { tmdb, Movie, TVSeries, Genre, Person, PROVIDER_IDS } from '../../lib/tmdb';
import SwipeStack from '../../components/SwipeStack';
import { addToWatchlist } from '../../lib/watchlist';
import SkeletonCard from '../../components/SkeletonCard';
import { useToast } from '../../lib/toast';
import { useRegion } from '../../context/RegionContext';
import RangeSlider from '../../components/RangeSlider';
import SwipeTutorialOverlay from '../../components/SwipeTutorialOverlay';
import { trackPass, trackLike, trackSuperLike, updateGenreNames } from '../../utils/stats';

interface Filters {
  genres: number[];
  yearFrom?: number;
  yearTo?: number;
  actorId?: number;
  actorName?: string;
  provider?: number;
  providerName?: string;
  ratingGte?: number;
  availableInRegion?: boolean;
}

export default function SeriesScreen() {
  const { showToast } = useToast();
  const { region, regionName } = useRegion();
  const [series, setSeries] = useState<TVSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [swipedCount, setSwipedCount] = useState(0);
  const [randomPage, setRandomPage] = useState(1);
  const [showTutorial, setShowTutorial] = useState(false);

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
      const genreList = await tmdb.getTVGenres();
      setGenres(genreList);
      
      // Update genre names in stats
      const genreMap: { [id: number]: string } = {};
      genreList.forEach(genre => {
        genreMap[genre.id] = genre.name;
      });
      await updateGenreNames(genreMap);
    } catch (error) {
      console.error('Error loading TV genres:', error);
    } finally {
      setLoadingGenres(false);
    }
  };

  const hasActiveFilters = () => {
    return (
      filters.genres.length > 0 ||
      filters.yearFrom !== undefined ||
      filters.yearTo !== undefined ||
      filters.actorId !== undefined ||
      filters.provider !== undefined ||
      filters.ratingGte !== undefined ||
      filters.availableInRegion === true
    );
  };

  const loadInitialSeries = async () => {
    const newRandomPage = Math.floor(Math.random() * 100) + 1;
    setRandomPage(newRandomPage);
    await loadSeries(1, newRandomPage);
  };

  // Trigger tutorial every time this tab comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('📺 Series tab focused - triggering tutorial');
      setShowTutorial(false); // Reset first
      setTimeout(() => {
        setShowTutorial(true); // Then trigger
      }, 100);
      
      return () => {
        // Cleanup when tab loses focus
        setShowTutorial(false);
      };
    }, [])
  );

  // Effects
  useEffect(() => {
    loadInitialSeries();
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

  const loadSeries = async (page: number = 1, randomPageOverride?: number, filtersOverride?: Filters) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      let seriesData;

      // Use override filters if provided, otherwise use state
      const activeFilters = filtersOverride !== undefined ? filtersOverride : filters;
      const hasFilters = 
        activeFilters.genres.length > 0 ||
        activeFilters.yearFrom !== undefined ||
        activeFilters.yearTo !== undefined ||
        activeFilters.actorId !== undefined ||
        activeFilters.provider !== undefined ||
        activeFilters.ratingGte !== undefined ||
        activeFilters.availableInRegion === true;

      if (hasFilters) {
        // Use filters (region from context)
        const response = await tmdb.discoverTVSeries({
          genres: activeFilters.genres.length > 0 ? activeFilters.genres : undefined,
          year_gte: activeFilters.yearFrom,
          year_lte: activeFilters.yearTo,
          actor: activeFilters.actorId,
          provider: activeFilters.provider,
          rating_gte: activeFilters.ratingGte,
          page,
          region, // Pass region from context for provider filtering
        });
        // Filter out series without posters in Discovery
        seriesData = response.results.filter(show => show.poster_path);
        
        // Apply region availability filter if enabled
        if (activeFilters.availableInRegion) {
          console.log(`🔍 Fetching watch providers for ${seriesData.length} series in region: ${region} (${regionName})`);
          
          // Fetch watch providers for all series in parallel
          const seriesWithProviders = await Promise.all(
            seriesData.map(async (show: any) => {
              try {
                const providers = await tmdb.getTVWatchProviders(show.id, region);
                return {
                  ...show,
                  watchProviders: providers,
                };
              } catch (error) {
                console.error(`Failed to fetch providers for ${show.name}:`, error);
                return {
                  ...show,
                  watchProviders: {},
                };
              }
            })
          );
          
          // Now filter based on the fetched provider data
          const beforeCount = seriesWithProviders.length;
          seriesData = seriesWithProviders.filter((show: any) => {
            const regionProviders = show.watchProviders?.[region];
            
            // Ensure we have provider data for this region
            if (!regionProviders || typeof regionProviders !== 'object') {
              if (__DEV__) {
                console.log(`❌ ${show.name}: No provider data for region ${region}`);
              }
              return false;
            }
            
            // Check all provider types (flatrate, rent, buy)
            const hasFlatrate = Array.isArray(regionProviders.flatrate) && regionProviders.flatrate.length > 0;
            const hasRent = Array.isArray(regionProviders.rent) && regionProviders.rent.length > 0;
            const hasBuy = Array.isArray(regionProviders.buy) && regionProviders.buy.length > 0;
            
            const hasAnyProvider = hasFlatrate || hasRent || hasBuy;
            
            // Debug logging for series that don't pass
            if (__DEV__ && !hasAnyProvider) {
              console.log(`❌ ${show.name}: No streaming options (flatrate=${hasFlatrate}, rent=${hasRent}, buy=${hasBuy})`);
            }
            
            return hasAnyProvider;
          });
          
          console.log(`✅ After region filter: ${seriesData.length}/${beforeCount} series available in ${region}`);
        }
        
        setHasMore(page < response.total_pages && response.total_pages > 0);
      } else {
        // Random mode - no filters (limit to last 40 years)
        const pageToUse = randomPageOverride !== undefined ? randomPageOverride : randomPage;
        const currentYear = new Date().getFullYear();
        const response = await tmdb.discoverTVSeries({ 
          page: pageToUse,
          year_gte: currentYear - 40
        });
        // Filter out series without posters in Discovery
        seriesData = response.results.filter(show => show.poster_path);
        setHasMore(true); // Always has more in random mode
      }

      if (page === 1) {
        setSeries(seriesData);
        setSwipedCount(0);
      } else {
        setSeries((prev) => [...prev, ...seriesData]);
      }

      setCurrentPage(page);
      console.log(`✅ Loaded ${seriesData.length} TV series (page ${page})`);
    } catch (err) {
      setError('Failed to load TV series');
      console.error('Error loading TV series:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = async () => {
    if (hasActiveFilters()) {
      // Reset to page 1 with current filters
      await loadSeries(1);
    } else {
      // Random mode - pick new random page
      const newRandomPage = Math.floor(Math.random() * 100) + 1;
      setRandomPage(newRandomPage);
      await loadSeries(1, newRandomPage);
    }
  };

  const handleSwipeLeft = async (item: Movie | TVSeries) => {
    const show = item as TVSeries;
    console.log('👎 Disliked:', show.name);
    
    // Track stats
    await trackPass();
    
    const newCount = swipedCount + 1;
    setSwipedCount(newCount);
    checkIfNeedMoreSeries(newCount);
  };

  const handleSwipeRight = async (item: Movie | TVSeries) => {
    const show = item as TVSeries;
    console.log('❤️ Liked:', show.name);
    
    // Track stats
    await trackLike(show);
    
    try {
      await addToWatchlist(show, 'normal', 'tv');
      showToast({ 
        message: `Added "${show.name}" to watchlist`, 
        type: 'success' 
      });
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
      showToast({ 
        message: 'Failed to add to watchlist', 
        type: 'error' 
      });
    }
    const newCount = swipedCount + 1;
    setSwipedCount(newCount);
    checkIfNeedMoreSeries(newCount);
  };

  const handleSwipeUp = async (item: Movie | TVSeries) => {
    const show = item as TVSeries;
    console.log('⭐ Super Liked:', show.name);
    
    // Track stats
    await trackSuperLike(show);
    
    try {
      await addToWatchlist(show, 'super', 'tv');
      showToast({ 
        message: `⭐ Super-liked "${show.name}"!`, 
        type: 'success' 
      });
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
      showToast({ 
        message: 'Failed to add to watchlist', 
        type: 'error' 
      });
    }
    const newCount = swipedCount + 1;
    setSwipedCount(newCount);
    checkIfNeedMoreSeries(newCount);
  };

  const checkIfNeedMoreSeries = (currentSwipedCount: number) => {
    const remainingSeries = series.length - currentSwipedCount;

    if (remainingSeries <= 3 && hasMore && !loadingMore) {
      console.log(`🔄 Only ${remainingSeries} series left, loading more...`);
      if (hasActiveFilters()) {
        loadSeries(currentPage + 1);
      } else {
        // In random mode, load a new random page
        const newRandomPage = Math.floor(Math.random() * 100) + 1;
        setRandomPage(newRandomPage);
        loadSeries(currentPage + 1, newRandomPage);
      }
    }
  };

  const openFilterModal = () => {
    setTempFilters({ ...filters });
    setActorSearchQuery(filters.actorName || '');
    setFilterModalVisible(true);
  };

  const applyFilters = async () => {
    const newFilters = { ...tempFilters };
    setFilters(newFilters);
    setFilterModalVisible(false);
    setCurrentPage(1);
    // Pass newFilters directly to avoid state sync issue
    await loadSeries(1, undefined, newFilters);
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
    // Pass emptyFilters directly to ensure immediate application
    await loadSeries(1, newRandomPage, emptyFilters);
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
    } else if (filterKey === 'yearFrom') {
      delete updatedFilters.yearFrom;
      delete updatedFilters.yearTo;
    } else {
      delete updatedFilters[filterKey];
    }
    setFilters(updatedFilters);
    
    // Check if all filters are now empty
    const isEmpty = 
      updatedFilters.genres.length === 0 &&
      !updatedFilters.yearFrom &&
      !updatedFilters.yearTo &&
      !updatedFilters.actorId &&
      !updatedFilters.provider &&
      updatedFilters.ratingGte === undefined &&
      !updatedFilters.availableInRegion;
    
    if (isEmpty) {
      const newRandomPage = Math.floor(Math.random() * 100) + 1;
      setRandomPage(newRandomPage);
      // Pass updatedFilters directly to ensure immediate application
      await loadSeries(1, newRandomPage, updatedFilters);
    } else {
      // Pass updatedFilters directly to ensure immediate application
      await loadSeries(1, undefined, updatedFilters);
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
        <View style={styles.stickyHeader}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>📺 Series</Text>
            <View style={styles.filterButton}>
              <Text style={styles.filterIcon}>⚙️</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>Loading TV series...</Text>
        </View>
        <View style={styles.contentArea}>
          <View style={styles.skeletonContainer}>
            <SkeletonCard />
          </View>
        </View>
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
    <View key={region} style={styles.container}>
      {/* Sticky header - always visible at top */}
      <View style={styles.stickyHeader}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>📺 Series</Text>
          <TouchableOpacity onPress={openFilterModal} style={styles.filterButton}>
            <Text style={styles.filterIcon}>
              {hasActiveFilters() ? '🔍' : '⚙️'}
            </Text>
          </TouchableOpacity>
        </View>

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
            {(filters.yearFrom || filters.yearTo) && (
              <TouchableOpacity
                style={styles.filterPill}
                onPress={() => removeFilter('yearFrom')}
              >
                <Text style={styles.filterPillText}>
                  Year: {filters.yearFrom || '—'} - {filters.yearTo || '—'}
                </Text>
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
            {filters.availableInRegion && (
              <TouchableOpacity
                style={styles.filterPill}
                onPress={() => removeFilter('availableInRegion')}
              >
                <Text style={styles.filterPillText}>Available in {regionName}</Text>
                <Text style={styles.filterPillX}>✕</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}
      </View>

      {/* Swipe content area - fills remaining space */}
      <View style={[
        styles.contentArea,
        hasActiveFilters() && styles.contentAreaWithFilters
      ]}>
        <SwipeStack
          movies={series}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          onSwipeUp={handleSwipeUp}
        />
      </View>

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
              <Text style={styles.modalTitle}>Filter TV Series</Text>
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

              {/* Year Range */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>
                  Year: {tempFilters.yearFrom || 1900} — {tempFilters.yearTo || new Date().getFullYear()}
                </Text>
                <RangeSlider
                  minValue={1900}
                  maxValue={new Date().getFullYear()}
                  fromValue={tempFilters.yearFrom || 1900}
                  toValue={tempFilters.yearTo || new Date().getFullYear()}
                  step={1}
                  onFromChange={(value) => {
                    const currentYear = new Date().getFullYear();
                    setTempFilters((prev) => ({
                      ...prev,
                      // Only set if not the full range
                      yearFrom: value === 1900 && (prev.yearTo === currentYear || !prev.yearTo) ? undefined : value,
                    }));
                  }}
                  onToChange={(value) => {
                    const currentYear = new Date().getFullYear();
                    setTempFilters((prev) => ({
                      ...prev,
                      // Only set if not the full range
                      yearTo: value === currentYear && (prev.yearFrom === 1900 || !prev.yearFrom) ? undefined : value,
                    }));
                  }}
                  minimumTrackTintColor={Colors.primary}
                  maximumTrackTintColor="#333333"
                  thumbTintColor={Colors.primary}
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

              {/* Available in Region */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Availability</Text>
                <TouchableOpacity
                  style={[
                    styles.toggleOption,
                    tempFilters.availableInRegion && styles.toggleOptionSelected,
                  ]}
                  onPress={() =>
                    setTempFilters((prev) => ({
                      ...prev,
                      availableInRegion: !prev.availableInRegion,
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.toggleText,
                      tempFilters.availableInRegion && styles.toggleTextSelected,
                    ]}
                  >
                    Available in {regionName}
                  </Text>
                  <View style={styles.toggleSwitch}>
                    <View
                      style={[
                        styles.toggleKnob,
                        tempFilters.availableInRegion && styles.toggleKnobActive,
                      ]}
                    />
                  </View>
                </TouchableOpacity>
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

      {/* Tutorial Overlay - shows every time tab is focused */}
      <SwipeTutorialOverlay trigger={showTutorial} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  stickyHeader: {
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  contentArea: {
    flex: 1,
  },
  contentAreaWithFilters: {
    // No additional padding needed - filter pills are part of header
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: 16,
    maxHeight: 40,
  },
  filterPillsContent: {
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
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  toggleOptionSelected: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
  },
  toggleText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  toggleTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    backgroundColor: '#333333',
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.textSecondary,
  },
  toggleKnobActive: {
    backgroundColor: Colors.primary,
    transform: [{ translateX: 22 }],
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
  skeletonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
});

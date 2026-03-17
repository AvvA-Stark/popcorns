/**
 * Watchlist Screen
 * Display user's saved movies to watch later
 */

import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Alert, ListRenderItem } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../constants/Colors';
import { getWatchlist, removeFromWatchlist, WatchlistItem, initializeSync, fullSync } from '../../lib/watchlist';
import WatchlistCard from '../../components/WatchlistCard';
import { useToast } from '../../lib/toast';
import { logSupabaseStatus } from '../../lib/supabase';

export default function WatchlistScreen() {
  const { showToast } = useToast();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Initialize Supabase sync on component mount (one-time)
  useEffect(() => {
    logSupabaseStatus();
    initializeSync().then(() => {
      console.log('✅ Supabase sync initialized');
    }).catch(err => {
      console.error('⚠️ Supabase sync initialization failed:', err);
    });
  }, []);

  // Load watchlist when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadWatchlist();
    }, [])
  );

  const loadWatchlist = async () => {
    try {
      const items = await getWatchlist();
      setWatchlist(items);
      console.log(`📋 Loaded ${items.length} movies from watchlist`);
    } catch (error) {
      console.error('Error loading watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    // Trigger full sync on pull-to-refresh
    await fullSync().catch(err => {
      console.error('Sync failed during refresh:', err);
    });
    await loadWatchlist();
    setRefreshing(false);
  };

  const handleRemove = async (movieId: number, skipConfirmation: boolean = false) => {
    const movie = watchlist.find(item => item.id === movieId);
    if (!movie) return;

    const performDelete = async () => {
      try {
        await removeFromWatchlist(movieId, movie.mediaType);
        setWatchlist(prev => prev.filter(item => !(item.id === movieId && item.mediaType === movie.mediaType)));
        showToast({ 
          message: `Removed "${movie.title}" from watchlist`, 
          type: 'info' 
        });
        console.log(`🗑️ Removed ${movie.title} from watchlist`);
      } catch (error) {
        console.error('Error removing from watchlist:', error);
        showToast({ 
          message: 'Failed to remove from watchlist', 
          type: 'error' 
        });
      }
    };

    if (skipConfirmation) {
      // For swipe-to-delete: immediate removal without confirmation
      await performDelete();
    } else {
      // For button tap: show confirmation alert
      Alert.alert(
        'Remove from Watchlist',
        `Remove "${movie.title}" from your watchlist?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: performDelete,
          },
        ]
      );
    }
  };

  const superLikedCount = watchlist.filter(item => item.priority === 'super').length;
  const normalLikedCount = watchlist.filter(item => item.priority === 'normal').length;

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>📋 Your Watchlist</Text>
        </View>
      </View>
    );
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>📋 Your Watchlist</Text>
      {watchlist.length > 0 ? (
        <View style={styles.stats}>
          <Text style={styles.statsText}>
            {watchlist.length} {watchlist.length === 1 ? 'movie' : 'movies'}
          </Text>
          {superLikedCount > 0 && (
            <Text style={styles.statsDetail}>
              ⭐ {superLikedCount} super {superLikedCount === 1 ? 'like' : 'likes'}
            </Text>
          )}
        </View>
      ) : (
        <Text style={styles.subtitle}>Movies you want to watch</Text>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🍿</Text>
      <Text style={styles.emptyText}>Your watchlist is empty</Text>
      <Text style={styles.emptySubtext}>
        Start discovering movies and swipe right to add them here
      </Text>
      <View style={styles.emptyHintRow}>
        <View style={styles.emptyHint}>
          <Text style={styles.emptyHintIcon}>👉</Text>
          <Text style={styles.emptyHintText}>Like</Text>
        </View>
        <View style={styles.emptyHint}>
          <Text style={styles.emptyHintIcon}>👆</Text>
          <Text style={styles.emptyHintText}>Super Like</Text>
        </View>
      </View>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <Text style={styles.footerText}>
        Pull down to refresh
      </Text>
    </View>
  );

  const renderItem: ListRenderItem<WatchlistItem> = ({ item }) => (
    <WatchlistCard item={item} onRemove={handleRemove} />
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <FlatList
        data={watchlist}
        renderItem={renderItem}
        keyExtractor={(item) => `${item.id}-${item.mediaType}-${item.addedAt}`}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
        // Performance optimizations (removeClippedSubviews disabled to fix swipe gesture)
        removeClippedSubviews={false}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        windowSize={10}
        initialNumToRender={10}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1, // Fixed: Allows ScrollView to expand and scroll fully
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100, // Fixed: Extra bottom padding for full scroll visibility
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  statsText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  statsDetail: {
    fontSize: 14,
    color: Colors.superLike,
    fontWeight: '600',
  },
  list: {
    flex: 1,
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
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 24,
  },
  emptyHintRow: {
    flexDirection: 'row',
    gap: 32,
    marginTop: 8,
  },
  emptyHint: {
    alignItems: 'center',
    gap: 8,
  },
  emptyHintIcon: {
    fontSize: 32,
  },
  emptyHintText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 12,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
});

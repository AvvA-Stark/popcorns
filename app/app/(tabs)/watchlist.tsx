/**
 * Watchlist Screen
 * Display user's saved movies to watch later
 */

import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../constants/Colors';
import { getWatchlist, removeFromWatchlist, WatchlistItem } from '../../lib/watchlist';
import WatchlistCard from '../../components/WatchlistCard';
import { useToast } from '../../lib/toast';

export default function WatchlistScreen() {
  const { showToast } = useToast();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    await loadWatchlist();
    setRefreshing(false);
  };

  const handleRemove = async (movieId: number) => {
    const movie = watchlist.find(item => item.id === movieId);
    if (!movie) return;

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
          onPress: async () => {
            try {
              await removeFromWatchlist(movieId);
              setWatchlist(prev => prev.filter(item => item.id !== movieId));
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
          },
        },
      ]
    );
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

  if (watchlist.length === 0) {
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
            />
          }
        >
          <View style={styles.header}>
            <Text style={styles.title}>📋 Your Watchlist</Text>
            <Text style={styles.subtitle}>Movies you want to watch</Text>
          </View>

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
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>📋 Your Watchlist</Text>
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
        </View>

        <View style={styles.list}>
          {watchlist.map(item => (
            <WatchlistCard
              key={item.id}
              item={item}
              onRemove={handleRemove}
            />
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Pull down to refresh
          </Text>
        </View>
      </ScrollView>
    </View>
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

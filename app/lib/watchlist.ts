/**
 * Watchlist Service
 * Manages persistent storage of user's saved movies and TV series
 * Includes Supabase sync for cloud backup and multi-device support
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Movie, TVSeries } from './tmdb';
import { supabase, isSupabaseAvailable } from './supabase';
import { getDeviceId } from './deviceId';

const WATCHLIST_KEY = '@popcorns:watchlist';
const MIGRATION_KEY = '@popcorns:supabase_migrated';
const LAST_SYNC_KEY = '@popcorns:last_sync';

export type MediaType = 'movie' | 'tv';

export interface WatchlistItem {
  id: number;
  title: string;
  posterPath: string | null;
  addedAt: number;
  priority: 'normal' | 'super'; // normal = right swipe, super = up swipe
  mediaType: MediaType; // 'movie' or 'tv'
  overview?: string;
  releaseDate?: string;
  voteAverage?: number;
}

/**
 * Add a movie or TV series to the watchlist
 */
export async function addToWatchlist(
  item: Movie | TVSeries,
  priority: 'normal' | 'super' = 'normal',
  mediaType: MediaType = 'movie'
): Promise<void> {
  try {
    const currentWatchlist = await getWatchlist();
    
    // Check if item already exists (check both id and mediaType)
    const exists = currentWatchlist.some(w => w.id === item.id && w.mediaType === mediaType);
    if (exists) {
      const title = 'title' in item ? item.title : item.name;
      console.log(`${mediaType === 'movie' ? 'Movie' : 'Series'} ${title} already in watchlist`);
      return;
    }

    const title = 'title' in item ? item.title : item.name;
    const releaseDate = 'release_date' in item ? item.release_date : item.first_air_date;

    const newItem: WatchlistItem = {
      id: item.id,
      title,
      posterPath: item.poster_path,
      addedAt: Date.now(),
      priority,
      mediaType,
      overview: item.overview,
      releaseDate,
      voteAverage: item.vote_average,
    };

    const updatedWatchlist = [newItem, ...currentWatchlist];
    await AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(updatedWatchlist));
    console.log(`✅ Added ${title} to watchlist (${priority}, ${mediaType})`);
    
    // Auto-sync to Supabase (fire and forget)
    if (isSupabaseAvailable()) {
      syncWatchlistToSupabase().catch(err => {
        console.error('Background sync failed:', err);
      });
    }
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    throw error;
  }
}

/**
 * Remove a movie or TV series from the watchlist
 */
export async function removeFromWatchlist(id: number, mediaType: MediaType = 'movie'): Promise<void> {
  try {
    const currentWatchlist = await getWatchlist();
    const updatedWatchlist = currentWatchlist.filter(item => !(item.id === id && item.mediaType === mediaType));
    await AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(updatedWatchlist));
    console.log(`🗑️ Removed ${mediaType} ${id} from watchlist`);
    
    // Auto-sync to Supabase (delete from remote)
    if (isSupabaseAvailable()) {
      const deviceId = await getDeviceId();
      supabase!
        .from('watchlist')
        .delete()
        .eq('user_id', deviceId)
        .eq('movie_id', id)
        .eq('media_type', mediaType)
        .then(({ error }) => {
          if (error) {
            console.error('Background delete sync failed:', error);
          }
        });
    }
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    throw error;
  }
}

/**
 * Get the full watchlist
 */
export async function getWatchlist(): Promise<WatchlistItem[]> {
  try {
    const data = await AsyncStorage.getItem(WATCHLIST_KEY);
    if (!data) return [];
    
    const watchlist = JSON.parse(data);
    
    // Deduplicate: keep only the first occurrence of each id+mediaType combination
    const seen = new Set<string>();
    const deduped = watchlist.filter((item: WatchlistItem) => {
      const key = `${item.id}-${item.mediaType}`;
      if (seen.has(key)) {
        console.log(`⚠️ Found duplicate watchlist entry: ${item.title} (${key})`);
        return false;
      }
      seen.add(key);
      return true;
    });
    
    // If duplicates were found, save the cleaned list back to storage
    if (deduped.length < watchlist.length) {
      console.log(`🧹 Removed ${watchlist.length - deduped.length} duplicate(s) from watchlist`);
      await AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(deduped));
    }
    
    return deduped;
  } catch (error) {
    console.error('Error loading watchlist:', error);
    return [];
  }
}

/**
 * Check if a movie or TV series is in the watchlist
 */
export async function isInWatchlist(id: number, mediaType: MediaType = 'movie'): Promise<boolean> {
  try {
    const watchlist = await getWatchlist();
    return watchlist.some(item => item.id === id && item.mediaType === mediaType);
  } catch (error) {
    console.error('Error checking watchlist:', error);
    return false;
  }
}

/**
 * Clear the entire watchlist
 */
export async function clearWatchlist(): Promise<void> {
  try {
    await AsyncStorage.removeItem(WATCHLIST_KEY);
    console.log('🧹 Watchlist cleared');
  } catch (error) {
    console.error('Error clearing watchlist:', error);
    throw error;
  }
}

/**
 * Get watchlist statistics
 */
export async function getWatchlistStats(): Promise<{
  total: number;
  normal: number;
  super: number;
}> {
  try {
    const watchlist = await getWatchlist();
    return {
      total: watchlist.length,
      normal: watchlist.filter(item => item.priority === 'normal').length,
      super: watchlist.filter(item => item.priority === 'super').length,
    };
  } catch (error) {
    console.error('Error getting watchlist stats:', error);
    return { total: 0, normal: 0, super: 0 };
  }
}

// ============================================================================
// SUPABASE SYNC FUNCTIONS
// ============================================================================

/**
 * Sync local watchlist to Supabase (upload)
 */
export async function syncWatchlistToSupabase(): Promise<void> {
  if (!isSupabaseAvailable()) {
    console.log('⚠️ Supabase not configured - skipping upload sync');
    return;
  }

  try {
    const deviceId = await getDeviceId();
    const localWatchlist = await getWatchlist();

    console.log(`☁️ Syncing ${localWatchlist.length} items to Supabase...`);

    // Upload each item to Supabase (upsert to handle duplicates)
    for (const item of localWatchlist) {
      const { error } = await supabase!
        .from('watchlist')
        .upsert({
          user_id: deviceId,
          movie_id: item.id,
          media_type: item.mediaType,
          title: item.title,
          poster_path: item.posterPath,
          vote_average: item.voteAverage,
          release_date: item.releaseDate,
          overview: item.overview,
          priority: item.priority,
          added_at: new Date(item.addedAt).toISOString(),
        }, {
          onConflict: 'user_id,movie_id,media_type',
        });

      if (error) {
        console.error(`❌ Error uploading ${item.title}:`, error.message);
      }
    }

    await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
    console.log('✅ Watchlist uploaded to Supabase');
  } catch (error) {
    console.error('❌ Error syncing to Supabase:', error);
    throw error;
  }
}

/**
 * Sync watchlist from Supabase (download)
 */
export async function syncWatchlistFromSupabase(): Promise<WatchlistItem[]> {
  if (!isSupabaseAvailable()) {
    console.log('⚠️ Supabase not configured - skipping download sync');
    return [];
  }

  try {
    const deviceId = await getDeviceId();

    console.log('☁️ Downloading watchlist from Supabase...');

    const { data, error } = await supabase!
      .from('watchlist')
      .select('*')
      .eq('user_id', deviceId);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('📭 No watchlist data found in Supabase');
      return [];
    }

    // Convert Supabase data to WatchlistItem format
    const remoteWatchlist: WatchlistItem[] = data.map((item: any) => ({
      id: item.movie_id,
      title: item.title,
      posterPath: item.poster_path,
      addedAt: new Date(item.added_at).getTime(),
      priority: item.priority,
      mediaType: item.media_type,
      overview: item.overview,
      releaseDate: item.release_date,
      voteAverage: item.vote_average,
    }));

    console.log(`✅ Downloaded ${remoteWatchlist.length} items from Supabase`);
    return remoteWatchlist;
  } catch (error) {
    console.error('❌ Error downloading from Supabase:', error);
    return [];
  }
}

/**
 * Merge local and remote watchlists (keeping most recent)
 */
export async function mergeWatchlists(
  local: WatchlistItem[],
  remote: WatchlistItem[]
): Promise<WatchlistItem[]> {
  const merged = new Map<string, WatchlistItem>();

  // Add all local items
  local.forEach(item => {
    const key = `${item.id}-${item.mediaType}`;
    merged.set(key, item);
  });

  // Merge with remote items (keep most recent)
  remote.forEach(remoteItem => {
    const key = `${remoteItem.id}-${remoteItem.mediaType}`;
    const localItem = merged.get(key);

    if (!localItem || remoteItem.addedAt > localItem.addedAt) {
      // Remote item is newer or doesn't exist locally
      merged.set(key, remoteItem);
    }
  });

  // Convert map back to array, sorted by addedAt (newest first)
  const result = Array.from(merged.values()).sort((a, b) => b.addedAt - a.addedAt);
  
  console.log(`🔀 Merged watchlist: ${local.length} local + ${remote.length} remote = ${result.length} unique items`);
  
  return result;
}

/**
 * Full sync: Download from Supabase, merge with local, upload changes
 */
export async function fullSync(): Promise<void> {
  if (!isSupabaseAvailable()) {
    console.log('⚠️ Supabase not configured - sync disabled');
    return;
  }

  try {
    console.log('🔄 Starting full watchlist sync...');

    // 1. Get local watchlist
    const localWatchlist = await getWatchlist();

    // 2. Download from Supabase
    const remoteWatchlist = await syncWatchlistFromSupabase();

    // 3. Merge (keep most recent)
    const mergedWatchlist = await mergeWatchlists(localWatchlist, remoteWatchlist);

    // 4. Save merged result locally
    await AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(mergedWatchlist));

    // 5. Upload merged result to Supabase
    await syncWatchlistToSupabase();

    await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
    console.log('✅ Full sync complete');
  } catch (error) {
    console.error('❌ Error during full sync:', error);
    // Don't throw - we want the app to continue working even if sync fails
  }
}

/**
 * Migrate existing AsyncStorage watchlist to Supabase (one-time)
 */
export async function migrateToSupabase(): Promise<void> {
  if (!isSupabaseAvailable()) {
    console.log('⚠️ Supabase not configured - skipping migration');
    return;
  }

  try {
    // Check if migration already done
    const migrated = await AsyncStorage.getItem(MIGRATION_KEY);
    if (migrated === 'true') {
      console.log('✅ Migration already completed');
      return;
    }

    console.log('🚀 Starting watchlist migration to Supabase...');

    // Get existing local watchlist
    const localWatchlist = await getWatchlist();

    if (localWatchlist.length === 0) {
      console.log('📭 No local watchlist data to migrate');
      await AsyncStorage.setItem(MIGRATION_KEY, 'true');
      return;
    }

    // Upload to Supabase
    await syncWatchlistToSupabase();

    // Mark migration as complete
    await AsyncStorage.setItem(MIGRATION_KEY, 'true');
    console.log(`✅ Migrated ${localWatchlist.length} items to Supabase`);
  } catch (error) {
    console.error('❌ Error during migration:', error);
    // Don't throw - migration can be retried later
  }
}

/**
 * Initialize sync on app startup
 * Handles migration and initial sync
 */
export async function initializeSync(): Promise<void> {
  if (!isSupabaseAvailable()) {
    console.log('⚠️ Supabase not configured - running in local-only mode');
    return;
  }

  try {
    // 1. Migrate existing data (if not done yet)
    await migrateToSupabase();

    // 2. Perform full sync
    await fullSync();
  } catch (error) {
    console.error('❌ Error initializing sync:', error);
    // Continue running - app should work even if sync fails
  }
}

/**
 * Get last sync timestamp
 */
export async function getLastSyncTime(): Promise<number | null> {
  try {
    const timestamp = await AsyncStorage.getItem(LAST_SYNC_KEY);
    return timestamp ? parseInt(timestamp, 10) : null;
  } catch (error) {
    console.error('Error getting last sync time:', error);
    return null;
  }
}

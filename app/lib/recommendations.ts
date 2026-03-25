/**
 * Adaptive Recommendation Engine
 * Learns user preferences from swipe history with recency weighting
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Movie, TVSeries, CastMember, CrewMember } from './tmdb';

const SWIPE_HISTORY_KEY = '@popcorns:swipe_history';
const TASTE_PROFILE_KEY = '@popcorns:taste_profile';
const MAX_HISTORY_SIZE = 200;

export interface SwipeHistoryItem {
  movieId: number;
  action: 'like' | 'dislike' | 'superLike';
  genres: string[];
  actors?: string[];
  director?: string;
  timestamp: string; // ISO 8601
}

export interface TasteProfile {
  genres: Record<string, number>;
  actors: Record<string, number>;
  directors: Record<string, number>;
  lastUpdated: string;
}

export interface ScoredMovie {
  movie: Movie | TVSeries;
  score: number;
}

/**
 * Calculate time decay weight based on recency
 * Recent swipes (24h) = 1.0x
 * 3 days = 0.5x
 * 1 week = 0.2x
 * 1 month+ = 0.05x
 */
export function getRecencyWeight(timestamp: string): number {
  const hoursSince = (Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60);
  
  if (hoursSince < 24) return 1.0;
  if (hoursSince < 72) return 0.5;
  if (hoursSince < 168) return 0.2;
  return 0.05;
}

/**
 * Get action weight for scoring
 * Like = +5, Dislike = -3, Super Like = +10
 */
function getActionWeight(action: 'like' | 'dislike' | 'superLike'): number {
  switch (action) {
    case 'superLike':
      return 10;
    case 'like':
      return 5;
    case 'dislike':
      return -3;
  }
}

/**
 * Load swipe history from storage
 */
export async function getSwipeHistory(): Promise<SwipeHistoryItem[]> {
  try {
    const data = await AsyncStorage.getItem(SWIPE_HISTORY_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading swipe history:', error);
    return [];
  }
}

/**
 * Save swipe history to storage
 */
async function saveSwipeHistory(history: SwipeHistoryItem[]): Promise<void> {
  try {
    // Keep only the last MAX_HISTORY_SIZE items
    const trimmed = history.slice(-MAX_HISTORY_SIZE);
    await AsyncStorage.setItem(SWIPE_HISTORY_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Error saving swipe history:', error);
  }
}

/**
 * Load taste profile from storage
 */
export async function getTasteProfile(): Promise<TasteProfile | null> {
  try {
    const data = await AsyncStorage.getItem(TASTE_PROFILE_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading taste profile:', error);
    return null;
  }
}

/**
 * Save taste profile to storage
 */
async function saveTasteProfile(profile: TasteProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(TASTE_PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving taste profile:', error);
  }
}

/**
 * Track a swipe and update taste profile
 * @param item - Movie or TV series that was swiped
 * @param action - The swipe action (like, dislike, superLike)
 * @param credits - Optional credits data (cast/crew) from TMDB
 */
export async function trackSwipe(
  item: Movie | TVSeries,
  action: 'like' | 'dislike' | 'superLike',
  credits?: { cast?: CastMember[]; crew?: CrewMember[] }
): Promise<void> {
  try {
    // Extract metadata
    const genres = item.genre_ids.map(String);
    const actors = credits?.cast?.slice(0, 5).map((c) => c.name) || [];
    const director = credits?.crew?.find((c) => c.job === 'Director')?.name;

    // Create swipe history item
    const historyItem: SwipeHistoryItem = {
      movieId: item.id,
      action,
      genres,
      actors,
      director,
      timestamp: new Date().toISOString(),
    };

    // Load and update history
    const history = await getSwipeHistory();
    history.push(historyItem);
    await saveSwipeHistory(history);

    // Recalculate taste profile
    const profile = await calculateTasteProfile(history);
    await saveTasteProfile(profile);

    console.log(`✅ Tracked ${action} for ${isMovie(item) ? item.title : item.name}`);
  } catch (error) {
    console.error('Error tracking swipe:', error);
  }
}

/**
 * Calculate taste profile from swipe history with time decay
 */
export async function calculateTasteProfile(
  swipeHistory: SwipeHistoryItem[]
): Promise<TasteProfile> {
  const profile: TasteProfile = {
    genres: {},
    actors: {},
    directors: {},
    lastUpdated: new Date().toISOString(),
  };

  for (const swipe of swipeHistory) {
    const recencyWeight = getRecencyWeight(swipe.timestamp);
    const actionWeight = getActionWeight(swipe.action);
    const totalWeight = recencyWeight * actionWeight;

    // Update genre scores
    for (const genre of swipe.genres) {
      profile.genres[genre] = (profile.genres[genre] || 0) + totalWeight;
    }

    // Update actor scores
    if (swipe.actors) {
      for (const actor of swipe.actors) {
        profile.actors[actor] = (profile.actors[actor] || 0) + totalWeight;
      }
    }

    // Update director scores
    if (swipe.director) {
      profile.directors[swipe.director] =
        (profile.directors[swipe.director] || 0) + totalWeight;
    }
  }

  return profile;
}

/**
 * Calculate relevance score for a movie based on taste profile
 */
export function scoreMovie(
  item: Movie | TVSeries,
  profile: TasteProfile,
  credits?: { cast?: CastMember[]; crew?: CrewMember[] }
): number {
  let score = 0;

  // Score based on genres
  for (const genreId of item.genre_ids) {
    const genreScore = profile.genres[String(genreId)] || 0;
    score += genreScore;
  }

  // Score based on actors (if credits available)
  if (credits?.cast) {
    for (const castMember of credits.cast.slice(0, 5)) {
      const actorScore = profile.actors[castMember.name] || 0;
      score += actorScore * 0.5; // Weight actors less than genres
    }
  }

  // Score based on director (if credits available)
  if (credits?.crew) {
    const director = credits.crew.find((c) => c.job === 'Director');
    if (director) {
      const directorScore = profile.directors[director.name] || 0;
      score += directorScore * 0.7; // Weight directors between genres and actors
    }
  }

  return score;
}

/**
 * Sort movies by relevance to user's taste profile
 * Returns movies sorted by descending score (most relevant first)
 */
export async function sortByRelevance(
  items: (Movie | TVSeries)[]
): Promise<(Movie | TVSeries)[]> {
  try {
    const profile = await getTasteProfile();
    
    // If no profile yet (cold start), return unfiltered
    if (!profile) {
      console.log('❄️ Cold start: No taste profile yet, showing unfiltered feed');
      return items;
    }

    // Score all items
    const scored: ScoredMovie[] = items.map((item) => ({
      movie: item,
      score: scoreMovie(item, profile),
    }));

    // Sort by score (descending)
    scored.sort((a, b) => b.score - a.score);

    // Return sorted movies
    const sorted = scored.map((s) => s.movie);
    
    console.log(`🎯 Sorted ${items.length} items by relevance (top score: ${scored[0]?.score.toFixed(2)})`);
    
    return sorted;
  } catch (error) {
    console.error('Error sorting by relevance:', error);
    return items; // Fallback to original order
  }
}

/**
 * Check if we have enough swipe history to enable recommendations
 * Returns true if user has swiped at least 10-15 times
 */
export async function hasMinimumSwipeHistory(): Promise<boolean> {
  const history = await getSwipeHistory();
  return history.length >= 10;
}

/**
 * Get recent swipes (last N items)
 */
export async function getRecentSwipes(count: number = 30): Promise<SwipeHistoryItem[]> {
  const history = await getSwipeHistory();
  return history.slice(-count);
}

/**
 * Get all-time statistics from swipe history
 */
export async function getAllTimeStats(): Promise<{
  genres: Array<{ name: string; count: number }>;
  actors: Array<{ name: string; count: number }>;
  directors: Array<{ name: string; count: number }>;
}> {
  const profile = await getTasteProfile();
  
  if (!profile) {
    return { genres: [], actors: [], directors: [] };
  }

  // Convert to arrays and sort by score (descending)
  const genres = Object.entries(profile.genres)
    .filter(([_, score]) => score > 0) // Only positive scores
    .map(([name, score]) => ({ name, count: Math.round(score) }))
    .sort((a, b) => b.count - a.count);

  const actors = Object.entries(profile.actors)
    .filter(([_, score]) => score > 0)
    .map(([name, score]) => ({ name, count: Math.round(score) }))
    .sort((a, b) => b.count - a.count);

  const directors = Object.entries(profile.directors)
    .filter(([_, score]) => score > 0)
    .map(([name, score]) => ({ name, count: Math.round(score) }))
    .sort((a, b) => b.count - a.count);

  return { genres, actors, directors };
}

/**
 * Get current mood (recent preferences from last 20-30 swipes)
 */
export async function getCurrentMood(): Promise<{
  genres: Array<{ name: string; count: number }>;
  actors: Array<{ name: string; count: number }>;
  directors: Array<{ name: string; count: number }>;
}> {
  const recentSwipes = await getRecentSwipes(30);
  
  // Calculate a temporary profile from only recent swipes
  const recentProfile = await calculateTasteProfile(recentSwipes);

  // Convert to arrays and sort by score (descending)
  const genres = Object.entries(recentProfile.genres)
    .filter(([_, score]) => score > 0) // Only positive scores
    .map(([name, score]) => ({ name, count: Math.round(score) }))
    .sort((a, b) => b.count - a.count);

  const actors = Object.entries(recentProfile.actors)
    .filter(([_, score]) => score > 0)
    .map(([name, score]) => ({ name, count: Math.round(score) }))
    .sort((a, b) => b.count - a.count);

  const directors = Object.entries(recentProfile.directors)
    .filter(([_, score]) => score > 0)
    .map(([name, score]) => ({ name, count: Math.round(score) }))
    .sort((a, b) => b.count - a.count);

  return { genres, actors, directors };
}

/**
 * Reset all recommendation data (clear swipe history and taste profile)
 */
export async function resetRecommendations(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SWIPE_HISTORY_KEY);
    await AsyncStorage.removeItem(TASTE_PROFILE_KEY);
    console.log('🧹 Recommendations reset');
  } catch (error) {
    console.error('Error resetting recommendations:', error);
  }
}

/**
 * Helper to check if item is a Movie
 */
function isMovie(item: Movie | TVSeries): item is Movie {
  return 'title' in item;
}

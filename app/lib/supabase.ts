/**
 * Supabase Configuration
 * Handles connection to Supabase for persistent cloud storage
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase configuration
// IMPORTANT: Replace these with your actual Supabase project credentials
// Get these from: https://app.supabase.com/project/_/settings/api
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Check if credentials are configured
const isConfigured = 
  SUPABASE_URL !== 'YOUR_SUPABASE_URL' && 
  SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY' &&
  SUPABASE_URL.length > 0 &&
  SUPABASE_ANON_KEY.length > 0;

/**
 * Initialize Supabase client
 * Returns null if credentials are not configured
 */
export const supabase: SupabaseClient | null = isConfigured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
}) : null;

/**
 * Check if Supabase is configured and available
 */
export function isSupabaseAvailable(): boolean {
  return supabase !== null;
}

/**
 * Log Supabase configuration status
 */
export function logSupabaseStatus(): void {
  if (isConfigured) {
    console.log('✅ Supabase: Connected');
  } else {
    console.log('⚠️ Supabase: Not configured (using local storage only)');
    console.log('ℹ️ To enable cloud sync, add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file');
  }
}

/**
 * Database schema for reference:
 * 
 * CREATE TABLE watchlist (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   user_id TEXT NOT NULL,
 *   movie_id INTEGER NOT NULL,
 *   media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
 *   title TEXT,
 *   poster_path TEXT,
 *   vote_average REAL,
 *   release_date TEXT,
 *   overview TEXT,
 *   priority TEXT NOT NULL CHECK (priority IN ('normal', 'super')),
 *   added_at TIMESTAMP DEFAULT NOW(),
 *   UNIQUE(user_id, movie_id, media_type)
 * );
 * 
 * -- Enable Row Level Security
 * ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
 * 
 * -- Create policy to allow all operations (since we're using device IDs, not auth)
 * CREATE POLICY "Enable all access for all users" ON watchlist FOR ALL USING (true);
 * 
 * -- Create index for faster queries
 * CREATE INDEX idx_watchlist_user_id ON watchlist(user_id);
 */

/**
 * Region Detection Utility
 * Detects user's country code for streaming provider availability
 */

import * as Localization from 'expo-localization';

/**
 * Get user's region/country code (e.g., 'US', 'BG', 'GB')
 * Falls back to 'US' if detection fails or returns invalid code
 */
export function getRegion(): string {
  try {
    // Get device region from expo-localization
    const region = Localization.region;
    
    // Validate that we got a proper 2-letter country code
    if (region && typeof region === 'string' && region.length === 2) {
      console.log(`✅ Detected region: ${region}`);
      return region.toUpperCase();
    }
    
    // Fallback to US if invalid
    console.warn('⚠️ Invalid or missing region, falling back to US');
    return 'US';
  } catch (error) {
    console.error('❌ Error detecting region, falling back to US:', error);
    return 'US';
  }
}

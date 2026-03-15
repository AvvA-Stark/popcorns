/**
 * Region Detection Utility
 * Detects user's country code for streaming provider availability
 */

import * as Localization from 'expo-localization';

/**
 * Get user's region/country code (e.g., 'US', 'BG', 'GB')
 * Falls back to parsing locale, then 'US' if detection fails
 */
export function getRegion(): string {
  try {
    // First try: Get device region from expo-localization
    const region = Localization.region;
    
    // Validate that we got a proper 2-letter country code
    if (region && typeof region === 'string' && region.length === 2) {
      const regionCode = region.toUpperCase();
      console.log(`[Region Detection] Path 1: Localization.region → ${regionCode}`);
      return regionCode;
    }
    
    // Second try: Parse region from locale (e.g., "en-BG" → "BG", "bg-BG" → "BG")
    const locale = Localization.locale;
    if (locale && typeof locale === 'string') {
      // Split by hyphen or underscore and get the second part (country code)
      const parts = locale.split(/[-_]/);
      if (parts.length >= 2) {
        const localeRegion = parts[1].toUpperCase();
        if (localeRegion.length === 2) {
          console.log(`[Region Detection] Path 2: Parsed from Localization.locale (${locale}) → ${localeRegion}`);
          return localeRegion;
        }
      }
    }
    
    // Final fallback to US
    console.warn('[Region Detection] Path 3: No valid region or locale found, falling back to US');
    return 'US';
  } catch (error) {
    console.error('[Region Detection] Error detecting region, falling back to US:', error);
    return 'US';
  }
}

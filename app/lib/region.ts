/**
 * Region Detection Utility
 * Detects user's country code for streaming provider availability
 */

import { getLocales } from 'expo-localization';

// Cache the detected region so we only fetch once per app session
let cachedRegion: string | null = null;

/**
 * Get user's region/country code (e.g., 'US', 'BG', 'GB')
 * Falls back to parsing locale, then IP-based detection, then 'US' if all fail
 */
export async function getRegion(): Promise<string> {
  // Return cached region if already detected
  if (cachedRegion) {
    console.log(`[Region Detection] Using cached region: ${cachedRegion}`);
    return cachedRegion;
  }

  try {
    // Get locales from expo-localization
    const locales = getLocales();
    const primaryLocale = locales[0];
    
    // First try: Get region code from primary locale
    if (primaryLocale?.regionCode) {
      const regionCode = primaryLocale.regionCode.toUpperCase();
      // Skip 'US' as it might be a default value - we'll try other methods first
      if (regionCode !== 'US') {
        console.log(`[Region Detection] Path 1: Locale regionCode → ${regionCode}`);
        cachedRegion = regionCode;
        return regionCode;
      }
    }
    
    // Second try: Parse region from language tag (e.g., "en-BG" → "BG", "bg-BG" → "BG")
    if (primaryLocale?.languageTag) {
      const languageTag = primaryLocale.languageTag;
      const parts = languageTag.split(/[-_]/);
      if (parts.length >= 2) {
        const localeRegion = parts[1].toUpperCase();
        // Skip 'US' as it might be a default value
        if (localeRegion.length === 2 && localeRegion !== 'US') {
          console.log(`[Region Detection] Path 2: Parsed from languageTag (${languageTag}) → ${localeRegion}`);
          cachedRegion = localeRegion;
          return localeRegion;
        }
      }
    }
    
    // Third try: IP-based geolocation via ipapi.co
    console.log('[Region Detection] Path 3: Attempting IP-based detection via ipapi.co...');
    try {
      const response = await fetch('https://ipapi.co/json/', {
        headers: { 'User-Agent': 'Popcorns-App/1.0' }
      });
      
      if (response.ok) {
        const data = await response.json();
        const countryCode = data.country_code;
        
        if (countryCode && typeof countryCode === 'string' && countryCode.length === 2) {
          const ipRegion = countryCode.toUpperCase();
          console.log(`[Region Detection] Path 3: IP-based detection → ${ipRegion}`);
          cachedRegion = ipRegion;
          return ipRegion;
        } else {
          console.warn('[Region Detection] Path 3: IP API returned invalid country_code:', countryCode);
        }
      } else {
        console.warn('[Region Detection] Path 3: IP API request failed with status:', response.status);
      }
    } catch (ipError) {
      console.warn('[Region Detection] Path 3: IP-based detection failed:', ipError);
    }
    
    // Final fallback to US (or the regionCode from locale if it was US)
    const fallbackRegion = primaryLocale?.regionCode?.toUpperCase() || 'US';
    console.warn(`[Region Detection] Path 4: All detection methods failed, falling back to ${fallbackRegion}`);
    cachedRegion = fallbackRegion;
    return fallbackRegion;
  } catch (error) {
    console.error('[Region Detection] Error detecting region, falling back to US:', error);
    cachedRegion = 'US';
    return 'US';
  }
}

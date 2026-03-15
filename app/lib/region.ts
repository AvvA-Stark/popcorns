/**
 * Region Detection Utility
 * Detects user's country code for streaming provider availability
 */

import * as Localization from 'expo-localization';

// Cache the detected region so we only fetch once per app session
let cachedRegion: string | null = null;

/**
 * Get user's region/country code (e.g., 'US', 'BG', 'GB')
 * Uses device region → IP-based detection → 'US' fallback
 */
export async function getRegion(): Promise<string> {
  // Return cached region if already detected
  if (cachedRegion) {
    console.log(`[Region Detection] Using cached region: ${cachedRegion}`);
    return cachedRegion;
  }

  try {
    // First try: Get region directly from device settings
    if (Localization.region) {
      const deviceRegion = Localization.region.toUpperCase();
      // Accept device region if present and not 'US' (which might be a default)
      if (deviceRegion !== 'US') {
        console.log(`[Region Detection] Path 1: Device region → ${deviceRegion}`);
        cachedRegion = deviceRegion;
        return deviceRegion;
      }
    }
    
    // Second try: IP-based geolocation via api.country.is
    console.log('[Region Detection] Path 2: Attempting IP-based detection via api.country.is...');
    try {
      const response = await fetch('https://api.country.is');
      
      if (response.ok) {
        const data = await response.json();
        const countryCode = data.country;
        
        if (countryCode && typeof countryCode === 'string' && countryCode.length === 2) {
          const ipRegion = countryCode.toUpperCase();
          console.log(`[Region Detection] Path 2: IP-based detection → ${ipRegion}`);
          cachedRegion = ipRegion;
          return ipRegion;
        } else {
          console.warn('[Region Detection] Path 2: IP API returned invalid country:', countryCode);
        }
      } else {
        console.warn('[Region Detection] Path 2: IP API request failed with status:', response.status);
      }
    } catch (ipError) {
      console.warn('[Region Detection] Path 2: IP-based detection failed:', ipError);
    }
    
    // Final fallback to US (or device region if it was US)
    const fallbackRegion = Localization.region?.toUpperCase() || 'US';
    console.warn(`[Region Detection] Path 3: All detection methods failed, falling back to ${fallbackRegion}`);
    cachedRegion = fallbackRegion;
    return fallbackRegion;
  } catch (error) {
    console.error('[Region Detection] Error detecting region, falling back to US:', error);
    cachedRegion = 'US';
    return 'US';
  }
}

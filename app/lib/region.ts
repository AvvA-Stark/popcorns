/**
 * Region Detection Utility
 * Detects user's country code for streaming provider availability
 */

import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REGION_OVERRIDE_KEY = '@popcorns_region_override';

// Cache the detected region so we only fetch once per app session
let cachedRegion: string | null = null;

/**
 * Get user's region/country code (e.g., 'US', 'BG', 'GB')
 * Priority: Manual override → Cached → Device region → IP-based detection → 'US' fallback
 */
export async function getRegion(): Promise<string> {
  // Check for manual override first (highest priority)
  try {
    const override = await AsyncStorage.getItem(REGION_OVERRIDE_KEY);
    if (override) {
      console.log(`[Region Detection] Using manual override: ${override}`);
      cachedRegion = override;
      return override;
    }
  } catch (error) {
    console.warn('[Region Detection] Failed to read override from AsyncStorage:', error);
  }

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

/**
 * Set a manual region override
 * This takes precedence over auto-detection
 * @param code - Two-letter country code (e.g., 'BG', 'US')
 */
export async function setRegionOverride(code: string): Promise<void> {
  try {
    const upperCode = code.toUpperCase();
    await AsyncStorage.setItem(REGION_OVERRIDE_KEY, upperCode);
    cachedRegion = upperCode; // Update cache immediately
    console.log(`[Region Detection] Manual override set: ${upperCode}`);
    // Notify listeners about region change
    emitRegionChange(cachedRegion);
  } catch (error) {
    console.error('[Region Detection] Failed to save region override:', error);
    throw error;
  }
}

/**
 * Clear the manual region override and reset to auto-detection
 */
export async function clearRegionOverride(): Promise<void> {
  try {
    await AsyncStorage.removeItem(REGION_OVERRIDE_KEY);
    cachedRegion = null; // Clear cache to force re-detection
    console.log('[Region Detection] Manual override cleared, will auto-detect on next call');
    emitRegionChange(cachedRegion); // emit with potentially new region after re-detect? Actually cache is null, but we can emit the eventual region? Better emit the cleared state? We'll let listeners fetch via getRegion if needed.
  } catch (error) {
    console.error('[Region Detection] Failed to clear region override:', error);
    throw error;
  }
}

// ============================================================================
// REGION CHANGE EVENT EMITTER
// ============================================================================
// Allows UI to react to region changes in real-time

type RegionChangeListener = (region: string) => void;
const regionListeners: RegionChangeListener[] = [];

/**
 * Subscribe to region change events.
 * Returns an unsubscribe function.
 */
export function onRegionChange(listener: RegionChangeListener): () => void {
  regionListeners.push(listener);
  return () => {
    const index = regionListeners.indexOf(listener);
    if (index !== -1) {
      regionListeners.splice(index, 1);
    }
  };
}

function emitRegionChange(region: string | null): void {
  if (region !== null) {
    regionListeners.forEach(listener => {
      try {
        listener(region);
      } catch (err) {
        console.error('Error in region change listener:', err);
      }
    });
  }
}

// Modify setRegionOverride to emit after updating
export async function setRegionOverride(code: string): Promise<void> {
  try {
    const upperCode = code.toUpperCase();
    await AsyncStorage.setItem(REGION_OVERRIDE_KEY, upperCode);
    cachedRegion = upperCode; // Update cache immediately
    console.log(`[Region Detection] Manual override set: ${upperCode}`);
    emitRegionChange(cachedRegion);
  } catch (error) {
    console.error('[Region Detection] Failed to save region override:', error);
    throw error;
  }
}

/**
 * RegionContext - Provides user's region globally
 * Detects region once on app start and caches the result
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getRegion, onRegionChange } from '../lib/region';
import { AppState, AppStateStatus } from 'react-native';

interface RegionContextValue {
  region: string;
  regionName: string;
  loading: boolean;
}

const RegionContext = createContext<RegionContextValue | undefined>(undefined);

// Map region codes to full country names
const getRegionName = (regionCode: string): string => {
  const regionMap: Record<string, string> = {
    'BG': 'Bulgaria',
    'US': 'United States',
    'GB': 'United Kingdom',
    'DE': 'Germany',
    'FR': 'France',
    'ES': 'Spain',
    'IT': 'Italy',
    'NL': 'Netherlands',
    'PL': 'Poland',
    'RO': 'Romania',
    'CA': 'Canada',
    'AU': 'Australia',
    'JP': 'Japan',
    'KR': 'South Korea',
    'IN': 'India',
    'BR': 'Brazil',
    'MX': 'Mexico',
  };
  
  return regionMap[regionCode] || regionCode;
};

export function RegionProvider({ children }: { children: ReactNode }) {
  const [region, setRegionState] = useState('US'); // Default fallback
  const [regionName, setRegionNameState] = useState('United States');
  const [loading, setLoading] = useState(true);

  // Helper to update both region and regionName
  const updateRegion = (newRegion: string) => {
    setRegionState(newRegion);
    setRegionNameState(getRegionName(newRegion));
  };

  // Initial region detection
  useEffect(() => {
    let mounted = true;
    const loadRegion = async () => {
      try {
        const detectedRegion = await getRegion();
        if (mounted) {
          updateRegion(detectedRegion);
        }
      } catch (error) {
        console.error('[RegionContext] Failed to detect region:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    loadRegion();

    // Subscribe to region change events for real-time updates
    const unsubscribe = onRegionChange((newRegion) => {
      updateRegion(newRegion);
    });

    // Also listen to app state changes as a fallback to re-detect region
    const appStateListener = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Re-fetch region in case it changed via other means (e.g., settings)
        getRegion().then(updateRegion).catch(console.error);
      }
    };
    const appStateSubscription = AppState.addEventListener('change', appStateListener);

    return () => {
      mounted = false;
      unsubscribe();
      if (appStateSubscription?.remove) {
        appStateSubscription.remove();
      } else if (appStateSubscription?.removeListener) {
        // For older React Native
        (appStateSubscription as any).removeListener();
      }
    };
  }, []);

  return (
    <RegionContext.Provider value={{ region, regionName, loading }}>
      {children}
    </RegionContext.Provider>
  );
}

export function useRegion() {
  const context = useContext(RegionContext);
  if (context === undefined) {
    throw new Error('useRegion must be used within a RegionProvider');
  }
  return context;
}

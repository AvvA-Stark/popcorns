/**
 * RegionContext - Provides user's region globally
 * Detects region once on app start and caches the result
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getRegion } from '../lib/region';

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
  const [region, setRegion] = useState('US'); // Default fallback
  const [regionName, setRegionName] = useState('United States');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Detect region on mount - this will cache it globally
    getRegion()
      .then((detectedRegion) => {
        setRegion(detectedRegion);
        setRegionName(getRegionName(detectedRegion));
      })
      .catch((error) => {
        console.error('[RegionContext] Failed to detect region:', error);
        // Keep defaults on error
      })
      .finally(() => {
        setLoading(false);
      });
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

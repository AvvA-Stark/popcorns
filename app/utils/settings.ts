/**
 * User Settings Service
 * Manages app preferences and configuration
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { setRegionOverride } from '../lib/region';

const SETTINGS_KEY = '@popcorns:user_settings';

export type Language = 'en' | 'de' | 'es' | 'it';
export type Region = 'US' | 'GB' | 'DE' | 'ES' | 'IT' | 'BG';

export interface UserSettings {
  language: Language;
  region: Region;
}

export const LANGUAGES = {
  en: { code: 'en', name: 'English', flag: '🇬🇧' },
  de: { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  es: { code: 'es', name: 'Español', flag: '🇪🇸' },
  it: { code: 'it', name: 'Italiano', flag: '🇮🇹' },
} as const;

export const REGIONS = {
  US: { code: 'US', name: 'United States', flag: '🇺🇸' },
  GB: { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  DE: { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  ES: { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  IT: { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  BG: { code: 'BG', name: 'Bulgaria', flag: '🇧🇬' },
} as const;

const DEFAULT_SETTINGS: UserSettings = {
  language: 'en',
  region: 'US',
};

/**
 * Get current user settings
 */
export async function getSettings(): Promise<UserSettings> {
  try {
    const data = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!data) {
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch (error) {
    console.error('Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Update user settings
 */
export async function updateSettings(settings: Partial<UserSettings>): Promise<void> {
  try {
    const currentSettings = await getSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
    console.log('✅ Settings updated:', settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
}

/**
 * Set language preference
 */
export async function setLanguage(language: Language): Promise<void> {
  await updateSettings({ language });
}

/**
 * Set region preference
 */
export async function setRegion(region: Region): Promise<void> {
  await updateSettings({ region });
  // Also update the region override so that region picker and Discovery screens pick up the change immediately
  try {
    await setRegionOverride(region);
  } catch (error) {
    console.error('Failed to set region override:', error);
    // Don't throw - settings still saved
  }
}

/**
 * Get current language
 */
export async function getLanguage(): Promise<Language> {
  const settings = await getSettings();
  return settings.language;
}

/**
 * Get current region
 */
export async function getRegion(): Promise<Region> {
  const settings = await getSettings();
  return settings.region;
}

/**
 * Reset settings to defaults
 */
export async function resetSettings(): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    console.log('🔄 Settings reset to defaults');
  } catch (error) {
    console.error('Error resetting settings:', error);
    throw error;
  }
}

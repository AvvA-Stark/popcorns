/**
 * Device ID Management
 * Generates and persists a unique device ID for watchlist sync
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';

const DEVICE_ID_KEY = '@popcorns:device_id';

/**
 * Get or generate a unique device ID
 * Uses expo-device if available, otherwise generates a UUID
 */
export async function getDeviceId(): Promise<string> {
  try {
    // Check if we already have a stored device ID
    const storedId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (storedId) {
      return storedId;
    }

    // Try to use device identifiers
    let deviceId: string;
    
    if (Device.modelId) {
      // Combine multiple device identifiers for better uniqueness
      const identifiers = [
        Device.modelId,
        Device.osName,
        Device.osVersion,
        Device.deviceName,
      ].filter(Boolean).join('-');
      
      // Hash-like simple transformation to make it more unique
      deviceId = `${identifiers}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    } else {
      // Fallback: Generate a random UUID
      deviceId = generateUUID();
    }

    // Store the device ID for future use
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    console.log('📱 Generated new device ID:', deviceId.substring(0, 20) + '...');
    
    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    // Fallback to a simple random ID
    return generateUUID();
  }
}

/**
 * Generate a simple UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Reset device ID (for testing purposes)
 */
export async function resetDeviceId(): Promise<void> {
  try {
    await AsyncStorage.removeItem(DEVICE_ID_KEY);
    console.log('🔄 Device ID reset');
  } catch (error) {
    console.error('Error resetting device ID:', error);
  }
}

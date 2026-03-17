/**
 * RegionPicker Modal
 * Allows users to manually override their region for streaming provider availability
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/Colors';
import { getRegion, setRegionOverride, clearRegionOverride } from '../../lib/region';
import { REGIONS } from '../../utils/settings';

export default function RegionPicker({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [currentRegion, setCurrentRegion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load current region when modal opens
  useEffect(() => {
    if (visible) {
      loadCurrentRegion();
    }
  }, [visible]);

  const loadCurrentRegion = async () => {
    try {
      setLoading(true);
      const region = await getRegion();
      setCurrentRegion(region);
    } catch (error) {
      console.error('[RegionPicker] Failed to load current region:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRegion = async (code: string) => {
    try {
      setSaving(true);
      await setRegionOverride(code);
      setCurrentRegion(code);
      
      // Close modal after a brief delay to show selection feedback
      setTimeout(() => {
        onClose();
        setSaving(false);
      }, 300);
    } catch (error) {
      console.error('[RegionPicker] Failed to save region:', error);
      setSaving(false);
    }
  };

  const handleAutoDetect = async () => {
    try {
      setSaving(true);
      await clearRegionOverride();
      
      // Re-detect region
      const newRegion = await getRegion();
      setCurrentRegion(newRegion);
      
      setTimeout(() => {
        onClose();
        setSaving(false);
      }, 300);
    } catch (error) {
      console.error('[RegionPicker] Failed to clear override:', error);
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('profile.selectRegion')}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          {t('profile.regionDescription', { default: 'Choose your region to see available streaming providers' })}
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Auto-detect option */}
            <TouchableOpacity
              style={[
                styles.regionButton,
                styles.autoDetectButton,
                currentRegion && !REGIONS.find(r => r.code === currentRegion) && styles.selectedButton,
              ]}
              onPress={handleAutoDetect}
              disabled={saving}
            >
              <Text style={styles.regionIcon}>🌍</Text>
              <View style={styles.regionTextContainer}>
                <Text style={styles.regionName}>{t('common.autoDetect', { default: 'Auto-detect' })}</Text>
                <Text style={styles.regionSubtext}>{t('common.useDeviceLocation', { default: 'Use your device location' })}</Text>
              </View>
              {currentRegion && !REGIONS.find(r => r.code === currentRegion) && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Region list */}
            {REGIONS.map((region) => {
              const isSelected = currentRegion === region.code;
              return (
                <TouchableOpacity
                  key={region.code}
                  style={[styles.regionButton, isSelected && styles.selectedButton]}
                  onPress={() => handleSelectRegion(region.code)}
                  disabled={saving}
                >
                  <Text style={styles.regionName}>{region.flag} {t('regions.' + region.code)}</Text>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {saving && (
          <View style={styles.savingOverlay}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Colors.backgroundSecondary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: Colors.text,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  regionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
  },
  autoDetectButton: {
    backgroundColor: Colors.surface,
    marginBottom: 16,
  },
  selectedButton: {
    backgroundColor: Colors.primary,
  },
  regionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  regionTextContainer: {
    flex: 1,
  },
  regionName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  regionSubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  checkmark: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surface,
    marginVertical: 8,
  },
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
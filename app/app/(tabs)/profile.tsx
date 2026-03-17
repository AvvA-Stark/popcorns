/**
 * Profile Screen
 * User stats dashboard displaying swipe activity and preferences
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../constants/Colors';
import { getStats, getAccountAge, getAccountCreatedDate, getTopGenres, initializeStats } from '../../utils/stats';
import { getWatchlistStats } from '../../lib/watchlist';
import { 
  getSettings, 
  setLanguage, 
  setRegion, 
  LANGUAGES, 
  REGIONS, 
  Language, 
  Region 
} from '../../utils/settings';

export default function ProfileScreen() {
  const [stats, setStats] = useState({
    totalSwipes: 0,
    likes: 0,
    passes: 0,
    superLikes: 0,
    watchlistCount: 0,
    accountAge: 0,
    accountCreated: null as Date | null,
    topGenres: [] as Array<{ name: string; count: number }>,
  });
  const [settings, setSettingsState] = useState({
    language: 'en' as Language,
    region: 'US' as Region,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [regionModalVisible, setRegionModalVisible] = useState(false);

  const loadStats = async () => {
    try {
      const results = await Promise.allSettled([
        getStats(),
        getWatchlistStats(),
        getAccountAge(),
        getAccountCreatedDate(),
        getTopGenres(3),
      ]);

      // Extract values, falling back to defaults on error
      const userStats = results[0].status === 'fulfilled' ? results[0].value : { totalSwipes: 0, likes: 0, passes: 0, superLikes: 0, genres: {} };
      const watchlistStats = results[1].status === 'fulfilled' ? results[1].value : { total: 0, normal: 0, super: 0 };
      const accountAge = results[2].status === 'fulfilled' ? results[2].value : 0;
      const createdDate = results[3].status === 'fulfilled' ? results[3].value : null;
      const topGenres = results[4].status === 'fulfilled' ? results[4].value : [];

      setStats({
        totalSwipes: userStats.totalSwipes,
        likes: userStats.likes,
        passes: userStats.passes,
        superLikes: userStats.superLikes,
        watchlistCount: watchlistStats.total,
        accountAge,
        accountCreated: createdDate,
        topGenres,
      });
    } catch (error) {
      console.error('Error loading profile stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadSettings = async () => {
    try {
      const userSettings = await getSettings();
      setSettingsState(userSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  // Initialize stats and settings on first load
  useEffect(() => {
    initializeStats().then(() => {
      loadStats();
      loadSettings();
    });
  }, []);

  // Reload stats when tab comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadStats();
      loadSettings();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadStats();
    loadSettings();
  };

  const handleLanguageChange = async (language: Language) => {
    try {
      await setLanguage(language);
      setSettingsState((prev) => ({ ...prev, language }));
      setLanguageModalVisible(false);
      console.log(`✅ Language changed to: ${LANGUAGES[language].name}`);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const handleRegionChange = async (region: Region) => {
    try {
      await setRegion(region);
      setSettingsState((prev) => ({ ...prev, region }));
      setRegionModalVisible(false);
      console.log(`✅ Region changed to: ${REGIONS[region].name}`);
    } catch (error) {
      console.error('Error changing region:', error);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Unknown';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getLikePercentage = () => {
    if (stats.totalSwipes === 0) return 0;
    return Math.round((stats.likes / stats.totalSwipes) * 100);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <Text style={styles.username}>Movie Enthusiast</Text>
          <Text style={styles.bio}>Swipe • Discover • Watch</Text>
        </View>

        {/* Main Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalSwipes}</Text>
            <Text style={styles.statLabel}>Movies</Text>
            <Text style={styles.statSubLabel}>Discovered</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: Colors.like }]}>{stats.likes}</Text>
            <Text style={styles.statLabel}>Likes</Text>
            <Text style={styles.statSubLabel}>{getLikePercentage()}% match</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: Colors.dislike }]}>{stats.passes}</Text>
            <Text style={styles.statLabel}>Passes</Text>
            <Text style={styles.statSubLabel}>Not your vibe</Text>
          </View>
        </View>

        {/* Secondary Stats */}
        <View style={styles.secondaryStatsContainer}>
          <View style={styles.secondaryStatCard}>
            <View style={styles.secondaryStatIcon}>
              <Text style={styles.iconText}>🍿</Text>
            </View>
            <View style={styles.secondaryStatContent}>
              <Text style={styles.secondaryStatNumber}>{stats.watchlistCount}</Text>
              <Text style={styles.secondaryStatLabel}>Watchlist Items</Text>
            </View>
          </View>

          <View style={styles.secondaryStatCard}>
            <View style={styles.secondaryStatIcon}>
              <Text style={styles.iconText}>⭐</Text>
            </View>
            <View style={styles.secondaryStatContent}>
              <Text style={styles.secondaryStatNumber}>{stats.superLikes}</Text>
              <Text style={styles.secondaryStatLabel}>Super Likes</Text>
            </View>
          </View>

          <View style={styles.secondaryStatCard}>
            <View style={styles.secondaryStatIcon}>
              <Text style={styles.iconText}>📅</Text>
            </View>
            <View style={styles.secondaryStatContent}>
              <Text style={styles.secondaryStatNumber}>{stats.accountAge}</Text>
              <Text style={styles.secondaryStatLabel}>Days Active</Text>
            </View>
          </View>
        </View>

        {/* Top Genres */}
        {stats.topGenres.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎭 Favorite Genres</Text>
            <View style={styles.genresList}>
              {stats.topGenres.map((genre, index) => (
                <View key={index} style={styles.genreCard}>
                  <View style={styles.genreRank}>
                    <Text style={styles.genreRankText}>#{index + 1}</Text>
                  </View>
                  <View style={styles.genreContent}>
                    <Text style={styles.genreName}>{genre.name}</Text>
                    <Text style={styles.genreCount}>{genre.count} likes</Text>
                  </View>
                  <View style={styles.genreBar}>
                    <View
                      style={[
                        styles.genreBarFill,
                        {
                          width: `${(genre.count / stats.topGenres[0].count) * 100}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Settings</Text>
          
          {/* Language Selector */}
          <TouchableOpacity
            style={styles.settingCard}
            onPress={() => setLanguageModalVisible(true)}
          >
            <View style={styles.settingIcon}>
              <Text style={styles.iconText}>🌐</Text>
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Language</Text>
              <Text style={styles.settingValue}>
                {LANGUAGES[settings.language].flag} {LANGUAGES[settings.language].name}
              </Text>
            </View>
            <Text style={styles.settingChevron}>›</Text>
          </TouchableOpacity>

          {/* Region Selector */}
          <TouchableOpacity
            style={styles.settingCard}
            onPress={() => setRegionModalVisible(true)}
          >
            <View style={styles.settingIcon}>
              <Text style={styles.iconText}>📍</Text>
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Region</Text>
              <Text style={styles.settingValue}>
                {REGIONS[settings.region].flag} {REGIONS[settings.region].name}
              </Text>
            </View>
            <Text style={styles.settingChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Account Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Member since {formatDate(stats.accountCreated)}
          </Text>
        </View>

        {/* Empty State */}
        {stats.totalSwipes === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🎬</Text>
            <Text style={styles.emptyStateTitle}>Start Discovering!</Text>
            <Text style={styles.emptyStateText}>
              Swipe through movies to build your profile and see your stats here
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={languageModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.optionsList}>
              {Object.entries(LANGUAGES).map(([code, lang]) => (
                <TouchableOpacity
                  key={code}
                  style={[
                    styles.optionCard,
                    settings.language === code && styles.optionCardSelected,
                  ]}
                  onPress={() => handleLanguageChange(code as Language)}
                >
                  <Text style={styles.optionFlag}>{lang.flag}</Text>
                  <Text
                    style={[
                      styles.optionText,
                      settings.language === code && styles.optionTextSelected,
                    ]}
                  >
                    {lang.name}
                  </Text>
                  {settings.language === code && (
                    <Text style={styles.optionCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Region Selection Modal */}
      <Modal
        visible={regionModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setRegionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Region</Text>
              <TouchableOpacity onPress={() => setRegionModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.optionsList}>
              {Object.entries(REGIONS).map(([code, region]) => (
                <TouchableOpacity
                  key={code}
                  style={[
                    styles.optionCard,
                    settings.region === code && styles.optionCardSelected,
                  ]}
                  onPress={() => handleRegionChange(code as Region)}
                >
                  <Text style={styles.optionFlag}>{region.flag}</Text>
                  <Text
                    style={[
                      styles.optionText,
                      settings.region === code && styles.optionTextSelected,
                    ]}
                  >
                    {region.name}
                  </Text>
                  {settings.region === code && (
                    <Text style={styles.optionCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  avatarText: {
    fontSize: 48,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  statSubLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  secondaryStatsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  secondaryStatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  secondaryStatIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 24,
  },
  secondaryStatContent: {
    flex: 1,
  },
  secondaryStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
  },
  secondaryStatLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  genresList: {
    gap: 12,
  },
  genreCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  genreRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  genreRankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  genreContent: {
    flex: 1,
  },
  genreName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  genreCount: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  genreBar: {
    width: 80,
    height: 6,
    backgroundColor: Colors.background,
    borderRadius: 3,
    overflow: 'hidden',
    marginLeft: 12,
  },
  genreBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  settingValue: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  settingChevron: {
    fontSize: 28,
    color: Colors.textTertiary,
    fontWeight: '300',
  },
  footer: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#222222',
  },
  footerText: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalClose: {
    fontSize: 28,
    color: Colors.textSecondary,
    fontWeight: '300',
  },
  optionsList: {
    paddingHorizontal: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  optionCardSelected: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
  },
  optionFlag: {
    fontSize: 32,
    marginRight: 16,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  optionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  optionCheck: {
    fontSize: 24,
    color: Colors.primary,
    fontWeight: 'bold',
  },
});

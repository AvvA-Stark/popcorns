/**
 * Profile Screen
 * User stats dashboard displaying swipe activity and preferences
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Modal, Image, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/Colors';
import { getStats, getAccountAge, getAccountCreatedDate, getTopGenres, initializeStats } from '../../utils/stats';
import { getWatchlistStats } from '../../lib/watchlist';
import { useToast } from '../../lib/toast';
import { 
  getSettings, 
  setLanguage, 
  setRegion, 
  LANGUAGES, 
  REGIONS, 
  Language, 
  Region 
} from '../../utils/settings';
import { changeLanguage } from '../../lib/i18n';
import { getCurrentMood, getAllTimeStats, resetRecommendations } from '../../lib/recommendations';
import { tmdb } from '../../lib/tmdb';

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
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
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [currentMood, setCurrentMood] = useState<{
    genres: Array<{ name: string; count: number }>;
    actors: Array<{ name: string; count: number }>;
    directors: Array<{ name: string; count: number }>;
  }>({ genres: [], actors: [], directors: [] });
  const [allTimeFavorites, setAllTimeFavorites] = useState<{
    genres: Array<{ name: string; count: number }>;
    actors: Array<{ name: string; count: number }>;
    directors: Array<{ name: string; count: number }>;
  }>({ genres: [], actors: [], directors: [] });

  const loadStats = async () => {
    try {
      const results = await Promise.allSettled([
        getStats(),
        getWatchlistStats(),
        getAccountAge(),
        getAccountCreatedDate(),
        getTopGenres(3),
        getCurrentMood(),
        getAllTimeStats(),
        tmdb.getGenres(), // Fetch movie genres
        tmdb.getTVGenres(), // Fetch TV genres
      ]);

      // Extract values, falling back to defaults on error
      const userStats = results[0].status === 'fulfilled' ? results[0].value : { totalSwipes: 0, likes: 0, passes: 0, superLikes: 0, genres: {} };
      const watchlistStats = results[1].status === 'fulfilled' ? results[1].value : { total: 0, normal: 0, super: 0 };
      const accountAge = results[2].status === 'fulfilled' ? results[2].value : 0;
      const createdDate = results[3].status === 'fulfilled' ? results[3].value : null;
      const topGenres = results[4].status === 'fulfilled' ? results[4].value : [];
      const mood = results[5].status === 'fulfilled' ? results[5].value : { genres: [], actors: [], directors: [] };
      const allTime = results[6].status === 'fulfilled' ? results[6].value : { genres: [], actors: [], directors: [] };
      const movieGenres = results[7].status === 'fulfilled' ? results[7].value : [];
      const tvGenres = results[8].status === 'fulfilled' ? results[8].value : [];

      // Create genre ID to name map
      const genreMap: { [id: string]: string } = {};
      [...movieGenres, ...tvGenres].forEach((genre) => {
        genreMap[String(genre.id)] = genre.name;
      });

      // Convert genre IDs to names in mood and allTime
      const convertGenreIds = (data: {
        genres: Array<{ name: string; count: number }>;
        actors: Array<{ name: string; count: number }>;
        directors: Array<{ name: string; count: number }>;
      }) => ({
        genres: data.genres.map((g) => ({
          name: genreMap[g.name] || g.name, // g.name is actually the ID
          count: g.count,
        })),
        actors: data.actors,
        directors: data.directors,
      });

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

      setCurrentMood(convertGenreIds(mood));
      setAllTimeFavorites(convertGenreIds(allTime));
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

  const loadAvatar = async () => {
    try {
      const savedAvatar = await AsyncStorage.getItem('user_avatar');
      if (savedAvatar) {
        setAvatarUri(savedAvatar);
      }
    } catch (error) {
      console.error('Error loading avatar:', error);
    }
  };

  const pickImage = async () => {
    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to change your avatar.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        await AsyncStorage.setItem('user_avatar', base64Image);
        setAvatarUri(base64Image);
        console.log('✅ Avatar updated successfully');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to update avatar. Please try again.');
    }
  };



  // Initialize stats and settings on first load
  useEffect(() => {
    initializeStats().then(() => {
      loadStats();
      loadSettings();
      loadAvatar();
    });
  }, []);

  // Reload stats when tab comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadStats();
      loadSettings();
      loadAvatar();
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
      // Change i18n language
      await changeLanguage(language);
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
    if (!date) return t('profile.unknownDate');
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
          <TouchableOpacity onPress={pickImage} activeOpacity={0.7}>
            <View style={styles.avatar}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>👤</Text>
              )}
            </View>
          </TouchableOpacity>
          <View style={styles.avatarButtons}>
            <TouchableOpacity style={styles.changePhotoButton} onPress={pickImage}>
              <Text style={styles.changePhotoText}>📷 Change Photo</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.username}>Movie Enthusiast</Text>
          <Text style={styles.bio}>{t('profile.headerBio')}</Text>
        </View>

        {/* Main Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalSwipes}</Text>
            <Text style={styles.statLabel}>{t('profile.totalSwipes')}</Text>
            <Text style={styles.statSubLabel}></Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: Colors.like }]}>{stats.likes}</Text>
            <Text style={styles.statLabel}>{t('profile.likes')}</Text>
            <Text style={styles.statSubLabel}>{getLikePercentage()}% {t('profile.matchPercentage', { percent: getLikePercentage() })}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: Colors.dislike }]}>{stats.passes}</Text>
            <Text style={styles.statLabel}>{t('profile.passes')}</Text>
            <Text style={styles.statSubLabel}>{t('profile.notYourVibe')}</Text>
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
              <Text style={styles.secondaryStatLabel}>{t('profile.watchlistItems')}</Text>
            </View>
          </View>

          <View style={styles.secondaryStatCard}>
            <View style={styles.secondaryStatIcon}>
              <Text style={styles.iconText}>⭐</Text>
            </View>
            <View style={styles.secondaryStatContent}>
              <Text style={styles.secondaryStatNumber}>{stats.superLikes}</Text>
              <Text style={styles.secondaryStatLabel}>{t('profile.superLikes')}</Text>
            </View>
          </View>

          <View style={styles.secondaryStatCard}>
            <View style={styles.secondaryStatIcon}>
              <Text style={styles.iconText}>📅</Text>
            </View>
            <View style={styles.secondaryStatContent}>
              <Text style={styles.secondaryStatNumber}>{stats.accountAge}</Text>
              <Text style={styles.secondaryStatLabel}>{t('profile.daysActive')}</Text>
            </View>
          </View>
        </View>

        {/* Top Genres */}
        {stats.topGenres.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎭 {t('profile.favoriteGenres')}</Text>
            <View style={styles.genresList}>
              {stats.topGenres.map((genre, index) => (
                <View key={index} style={styles.genreCard}>
                  <View style={styles.genreRank}>
                    <Text style={styles.genreRankText}>{t('profile.genreRank', { rank: index + 1 })}</Text>
                  </View>
                  <View style={styles.genreContent}>
                    <Text style={styles.genreName}>{genre.name}</Text>
                    <Text style={styles.genreCount}>{t('profile.genreLikes', { count: genre.count })}</Text>
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

        {/* Current Mood Section */}
        {currentMood.genres.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔥 Current Mood</Text>
            <Text style={styles.sectionSubtitle}>What you're into right now (last 30 swipes)</Text>
            <View style={styles.moodContainer}>
              {currentMood.genres.slice(0, 5).map((genre, index) => (
                <View key={`mood-genre-${index}`} style={styles.moodChip}>
                  <Text style={styles.moodChipText}>
                    {genre.name} ({genre.count})
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* All-Time Favorites Section */}
        {allTimeFavorites.genres.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⭐ All-Time Favorites</Text>
            <Text style={styles.sectionSubtitle}>Your overall taste profile</Text>
            <View style={styles.moodContainer}>
              {allTimeFavorites.genres.slice(0, 5).map((genre, index) => (
                <View key={`alltime-genre-${index}`} style={styles.moodChip}>
                  <Text style={styles.moodChipText}>
                    {genre.name} ({genre.count})
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Reset Preferences Button */}
        {(currentMood.genres.length > 0 || allTimeFavorites.genres.length > 0) && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={async () => {
                Alert.alert(
                  'Reset Preferences',
                  'This will clear all your swipe history and taste profile. Are you sure?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Reset',
                      style: 'destructive',
                      onPress: async () => {
                        await resetRecommendations();
                        setCurrentMood({ genres: [], actors: [], directors: [] });
                        setAllTimeFavorites({ genres: [], actors: [], directors: [] });
                        showToast({ message: 'Preferences reset successfully', type: 'success' });
                      },
                    },
                  ]
                );
              }}
            >
              <Text style={styles.resetButtonText}>🧹 Reset Preferences</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ {t('profile.settings')}</Text>
          
          {/* Language Selector */}
          <TouchableOpacity
            style={styles.settingCard}
            onPress={() => setLanguageModalVisible(true)}
          >
            <View style={styles.settingIcon}>
              <Text style={styles.iconText}>🌐</Text>
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>{t('profile.language')}</Text>
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
              <Text style={styles.settingLabel}>{t('profile.region')}</Text>
              <Text style={styles.settingValue}>
                {REGIONS[settings.region].flag} {t('regions.' + settings.region)}
              </Text>
            </View>
            <Text style={styles.settingChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Account Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t('profile.memberSince', { date: formatDate(stats.accountCreated) })}
          </Text>
        </View>

        {/* Empty State */}
        {stats.totalSwipes === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🎬</Text>
            <Text style={styles.emptyStateTitle}>{t('profile.emptyStateTitle')}</Text>
            <Text style={styles.emptyStateText}>
              {t('profile.emptyStateText')}
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
              <Text style={styles.modalTitle}>{t('profile.selectLanguage')}</Text>
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
              <Text style={styles.modalTitle}>{t('profile.selectRegion')}</Text>
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
                    {t('regions.' + code)}
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  avatarText: {
    fontSize: 48,
  },
  avatarButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  changePhotoButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  changePhotoText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
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
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
    marginTop: -8,
  },
  moodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moodChip: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  moodChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  resetButton: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444444',
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
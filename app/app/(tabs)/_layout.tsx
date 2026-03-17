/**
 * Tabs Layout
 * Bottom tab navigation for main app screens
 */

import React, { useState } from 'react';
import { Tabs } from 'expo-router';
import { Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/Colors';
import RegionPicker from '../components/RegionPicker';
import { REGIONS } from '../../utils/settings';

export default function TabsLayout() {
  const { t } = useTranslation();
  const [regionPickerVisible, setRegionPickerVisible] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textSecondary,
          tabBarStyle: {
            backgroundColor: Colors.backgroundSecondary,
            borderTopColor: Colors.surface,
            borderTopWidth: 1,
          },
          headerStyle: {
            backgroundColor: Colors.backgroundSecondary,
          },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setRegionPickerVisible(true)}
              style={{
                marginRight: 16,
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: Colors.surface,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 18 }}>⚙️</Text>
            </TouchableOpacity>
          ),
        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.discover'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🎬</Text>,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="series"
        options={{
          title: t('tabs.series'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📺</Text>,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="watchlist"
        options={{
          title: t('tabs.watchlist'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🍿</Text>,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t('tabs.search'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🔍</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>👤</Text>,
        }}
      />
      </Tabs>

      <RegionPicker
        visible={regionPickerVisible}
        onClose={() => setRegionPickerVisible(false)}
      />
    </>
  );
}

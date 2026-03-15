/**
 * Tabs Layout
 * Bottom tab navigation for main app screens
 */

import React, { useState } from 'react';
import { Tabs } from 'expo-router';
import { Text, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/Colors';
import RegionPicker from '../components/RegionPicker';

export default function TabsLayout() {
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
          title: 'Discover',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🎬</Text>,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🔍</Text>,
        }}
      />
      <Tabs.Screen
        name="watchlist"
        options={{
          title: 'Watchlist',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📋</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
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

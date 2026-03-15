/**
 * Root Layout
 * Configures expo-router and app-wide settings
 */

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors } from '../constants/Colors';
import { ToastProvider } from '../lib/toast';
import { RegionProvider } from '../context/RegionContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RegionProvider>
        <ToastProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: Colors.backgroundSecondary,
              },
              headerTintColor: Colors.text,
              headerShadowVisible: false,
              contentStyle: {
                backgroundColor: Colors.background,
              },
            }}
          >
            <Stack.Screen
              name="(tabs)"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="movie/[id]"
              options={{
                presentation: 'modal',
                headerTitle: 'Movie Details',
              }}
            />
          </Stack>
        </ToastProvider>
      </RegionProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Root Layout
 * Configures expo-router and app-wide settings
 */

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { I18nextProvider } from 'react-i18next';
import { Colors } from '../constants/Colors';
import { ToastProvider } from '../lib/toast';
import { RegionProvider } from '../context/RegionContext';
import i18n, { initializeI18n } from '../lib/i18n';

// Initialize i18n on app startup
initializeI18n().catch(console.error);

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <I18nextProvider i18n={i18n}>
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
      </I18nextProvider>
    </GestureHandlerRootView>
  );
}

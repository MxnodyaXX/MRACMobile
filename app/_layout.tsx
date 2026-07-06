import '../global.css';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { LoadingScreen } from '@/src/components/LoadingScreen';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/src/store/useAuthStore';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Zustand's persist middleware rehydrates from storage asynchronously. Gate the
  // first render until it finishes so a logged-in user isn't briefly bounced to
  // the login screen on cold start.
  //
  // Start `false` on every platform (matches the web server-render output, avoiding
  // a hydration mismatch) and flip it from the effect. A safety timeout guarantees
  // we never stay stuck on the loading screen if the hydration event is missed.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    const timer = setTimeout(() => setHydrated(true), 1000);
    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, []);

  if (!hydrated) {
    return (
      <SafeAreaProvider>
        <LoadingScreen label="Starting up…" />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

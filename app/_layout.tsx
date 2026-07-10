import '../global.css';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { LoadingScreen } from '@/src/components/LoadingScreen';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/src/store/useAuthStore';

export const unstable_settings = {
  anchor: '(tabs)',
};

/**
 * Shown instead of a blank screen when the app throws while rendering.
 * Deliberately uses only raw React Native styles — no NativeWind, no reanimated —
 * so it still renders even if one of those is what broke.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff', paddingTop: 64, paddingHorizontal: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#b91c1c', marginBottom: 10 }}>App crashed</Text>
      <Text selectable style={{ fontSize: 13, color: '#111827', marginBottom: 14 }}>
        {error?.message ?? 'Unknown error'}
      </Text>
      <ScrollView style={{ flex: 1 }}>
        <Text selectable style={{ fontSize: 10, color: '#475569' }}>
          {error?.stack ?? ''}
        </Text>
      </ScrollView>
      <TouchableOpacity
        onPress={retry}
        style={{ backgroundColor: '#0D1B45', paddingVertical: 14, borderRadius: 12, marginVertical: 20 }}
      >
        <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

/** TEMPORARY diagnostic. 'off' restores the app.
 *  'nativewind' → tests whether NativeWind classNames apply on device.
 *  'loading'    → tests LinearGradient + reanimated (the LoadingScreen). */
const DIAGNOSTIC: 'off' | 'nativewind' | 'loading' = 'nativewind';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  if (DIAGNOSTIC === 'nativewind') {
    return (
      <View style={{ flex: 1, backgroundColor: '#ffffff', paddingTop: 70, paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 14 }}>Style probe</Text>

        {/* 1. Raw RN style — must always show */}
        <View style={{ height: 46, backgroundColor: '#e11d48', justifyContent: 'center', paddingHorizontal: 10, marginBottom: 10 }}>
          <Text style={{ color: '#fff' }}>1. RAW STYLE (always red)</Text>
        </View>

        {/* 2. NativeWind className — green ONLY if NativeWind works on native */}
        <View className="h-12 bg-emerald-600 justify-center px-3 mb-3">
          <Text className="text-white">2. NATIVEWIND (green = works)</Text>
        </View>

        {/* 3. Custom navy from tailwind.config */}
        <View className="h-12 bg-navy-800 justify-center px-3 mb-3">
          <Text className="text-white">3. NAVY THEME (dark blue = works)</Text>
        </View>

        {/* 4. The arbitrary shadow class we added everywhere */}
        <View className="h-12 bg-white border border-slate-100 shadow-[0px_6px_16px_rgba(2,6,23,0.08)] justify-center px-3">
          <Text>4. SHADOW CLASS (no crash = ok)</Text>
        </View>
      </View>
    );
  }

  if (DIAGNOSTIC === 'loading') {
    return (
      <SafeAreaProvider>
        <LoadingScreen label="Probe" />
      </SafeAreaProvider>
    );
  }

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

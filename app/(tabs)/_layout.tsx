import { Redirect, Tabs } from 'expo-router';

import { FloatingTabBar } from '@/src/components/FloatingTabBar';
import { useAuthStore } from '@/src/store/useAuthStore';

export default function TabLayout() {
  const currentUser = useAuthStore((s) => s.currentUser);

  // Auth gate: no session → login.
  if (!currentUser) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{ headerShown: false, animation: 'shift' }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="bookings" options={{ title: 'Bookings' }} />
      <Tabs.Screen name="vehicles" options={{ title: 'Vehicles' }} />
      <Tabs.Screen name="alerts" options={{ title: 'Alerts' }} />
      <Tabs.Screen name="commissions" options={{ title: 'Fees' }} />
    </Tabs>
  );
}

import { Redirect, Tabs } from 'expo-router';

import { FloatingTabBar } from '@/src/components/FloatingTabBar';
import { useAuthStore } from '@/src/store/useAuthStore';

export default function TabLayout() {
  const currentUser = useAuthStore((s) => s.currentUser);

  // Auth gate: no session → login.
  if (!currentUser) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{ headerShown: false, animation: 'fade' }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      {/* Visible tabs */}
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="bookings" options={{ title: 'Bookings' }} />
      <Tabs.Screen name="vehicles" options={{ title: 'Vehicles' }} />
      <Tabs.Screen name="alerts" options={{ title: 'Alerts' }} />
      <Tabs.Screen name="more" options={{ title: 'More' }} />

      {/* Pages reached from the More menu — hidden from the bar (href: null) but
          still inside the tab navigator so the floating bar stays visible. */}
      <Tabs.Screen name="commissions" options={{ href: null }} />
      <Tabs.Screen name="referrals" options={{ href: null }} />
      <Tabs.Screen name="owners" options={{ href: null }} />
      <Tabs.Screen name="expenses" options={{ href: null }} />
      <Tabs.Screen name="drivers" options={{ href: null }} />
      <Tabs.Screen name="handovers" options={{ href: null }} />
      <Tabs.Screen name="customers" options={{ href: null }} />
      <Tabs.Screen name="inquiries" options={{ href: null }} />
      <Tabs.Screen name="incomplete" options={{ href: null }} />
      <Tabs.Screen name="credit" options={{ href: null }} />
      <Tabs.Screen name="permissions" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}

import { Redirect, Tabs } from 'expo-router';
import { Bell, CalendarDays, Car, LayoutDashboard, Percent } from 'lucide-react-native';

import { useAuthStore } from '@/src/store/useAuthStore';

export default function TabLayout() {
  const currentUser = useAuthStore((s) => s.currentUser);

  // Auth gate: no session → login.
  if (!currentUser) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0D1B45',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{
          title: 'Vehicles',
          tabBarIcon: ({ color, size }) => <Car color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, size }) => <Bell color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="commissions"
        options={{
          title: 'Commissions',
          tabBarIcon: ({ color, size }) => <Percent color={color} size={size ?? 22} />,
        }}
      />
    </Tabs>
  );
}

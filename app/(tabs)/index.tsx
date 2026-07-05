import { LogOut, RefreshCw } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useShallow } from 'zustand/react/shallow';

import { supabaseEnabled } from '@/src/lib/supabase';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useStore } from '@/src/store/useStore';

export default function DashboardScreen() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);
  const loadUsers = useAuthStore((s) => s.loadUsers);

  const loadAll = useStore((s) => s.loadAll);
  const loaded = useStore((s) => s.loaded);

  const [busy, setBusy] = useState(false);

  // useShallow prevents an infinite render loop: without it this inline object
  // selector returns a new reference every render, which useSyncExternalStore
  // treats as a state change → re-render → white screen.
  const counts = useStore(
    useShallow((s) => ({
      vehicles: s.vehicles.length,
      owners: s.owners.length,
      bookings: s.bookings.length,
      customers: s.customers.length,
      commissions: s.commissions.length,
      drivers: s.drivers.length,
    })),
  );

  const refresh = async () => {
    setBusy(true);
    try {
      await Promise.all([loadAll(), loadUsers()]);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <ScrollView contentContainerClassName="p-5 gap-4">
        {/* Header */}
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-slate-500 text-sm">Welcome back,</Text>
            <Text className="text-2xl font-black text-slate-900">
              {currentUser?.name ?? 'User'}
            </Text>
            <Text className="text-navy-800 text-xs font-semibold mt-0.5 uppercase">
              {currentUser?.role}
            </Text>
          </View>
          <TouchableOpacity
            onPress={logout}
            className="flex-row items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2"
          >
            <LogOut size={16} color="#0D1B45" />
            <Text className="text-navy-800 font-semibold text-sm">Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Live data widget */}
        <View className="bg-navy-800 rounded-2xl p-5">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white font-bold text-base">Backend status</Text>
            <View
              className={`px-2.5 py-1 rounded-full ${
                supabaseEnabled && loaded ? 'bg-emerald-400/20' : 'bg-amber-400/20'
              }`}
            >
              <Text
                className={`text-[11px] font-semibold ${
                  supabaseEnabled && loaded ? 'text-emerald-300' : 'text-amber-300'
                }`}
              >
                {supabaseEnabled ? (loaded ? 'Live' : 'Loading…') : 'Not configured'}
              </Text>
            </View>
          </View>

          <View className="flex-row flex-wrap">
            {Object.entries(counts).map(([k, v]) => (
              <View key={k} className="w-1/3 py-2">
                <Text className="text-white text-2xl font-black">{v}</Text>
                <Text className="text-white/50 text-xs capitalize">{k}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            onPress={refresh}
            disabled={busy}
            className={`flex-row items-center justify-center gap-2 bg-white/10 rounded-xl py-2.5 mt-2 ${
              busy ? 'opacity-60' : ''
            }`}
          >
            {busy ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <RefreshCw size={15} color="#ffffff" />
            )}
            <Text className="text-white font-semibold text-sm">Reload from Supabase</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-slate-400 text-xs text-center leading-5">
          Dashboard, Bookings, Vehicles and the rest are built out in the coming phases.
          This card confirms your Supabase data is loading natively.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

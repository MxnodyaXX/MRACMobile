import { CheckCircle2, LogOut, RefreshCw, UserPlus } from 'lucide-react-native';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { PageScreen } from '@/src/components/PageScreen';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useStore } from '@/src/store/useStore';

export default function SettingsScreen() {
  const owners = useStore((s) => s.owners);
  const recomputeStats = useStore((s) => s.recomputeStats);
  const users = useAuthStore((s) => s.users);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const logout = useAuthStore((s) => s.logout);
  const createOwnerAccount = useAuthStore((s) => s.createOwnerAccount);
  const currentUser = useAuthStore((s) => s.currentUser);
  const admin = isAdmin();

  const ownerUserMap = new Map(users.filter((u) => u.ownerId).map((u) => [u.ownerId, u]));
  const withProfile = owners.filter((o) => ownerUserMap.has(o.id));
  const withoutProfile = owners.filter((o) => !ownerUserMap.has(o.id));

  const doRecompute = () =>
    Alert.alert('Recalculate statistics', 'Rebuild every vehicle’s revenue and owner earnings from the actual bookings?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Recalculate', onPress: () => recomputeStats() },
    ]);

  return (
    <PageScreen title="Settings">
      <ScrollView contentContainerClassName="p-4 pb-10">
        {/* Account */}
        <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Account</Text>
        <View className="bg-white rounded-2xl border border-slate-100 p-4 mb-6">
          <Text className="text-sm font-bold text-slate-900">{currentUser?.name}</Text>
          <Text className="text-xs text-slate-400 mb-3 capitalize">{currentUser?.role}{currentUser?.username ? ` · @${currentUser.username}` : ''}</Text>
          <TouchableOpacity onPress={logout} className="flex-row items-center justify-center gap-2 rounded-xl py-2.5 bg-slate-100">
            <LogOut size={16} color="#0D1B45" />
            <Text className="text-navy-800 font-semibold text-sm">Log out</Text>
          </TouchableOpacity>
        </View>

        {/* Data management */}
        <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Data Management</Text>
        {admin && (
          <TouchableOpacity onPress={doRecompute} className="flex-row items-start gap-3 bg-white rounded-2xl border border-slate-100 p-4 mb-6">
            <View className="w-11 h-11 rounded-xl bg-emerald-600 items-center justify-center"><RefreshCw size={20} color="#fff" /></View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-slate-800">Recalculate Statistics</Text>
              <Text className="text-xs text-slate-400 mt-1 leading-5">Rebuild every vehicle’s revenue/rent count and owner earnings from the actual bookings. Fixes any inflated totals.</Text>
            </View>
          </TouchableOpacity>
        )}
        {!admin && (
          <View className="bg-white rounded-2xl border border-slate-100 p-4 mb-6">
            <Text className="text-sm text-slate-500">Manual booking entry will be available in a later update.</Text>
          </View>
        )}

        {/* Owner profiles (admin) */}
        {admin && (
          <>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Owner Login Profiles</Text>
              <Text className="text-xs text-slate-400">{withProfile.length}/{owners.length} set up</Text>
            </View>
            {owners.length === 0 ? (
              <Text className="text-slate-400 text-sm text-center py-12">No owners in the system yet.</Text>
            ) : (
              <>
                {withoutProfile.map((owner) => (
                  <View key={owner.id} className="bg-white rounded-2xl border border-amber-100 p-4 mb-3">
                    <View className="flex-row items-center gap-3 mb-3">
                      <View className="w-10 h-10 rounded-xl bg-amber-100 items-center justify-center"><Text className="text-amber-700 font-bold text-sm">{owner.name[0].toUpperCase()}</Text></View>
                      <View className="flex-1"><Text className="text-sm font-semibold text-slate-900" numberOfLines={1}>{owner.name}</Text><Text className="text-xs text-slate-400">{owner.phone}</Text></View>
                      <View className="bg-amber-100 rounded-full px-2 py-0.5"><Text className="text-xs font-semibold text-amber-700">No login</Text></View>
                    </View>
                    <TouchableOpacity onPress={() => createOwnerAccount(owner.id, owner.name)} className="flex-row items-center justify-center gap-2 rounded-xl py-2.5 bg-navy-800">
                      <UserPlus size={14} color="#fff" /><Text className="text-white font-semibold text-sm">Create Login Profile</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {withProfile.map((owner) => {
                  const user = ownerUserMap.get(owner.id);
                  return (
                    <View key={owner.id} className="bg-white rounded-2xl border border-emerald-100 p-4 mb-3">
                      <View className="flex-row items-center gap-3">
                        <View className="w-10 h-10 rounded-xl bg-emerald-100 items-center justify-center"><Text className="text-emerald-700 font-bold text-sm">{owner.name[0].toUpperCase()}</Text></View>
                        <View className="flex-1"><Text className="text-sm font-semibold text-slate-900" numberOfLines={1}>{owner.name}</Text><Text className="text-xs text-slate-500">@{user?.username}</Text></View>
                        <View className="flex-row items-center gap-1 bg-emerald-100 rounded-full px-2 py-0.5"><CheckCircle2 size={11} color="#047857" /><Text className="text-xs font-semibold text-emerald-700">Active</Text></View>
                      </View>
                    </View>
                  );
                })}
              </>
            )}
          </>
        )}
      </ScrollView>
    </PageScreen>
  );
}

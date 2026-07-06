import { Eye, EyeOff, Key, ShieldCheck, ShieldOff, ToggleLeft, ToggleRight, UserPlus } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { PageScreen } from '@/src/components/PageScreen';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useStore } from '@/src/store/useStore';
import { OwnerPermissions } from '@/src/types/auth';

type PermKey = keyof Omit<OwnerPermissions, 'disabled'>;
const ACTIONS: { key: PermKey; label: string; desc: string }[] = [
  { key: 'canBook', label: 'Create Bookings', desc: 'Add new bookings for their vehicles' },
  { key: 'canEditVehicle', label: 'Edit Vehicles', desc: 'Edit their own vehicle details' },
  { key: 'canChangeStatus', label: 'Change Status', desc: 'Update booking / vehicle status' },
  { key: 'canAddExpenses', label: 'Log Expenses', desc: 'Record vehicle expenses' },
];
const PAGES: { key: PermKey; label: string; desc: string }[] = [
  { key: 'canViewExpenses', label: 'Expenses Page', desc: 'See the Expenses section' },
  { key: 'canViewHandovers', label: 'Handovers Page', desc: 'See handover records' },
  { key: 'canViewDrivers', label: 'Drivers Page', desc: 'See the Drivers section' },
  { key: 'canViewCustomers', label: 'Customers Page', desc: 'See the Customers section' },
  { key: 'canViewReferrals', label: 'Referrals Page', desc: 'See the Referrals section' },
  { key: 'canViewInquiries', label: 'Inquiries Page', desc: 'See customer inquiries' },
  { key: 'canViewIncomplete', label: 'Incomplete Page', desc: 'See draft processes' },
];

export default function PermissionsScreen() {
  const users = useAuthStore((s) => s.users);
  const getOwnerPermissions = useAuthStore((s) => s.getOwnerPermissions);
  const updatePermissions = useAuthStore((s) => s.updatePermissions);
  const createOwnerAccount = useAuthStore((s) => s.createOwnerAccount);
  const owners = useStore((s) => s.owners);
  // subscribe so toggles re-render
  useAuthStore((s) => s.permissions);

  return (
    <PageScreen title="Permissions">
      <ScrollView contentContainerClassName="p-4 pb-28">
        {owners.length === 0 && <Text className="text-slate-400 text-sm text-center py-16">No owners registered yet.</Text>}
        {owners.map((owner) => {
          const user = users.find((u) => u.ownerId === owner.id);
          const perms = getOwnerPermissions(owner.id);
          const hasAccount = !!user;
          return (
            <View key={owner.id} className="bg-white rounded-2xl border border-slate-100 p-4 mb-3">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-3 flex-1">
                  <View className="w-11 h-11 rounded-xl bg-navy-800 items-center justify-center"><Text className="text-white text-xs font-bold">{owner.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}</Text></View>
                  <View className="flex-1"><Text className="text-sm font-semibold text-slate-900" numberOfLines={1}>{owner.name}</Text><Text className="text-xs text-slate-400">{owner.phone}</Text></View>
                </View>
                {hasAccount ? (
                  <TouchableOpacity onPress={() => updatePermissions(owner.id, { disabled: !perms.disabled })} className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl ${perms.disabled ? 'bg-red-50' : 'bg-emerald-50'}`}>
                    {perms.disabled ? <ShieldOff size={14} color="#b91c1c" /> : <ShieldCheck size={14} color="#047857" />}
                    <Text className={`text-xs font-semibold ${perms.disabled ? 'text-red-700' : 'text-emerald-700'}`}>{perms.disabled ? 'Disabled' : 'Active'}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => createOwnerAccount(owner.id, owner.name)} className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100">
                    <UserPlus size={14} color="#475569" /><Text className="text-xs font-semibold text-slate-600">Create Login</Text>
                  </TouchableOpacity>
                )}
              </View>

              {hasAccount && user ? (
                <View className="bg-slate-50 rounded-xl px-4 py-3 mb-4">
                  <View className="flex-row items-center gap-1.5 mb-2"><Key size={12} color="#64748b" /><Text className="text-xs font-medium text-slate-500">Login Credentials</Text></View>
                  <Credential label="Username" value={user.username} />
                  <Credential label="Password" value={user.password} />
                </View>
              ) : (
                <Text className="text-xs text-slate-400 bg-amber-50 rounded-xl px-3 py-2 mb-3">No login account yet. Tap &quot;Create Login&quot; to generate credentials.</Text>
              )}

              {hasAccount && (
                <View style={{ opacity: perms.disabled ? 0.4 : 1 }} pointerEvents={perms.disabled ? 'none' : 'auto'}>
                  <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Actions</Text>
                  {ACTIONS.map((p) => <Toggle key={p.key} label={p.label} desc={p.desc} on={perms[p.key] as boolean} onPress={() => updatePermissions(owner.id, { [p.key]: !perms[p.key] })} />)}
                  <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 mt-3">Pages</Text>
                  {PAGES.map((p) => <Toggle key={p.key} label={p.label} desc={p.desc} on={perms[p.key] as boolean} onPress={() => updatePermissions(owner.id, { [p.key]: !perms[p.key] })} />)}
                  <Text className="text-xs text-slate-400 mt-2">Owners never see: Owners, Permissions, Credit, Settings — admin-only.</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </PageScreen>
  );
}

function Credential({ label, value }: { label: string; value: string }) {
  const [show, setShow] = useState(false);
  return (
    <View className="flex-row items-center gap-2 mb-1.5">
      <Text className="text-xs text-slate-400 w-16">{label}</Text>
      <Text className="flex-1 text-xs text-slate-700 font-mono bg-white px-2 py-1 rounded-lg">{show ? value : '••••••••'}</Text>
      <TouchableOpacity onPress={() => setShow((v) => !v)} hitSlop={8}>{show ? <EyeOff size={14} color="#94a3b8" /> : <Eye size={14} color="#94a3b8" />}</TouchableOpacity>
    </View>
  );
}

function Toggle({ label, desc, on, onPress }: { label: string; desc: string; on: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} className="flex-row items-center justify-between bg-slate-50 rounded-xl px-4 py-3 mb-2">
      <View className="flex-1 pr-2">
        <Text className={`text-sm font-medium ${on ? 'text-slate-800' : 'text-slate-400'}`}>{label}</Text>
        <Text className="text-xs text-slate-400">{desc}</Text>
      </View>
      {on ? <ToggleRight size={24} color="#0D1B45" /> : <ToggleLeft size={24} color="#cbd5e1" />}
    </TouchableOpacity>
  );
}

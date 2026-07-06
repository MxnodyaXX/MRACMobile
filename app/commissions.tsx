import { DollarSign, Percent, Search, TrendingUp, Users } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { PageScreen } from '@/src/components/PageScreen';
import { StatusBadge } from '@/src/components/StatusBadge';
import { Select } from '@/src/components/ui/Select';
import { bookingDiscount } from '@/src/lib/revenue';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useStore } from '@/src/store/useStore';
import type { Commission } from '@/src/types';

const SOURCES = ['WhatsApp', 'Facebook', 'Instagram', 'TikTok', 'Google', 'Word of Mouth'];

export default function CommissionsScreen() {
  const commissions = useStore((s) => s.commissions);
  const bookings = useStore((s) => s.bookings);
  const vehicles = useStore((s) => s.vehicles);
  const owners = useStore((s) => s.owners);
  const currentUser = useAuthStore((s) => s.currentUser);
  const isAdmin = useAuthStore((s) => s.isAdmin);

  const myOwnerId = currentUser?.ownerId ?? '';
  const scoped = isAdmin() ? commissions : commissions.filter((c) => c.ownerId === myOwnerId);

  const [search, setSearch] = useState('');
  const [fOwner, setFOwner] = useState('');
  const [fStatus, setFStatus] = useState('');

  // Totals (income net of booking discounts).
  const totalIncome = scoped.reduce((s, c) => {
    const bk = bookings.find((b) => b.id === c.bookingId);
    return s + c.totalIncome - (bk ? bookingDiscount(bk) : 0);
  }, 0);
  const totalReferral = scoped.reduce((s, c) => s + (c.coordinatorFee ?? 0), 0);
  const totalPayout = scoped.reduce((s, c) => s + c.ownerPayout, 0);
  const pendingCount = scoped.filter((c) => c.status === 'Pending').length;
  const paidPayout = scoped.filter((c) => c.status === 'Paid').reduce((s, c) => s + c.ownerPayout, 0);
  const pendingPayout = scoped.filter((c) => c.status === 'Pending').reduce((s, c) => s + c.ownerPayout, 0);

  // Income-by-referral buckets (admin).
  const buckets = useMemo(() => {
    const direct: Record<string, number> = {};
    const referral: Record<string, number> = {};
    const source: Record<string, number> = {};
    scoped.forEach((c) => {
      const ref = c.referral || 'Direct';
      if (ref === 'Direct') direct[c.ownerId] = (direct[c.ownerId] ?? 0) + c.totalIncome;
      else if (SOURCES.includes(ref)) source[ref] = (source[ref] ?? 0) + c.totalIncome;
      else referral[ref] = (referral[ref] ?? 0) + c.totalIncome;
    });
    return { direct, referral, source };
  }, [scoped]);

  const ownerPayouts = owners.map((o) => {
    const oc = commissions.filter((c) => c.ownerId === o.id);
    return { owner: o, total: oc.reduce((s, c) => s + c.ownerPayout, 0), pending: oc.filter((c) => c.status === 'Pending').reduce((s, c) => s + c.ownerPayout, 0), count: oc.length };
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scoped.filter((c) => {
      if (fOwner && c.ownerId !== fOwner) return false;
      if (fStatus && c.status !== fStatus) return false;
      if (q) {
        const b = bookings.find((x) => x.id === c.bookingId);
        const v = vehicles.find((x) => x.id === c.vehicleId);
        const o = owners.find((x) => x.id === c.ownerId);
        const hay = [b?.customerName, v?.brand, v?.model, v?.vehicleNumber, o?.name, c.referral].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [scoped, bookings, vehicles, owners, search, fOwner, fStatus]);

  const rs = (n: number) => `Rs ${Math.round(n).toLocaleString()}`;

  return (
    <PageScreen title="Commissions">
      <ScrollView contentContainerClassName="p-4 pb-10" keyboardShouldPersistTaps="handled">
        {/* KPI row */}
        <View className="flex-row gap-3 mb-3">
          <Kpi icon={DollarSign} color="#1B2B6B" label={isAdmin() ? 'Total Income' : 'Earned'} value={rs(isAdmin() ? totalIncome : totalPayout)} />
          <Kpi icon={Percent} color="#f59e0b" label="Referral Fees" value={rs(totalReferral)} />
        </View>
        <View className="flex-row gap-3 mb-4">
          <Kpi icon={Users} color="#10b981" label={isAdmin() ? 'Owner Payouts' : 'Paid'} value={rs(isAdmin() ? totalPayout : paidPayout)} />
          <Kpi icon={TrendingUp} color="#3b82f6" label={isAdmin() ? 'Pending' : 'Pending'} value={isAdmin() ? String(pendingCount) : rs(pendingPayout)} />
        </View>

        {/* Admin: income by referral + owner payouts */}
        {isAdmin() && (
          <>
            {(Object.keys(buckets.direct).length > 0 || Object.keys(buckets.referral).length > 0 || Object.keys(buckets.source).length > 0) && (
              <View className="bg-white rounded-2xl border border-slate-100 p-4 mb-3">
                <Text className="text-sm font-bold text-slate-800 mb-3">Income by Referral</Text>
                <Group title="Direct · by vehicle owner" rows={Object.entries(buckets.direct).map(([oid, v]) => ({ name: owners.find((o) => o.id === oid)?.name ?? 'Unknown', value: v }))} rs={rs} />
                <Group title="Owner Referrals" rows={Object.entries(buckets.referral).map(([n, v]) => ({ name: n, value: v }))} rs={rs} />
                <Group title="Marketing Sources" rows={Object.entries(buckets.source).map(([n, v]) => ({ name: n, value: v }))} rs={rs} />
              </View>
            )}

            <View className="bg-white rounded-2xl border border-slate-100 p-4 mb-3">
              <Text className="text-sm font-bold text-slate-800 mb-3">Owner Payouts</Text>
              {ownerPayouts.map(({ owner, total, pending, count }) => (
                <View key={owner.id} className="flex-row items-center gap-3 bg-slate-50 rounded-xl p-3 mb-2">
                  <View className="w-9 h-9 rounded-xl bg-navy-800 items-center justify-center">
                    <Text className="text-white text-xs font-bold">{owner.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-slate-800" numberOfLines={1}>{owner.name}</Text>
                    <Text className="text-xs text-slate-400">{count} bookings · {owner.commissionRate}% commission</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-sm font-bold text-slate-800">{rs(total)}</Text>
                    {pending > 0 && <Text className="text-xs text-amber-600">{rs(pending)} pending</Text>}
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Records */}
        <Text className="text-sm font-bold text-slate-800 mb-2">{isAdmin() ? 'All Payout Records' : 'My Commissions'}</Text>

        <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-3 mb-2">
          <Search size={15} color="#94a3b8" />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search customer, vehicle, owner…" placeholderTextColor="#94a3b8" className="flex-1 py-2.5 px-2 text-sm text-slate-900" />
        </View>
        <View className="flex-row gap-2 mb-3">
          {isAdmin() && (
            <View className="flex-1">
              <Select label="" value={fOwner} onChange={setFOwner} placeholder="All owners" options={[{ value: '', label: 'All owners' }, ...owners.map((o) => ({ value: o.id, label: o.name }))]} />
            </View>
          )}
          <View className="flex-1">
            <Select label="" value={fStatus} onChange={setFStatus} placeholder="All status" options={[{ value: '', label: 'All status' }, ...['Pending', 'Paid', 'Credit'].map((s) => ({ value: s, label: s }))]} />
          </View>
        </View>

        {filtered.length === 0 ? (
          <Text className="text-slate-400 text-sm text-center py-12">{commissions.length === 0 ? 'No payout records yet.' : 'No records match your filters.'}</Text>
        ) : (
          filtered.map((c) => <RecordCard key={c.id} c={c} rs={rs} />)
        )}
      </ScrollView>
    </PageScreen>
  );
}

function Kpi({ icon: Icon, color, label, value }: { icon: typeof DollarSign; color: string; label: string; value: string }) {
  return (
    <View className="flex-1 bg-white rounded-2xl border border-slate-100 p-3.5">
      <View style={{ backgroundColor: color }} className="w-9 h-9 rounded-xl items-center justify-center mb-2">
        <Icon size={16} color="#fff" />
      </View>
      <Text className="text-[11px] text-slate-400 font-medium">{label}</Text>
      <Text className="text-base font-black text-slate-900" numberOfLines={1}>{value}</Text>
    </View>
  );
}

function Group({ title, rows, rs }: { title: string; rows: { name: string; value: number }[]; rs: (n: number) => string }) {
  const active = rows.filter((r) => r.value > 0);
  if (active.length === 0) return null;
  return (
    <View className="mb-3">
      <Text className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{title}</Text>
      {active.sort((a, b) => b.value - a.value).map((r) => (
        <View key={r.name} className="flex-row items-center justify-between py-1">
          <Text className="text-xs text-slate-600 flex-1" numberOfLines={1}>{r.name}</Text>
          <Text className="text-xs font-semibold text-slate-800">{rs(r.value)}</Text>
        </View>
      ))}
    </View>
  );
}

function RecordCard({ c, rs }: { c: Commission; rs: (n: number) => string }) {
  const bookings = useStore((s) => s.bookings);
  const vehicles = useStore((s) => s.vehicles);
  const owners = useStore((s) => s.owners);
  const b = bookings.find((x) => x.id === c.bookingId);
  const v = vehicles.find((x) => x.id === c.vehicleId);
  const o = owners.find((x) => x.id === c.ownerId);
  return (
    <View className="bg-white rounded-2xl border border-slate-100 p-3.5 mb-2.5">
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 pr-2">
          <Text className="text-sm font-semibold text-slate-800" numberOfLines={1}>{b?.customerName ?? '—'}</Text>
          <Text className="text-[11px] text-slate-400" numberOfLines={1}>{v ? `${v.brand} ${v.model} · ${v.vehicleNumber}` : '—'}</Text>
          <Text className="text-[11px] text-slate-400">{o?.name ?? '—'} · {c.referral}</Text>
        </View>
        <StatusBadge status={c.status} />
      </View>
      <View className="flex-row justify-between border-t border-slate-50 pt-2">
        <Metric label="Total" value={rs(c.totalIncome)} />
        <Metric label="Referral" value={(c.coordinatorFee ?? 0) > 0 ? rs(c.coordinatorFee ?? 0) : '—'} color="#b45309" />
        <Metric label="Owner Gets" value={rs(c.ownerPayout)} color="#047857" />
      </View>
    </View>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View>
      <Text className="text-[10px] text-slate-400">{label}</Text>
      <Text className="text-xs font-bold" style={{ color: color ?? '#1e293b' }}>{value}</Text>
    </View>
  );
}

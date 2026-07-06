import { ArrowDownLeft, ArrowUpRight, CalendarClock, CheckCircle2, ChevronDown, Clock, Crown, HandCoins, Wallet } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { PageScreen } from '@/src/components/PageScreen';
import { StatusBadge } from '@/src/components/StatusBadge';
import { buildReferralRecords, RefRecord, totalsOf } from '@/src/lib/referralInsights';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useStore } from '@/src/store/useStore';

const rs = (n: number) => `Rs ${Math.round(n).toLocaleString()}`;

export default function ReferralsScreen() {
  const isAdmin = useAuthStore((s) => s.isAdmin);
  return (
    <PageScreen title="Referrals">
      {isAdmin() ? <AdminReferrals /> : <OwnerReferrals />}
    </PageScreen>
  );
}

function Kpi({ icon: Icon, color, label, value, note }: { icon: typeof HandCoins; color: string; label: string; value: number; note: string }) {
  return (
    <View className="flex-1 bg-white rounded-2xl border border-slate-100 p-3.5">
      <View style={{ backgroundColor: color }} className="w-9 h-9 rounded-xl items-center justify-center mb-2"><Icon size={16} color="#fff" /></View>
      <Text className="text-[11px] text-slate-400 font-medium" numberOfLines={1}>{label}</Text>
      <Text className="text-base font-black text-slate-900" numberOfLines={1}>{rs(value)}</Text>
      <Text className="text-[10px] text-slate-300" numberOfLines={1}>{note}</Text>
    </View>
  );
}

function RecordRow({ r, vehicleLabel, lead, action, onToggle }: {
  r: RefRecord;
  vehicleLabel: (id: string) => string;
  lead: 'referrer' | 'payer';
  action: 'settle' | 'receive';
  onToggle?: (bookingId: string, paid: boolean) => void;
}) {
  return (
    <View className="bg-slate-50 rounded-xl p-3 mb-2">
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-sm font-semibold text-slate-800" numberOfLines={1}>{lead === 'referrer' ? r.referrer : r.payerOwnerName}</Text>
        <StatusBadge status={r.booking.status} />
      </View>
      <Text className="text-xs text-slate-500" numberOfLines={1}>{r.booking.customerName} · {vehicleLabel(r.booking.vehicleId)}</Text>
      <Text className="text-[11px] text-slate-400 mb-2">{r.booking.startDate} → {r.booking.endDate}</Text>
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-bold text-amber-700">{rs(r.fee)}</Text>
        {!r.payable ? (
          <Text className="text-[11px] text-blue-500">Not due yet</Text>
        ) : action === 'receive' ? (
          r.paid
            ? <View className="flex-row items-center gap-1"><CheckCircle2 size={12} color="#047857" /><Text className="text-[11px] font-medium text-emerald-700">Received</Text></View>
            : <View className="flex-row items-center gap-1"><Clock size={12} color="#d97706" /><Text className="text-[11px] font-medium text-amber-600">Awaiting</Text></View>
        ) : r.paid ? (
          <TouchableOpacity onPress={() => onToggle?.(r.booking.id, false)} className="flex-row items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg">
            <CheckCircle2 size={12} color="#047857" /><Text className="text-[11px] font-medium text-emerald-700">Paid</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => onToggle?.(r.booking.id, true)} className="bg-amber-500 px-3 py-1 rounded-lg"><Text className="text-[11px] font-medium text-white">Mark paid</Text></TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function AdminReferrals() {
  const bookings = useStore((s) => s.bookings);
  const vehicles = useStore((s) => s.vehicles);
  const owners = useStore((s) => s.owners);
  const markReferralPaid = useStore((s) => s.markReferralPaid);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const records = useMemo(() => buildReferralRecords(bookings, vehicles, owners), [bookings, vehicles, owners]);
  const grand = totalsOf(records);
  const vehicleLabel = (id: string) => { const v = vehicles.find((x) => x.id === id); return v ? `${v.brand} ${v.model} · ${v.vehicleNumber}` : '—'; };

  const groups = useMemo(() => {
    const map: Record<string, RefRecord[]> = {};
    records.forEach((r) => { (map[r.referrer] ??= []).push(r); });
    return Object.entries(map).map(([referrer, recs]) => ({ referrer, recs, totals: totalsOf(recs), ownerId: recs[0].referrerOwnerId }))
      .sort((a, b) => b.totals.pending - a.totals.pending || b.totals.earned - a.totals.earned);
  }, [records]);
  const maxEarned = Math.max(1, ...groups.map((g) => g.totals.earned));
  const top = [...groups].sort((a, b) => b.totals.earned - a.totals.earned).slice(0, 5);

  return (
    <ScrollView contentContainerClassName="p-4 pb-10">
      {grand.pending > 0 && (
        <View className="flex-row items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
          <View className="w-9 h-9 rounded-xl bg-amber-500 items-center justify-center"><Wallet size={18} color="#fff" /></View>
          <View className="flex-1"><Text className="text-sm font-semibold text-amber-800">{rs(grand.pending)} in referral fees pending</Text><Text className="text-xs text-amber-700 mt-0.5">Owners owe these to referrers.</Text></View>
        </View>
      )}
      <View className="flex-row gap-3 mb-3">
        <Kpi icon={HandCoins} color="#1B2B6B" label="Referral Income" value={grand.earned} note="realized" />
        <Kpi icon={CheckCircle2} color="#10b981" label="Paid Out" value={grand.paid} note="settled" />
      </View>
      <View className="flex-row gap-3 mb-4">
        <Kpi icon={Clock} color="#f59e0b" label="Pending" value={grand.pending} note="awaiting" />
        <Kpi icon={CalendarClock} color="#3b82f6" label="Upcoming" value={grand.upcoming} note="not yet due" />
      </View>

      {top.length > 0 && (
        <View className="bg-white rounded-2xl border border-slate-100 p-4 mb-3">
          <View className="flex-row items-center gap-2 mb-3"><Crown size={16} color="#f59e0b" /><Text className="text-sm font-bold text-slate-800">Top Referrers</Text></View>
          {top.map((g, i) => (
            <View key={g.referrer} className="flex-row items-center gap-2 mb-2.5">
              <Text className="text-xs font-bold text-slate-400 w-4 text-center">{i + 1}</Text>
              <View className="w-24"><Text className="text-xs font-semibold text-slate-800" numberOfLines={1}>{g.referrer}</Text><Text className="text-[10px] text-slate-400">{g.totals.count} bkg</Text></View>
              <View className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden"><View style={{ width: `${(g.totals.earned / maxEarned) * 100}%`, backgroundColor: '#0D1B45' }} className="h-full rounded-full" /></View>
              <Text className="text-xs font-bold text-slate-800 w-20 text-right">{rs(g.totals.earned)}</Text>
            </View>
          ))}
        </View>
      )}

      <Text className="text-sm font-bold text-slate-800 mb-2">Referrers</Text>
      {groups.length === 0 ? (
        <Text className="text-slate-400 text-sm text-center py-12">No referral fees recorded yet.</Text>
      ) : (
        groups.map((g) => {
          const isOpen = !!open[g.referrer];
          return (
            <View key={g.referrer} className="bg-white rounded-2xl border border-slate-100 mb-2.5 overflow-hidden">
              <TouchableOpacity onPress={() => setOpen((m) => ({ ...m, [g.referrer]: !m[g.referrer] }))} className="flex-row items-center gap-3 p-3.5">
                <View className="w-9 h-9 rounded-xl bg-navy-800 items-center justify-center"><Text className="text-white text-xs font-bold">{g.referrer.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}</Text></View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-slate-800" numberOfLines={1}>{g.referrer}{g.ownerId ? '  ·  owner' : ''}</Text>
                  <Text className="text-xs text-slate-400">{g.totals.count} bkg · {rs(g.totals.earned)} earned</Text>
                </View>
                {g.totals.pending > 0
                  ? <View className="bg-amber-50 px-2 py-1 rounded-lg"><Text className="text-xs font-semibold text-amber-700">{rs(g.totals.pending)}</Text></View>
                  : <View className="bg-emerald-50 px-2 py-1 rounded-lg"><Text className="text-xs font-semibold text-emerald-700">Settled</Text></View>}
                <ChevronDown size={16} color="#94a3b8" style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }} />
              </TouchableOpacity>
              {isOpen && (
                <View className="px-3.5 pb-3.5 border-t border-slate-50 pt-3">
                  {g.recs.map((r) => <RecordRow key={r.booking.id} r={r} vehicleLabel={vehicleLabel} lead="payer" action="settle" onToggle={markReferralPaid} />)}
                </View>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

function OwnerReferrals() {
  const bookings = useStore((s) => s.bookings);
  const vehicles = useStore((s) => s.vehicles);
  const owners = useStore((s) => s.owners);
  const markReferralPaid = useStore((s) => s.markReferralPaid);
  const currentUser = useAuthStore((s) => s.currentUser);
  const myOwnerId = currentUser?.ownerId ?? '';
  const myName = owners.find((o) => o.id === myOwnerId)?.name ?? currentUser?.name ?? 'Me';

  const records = useMemo(() => buildReferralRecords(bookings, vehicles, owners), [bookings, vehicles, owners]);
  const referredByMe = records.filter((r) => r.referrerOwnerId === myOwnerId || r.referrer.trim().toLowerCase() === myName.trim().toLowerCase());
  const iOwe = records.filter((r) => r.payerOwnerId === myOwnerId);
  const earned = totalsOf(referredByMe);
  const owe = totalsOf(iOwe);
  const vehicleLabel = (id: string) => { const v = vehicles.find((x) => x.id === id); return v ? `${v.brand} ${v.model} · ${v.vehicleNumber}` : '—'; };
  const settleAll = () => iOwe.filter((r) => r.payable && !r.paid).forEach((r) => markReferralPaid(r.booking.id, true));

  return (
    <ScrollView contentContainerClassName="p-4 pb-10">
      {owe.pending > 0 && (
        <View className="flex-row items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
          <View className="w-9 h-9 rounded-xl bg-amber-500 items-center justify-center"><Wallet size={18} color="#fff" /></View>
          <View className="flex-1"><Text className="text-sm font-semibold text-amber-800">You owe {rs(owe.pending)}</Text><Text className="text-xs text-amber-700 mt-0.5">For rentals on your vehicles.</Text></View>
          <TouchableOpacity onPress={settleAll} className="bg-navy-800 rounded-xl px-3 py-2"><Text className="text-white text-xs font-semibold">Settle all</Text></TouchableOpacity>
        </View>
      )}
      <View className="flex-row gap-3 mb-3">
        <Kpi icon={ArrowUpRight} color="#10b981" label="I Referred" value={earned.earned} note="brought" />
        <Kpi icon={CheckCircle2} color="#1B2B6B" label="Received" value={earned.paid} note="paid to you" />
      </View>
      <View className="flex-row gap-3 mb-4">
        <Kpi icon={Clock} color="#3b82f6" label="Awaiting" value={earned.pending} note="owed to you" />
        <Kpi icon={ArrowDownLeft} color="#f59e0b" label="I Owe" value={owe.pending} note="to pay" />
      </View>

      <Text className="text-sm font-bold text-slate-800 mb-2">Business I Referred</Text>
      {referredByMe.length === 0 ? <Text className="text-slate-400 text-xs text-center py-6 mb-3">Nothing yet.</Text> :
        referredByMe.map((r) => <RecordRow key={r.booking.id} r={r} vehicleLabel={vehicleLabel} lead="payer" action="receive" />)}

      <Text className="text-sm font-bold text-slate-800 mb-2 mt-3">Referral Fees I Owe</Text>
      {iOwe.length === 0 ? <Text className="text-slate-400 text-xs text-center py-6">Nothing owed.</Text> :
        iOwe.map((r) => <RecordRow key={r.booking.id} r={r} vehicleLabel={vehicleLabel} lead="referrer" action="settle" onToggle={markReferralPaid} />)}
    </ScrollView>
  );
}

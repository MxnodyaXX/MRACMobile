import { AlertTriangle, CheckCircle2, ChevronDown, Clock, CreditCard, Search, Users, Wallet } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { PageScreen } from '@/src/components/PageScreen';
import { StatusBadge } from '@/src/components/StatusBadge';
import { creditRecords } from '@/src/lib/credit';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useStore } from '@/src/store/useStore';
import type { Booking } from '@/src/types';

const RESP_LABEL: Record<string, string> = { self: 'Vehicle owner', owner: 'Referring owner', company: 'Company' };
const money = (n: number) => `Rs ${n.toLocaleString()}`;

export default function CreditScreen() {
  const bookings = useStore((s) => s.bookings);
  const vehicles = useStore((s) => s.vehicles);
  const owners = useStore((s) => s.owners);
  const settleCredit = useStore((s) => s.settleCredit);
  const isAdmin = useAuthStore((s) => s.isAdmin);

  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState<'outstanding' | 'settled' | 'all'>('outstanding');
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const records = useMemo(() => creditRecords(bookings), [bookings]);
  const vLabel = (id: string) => { const v = vehicles.find((x) => x.id === id); return v ? `${v.brand} ${v.model} · ${v.vehicleNumber}` : '—'; };
  const ownerOf = (id: string) => { const v = vehicles.find((x) => x.id === id); return owners.find((o) => o.id === v?.ownerId)?.name ?? '—'; };
  const custKey = (b: Booking) => b.customerId || b.customerPhone;

  const outstanding = records.filter((r) => !r.settled);
  const totalOutstanding = outstanding.reduce((s, r) => s + r.amount, 0);
  const totalSettled = records.filter((r) => r.settled).reduce((s, r) => s + r.amount, 0);
  const customersWithCredit = new Set(outstanding.map((r) => custKey(r.booking))).size;

  const q = search.trim().toLowerCase();
  const filtered = records.filter((r) => {
    if (statusF === 'outstanding' && r.settled) return false;
    if (statusF === 'settled' && !r.settled) return false;
    if (q) {
      const hay = `${r.booking.customerName} ${r.booking.customerPhone} ${vLabel(r.booking.vehicleId)} ${ownerOf(r.booking.vehicleId)}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const groups = useMemo(() => {
    const map: Record<string, { name: string; phone: string; records: typeof records; outstanding: number }> = {};
    filtered.forEach((r) => {
      const key = custKey(r.booking);
      const g = (map[key] ??= { name: r.booking.customerName, phone: r.booking.customerPhone, records: [], outstanding: 0 });
      g.records.push(r);
      if (!r.settled) g.outstanding += r.amount;
    });
    return Object.entries(map).map(([key, g]) => ({ key, ...g })).sort((a, b) => b.outstanding - a.outstanding);
  }, [filtered]);

  if (!isAdmin()) {
    return (
      <PageScreen title="Credit Management">
        <View className="flex-1 items-center justify-center px-8">
          <AlertTriangle size={40} color="#cbd5e1" />
          <Text className="text-slate-500 text-sm mt-3 text-center">This page is available to administrators only.</Text>
        </View>
      </PageScreen>
    );
  }

  return (
    <PageScreen title="Credit Management">
      <ScrollView contentContainerClassName="p-4 pb-28">
        {totalOutstanding > 0 && (
          <View className="flex-row items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
            <View className="w-9 h-9 rounded-xl bg-amber-500 items-center justify-center"><Wallet size={18} color="#fff" /></View>
            <View className="flex-1"><Text className="text-sm font-semibold text-amber-800">{money(totalOutstanding)} in customer credit to be received</Text><Text className="text-xs text-amber-700 mt-0.5">Owners must collect from their customers.</Text></View>
          </View>
        )}

        <View className="flex-row gap-3 mb-3">
          <Kpi icon={CreditCard} color="#f59e0b" label="To Be Received" value={money(totalOutstanding)} note={`${outstanding.length} pending`} />
          <Kpi icon={Users} color="#1B2B6B" label="Customers" value={String(customersWithCredit)} note="with credit" />
        </View>
        <View className="flex-row gap-3 mb-4">
          <Kpi icon={CheckCircle2} color="#10b981" label="Collected" value={money(totalSettled)} note="settled" />
          <Kpi icon={Clock} color="#3b82f6" label="Pending" value={String(outstanding.length)} note="bookings" />
        </View>

        <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-3 mb-2">
          <Search size={15} color="#94a3b8" />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search customer, vehicle…" placeholderTextColor="#94a3b8" className="flex-1 py-2.5 px-2 text-sm text-slate-900" />
        </View>
        <View className="flex-row gap-2 mb-3">
          {(['outstanding', 'settled', 'all'] as const).map((s) => (
            <TouchableOpacity key={s} onPress={() => setStatusF(s)} className={`px-3 py-1.5 rounded-xl ${statusF === s ? 'bg-navy-800' : 'bg-white border border-slate-200'}`}>
              <Text className={`text-xs font-medium capitalize ${statusF === s ? 'text-white' : 'text-slate-500'}`}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {groups.length === 0 ? (
          <Text className="text-slate-400 text-sm text-center py-12">No credit records match your filters.</Text>
        ) : (
          groups.map((g) => {
            const isOpen = !!open[g.key];
            return (
              <View key={g.key} className="bg-white rounded-2xl border border-slate-100 mb-2.5 overflow-hidden">
                <TouchableOpacity onPress={() => setOpen((m) => ({ ...m, [g.key]: !m[g.key] }))} className="flex-row items-center gap-3 p-3.5">
                  <View className="w-9 h-9 rounded-xl bg-navy-800 items-center justify-center"><Text className="text-white text-xs font-bold">{g.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}</Text></View>
                  <View className="flex-1"><Text className="text-sm font-semibold text-slate-800" numberOfLines={1}>{g.name}</Text><Text className="text-xs text-slate-400">{g.phone} · {g.records.length} rec</Text></View>
                  {g.outstanding > 0
                    ? <View className="bg-amber-50 px-2 py-1 rounded-lg"><Text className="text-xs font-semibold text-amber-700">{money(g.outstanding)}</Text></View>
                    : <View className="bg-emerald-50 px-2 py-1 rounded-lg"><Text className="text-xs font-semibold text-emerald-700">Settled</Text></View>}
                  <ChevronDown size={16} color="#94a3b8" style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }} />
                </TouchableOpacity>
                {isOpen && (
                  <View className="px-3.5 pb-3.5 border-t border-slate-50 pt-3">
                    {g.records.map((r) => (
                      <View key={r.booking.id} className="bg-slate-50 rounded-xl p-3 mb-2">
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-sm font-semibold text-slate-800" numberOfLines={1}>{vLabel(r.booking.vehicleId)}</Text>
                          <StatusBadge status={r.settled ? 'Paid' : 'Pending'} />
                        </View>
                        <Text className="text-xs text-slate-400">{ownerOf(r.booking.vehicleId)} · {RESP_LABEL[r.booking.creditResponsibility ?? 'self']}</Text>
                        <Text className="text-[11px] text-slate-400 mb-2">{r.booking.startDate} → {r.booking.endDate}</Text>
                        <View className="flex-row items-center justify-between">
                          <Text className="text-sm font-bold text-amber-700">{money(r.amount)}</Text>
                          {r.settled
                            ? <View className="flex-row items-center gap-1"><CheckCircle2 size={12} color="#047857" /><Text className="text-[11px] text-emerald-600">Collected</Text></View>
                            : <TouchableOpacity onPress={() => settleCredit(r.booking.id)} className="bg-emerald-600 px-3 py-1 rounded-lg"><Text className="text-[11px] font-medium text-white">Mark Collected</Text></TouchableOpacity>}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </PageScreen>
  );
}

function Kpi({ icon: Icon, color, label, value, note }: { icon: typeof CreditCard; color: string; label: string; value: string; note: string }) {
  return (
    <View className="flex-1 bg-white rounded-2xl border border-slate-100 p-3.5">
      <View style={{ backgroundColor: color }} className="w-9 h-9 rounded-xl items-center justify-center mb-2"><Icon size={16} color="#fff" /></View>
      <Text className="text-[11px] text-slate-400 font-medium" numberOfLines={1}>{label}</Text>
      <Text className="text-base font-black text-slate-900" numberOfLines={1}>{value}</Text>
      <Text className="text-[10px] text-slate-300" numberOfLines={1}>{note}</Text>
    </View>
  );
}

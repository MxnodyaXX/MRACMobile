import { useRouter } from 'expo-router';
import {
  AlertCircle, AlertTriangle, ArrowDownRight, Banknote, CalendarClock, CalendarDays, Car,
  CheckSquare, CreditCard, Crown, DollarSign, Gauge, LogOut, MessageSquare, Receipt, RefreshCw,
  Repeat, Scissors, ShieldAlert, Target, TrendingDown, TrendingUp, UserCircle, Users, Wallet, X,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StatusBadge } from '@/src/components/StatusBadge';
import {
  customerStats, depositAndDebt, expensesByCategory, fleetUtilization, inquiryFunnel, insuranceExpiring,
  leadSources, momGrowth, overdueReturns, paymentMethods, rentalAverages, upcoming, vehicleProfit,
} from '@/src/lib/analytics';
import { creditTotals } from '@/src/lib/credit';
import { grossRevenue, netRevenue, totalDiscount, vehicleNetRevenue } from '@/src/lib/revenue';
import { BarChart, Donut } from '@/src/features/dashboard/charts';
import { Empty, KpiCard, Panel, ProgressBar, StatTile, pct, rs } from '@/src/features/dashboard/pieces';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useStore } from '@/src/store/useStore';
import { Vehicle } from '@/src/types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PODIUM = [
  { rank: 2, h: 78, medal: '🥈', grad: '#637D9C' },
  { rank: 1, h: 116, medal: '🥇', grad: '#1B2B6B' },
  { rank: 3, h: 60, medal: '🥉', grad: '#4D6785' },
];

export default function DashboardScreen() {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.currentUser);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const logout = useAuthStore((s) => s.logout);
  const loadUsers = useAuthStore((s) => s.loadUsers);

  const vehicles = useStore((s) => s.vehicles);
  const bookings = useStore((s) => s.bookings);
  const inquiries = useStore((s) => s.inquiries);
  const expenses = useStore((s) => s.expenses);
  const owners = useStore((s) => s.owners);
  const notifications = useStore((s) => s.notifications);
  const loaded = useStore((s) => s.loaded);
  const loadAll = useStore((s) => s.loadAll);

  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<'revenue' | 'bookings' | 'expenses'>('revenue');
  const [infoModal, setInfoModal] = useState<'outstanding' | 'profit' | null>(null);

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

  const isOwnerRole = !isAdmin() && currentUser?.role === 'owner';

  // ── Scope data to owner when not admin ────────────────────────────────────
  const scoped = useMemo(() => {
    const idSet = isOwnerRole
      ? new Set(vehicles.filter((v) => v.ownerId === currentUser?.ownerId).map((v) => v.id))
      : null;
    return {
      vehicles: idSet ? vehicles.filter((v) => idSet.has(v.id)) : vehicles,
      bookings: idSet ? bookings.filter((b) => idSet.has(b.vehicleId)) : bookings,
      expenses: idSet ? expenses.filter((e) => idSet.has(e.vehicleId)) : expenses,
    };
  }, [isOwnerRole, currentUser, vehicles, bookings, expenses]);

  // ── Derived KPIs (mirrors the web dashboard) ──────────────────────────────
  const d = useMemo(() => {
    const netRev = (v: Vehicle) => vehicleNetRevenue(v, scoped.bookings);
    const byRevenue = [...scoped.vehicles].sort((a, b) => netRev(b) - netRev(a));
    const gross = scoped.vehicles.reduce((s, v) => s + v.revenue, 0);
    const discounts = totalDiscount(scoped.bookings);
    const totalRevenue = gross - discounts;
    const activeBookings = scoped.bookings.filter((b) => b.status === 'Confirmed' || b.status === 'Ongoing');
    const unread = notifications.filter((n) => !n.read).length;

    const receivable = scoped.bookings.filter((b) => b.status === 'Ongoing' || b.status === 'Completed');
    const informallyUnpaid = receivable.filter((b) => !((b.creditAmount ?? 0) > 0 && !b.creditSettled));
    const outstanding = informallyUnpaid.reduce(
      (s, b) => s + Math.max(0, b.totalAmount - (b.discount ?? 0) - b.paidAmount),
      0,
    );
    const outstandingRows = informallyUnpaid
      .filter((b) => b.totalAmount - (b.discount ?? 0) > b.paidAmount)
      .map((b) => ({ ...b, balance: b.totalAmount - (b.discount ?? 0) - b.paidAmount }))
      .sort((a, b) => b.balance - a.balance);

    const now = new Date();
    const inMonth = (ds: string) => {
      const x = new Date(ds);
      return x.getFullYear() === now.getFullYear() && x.getMonth() === now.getMonth();
    };
    const thisMonthRevenue = scoped.bookings
      .filter((b) => b.status !== 'Cancelled' && inMonth(b.startDate))
      .reduce((s, b) => s + b.totalAmount, 0);
    const thisMonthExpenses = scoped.expenses.filter((e) => inMonth(e.date)).reduce((s, e) => s + e.amount, 0);

    const chartData = Array.from({ length: 5 }, (_, i) => {
      const dt = new Date();
      dt.setDate(1);
      dt.setMonth(dt.getMonth() - (4 - i));
      const y = dt.getFullYear();
      const mo = dt.getMonth();
      const match = (ds: string) => {
        const x = new Date(ds);
        return x.getFullYear() === y && x.getMonth() === mo;
      };
      const rev = scoped.bookings.filter((b) => b.status !== 'Cancelled' && match(b.startDate)).reduce((s, b) => s + b.totalAmount, 0);
      const cnt = scoped.bookings.filter((b) => b.status !== 'Cancelled' && match(b.startDate)).length;
      const exp = scoped.expenses.filter((e) => match(e.date)).reduce((s, e) => s + e.amount, 0);
      return { label: MONTHS[mo], revenue: rev, bookings: cnt, expenses: exp };
    });

    return {
      byRevenue, netRev, gross, discounts, totalRevenue, activeBookings, unread,
      outstanding, outstandingRows, thisMonthRevenue, thisMonthExpenses,
      monthlyProfit: thisMonthRevenue - thisMonthExpenses,
      credit: creditTotals(scoped.bookings),
      chartData,
      // analytics blocks
      overdue: overdueReturns(scoped.bookings),
      soon: upcoming(scoped.bookings, 7),
      insurance: insuranceExpiring(scoped.vehicles, 30),
      mom: momGrowth(scoped.bookings),
      dd: depositAndDebt(scoped.bookings),
      net: netRevenue(scoped.bookings),
      grossN: grossRevenue(scoped.bookings),
      util: fleetUtilization(scoped.vehicles, scoped.bookings, 30),
      profit: vehicleProfit(scoped.vehicles, scoped.expenses, scoped.bookings),
      leads: leadSources(scoped.bookings),
      expCats: expensesByCategory(scoped.expenses),
      pay: paymentMethods(scoped.bookings),
      custStats: customerStats(scoped.bookings),
      avgs: rentalAverages(scoped.bookings),
      funnel: inquiryFunnel(inquiries),
    };
  }, [scoped, notifications, inquiries]);

  const vLabel = (id: string) => {
    const v = vehicles.find((x) => x.id === id);
    return v ? `${v.brand} ${v.model} · ${v.vehicleNumber}` : '—';
  };

  const available = vehicles.filter((v) => v.status === 'Available');
  const onRent = vehicles.filter((v) => v.status === 'Ongoing' || v.status === 'Reserved');
  const underRepair = vehicles.filter((v) => v.status === 'Maintenance');
  const scopedAvailable = scoped.vehicles.filter((v) => v.status === 'Available');
  const scopedOnRent = scoped.vehicles.filter((v) => v.status === 'Ongoing' || v.status === 'Reserved');
  const scopedUnderRepair = scoped.vehicles.filter((v) => v.status === 'Maintenance');
  const completedRentals = scoped.bookings.filter((b) => b.status === 'Completed').length;
  const uniqueCustomers = new Set(scoped.bookings.map((b) => b.customerPhone)).size;

  const podium = [d.byRevenue[1], d.byRevenue[0], d.byRevenue[2]];
  const maxProfit = Math.max(1, ...d.profit.map((x) => Math.abs(x.profit)));
  const chartColor = tab === 'expenses' ? '#EF4444' : '#4B7BE5';
  const chartKey = tab;

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <ScrollView contentContainerClassName="p-4 pb-10">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-slate-500 text-sm">Welcome back,</Text>
            <Text className="text-2xl font-black text-slate-900">{currentUser?.name ?? 'User'}</Text>
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity onPress={refresh} disabled={busy} className="w-10 h-10 rounded-xl bg-white border border-slate-200 items-center justify-center">
              {busy ? <ActivityIndicator size="small" color="#0D1B45" /> : <RefreshCw size={17} color="#0D1B45" />}
            </TouchableOpacity>
            <TouchableOpacity onPress={logout} className="w-10 h-10 rounded-xl bg-white border border-slate-200 items-center justify-center">
              <LogOut size={17} color="#0D1B45" />
            </TouchableOpacity>
          </View>
        </View>

        {!loaded && (
          <View className="items-center py-4">
            <ActivityIndicator color="#0D1B45" />
          </View>
        )}

        {/* KPI row */}
        <View className="flex-row gap-3 mb-3">
          <KpiCard label="Total Fleet" value={scoped.vehicles.length} sub={`${scopedAvailable.length} available`} icon={Car} color="#1B2B6B" onPress={() => router.push('/vehicles')} />
          <KpiCard label="Active Bookings" value={d.activeBookings.length} sub="confirmed + ongoing" icon={CalendarDays} color="#3B82F6" onPress={() => router.push('/bookings')} />
        </View>
        <View className="flex-row gap-3 mb-4">
          <KpiCard label="Net Revenue" value={rs(d.totalRevenue)} sub={`Gross ${rs(d.gross)}`} icon={DollarSign} color="#10B981" onPress={() => router.push('/commissions')} />
          <KpiCard label="Alerts" value={d.unread} sub="unread" icon={AlertCircle} color="#F59E0B" onPress={() => router.push('/alerts')} />
        </View>

        {/* Operational Alerts */}
        <Panel title="Overdue Returns" icon={AlertTriangle} iconColor="#ef4444" badge={d.overdue.length} badgeTone={d.overdue.length ? 'red' : 'muted'} onPress={() => router.push('/bookings')}>
          {d.overdue.length === 0 ? (
            <Empty text="No overdue rentals. Every vehicle is back on time." />
          ) : (
            d.overdue.slice(0, 5).map(({ booking: b, daysLate }) => (
              <View key={b.id} className="flex-row items-center justify-between bg-red-50 rounded-xl px-3 py-2 mb-2">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-slate-800" numberOfLines={1}>{b.customerName}</Text>
                  <Text className="text-[11px] text-slate-400" numberOfLines={1}>{vLabel(b.vehicleId)}</Text>
                </View>
                <Text className="text-[11px] font-bold text-red-600">{daysLate}d late</Text>
              </View>
            ))
          )}
        </Panel>

        <Panel title="Next 7 Days" icon={CalendarClock} iconColor="#3b82f6" badge={d.soon.pickups.length + d.soon.returns.length} badgeTone="blue" onPress={() => router.push('/bookings')}>
          {d.soon.pickups.length === 0 && d.soon.returns.length === 0 ? (
            <Empty text="Nothing scheduled in the coming week." />
          ) : (
            <>
              {d.soon.pickups.slice(0, 3).map((b) => (
                <UpcomingRow key={`p${b.id}`} tag="Pickup" tone="emerald" name={b.customerName} sub={vLabel(b.vehicleId)} date={b.startDate} />
              ))}
              {d.soon.returns.slice(0, 3).map((b) => (
                <UpcomingRow key={`r${b.id}`} tag="Return" tone="blue" name={b.customerName} sub={vLabel(b.vehicleId)} date={b.endDate} />
              ))}
            </>
          )}
        </Panel>

        <Panel title="Insurance Watch" icon={ShieldAlert} iconColor="#f59e0b" badge={d.insurance.length} badgeTone={d.insurance.length ? 'amber' : 'muted'} onPress={() => router.push('/vehicles')}>
          {d.insurance.length === 0 ? (
            <Empty text="All policies valid for the next 30 days." />
          ) : (
            d.insurance.slice(0, 5).map((al) => (
              <View key={al.vehicle.id} className="flex-row items-center justify-between bg-amber-50 rounded-xl px-3 py-2 mb-2">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-slate-800" numberOfLines={1}>{al.vehicle.brand} {al.vehicle.model}</Text>
                  <Text className="text-[11px] text-slate-400">{al.vehicle.vehicleNumber}</Text>
                </View>
                <Text className={`text-[11px] font-bold ${al.missing || (al.daysLeft ?? 0) < 0 ? 'text-red-600' : 'text-amber-600'}`}>
                  {al.missing ? 'No policy' : (al.daysLeft ?? 0) < 0 ? 'Expired' : `${al.daysLeft}d left`}
                </Text>
              </View>
            ))
          )}
        </Panel>

        {/* Business KPIs */}
        <View className="flex-row gap-3 mb-3">
          <StatTile icon={Wallet} color="#ef4444" label="Outstanding" value={rs(d.outstanding)} sub={`${d.outstandingRows.length} unpaid`} tone={d.outstanding > 0 ? 'red' : 'emerald'} onPress={() => setInfoModal('outstanding')} />
          <StatTile icon={TrendingUp} color={d.monthlyProfit >= 0 ? '#10B981' : '#ef4444'} label="Month Profit" value={rs(d.monthlyProfit)} sub="rev − expenses" tone={d.monthlyProfit >= 0 ? 'emerald' : 'red'} onPress={() => setInfoModal('profit')} />
        </View>

        {/* Total credit */}
        <View className="bg-white rounded-2xl p-4 border border-slate-100 mb-3 flex-row items-start gap-3">
          <View className="w-11 h-11 rounded-xl bg-amber-500 items-center justify-center">
            <CreditCard size={20} color="#fff" />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-slate-400 font-medium">Total Credit To Be Received</Text>
            <Text className={`text-2xl font-black ${d.credit.total > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{rs(d.credit.total)}</Text>
            <Text className="text-xs text-slate-500 mt-0.5">{d.credit.customers} customer(s) · {d.credit.bookings} booking(s)</Text>
          </View>
        </View>

        {/* Money Insights */}
        <Text className="text-sm font-bold text-slate-700 mb-2 mt-2">Money Insights</Text>
        <View className="flex-row gap-3 mb-3">
          <StatTile icon={DollarSign} color="#1B2B6B" label="Gross Revenue" value={rs(d.grossN)} sub="before discounts" onPress={() => router.push('/commissions')} />
          <StatTile icon={Scissors} color="#f59e0b" label="Discounts" value={rs(d.discounts)} sub={`net ${rs(d.net)}`} tone={d.discounts > 0 ? 'red' : undefined} onPress={() => router.push('/bookings')} />
        </View>
        <View className="flex-row gap-3 mb-3">
          <StatTile icon={d.mom.growth !== null && d.mom.growth < 0 ? TrendingDown : TrendingUp} color={d.mom.growth !== null && d.mom.growth < 0 ? '#ef4444' : '#10B981'} label="Revenue Growth" value={d.mom.growth === null ? '—' : `${d.mom.growth >= 0 ? '+' : ''}${pct(d.mom.growth)}`} sub="vs last month" tone={d.mom.growth !== null && d.mom.growth < 0 ? 'red' : 'emerald'} />
          <StatTile icon={Banknote} color="#3B82F6" label="Deposits Held" value={rs(d.dd.depositsHeld)} sub="refundable" onPress={() => router.push('/bookings')} />
        </View>
        <View className="flex-row gap-3 mb-4">
          <StatTile icon={ArrowDownRight} color="#ef4444" label="Bad Debt" value={rs(d.dd.badDebt)} sub="written off" tone={d.dd.badDebt > 0 ? 'red' : undefined} />
          <View className="flex-1" />
        </View>

        {/* Leaderboard */}
        <View className="bg-white rounded-2xl p-4 border border-slate-100 mb-3">
          <View className="flex-row items-center gap-2 mb-3">
            <Crown size={16} color="#f59e0b" />
            <Text className="text-sm font-bold text-slate-800">Leaderboard</Text>
          </View>
          {d.byRevenue.length === 0 ? (
            <Empty text="No vehicles yet." />
          ) : (
            <View className="rounded-2xl overflow-hidden px-2 pt-4" style={{ backgroundColor: '#0D1B45' }}>
              <View className="flex-row items-end justify-center gap-3">
                {podium.map((v, i) => {
                  if (!v) return <View key={i} className="flex-1" />;
                  const cfg = PODIUM[i];
                  return (
                    <View key={v.id} className="flex-1 items-center">
                      <Text style={{ fontSize: 22 }}>{cfg.medal}</Text>
                      <Text className="text-white font-bold text-[11px] text-center mt-1" numberOfLines={1}>{v.brand} {v.model}</Text>
                      <Text className="text-white/60 text-[10px] mb-2">{rs(d.netRev(v))}</Text>
                      <View style={{ height: cfg.h, backgroundColor: cfg.grad }} className="w-full rounded-t-xl items-center justify-center">
                        <Text className="text-white/50 text-[9px] font-bold uppercase tracking-widest">{cfg.rank === 1 ? '1st' : cfg.rank === 2 ? '2nd' : '3rd'}</Text>
                        <Text className="text-white font-black text-2xl">{cfg.rank}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
          {/* Fleet pills */}
          <View className="flex-row gap-3 mt-4">
            <FleetPill label="Available" count={available.length} color="#10B981" />
            <FleetPill label="On Rent" count={onRent.length} color="#3B82F6" />
            <FleetPill label="Under Repair" count={underRepair.length} color="#EF4444" />
          </View>
        </View>

        {/* Vehicle Performance */}
        <Panel title="Busiest Vehicles" icon={Gauge} iconColor="#3b82f6" onPress={() => router.push('/vehicles')}>
          <Text className="text-[11px] text-slate-400 -mt-1 mb-3">Fleet avg {pct(d.util.fleetRate)} busy · last 30 days</Text>
          {d.util.perVehicle.length === 0 ? <Empty text="No vehicles to rank yet." /> : d.util.perVehicle.slice(0, 5).map((u) => (
            <ProgressBar key={u.vehicle.id} label={`${u.vehicle.brand} ${u.vehicle.model}`} sub={u.vehicle.vehicleNumber} ratio={u.rate} display={pct(u.rate)} tone="blue" />
          ))}
        </Panel>
        <Panel title="Profit per Vehicle" icon={TrendingUp} iconColor="#10b981" onPress={() => router.push('/vehicles')}>
          {d.profit.length === 0 ? <Empty text="No vehicles to rank yet." /> : d.profit.slice(0, 5).map((p) => (
            <ProgressBar key={p.vehicle.id} label={`${p.vehicle.brand} ${p.vehicle.model}`} sub={`rev ${rs(p.revenue)} · exp ${rs(p.expenses)}`} ratio={Math.abs(p.profit) / maxProfit} display={rs(p.profit)} tone={p.profit < 0 ? 'red' : 'emerald'} />
          ))}
        </Panel>

        {/* Charts */}
        <View className="bg-white rounded-2xl p-4 border border-slate-100 mb-3">
          <View className="flex-row gap-2 mb-4">
            {(['revenue', 'bookings', 'expenses'] as const).map((t) => (
              <TouchableOpacity key={t} onPress={() => setTab(t)} className={`px-3 py-1.5 rounded-xl ${tab === t ? 'bg-navy-800' : 'bg-slate-100'}`}>
                <Text className={`text-xs font-medium ${tab === t ? 'text-white' : 'text-slate-500'}`}>{t === 'bookings' ? 'Bookings' : t === 'revenue' ? 'Revenue' : 'Expenses'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <BarChart
              data={d.chartData.map((c) => ({ label: c.label, value: c[chartKey] }))}
              color={chartColor}
              format={(n) => (tab === 'bookings' ? String(n) : `${Math.round(n / 1000)}k`)}
            />
          </ScrollView>
        </View>

        {/* Distribution donuts */}
        <Panel title="Lead Sources" icon={Target} iconColor="#3b82f6">
          {d.leads.filter((l) => l.revenue > 0).length === 0 ? <Empty text="No bookings to attribute yet." /> : (
            <Donut slices={d.leads.map((l) => ({ name: l.source, value: l.revenue }))} format={rs} />
          )}
        </Panel>
        <Panel title="Expense Breakdown" icon={Receipt} iconColor="#ef4444">
          {d.expCats.length === 0 ? <Empty text="No expenses logged yet." /> : (
            <Donut slices={d.expCats.map((e) => ({ name: e.category, value: e.amount }))} format={rs} />
          )}
        </Panel>
        <Panel title="Payment Methods" icon={CreditCard} iconColor="#8b5cf6">
          {d.pay.filter((p) => p.amount > 0).length === 0 ? <Empty text="No payments recorded yet." /> : (
            <Donut slices={d.pay.map((p) => ({ name: p.method, value: p.amount }))} format={rs} />
          )}
        </Panel>

        {/* Fleet columns */}
        <FleetColumn title="Available Vehicles" color="#10b981" vehicles={scopedAvailable} onViewAll={() => router.push('/vehicles')} />
        <FleetColumn title="Vehicles On Rent" color="#3b82f6" vehicles={scopedOnRent} bookings={d.activeBookings} onViewAll={() => router.push('/bookings')} />
        <FleetColumn title="Under Repair" color="#ef4444" vehicles={scopedUnderRepair} onViewAll={() => router.push('/vehicles')} />

        {/* Stats bar */}
        <View className="bg-white rounded-2xl border border-slate-100 mb-3 flex-row flex-wrap">
          {[
            ...(!isOwnerRole ? [{ icon: UserCircle, label: 'Owners', value: owners.length }] : []),
            { icon: Car, label: 'Vehicles', value: scoped.vehicles.length },
            { icon: CheckSquare, label: 'Completed', value: completedRentals },
            { icon: Users, label: 'Customers', value: uniqueCustomers },
            { icon: MessageSquare, label: 'Inquiries', value: inquiries.length },
          ].map((s) => (
            <View key={s.label} className="w-1/2 flex-row items-center gap-2 p-4 border-b border-slate-50">
              <s.icon size={17} color="#94a3b8" />
              <View>
                <Text className="text-slate-900 font-black text-lg">{s.value}</Text>
                <Text className="text-slate-400 text-[11px]">{s.label}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Customer Insights */}
        <Text className="text-sm font-bold text-slate-700 mb-2 mt-2">Customer Insights</Text>
        <View className="flex-row gap-3 mb-3">
          <StatTile icon={Banknote} color="#1B2B6B" label="Avg Rental" value={rs(d.avgs.avgValue)} sub={`${d.avgs.avgDuration.toFixed(1)} days`} />
          <StatTile icon={Repeat} color="#8b5cf6" label="Repeat" value={pct(d.custStats.repeatRate)} sub={`${d.custStats.repeat}/${d.custStats.total}`} />
        </View>
        {!isOwnerRole && (
          <Panel title="Inquiry Conversion" icon={Target} iconColor="#10b981">
            {d.funnel.total === 0 ? <Empty text="No inquiries captured yet." /> : (
              <>
                <View className="flex-row items-end gap-2 mb-3">
                  <Text className="text-3xl font-black text-emerald-600">{pct(d.funnel.conversionRate)}</Text>
                  <Text className="text-xs text-slate-400 mb-1">conversion rate</Text>
                </View>
                <View className="flex-row gap-2">
                  <FunnelStat label="Pending" value={d.funnel.pending} tone="amber" />
                  <FunnelStat label="Converted" value={d.funnel.converted} tone="emerald" />
                  <FunnelStat label="Lost" value={d.funnel.lost} tone="red" />
                </View>
              </>
            )}
          </Panel>
        )}
        <Panel title="Top Customers" icon={Users} iconColor="#64748b">
          {d.custStats.top.length === 0 ? <Empty text="No customers yet." /> : d.custStats.top.map((c, i) => (
            <View key={c.phone} className="flex-row items-center gap-3 bg-slate-50 rounded-xl px-3 py-2 mb-2">
              <View className="w-6 h-6 rounded-lg bg-navy-800 items-center justify-center">
                <Text className="text-white text-xs font-bold">{i + 1}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-slate-800" numberOfLines={1}>{c.name}</Text>
                <Text className="text-[11px] text-slate-400">{c.bookings} booking{c.bookings !== 1 ? 's' : ''}</Text>
              </View>
              <Text className="text-sm font-bold text-emerald-600">{rs(c.spend)}</Text>
            </View>
          ))}
        </Panel>
      </ScrollView>

      {/* Outstanding modal */}
      <InfoModal visible={infoModal === 'outstanding'} title="Outstanding Balances" onClose={() => setInfoModal(null)}>
        {d.outstandingRows.length === 0 ? (
          <Empty text="No outstanding balances." />
        ) : (
          d.outstandingRows.map((b) => (
            <View key={b.id} className="flex-row items-center gap-3 bg-slate-50 rounded-xl px-3 py-2.5 mb-2">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-slate-800" numberOfLines={1}>{b.customerName}</Text>
                <Text className="text-[11px] text-slate-400" numberOfLines={1}>{vLabel(b.vehicleId)}</Text>
                <Text className="text-[11px] text-slate-400">Total {rs(b.totalAmount)} · Paid {rs(b.paidAmount)}</Text>
              </View>
              <View className="items-end">
                <Text className="text-sm font-bold text-red-600">{rs(b.balance)}</Text>
                <StatusBadge status={b.status} />
              </View>
            </View>
          ))
        )}
      </InfoModal>

      {/* Profit modal */}
      <InfoModal visible={infoModal === 'profit'} title="This Month's Profit" onClose={() => setInfoModal(null)}>
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-emerald-50 rounded-xl p-3 items-center">
            <Text className="text-[11px] text-emerald-500 font-medium">Revenue</Text>
            <Text className="text-lg font-black text-emerald-700">{rs(d.thisMonthRevenue)}</Text>
          </View>
          <View className="flex-1 bg-red-50 rounded-xl p-3 items-center">
            <Text className="text-[11px] text-red-400 font-medium">Expenses</Text>
            <Text className="text-lg font-black text-red-600">{rs(d.thisMonthExpenses)}</Text>
          </View>
        </View>
        <View className="flex-row items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
          <Text className="text-sm font-semibold text-slate-700">Net Profit</Text>
          <Text className={`text-base font-black ${d.monthlyProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{rs(d.monthlyProfit)}</Text>
        </View>
      </InfoModal>
    </SafeAreaView>
  );
}

function UpcomingRow({ tag, tone, name, sub, date }: { tag: string; tone: 'emerald' | 'blue'; name: string; sub: string; date: string }) {
  const cls = tone === 'emerald' ? 'bg-emerald-100' : 'bg-blue-100';
  const txt = tone === 'emerald' ? 'text-emerald-700' : 'text-blue-700';
  return (
    <View className="flex-row items-center justify-between bg-slate-50 rounded-xl px-3 py-2 mb-2">
      <View className="flex-1">
        <Text className="text-sm font-semibold text-slate-800" numberOfLines={1}>{name}</Text>
        <Text className="text-[11px] text-slate-400" numberOfLines={1}>{sub}</Text>
      </View>
      <View className="items-end">
        <View className={`px-1.5 py-0.5 rounded ${cls}`}>
          <Text className={`text-[10px] font-bold ${txt}`}>{tag}</Text>
        </View>
        <Text className="text-[11px] text-slate-500 mt-0.5">{date}</Text>
      </View>
    </View>
  );
}

function FleetPill({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <View className="flex-1 rounded-2xl py-4 items-center" style={{ backgroundColor: color + '18' }}>
      <View className="flex-row items-center gap-1.5 mb-1">
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
        <Text className="text-[11px] font-semibold text-slate-500">{label}</Text>
      </View>
      <Text className="text-2xl font-black" style={{ color: '#1B2B6B' }}>{count}</Text>
    </View>
  );
}

function FleetColumn({ title, color, vehicles, bookings = [], onViewAll }: { title: string; color: string; vehicles: Vehicle[]; bookings?: { vehicleId: string; customerName: string; startDate: string }[]; onViewAll: () => void }) {
  return (
    <View className="bg-white rounded-2xl p-4 border border-slate-100 mb-3">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-xs font-bold uppercase tracking-widest" style={{ color }}>{title}</Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text className="text-xs text-slate-400">View All</Text>
        </TouchableOpacity>
      </View>
      {vehicles.length === 0 ? (
        <Text className="text-slate-400 text-xs text-center py-4">None at the moment.</Text>
      ) : (
        vehicles.slice(0, 4).map((v) => {
          const b = bookings.find((x) => x.vehicleId === v.id);
          return (
            <View key={v.id} className="flex-row items-center gap-3 bg-slate-50 rounded-xl p-3 mb-2">
              <View className="w-12 h-8 rounded-lg bg-white border border-slate-100 items-center justify-center">
                <Car size={14} color="#94a3b8" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-slate-800" numberOfLines={1}>{v.brand} {v.model}</Text>
                <Text className="text-xs text-slate-400" numberOfLines={1}>{b ? `${b.customerName} · ${b.startDate}` : v.vehicleNumber}</Text>
              </View>
              <StatusBadge status={v.status} />
            </View>
          );
        })
      )}
    </View>
  );
}

function FunnelStat({ label, value, tone }: { label: string; value: number; tone: 'amber' | 'emerald' | 'red' }) {
  const bg = { amber: 'bg-amber-50', emerald: 'bg-emerald-50', red: 'bg-red-50' }[tone];
  const txt = { amber: 'text-amber-700', emerald: 'text-emerald-700', red: 'text-red-600' }[tone];
  return (
    <View className={`flex-1 rounded-xl py-2.5 items-center ${bg}`}>
      <Text className={`text-lg font-black ${txt}`}>{value}</Text>
      <Text className={`text-[10px] mt-1 ${txt}`}>{label}</Text>
    </View>
  );
}

function InfoModal({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-row items-center justify-between px-5 py-3 border-b border-slate-100">
          <Text className="text-lg font-bold text-slate-900">{title}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <X size={22} color="#64748b" />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerClassName="p-5 pb-16">{children}</ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

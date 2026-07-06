import { Plus, Trash2, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PageScreen } from '@/src/components/PageScreen';
import { NumberField, TextField } from '@/src/components/ui/FormField';
import { DateField } from '@/src/components/ui/DateField';
import { Select } from '@/src/components/ui/Select';
import { Donut } from '@/src/features/dashboard/charts';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useStore } from '@/src/store/useStore';
import { Expense, ExpenseCategory } from '@/src/types';

const CATEGORIES: ExpenseCategory[] = ['Service', 'Repair', 'Fine', 'Damage', 'Tire', 'Insurance', 'Fuel', 'Other'];
const CAT_COLORS: Record<ExpenseCategory, string> = {
  Service: '#4B7BE5', Repair: '#EF4444', Fine: '#F59E0B', Damage: '#EC4899',
  Tire: '#8B5CF6', Insurance: '#10B981', Fuel: '#06B6D4', Other: '#6B7280',
};

type ExpenseForm = Omit<Expense, 'id' | 'createdAt'>;
const empty = (): ExpenseForm => ({ vehicleId: '', category: 'Service', amount: 0, description: '', date: new Date().toISOString().slice(0, 10) });

export default function ExpensesScreen() {
  const expenses = useStore((s) => s.expenses);
  const vehicles = useStore((s) => s.vehicles);
  const addExpense = useStore((s) => s.addExpense);
  const deleteExpense = useStore((s) => s.deleteExpense);
  const currentUser = useAuthStore((s) => s.currentUser);
  const isAdmin = useAuthStore((s) => s.isAdmin);

  const [filter, setFilter] = useState<ExpenseCategory | 'All'>('All');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [open, setOpen] = useState(false);

  const isOwner = !isAdmin() && currentUser?.role === 'owner';
  const myIds = useMemo(
    () => (isOwner ? new Set(vehicles.filter((v) => v.ownerId === currentUser?.ownerId).map((v) => v.id)) : null),
    [isOwner, vehicles, currentUser],
  );
  const scopedExpenses = myIds ? expenses.filter((e) => myIds.has(e.vehicleId)) : expenses;
  const scopedVehicles = myIds ? vehicles.filter((v) => myIds.has(v.id)) : vehicles;

  const filtered = scopedExpenses.filter((e) => {
    if (filter !== 'All' && e.category !== filter) return false;
    if (vehicleFilter && e.vehicleId !== vehicleFilter) return false;
    return true;
  });
  const sorted = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const total = scopedExpenses.reduce((s, e) => s + e.amount, 0);
  const catMap: Partial<Record<ExpenseCategory, number>> = {};
  scopedExpenses.forEach((e) => { catMap[e.category] = (catMap[e.category] ?? 0) + e.amount; });

  const confirmDelete = (e: Expense) =>
    Alert.alert('Delete expense', `Remove "${e.description}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteExpense(e.id) },
    ]);

  return (
    <PageScreen
      title="Expenses"
      right={
        <TouchableOpacity onPress={() => setOpen(true)} className="flex-row items-center gap-1 bg-navy-800 rounded-xl px-3 py-2">
          <Plus size={15} color="#fff" />
          <Text className="text-white font-semibold text-xs">Add</Text>
        </TouchableOpacity>
      }
    >
      <ScrollView contentContainerClassName="p-4 pb-28">
        {/* Total + donut */}
        <View className="bg-white rounded-2xl border border-slate-100 shadow-[0px_6px_16px_rgba(2,6,23,0.08)] p-4 mb-3">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-bold text-slate-800">Expense by Category</Text>
            <Text className="text-sm font-bold text-slate-900">Rs {total.toLocaleString()}</Text>
          </View>
          {total > 0 ? (
            <Donut slices={CATEGORIES.map((c) => ({ name: c, value: catMap[c] ?? 0 }))} format={(n) => `Rs ${Math.round(n).toLocaleString()}`} />
          ) : (
            <Text className="text-slate-400 text-xs text-center py-4">No expenses logged yet.</Text>
          )}
        </View>

        {/* Category filter chips */}
        <View className="flex-row flex-wrap gap-2 mb-3">
          <Chip label="All" active={filter === 'All'} onPress={() => setFilter('All')} />
          {CATEGORIES.map((c) => (
            <Chip key={c} label={`${c} · Rs ${(catMap[c] ?? 0).toLocaleString()}`} color={CAT_COLORS[c]} active={filter === c} onPress={() => setFilter(filter === c ? 'All' : c)} />
          ))}
        </View>

        {/* Vehicle filter */}
        <Select label="Filter by vehicle" value={vehicleFilter} onChange={setVehicleFilter} placeholder="All Vehicles"
          options={[{ value: '', label: 'All Vehicles' }, ...scopedVehicles.map((v) => ({ value: v.id, label: `${v.brand} ${v.model} · ${v.vehicleNumber}` }))]} />

        {/* List */}
        {sorted.length === 0 ? (
          <Text className="text-slate-400 text-sm text-center py-12">No expenses found.</Text>
        ) : (
          sorted.map((e) => {
            const v = vehicles.find((x) => x.id === e.vehicleId);
            return (
              <View key={e.id} className="bg-white rounded-2xl border border-slate-100 shadow-[0px_6px_16px_rgba(2,6,23,0.08)] p-3.5 mb-2.5 flex-row items-center gap-3">
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: CAT_COLORS[e.category] }} />
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-slate-800" numberOfLines={1}>{e.description}</Text>
                  <Text className="text-[11px] text-slate-400" numberOfLines={1}>
                    {e.category} · {v ? `${v.brand} ${v.model}` : '—'} · {e.date}
                  </Text>
                </View>
                <Text className="text-sm font-bold text-slate-900">Rs {e.amount.toLocaleString()}</Text>
                <TouchableOpacity onPress={() => confirmDelete(e)} hitSlop={8} className="w-8 h-8 rounded-lg bg-red-50 items-center justify-center">
                  <Trash2 size={14} color="#dc2626" />
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      <AddExpenseModal
        visible={open}
        vehicles={scopedVehicles}
        onClose={() => setOpen(false)}
        onSubmit={(form) => { addExpense(form); setOpen(false); }}
      />
    </PageScreen>
  );
}

function Chip({ label, active, onPress, color }: { label: string; active: boolean; onPress: () => void; color?: string }) {
  return (
    <TouchableOpacity onPress={onPress} className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl ${active ? 'bg-navy-800' : 'bg-white border border-slate-200'}`}>
      {color && <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />}
      <Text className={`text-xs font-medium ${active ? 'text-white' : 'text-slate-600'}`}>{label}</Text>
    </TouchableOpacity>
  );
}

function AddExpenseModal({
  visible, vehicles, onClose, onSubmit,
}: {
  visible: boolean;
  vehicles: { id: string; brand: string; model: string; vehicleNumber: string }[];
  onClose: () => void;
  onSubmit: (form: ExpenseForm) => void;
}) {
  const [form, setForm] = useState<ExpenseForm>(empty());
  const set = <K extends keyof ExpenseForm>(k: K, v: ExpenseForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const canSave = form.vehicleId && form.description.trim() && form.amount > 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose} onShow={() => setForm(empty())}>
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-row items-center justify-between px-5 py-3 border-b border-slate-100">
          <Text className="text-lg font-bold text-slate-900">Add Expense</Text>
          <TouchableOpacity onPress={onClose} hitSlop={10}><X size={22} color="#64748b" /></TouchableOpacity>
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
          <ScrollView contentContainerClassName="p-5 pb-24" keyboardShouldPersistTaps="handled">
            <Select label="Vehicle *" value={form.vehicleId} onChange={(v) => set('vehicleId', v)} placeholder="Select vehicle"
              options={vehicles.map((v) => ({ value: v.id, label: `${v.brand} ${v.model} · ${v.vehicleNumber}` }))} />
            <Select label="Category" value={form.category} onChange={(v) => set('category', v as ExpenseCategory)} options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
            <NumberField label="Amount (Rs) *" value={form.amount} onChangeNumber={(n) => set('amount', n)} />
            <DateField label="Date" value={form.date} onChange={(v) => set('date', v)} />
            <TextField label="Description *" value={form.description} onChangeText={(v) => set('description', v)} placeholder="Brief description" />
          </ScrollView>
        </KeyboardAvoidingView>
        <View className="flex-row gap-3 px-5 py-3 border-t border-slate-100">
          <TouchableOpacity onPress={onClose} className="flex-1 items-center justify-center rounded-xl py-3 bg-slate-100">
            <Text className="text-slate-700 font-semibold">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => canSave && onSubmit(form)} disabled={!canSave} className={`flex-1 items-center justify-center rounded-xl py-3 bg-navy-800 ${canSave ? '' : 'opacity-50'}`}>
            <Text className="text-white font-semibold">Save Expense</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

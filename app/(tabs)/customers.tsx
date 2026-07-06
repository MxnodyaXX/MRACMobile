import {
  AlertTriangle, Car, ChevronDown, CreditCard, Edit2, Mail, MapPin, Phone, Plus, Search, Trash2, User, X,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PageScreen } from '@/src/components/PageScreen';
import { StatusBadge } from '@/src/components/StatusBadge';
import { TextField } from '@/src/components/ui/FormField';
import { customerCredit } from '@/src/lib/credit';
import { useStore } from '@/src/store/useStore';
import { Customer } from '@/src/types';

const AVATAR = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#F43F5E', '#06B6D4', '#6366F1', '#14B8A6'];
const avatarColor = (name: string) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR[Math.abs(h) % AVATAR.length];
};
const initials = (name: string) => name.trim().split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 2);

type CustForm = Omit<Customer, 'id' | 'createdAt'>;
const empty = (): CustForm => ({ name: '', phone: '', email: '', nic: '', address: '', notes: '', smsOptIn: true });

export default function CustomersScreen() {
  const customers = useStore((s) => s.customers);
  const bookings = useStore((s) => s.bookings);
  const vehicles = useStore((s) => s.vehicles);
  const addCustomer = useStore((s) => s.addCustomer);
  const updateCustomer = useStore((s) => s.updateCustomer);
  const deleteCustomer = useStore((s) => s.deleteCustomer);

  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [mode, setMode] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Customer | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...customers]
      .filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.email ?? '').toLowerCase().includes(q) || (c.nic ?? '').toLowerCase().includes(q))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [customers, search]);

  const history = (c: Customer) => bookings.filter((b) => b.customerPhone === c.phone).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const spend = (c: Customer) => history(c).reduce((s, b) => s + b.paidAmount, 0);

  const totalRevenue = customers.reduce((s, c) => s + spend(c), 0);
  const activeCount = customers.filter((c) => bookings.some((b) => b.customerPhone === c.phone && (b.status === 'Confirmed' || b.status === 'Ongoing'))).length;

  const confirmDelete = (c: Customer) =>
    Alert.alert('Delete customer', `Delete ${c.name}? Their booking history stays intact.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteCustomer(c.id) },
    ]);

  const submit = (form: CustForm) => {
    const dup = customers.find((c) => c.phone === form.phone.trim() && c.id !== editing?.id);
    if (dup) { Alert.alert('Duplicate', 'A customer with this phone number already exists.'); return; }
    const clean = { ...form, name: form.name.trim(), phone: form.phone.trim() };
    if (mode === 'edit' && editing) updateCustomer(editing.id, clean);
    else addCustomer(clean);
    setMode(null);
    setEditing(null);
  };

  return (
    <PageScreen
      title="Customers"
      right={
        <TouchableOpacity onPress={() => { setEditing(null); setMode('add'); }} className="flex-row items-center gap-1 bg-navy-800 rounded-xl px-3 py-2">
          <Plus size={15} color="#fff" />
          <Text className="text-white font-semibold text-xs">Add</Text>
        </TouchableOpacity>
      }
    >
      <ScrollView contentContainerClassName="p-4 pb-28" keyboardShouldPersistTaps="handled">
        {/* Stats */}
        <View className="flex-row gap-3 mb-4">
          <Stat value={customers.length} label="Customers" />
          <Stat value={activeCount} label="Active" color="#059669" />
          <Stat value={`Rs ${totalRevenue.toLocaleString()}`} label="Revenue" small />
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-3 mb-4">
          <Search size={15} color="#94a3b8" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search name, phone, email or NIC…"
            placeholderTextColor="#94a3b8"
            className="flex-1 py-2.5 px-2 text-sm text-slate-900"
          />
        </View>

        {filtered.length === 0 ? (
          <Text className="text-slate-400 text-sm text-center py-16">
            {search ? 'No customers match your search.' : 'No customers yet.'}
          </Text>
        ) : (
          filtered.map((c) => {
            const hist = history(c);
            const credit = customerCredit(c, bookings);
            const expanded = expandedId === c.id;
            const active = hist.some((b) => b.status === 'Confirmed' || b.status === 'Ongoing');
            return (
              <View key={c.id} className="bg-white rounded-2xl border border-slate-100 shadow-[0px_6px_16px_rgba(2,6,23,0.08)] p-4 mb-3">
                <View className="flex-row items-start gap-3">
                  <View style={{ backgroundColor: avatarColor(c.name) }} className="w-11 h-11 rounded-xl items-center justify-center">
                    <Text className="text-white font-bold text-sm">{initials(c.name)}</Text>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-sm font-bold text-slate-900" numberOfLines={1}>{c.name}</Text>
                      {active && (
                        <View className="bg-emerald-100 rounded-full px-2 py-0.5">
                          <Text className="text-[10px] font-semibold text-emerald-700">Active</Text>
                        </View>
                      )}
                    </View>
                    <View className="mt-1 gap-0.5">
                      <IconLine icon={Phone} text={c.phone} />
                      {c.email ? <IconLine icon={Mail} text={c.email} /> : null}
                      {c.nic ? <IconLine icon={CreditCard} text={c.nic} /> : null}
                      {c.address ? <IconLine icon={MapPin} text={c.address} /> : null}
                    </View>
                  </View>
                  <View className="flex-row gap-1">
                    <TouchableOpacity onPress={() => { setEditing(c); setMode('edit'); }} hitSlop={6} className="w-8 h-8 rounded-lg bg-slate-50 items-center justify-center">
                      <Edit2 size={14} color="#475569" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => confirmDelete(c)} hitSlop={6} className="w-8 h-8 rounded-lg bg-red-50 items-center justify-center">
                      <Trash2 size={14} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="flex-row items-center justify-between mt-3">
                  <Text className="text-xs text-slate-400">{hist.length} booking{hist.length !== 1 ? 's' : ''} · Rs {spend(c).toLocaleString()} paid</Text>
                  {credit.outstanding > 0 && (
                    <View className="flex-row items-center gap-1 bg-red-50 rounded-lg px-2 py-1">
                      <CreditCard size={11} color="#b91c1c" />
                      <Text className="text-[11px] font-semibold text-red-700">Credit Rs {credit.outstanding.toLocaleString()}</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity onPress={() => setExpandedId(expanded ? null : c.id)} className="flex-row items-center gap-2 mt-3 pt-3 border-t border-slate-50">
                  <Text className="text-xs font-semibold text-slate-500 flex-1">Rental History {hist.length > 0 ? `(${hist.length})` : ''}</Text>
                  <ChevronDown size={14} color="#94a3b8" style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }} />
                </TouchableOpacity>

                {expanded && (
                  <View className="mt-2">
                    {hist.length === 0 ? (
                      <Text className="text-center py-4 text-xs text-slate-400">No rental history.</Text>
                    ) : (
                      hist.map((b) => {
                        const v = vehicles.find((x) => x.id === b.vehicleId);
                        const bal = b.totalAmount - (b.discount ?? 0) - b.paidAmount;
                        return (
                          <View key={b.id} className="flex-row items-center gap-2.5 bg-slate-50 rounded-xl px-3 py-2.5 mb-2">
                            <View className="w-8 h-8 rounded-lg bg-white items-center justify-center">
                              <Car size={14} color="#64748b" />
                            </View>
                            <View className="flex-1">
                              <Text className="text-xs font-semibold text-slate-800" numberOfLines={1}>{v ? `${v.brand} ${v.model}` : 'Vehicle'}</Text>
                              <Text className="text-[10px] text-slate-400">{b.startDate} → {b.endDate} · {b.totalDays}d</Text>
                            </View>
                            <View className="items-end">
                              <Text className="text-xs font-bold text-slate-800">Rs {b.totalAmount.toLocaleString()}</Text>
                              <Text className={`text-[10px] ${bal > 0 ? 'text-red-500' : 'text-emerald-600'}`}>{bal > 0 ? `Bal ${bal.toLocaleString()}` : 'Settled'}</Text>
                            </View>
                            <StatusBadge status={b.status} />
                          </View>
                        );
                      })
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <CustomerFormModal
        visible={mode !== null}
        mode={mode === 'edit' ? 'edit' : 'add'}
        initial={editing}
        onClose={() => { setMode(null); setEditing(null); }}
        onSubmit={submit}
      />
    </PageScreen>
  );
}

function Stat({ value, label, color, small }: { value: string | number; label: string; color?: string; small?: boolean }) {
  return (
    <View className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-[0px_6px_16px_rgba(2,6,23,0.08)] py-4 items-center">
      <Text className={`font-black ${small ? 'text-sm' : 'text-2xl'}`} style={{ color: color ?? '#0f172a' }} numberOfLines={1}>{value}</Text>
      <Text className="text-[11px] text-slate-400 mt-0.5">{label}</Text>
    </View>
  );
}

function IconLine({ icon: Icon, text }: { icon: typeof Phone; text: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <Icon size={10} color="#94a3b8" />
      <Text className="text-xs text-slate-400" numberOfLines={1}>{text}</Text>
    </View>
  );
}

function CustomerFormModal({
  visible, mode, initial, onClose, onSubmit,
}: {
  visible: boolean;
  mode: 'add' | 'edit';
  initial: Customer | null;
  onClose: () => void;
  onSubmit: (form: CustForm) => void;
}) {
  const [form, setForm] = useState<CustForm>(empty());
  const set = <K extends keyof CustForm>(k: K, v: CustForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const canSave = form.name.trim() && form.phone.trim();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose} onShow={() => setForm(initial ? {
      name: initial.name, phone: initial.phone, email: initial.email ?? '', nic: initial.nic ?? '', address: initial.address ?? '', notes: initial.notes ?? '', smsOptIn: initial.smsOptIn ?? true,
    } : empty())}>
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-row items-center justify-between px-5 py-3 border-b border-slate-100">
          <Text className="text-lg font-bold text-slate-900">{mode === 'add' ? 'Add Customer' : 'Edit Customer'}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={10}><X size={22} color="#64748b" /></TouchableOpacity>
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
          <ScrollView contentContainerClassName="p-5 pb-24" keyboardShouldPersistTaps="handled">
            <TextField label="Full Name *" value={form.name} onChangeText={(v) => set('name', v)} placeholder="Amila Jayasinghe" />
            <TextField label="Phone *" value={form.phone} onChangeText={(v) => set('phone', v)} placeholder="07X XXXXXXX" keyboardType="phone-pad" />
            <TextField label="Email" value={form.email ?? ''} onChangeText={(v) => set('email', v)} placeholder="customer@email.com" keyboardType="email-address" autoCapitalize="none" />
            <TextField label="NIC" value={form.nic ?? ''} onChangeText={(v) => set('nic', v)} placeholder="901234567V" autoCapitalize="characters" />
            <TextField label="Address" value={form.address ?? ''} onChangeText={(v) => set('address', v)} />
            <TextField label="Notes" value={form.notes ?? ''} onChangeText={(v) => set('notes', v)} multiline />
            <TouchableOpacity onPress={() => set('smsOptIn', !(form.smsOptIn ?? true))} className="flex-row items-center justify-between bg-slate-50 rounded-xl px-3.5 py-3 mt-1">
              <View>
                <Text className="text-sm font-medium text-slate-700">Receive SMS notifications</Text>
                <Text className="text-xs text-slate-400">Booking, payment and reminder texts</Text>
              </View>
              <View style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: form.smsOptIn ?? true ? '#10b981' : '#cbd5e1', justifyContent: 'center' }}>
                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', marginLeft: form.smsOptIn ?? true ? 22 : 2 }} />
              </View>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
        <View className="flex-row gap-3 px-5 py-3 border-t border-slate-100">
          <TouchableOpacity onPress={onClose} className="flex-1 items-center justify-center rounded-xl py-3 bg-slate-100">
            <Text className="text-slate-700 font-semibold">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => canSave && onSubmit(form)} disabled={!canSave} className={`flex-1 items-center justify-center rounded-xl py-3 bg-navy-800 ${canSave ? '' : 'opacity-50'}`}>
            <Text className="text-white font-semibold">{mode === 'add' ? 'Save Customer' : 'Update'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

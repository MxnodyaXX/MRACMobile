import { AlertTriangle, Phone, Plus, UserCheck, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PageScreen } from '@/src/components/PageScreen';
import { StatusBadge } from '@/src/components/StatusBadge';
import { DateField } from '@/src/components/ui/DateField';
import { NumberField, TextField } from '@/src/components/ui/FormField';
import { Select } from '@/src/components/ui/Select';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useStore } from '@/src/store/useStore';
import { Driver } from '@/src/types';

const STATUSES: Driver['status'][] = ['Available', 'On Duty', 'Off'];

type DriverForm = Omit<Driver, 'id' | 'joinedAt' | 'totalEarnings'>;
const empty = (): DriverForm => ({
  name: '', phone: '', licenseNumber: '', licenseExpiry: '', status: 'Available', dailyRate: 1500, nic: '', address: '',
});

export default function DriversScreen() {
  const drivers = useStore((s) => s.drivers);
  const bookings = useStore((s) => s.bookings);
  const vehicles = useStore((s) => s.vehicles);
  const addDriver = useStore((s) => s.addDriver);
  const updateDriver = useStore((s) => s.updateDriver);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const readOnly = !isAdmin();

  const [mode, setMode] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Driver | null>(null);

  const openAdd = () => { setEditing(null); setMode('add'); };
  const openEdit = (d: Driver) => { setEditing(d); setMode('edit'); };

  return (
    <PageScreen
      title="Drivers"
      right={
        !readOnly ? (
          <TouchableOpacity onPress={openAdd} className="flex-row items-center gap-1 bg-navy-800 rounded-xl px-3 py-2">
            <Plus size={15} color="#fff" />
            <Text className="text-white font-semibold text-xs">Add</Text>
          </TouchableOpacity>
        ) : undefined
      }
    >
      <ScrollView contentContainerClassName="p-4 pb-10">
        {/* Summary */}
        <View className="flex-row gap-3 mb-4">
          {STATUSES.map((s) => (
            <View key={s} className="flex-1 bg-white rounded-2xl border border-slate-100 p-3 items-center">
              <UserCheck size={18} color={s === 'Available' ? '#059669' : s === 'On Duty' ? '#2563eb' : '#64748b'} />
              <Text className="text-xl font-black text-slate-900 mt-1">{drivers.filter((d) => d.status === s).length}</Text>
              <Text className="text-[11px] text-slate-400">{s}</Text>
            </View>
          ))}
        </View>

        {drivers.length === 0 && <Text className="text-slate-400 text-sm text-center py-16">No drivers added yet.</Text>}

        {drivers.map((d) => {
          const cb = bookings.find((b) => b.id === d.currentBookingId);
          const cv = cb ? vehicles.find((v) => v.id === cb.vehicleId) : null;
          const days = d.licenseExpiry ? Math.floor((new Date(d.licenseExpiry).getTime() - Date.now()) / 86400000) : 999;
          const warn = days < 60;
          return (
            <View key={d.id} className="bg-white rounded-2xl border border-slate-100 p-4 mb-3">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-3 flex-1">
                  <View className="w-11 h-11 rounded-xl bg-navy-800 items-center justify-center">
                    <Text className="text-white font-bold text-sm">{d.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-slate-900" numberOfLines={1}>{d.name}</Text>
                    <View className="flex-row items-center gap-1">
                      <Phone size={10} color="#94a3b8" />
                      <Text className="text-xs text-slate-400">{d.phone || '—'}</Text>
                    </View>
                  </View>
                </View>
                <StatusBadge status={d.status} />
              </View>

              <View className="flex-row flex-wrap mb-2">
                <Cell label="License #" value={d.licenseNumber || '—'} />
                <Cell label="Expiry" value={(d.licenseExpiry || '—') + (warn ? ' ⚠' : '')} danger={warn} />
                <Cell label="Daily Rate" value={`Rs ${d.dailyRate.toLocaleString()}`} />
                <Cell label="Total Earned" value={`Rs ${d.totalEarnings.toLocaleString()}`} />
              </View>

              {cb && cv && (
                <View className="bg-blue-50 rounded-xl px-3 py-2 mb-2">
                  <Text className="text-[11px] text-blue-500">Currently driving</Text>
                  <Text className="text-xs font-semibold text-blue-700">{cv.brand} {cv.model} · {cv.vehicleNumber}</Text>
                  <Text className="text-[11px] text-blue-400">for {cb.customerName}</Text>
                </View>
              )}

              {warn && (
                <View className="flex-row items-center gap-2 bg-red-50 rounded-xl px-3 py-2 mb-2">
                  <AlertTriangle size={13} color="#dc2626" />
                  <Text className="text-xs text-red-600">License expires in {days} days</Text>
                </View>
              )}

              {!readOnly && (
                <View className="flex-row gap-2 mt-1">
                  <View className="flex-1">
                    <Select label="" value={d.status} onChange={(v) => updateDriver(d.id, { status: v as Driver['status'] })} options={STATUSES.map((s) => ({ value: s, label: s }))} />
                  </View>
                  <TouchableOpacity onPress={() => openEdit(d)} className="bg-slate-100 rounded-xl px-4 items-center justify-center" style={{ height: 42 }}>
                    <Text className="text-slate-700 font-semibold text-sm">Edit</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {!readOnly && (
        <DriverFormModal
          visible={mode !== null}
          mode={mode === 'edit' ? 'edit' : 'add'}
          initial={editing}
          onClose={() => setMode(null)}
          onSubmit={(form) => {
            if (mode === 'edit' && editing) updateDriver(editing.id, form);
            else addDriver(form);
            setMode(null);
          }}
        />
      )}
    </PageScreen>
  );
}

function Cell({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <View className="w-1/2 mb-2">
      <Text className="text-xs text-slate-400">{label}</Text>
      <Text className={`text-xs font-medium ${danger ? 'text-red-600' : 'text-slate-700'}`} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function DriverFormModal({
  visible, mode, initial, onClose, onSubmit,
}: {
  visible: boolean;
  mode: 'add' | 'edit';
  initial: Driver | null;
  onClose: () => void;
  onSubmit: (form: DriverForm) => void;
}) {
  const [form, setForm] = useState<DriverForm>(empty());
  useEffect(() => {
    if (visible) setForm(initial ? { ...initial } : empty());
  }, [visible, initial]);
  const set = <K extends keyof DriverForm>(k: K, v: DriverForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const canSave = form.name.trim() && form.licenseNumber.trim();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-row items-center justify-between px-5 py-3 border-b border-slate-100">
          <Text className="text-lg font-bold text-slate-900">{mode === 'add' ? 'Add Driver' : 'Edit Driver'}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={10}><X size={22} color="#64748b" /></TouchableOpacity>
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
          <ScrollView contentContainerClassName="p-5 pb-24" keyboardShouldPersistTaps="handled">
            <TextField label="Full Name *" value={form.name} onChangeText={(v) => set('name', v)} />
            <TextField label="Phone" value={form.phone} onChangeText={(v) => set('phone', v)} keyboardType="phone-pad" />
            <TextField label="NIC" value={form.nic ?? ''} onChangeText={(v) => set('nic', v)} autoCapitalize="characters" />
            <TextField label="License Number *" value={form.licenseNumber} onChangeText={(v) => set('licenseNumber', v)} autoCapitalize="characters" />
            <DateField label="License Expiry" value={form.licenseExpiry} onChange={(v) => set('licenseExpiry', v)} />
            <NumberField label="Daily Rate (Rs)" value={form.dailyRate} onChangeNumber={(n) => set('dailyRate', n)} />
            <Select label="Status" value={form.status} onChange={(v) => set('status', v as Driver['status'])} options={STATUSES.map((s) => ({ value: s, label: s }))} />
            <TextField label="Address" value={form.address ?? ''} onChangeText={(v) => set('address', v)} />
          </ScrollView>
        </KeyboardAvoidingView>
        <View className="flex-row gap-3 px-5 py-3 border-t border-slate-100">
          <TouchableOpacity onPress={onClose} className="flex-1 items-center justify-center rounded-xl py-3 bg-slate-100">
            <Text className="text-slate-700 font-semibold">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => canSave && onSubmit(form)} disabled={!canSave} className={`flex-1 items-center justify-center rounded-xl py-3 bg-navy-800 ${canSave ? '' : 'opacity-50'}`}>
            <Text className="text-white font-semibold">{mode === 'add' ? 'Add Driver' : 'Save'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

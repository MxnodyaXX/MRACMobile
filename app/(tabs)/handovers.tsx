import { AlertTriangle, CheckCircle2, Clock, Fuel, Gauge, MapPin, RotateCcw, Truck, X } from 'lucide-react-native';
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
import { Booking, VehicleHandover } from '@/src/types';

const FUEL_LEVELS = ['Full', '3/4', '1/2', '1/4', 'Empty'];

type HForm = {
  bookingId: string; vehicleId: string; type: 'delivery' | 'return';
  location: string; dateTime: string; mileage: number; fuelLevel: string; notes: string;
  extraKm: number; extraKmCharge: number; finalAmount: number;
};
const empty = (type: 'delivery' | 'return', bookingId = '', vehicleId = ''): HForm => ({
  bookingId, vehicleId, type, location: '', dateTime: new Date().toISOString().slice(0, 10), mileage: 0, fuelLevel: 'Full', notes: '', extraKm: 0, extraKmCharge: 0, finalAmount: 0,
});

export default function HandoversScreen() {
  const bookings = useStore((s) => s.bookings);
  const vehicles = useStore((s) => s.vehicles);
  const handovers = useStore((s) => s.handovers);
  const addHandover = useStore((s) => s.addHandover);
  const updateBooking = useStore((s) => s.updateBooking);
  const currentUser = useAuthStore((s) => s.currentUser);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const can = useAuthStore((s) => s.can);

  const [tab, setTab] = useState<'active' | 'records'>('active');
  const [modal, setModal] = useState<'delivery' | 'return' | null>(null);
  const [form, setForm] = useState<HForm>(empty('delivery'));

  const myIds = !isAdmin() && currentUser?.role === 'owner' ? vehicles.filter((v) => v.ownerId === currentUser?.ownerId).map((v) => v.id) : null;
  const relevant = (myIds ? bookings.filter((b) => myIds.includes(b.vehicleId)) : bookings).filter((b) => b.status === 'Confirmed' || b.status === 'Ongoing');
  const getH = (id: string) => ({ delivery: handovers.find((h) => h.bookingId === id && h.type === 'delivery'), ret: handovers.find((h) => h.bookingId === id && h.type === 'return') });
  const records = [...handovers].filter((h) => !myIds || myIds.includes(h.vehicleId)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const canAct = isAdmin() || can('canBook');

  const openDelivery = (b: Booking) => { setForm(empty('delivery', b.id, b.vehicleId)); setModal('delivery'); };
  const openReturn = (b: Booking) => { const f = empty('return', b.id, b.vehicleId); f.finalAmount = b.totalAmount; setForm(f); setModal('return'); };

  const recalcReturn = (f: HForm): HForm => {
    const delivery = handovers.find((h) => h.bookingId === f.bookingId && h.type === 'delivery');
    const vehicle = vehicles.find((v) => v.id === f.vehicleId);
    const booking = bookings.find((b) => b.id === f.bookingId);
    if (!delivery || !vehicle || !booking) return f;
    const driven = Math.max(0, f.mileage - delivery.mileage);
    const included = (vehicle.includedKmPerDay ?? 100) * booking.totalDays;
    const extraKm = Math.max(0, driven - included);
    const extraKmCharge = extraKm * (vehicle.extraKmRate ?? 50);
    const finalAmount = vehicle.dailyRent * booking.totalDays + extraKmCharge;
    return { ...f, extraKm, extraKmCharge, finalAmount };
  };

  const submit = () => {
    if (!form.location || !form.dateTime || !form.mileage) return;
    addHandover({ ...form });
    updateBooking(form.bookingId, { status: form.type === 'delivery' ? 'Ongoing' : 'Completed' });
    setModal(null);
  };

  return (
    <PageScreen title="Vehicle Handovers">
      <View className="flex-row gap-2 px-4 pt-3 pb-1">
        {(['active', 'records'] as const).map((t) => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} className={`px-4 py-1.5 rounded-xl ${tab === t ? 'bg-navy-800' : 'bg-white border border-slate-200'}`}>
            <Text className={`text-xs font-medium ${tab === t ? 'text-white' : 'text-slate-500'}`}>{t === 'active' ? `Active (${relevant.length})` : 'Records'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerClassName="p-4 pb-28">
        {tab === 'active' ? (
          relevant.length === 0 ? (
            <Text className="text-slate-400 text-sm text-center py-16">No active bookings requiring handover.</Text>
          ) : (
            relevant.map((b) => {
              const v = vehicles.find((x) => x.id === b.vehicleId);
              const { delivery, ret } = getH(b.id);
              return (
                <View key={b.id} className="bg-white rounded-2xl border border-slate-100 p-4 mb-3">
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-1"><Text className="text-sm font-bold text-slate-900">{b.customerName}</Text><Text className="text-xs text-slate-400">{v ? `${v.brand} ${v.model} · ${v.vehicleNumber}` : ''}</Text></View>
                    <StatusBadge status={b.status} size="md" />
                  </View>

                  {/* Delivery */}
                  <View className={`rounded-xl p-3 border mb-2 ${delivery ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200'}`}>
                    <View className="flex-row items-center gap-2 mb-2">
                      <Truck size={15} color={delivery ? '#059669' : '#94a3b8'} />
                      <Text className={`text-xs font-semibold uppercase ${delivery ? 'text-emerald-700' : 'text-slate-500'}`}>Delivery</Text>
                      {delivery && <CheckCircle2 size={14} color="#10b981" style={{ marginLeft: 'auto' }} />}
                    </View>
                    {delivery ? (
                      <>
                        <Detail icon={MapPin} value={delivery.location} />
                        <Detail icon={Gauge} value={`${delivery.mileage.toLocaleString()} km`} />
                        <Detail icon={Fuel} value={delivery.fuelLevel} />
                      </>
                    ) : canAct ? (
                      <TouchableOpacity onPress={() => openDelivery(b)} className="flex-row items-center gap-2 self-start bg-navy-800 rounded-xl px-4 py-2"><Truck size={13} color="#fff" /><Text className="text-white text-xs font-semibold">Record Delivery</Text></TouchableOpacity>
                    ) : <Text className="text-xs text-slate-400">Not recorded yet</Text>}
                  </View>

                  {/* Return */}
                  <View className={`rounded-xl p-3 border ${ret ? 'border-blue-200 bg-blue-50/50' : delivery ? 'border-amber-300' : 'border-slate-100 opacity-50'}`}>
                    <View className="flex-row items-center gap-2 mb-2">
                      <RotateCcw size={15} color={ret ? '#2563eb' : delivery ? '#f59e0b' : '#cbd5e1'} />
                      <Text className={`text-xs font-semibold uppercase ${ret ? 'text-blue-700' : delivery ? 'text-amber-600' : 'text-slate-300'}`}>Return</Text>
                      {ret && <CheckCircle2 size={14} color="#3b82f6" style={{ marginLeft: 'auto' }} />}
                    </View>
                    {ret ? (
                      <>
                        <Detail icon={Gauge} value={`${ret.mileage.toLocaleString()} km`} />
                        {(ret.extraKm ?? 0) > 0 && <View className="flex-row items-center gap-1.5 bg-amber-50 rounded-lg px-2.5 py-1.5 my-1"><AlertTriangle size={12} color="#f59e0b" /><Text className="text-xs text-amber-700">+{ret.extraKm} km · Rs {ret.extraKmCharge?.toLocaleString()}</Text></View>}
                        {ret.finalAmount ? <View className="flex-row justify-between pt-1"><Text className="text-xs text-blue-600">Final</Text><Text className="text-xs font-bold text-blue-800">Rs {ret.finalAmount.toLocaleString()}</Text></View> : null}
                      </>
                    ) : delivery && canAct ? (
                      <TouchableOpacity onPress={() => openReturn(b)} className="flex-row items-center gap-2 self-start bg-amber-500 rounded-xl px-4 py-2"><RotateCcw size={13} color="#fff" /><Text className="text-white text-xs font-semibold">Record Return</Text></TouchableOpacity>
                    ) : <Text className="text-xs text-slate-400">{delivery ? 'Awaiting return' : 'Deliver first'}</Text>}
                  </View>
                </View>
              );
            })
          )
        ) : (
          records.length === 0 ? <Text className="text-slate-400 text-sm text-center py-16">No handover records yet.</Text> :
            records.map((h) => {
              const v = vehicles.find((x) => x.id === h.vehicleId);
              const b = bookings.find((x) => x.id === h.bookingId);
              return (
                <View key={h.id} className="bg-white rounded-2xl border border-slate-100 p-3.5 mb-2.5">
                  <View className="flex-row items-center justify-between mb-1">
                    <View className="flex-row items-center gap-2">
                      {h.type === 'delivery' ? <Truck size={14} color="#059669" /> : <RotateCcw size={14} color="#2563eb" />}
                      <Text className="text-sm font-semibold text-slate-800 capitalize">{h.type}</Text>
                    </View>
                    <Text className="text-xs text-slate-400">{h.dateTime.replace('T', ' ')}</Text>
                  </View>
                  <Text className="text-xs text-slate-500">{b?.customerName} · {v ? `${v.brand} ${v.model}` : ''}</Text>
                  <Text className="text-[11px] text-slate-400">{h.location} · {h.mileage.toLocaleString()} km · {h.fuelLevel}</Text>
                </View>
              );
            })
        )}
      </ScrollView>

      <HandoverFormModal
        visible={modal !== null}
        form={form}
        onChange={(field, value) => setForm((f) => (field === 'mileage' && f.type === 'return' ? recalcReturn({ ...f, mileage: value as number }) : { ...f, [field]: value }))}
        onClose={() => setModal(null)}
        onSubmit={submit}
      />
    </PageScreen>
  );
}

function Detail({ icon: Icon, value }: { icon: typeof MapPin; value: string }) {
  return (
    <View className="flex-row items-center gap-2 mb-1"><Icon size={12} color="#94a3b8" /><Text className="text-xs text-slate-600 flex-1" numberOfLines={1}>{value}</Text></View>
  );
}

function HandoverFormModal({ visible, form, onChange, onClose, onSubmit }: {
  visible: boolean;
  form: HForm;
  onChange: (field: keyof HForm, value: string | number) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const isReturn = form.type === 'return';
  const canSave = form.location && form.dateTime && form.mileage > 0;
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-row items-center justify-between px-5 py-3 border-b border-slate-100">
          <Text className="text-lg font-bold text-slate-900">{isReturn ? 'Record Return' : 'Record Delivery'}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={10}><X size={22} color="#64748b" /></TouchableOpacity>
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
          <ScrollView contentContainerClassName="p-5 pb-24" keyboardShouldPersistTaps="handled">
            <TextField label="Location *" value={form.location} onChangeText={(v) => onChange('location', v)} placeholder="Handover location" />
            <DateField label="Date & Time *" value={form.dateTime} onChange={(v) => onChange('dateTime', v)} />
            <NumberField label="Mileage (km) *" value={form.mileage} onChangeNumber={(n) => onChange('mileage', n)} />
            <Select label="Fuel Level" value={form.fuelLevel} onChange={(v) => onChange('fuelLevel', v)} options={FUEL_LEVELS.map((f) => ({ value: f, label: f }))} />
            {isReturn && (form.extraKm > 0 || form.finalAmount > 0) && (
              <View className="bg-slate-50 rounded-xl p-3 mb-3">
                {form.extraKm > 0 && <View className="flex-row justify-between mb-1"><Text className="text-xs text-amber-700">Extra {form.extraKm} km</Text><Text className="text-xs font-semibold text-amber-700">Rs {form.extraKmCharge.toLocaleString()}</Text></View>}
                <View className="flex-row justify-between"><Text className="text-sm font-semibold text-slate-700">Final Amount</Text><Text className="text-sm font-black text-slate-900">Rs {form.finalAmount.toLocaleString()}</Text></View>
              </View>
            )}
            <TextField label="Notes" value={form.notes} onChangeText={(v) => onChange('notes', v)} multiline />
          </ScrollView>
        </KeyboardAvoidingView>
        <View className="flex-row gap-3 px-5 py-3 border-t border-slate-100">
          <TouchableOpacity onPress={onClose} className="flex-1 items-center justify-center rounded-xl py-3 bg-slate-100"><Text className="text-slate-700 font-semibold">Cancel</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => canSave && onSubmit()} disabled={!canSave} className={`flex-1 items-center justify-center rounded-xl py-3 bg-navy-800 ${canSave ? '' : 'opacity-50'}`}><Text className="text-white font-semibold">{isReturn ? 'Complete Return' : 'Save Delivery'}</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

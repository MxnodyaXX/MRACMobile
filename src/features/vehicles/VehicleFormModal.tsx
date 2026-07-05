import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NumberField, TextField } from '@/src/components/ui/FormField';
import { Select } from '@/src/components/ui/Select';
import { Owner, Vehicle, VehicleStatus } from '@/src/types';

const STATUS_OPTIONS: VehicleStatus[] = ['Available', 'Reserved', 'Ongoing', 'Maintenance'];
const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Electric', 'CNG'];
const TRANSMISSIONS = ['Manual', 'Automatic', 'CVT', 'Semi-Automatic'];

export type VehicleForm = Omit<Vehicle, 'id' | 'createdAt' | 'revenue' | 'rentCount'>;

const empty = (): VehicleForm => ({
  vehicleNumber: '',
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  ownerId: '',
  dailyRent: 0,
  extraKmRate: 50,
  includedKmPerDay: 100,
  status: 'Available',
  color: '',
  seats: 5,
  fuelType: 'Petrol',
  transmission: 'Manual',
  mileage: 0,
  insurance: { provider: '', policyNumber: '', expiryDate: '', premium: 0 },
});

export function VehicleFormModal({
  visible,
  mode,
  initial,
  owners,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  mode: 'add' | 'edit';
  initial: Vehicle | null;
  owners: Owner[];
  onClose: () => void;
  onSubmit: (form: VehicleForm) => void;
}) {
  const [form, setForm] = useState<VehicleForm>(empty());

  useEffect(() => {
    if (visible) setForm(initial ? { ...initial } : empty());
  }, [visible, initial]);

  const set = <K extends keyof VehicleForm>(k: K, v: VehicleForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const setIns = (k: keyof VehicleForm['insurance'], v: string | number) =>
    setForm((f) => ({ ...f, insurance: { ...f.insurance, [k]: v } }));

  const canSave = form.vehicleNumber.trim() && form.brand.trim() && form.model.trim();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-3 border-b border-slate-100">
          <Text className="text-lg font-bold text-slate-900">
            {mode === 'add' ? 'Add Vehicle' : 'Edit Vehicle'}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <X size={22} color="#64748b" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
          <ScrollView contentContainerClassName="p-5 pb-24" keyboardShouldPersistTaps="handled">
            <TextField label="Vehicle Number" value={form.vehicleNumber} onChangeText={(v) => set('vehicleNumber', v)} placeholder="CAB-1234" autoCapitalize="characters" />
            <TextField label="Brand" value={form.brand} onChangeText={(v) => set('brand', v)} placeholder="Toyota" />
            <TextField label="Model" value={form.model} onChangeText={(v) => set('model', v)} placeholder="Prius" />
            <NumberField label="Year" value={form.year} onChangeNumber={(n) => set('year', n)} placeholder="2020" />

            <Select
              label="Owner"
              value={form.ownerId}
              onChange={(v) => set('ownerId', v)}
              options={owners.map((o) => ({ value: o.id, label: o.name }))}
              placeholder="Select owner"
            />

            <NumberField label="Daily Rent (Rs)" value={form.dailyRent} onChangeNumber={(n) => set('dailyRent', n)} />
            <NumberField label="Included km / day" value={form.includedKmPerDay ?? 100} onChangeNumber={(n) => set('includedKmPerDay', n)} placeholder="100" />
            <NumberField label="Extra km rate (Rs/km)" value={form.extraKmRate ?? 50} onChangeNumber={(n) => set('extraKmRate', n)} placeholder="50" />

            <Select label="Status" value={form.status} onChange={(v) => set('status', v as VehicleStatus)} options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))} />
            <TextField label="Color" value={form.color ?? ''} onChangeText={(v) => set('color', v)} placeholder="Silver" />
            <Select label="Fuel Type" value={form.fuelType ?? ''} onChange={(v) => set('fuelType', v)} options={FUEL_TYPES.map((f) => ({ value: f, label: f }))} />
            <Select label="Transmission" value={form.transmission ?? ''} onChange={(v) => set('transmission', v)} options={TRANSMISSIONS.map((t) => ({ value: t, label: t }))} />
            <NumberField label="Seats" value={form.seats ?? 5} onChangeNumber={(n) => set('seats', n)} />
            <NumberField label="Mileage (km)" value={form.mileage ?? 0} onChangeNumber={(n) => set('mileage', n)} />

            {/* Insurance */}
            <Text className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-3 mb-2">Insurance Details</Text>
            <TextField label="Provider" value={form.insurance.provider} onChangeText={(v) => setIns('provider', v)} />
            <TextField label="Policy Number" value={form.insurance.policyNumber} onChangeText={(v) => setIns('policyNumber', v)} autoCapitalize="characters" />
            <TextField label="Expiry Date (YYYY-MM-DD)" value={form.insurance.expiryDate} onChangeText={(v) => setIns('expiryDate', v)} placeholder="2026-12-31" />
            <NumberField label="Premium (Rs)" value={form.insurance.premium} onChangeNumber={(n) => setIns('premium', n)} />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Footer actions */}
        <View className="flex-row gap-3 px-5 py-3 border-t border-slate-100">
          <TouchableOpacity onPress={onClose} className="flex-1 items-center justify-center rounded-xl py-3 bg-slate-100">
            <Text className="text-slate-700 font-semibold">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => canSave && onSubmit(form)}
            disabled={!canSave}
            className={`flex-1 items-center justify-center rounded-xl py-3 bg-navy-800 ${canSave ? '' : 'opacity-50'}`}
          >
            <Text className="text-white font-semibold">{mode === 'add' ? 'Add Vehicle' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

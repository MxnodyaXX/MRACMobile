import { AlertTriangle, CheckCircle, X, XCircle } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NumberField, TextField } from '@/src/components/ui/FormField';
import { Select } from '@/src/components/ui/Select';
import { DateField } from '@/src/components/ui/DateField';
import { rentalDays } from '@/src/lib/availability';
import { resolveReferralFee } from '@/src/lib/referral';
import { Booking, Customer, Driver, Owner, Vehicle } from '@/src/types';

// Marketing channels — these do NOT earn a referral fee.
const REFERRAL_SOURCES = ['WhatsApp', 'Facebook', 'Instagram', 'TikTok', 'Google', 'Word of Mouth'];

type BookingStatus = 'Confirmed' | 'Ongoing' | 'Completed' | 'Cancelled';

export type NewBooking = Omit<Booking, 'id' | 'createdAt'>;

type FormState = {
  vehicleId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerNIC: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  totalDays: number;
  totalAmount: number;
  paidAmount: number;
  status: BookingStatus;
  referral: string;
  referralFeeType: 'fixed' | 'percent';
  referralFeeValue: number;
  notes: string;
  pickupLocation: string;
  dropLocation: string;
  driverId: string;
  depositType?: 'cash' | 'vehicle' | 'other';
  depositAmount: number;
  depositAssetDescription: string;
};

const emptyForm = (): FormState => ({
  vehicleId: '',
  customerId: 'c_' + Math.random().toString(36).slice(2, 6),
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  customerNIC: '',
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
  totalDays: 0,
  totalAmount: 0,
  paidAmount: 0,
  status: 'Confirmed',
  referral: 'Direct',
  referralFeeType: 'fixed',
  referralFeeValue: 0,
  notes: '',
  pickupLocation: '',
  dropLocation: '',
  driverId: '',
  depositType: undefined,
  depositAmount: 0,
  depositAssetDescription: '',
});

export function BookingFormModal({
  visible,
  vehicles,
  customers,
  drivers,
  owners,
  isVehicleAvailable,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  vehicles: Vehicle[];
  customers: Customer[];
  drivers: Driver[];
  owners: Owner[];
  isVehicleAvailable: (
    vehicleId: string,
    startDate: string,
    endDate: string,
    excludeBookingId?: string,
    startTime?: string,
    endTime?: string,
  ) => boolean;
  onClose: () => void;
  onSubmit: (data: NewBooking) => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm());
  const [customerMode, setCustomerMode] = useState<'new' | 'existing'>('new');
  const [referralCustom, setReferralCustom] = useState(false);
  const [error, setError] = useState('');

  // Reset each time the modal opens.
  const reset = () => {
    setForm(emptyForm());
    setCustomerMode('new');
    setReferralCustom(false);
    setError('');
  };

  const set = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((f) => {
      const u = { ...f, [field]: value };
      const affects = ['startDate', 'endDate', 'vehicleId', 'startTime', 'endTime'].includes(field as string);
      if (affects && u.startDate && u.endDate && u.startDate <= u.endDate) {
        const days = rentalDays(u.startDate, u.endDate, u.startTime, u.endTime);
        const vehicle = vehicles.find((v) => v.id === u.vehicleId);
        u.totalDays = days;
        u.totalAmount = days * (vehicle?.dailyRent ?? 0);
      }
      return u;
    });
  };

  const isPersonReferral =
    !!form.referral && form.referral !== 'Direct' && !REFERRAL_SOURCES.includes(form.referral);

  const bookedVehicleOwner = owners.find(
    (o) => o.id === vehicles.find((v) => v.id === form.vehicleId)?.ownerId,
  );
  const selfReferral =
    isPersonReferral &&
    !!bookedVehicleOwner &&
    form.referral.trim().toLowerCase() === bookedVehicleOwner.name.trim().toLowerCase();

  const availability = useMemo(() => {
    if (!form.vehicleId || !form.startDate || !form.endDate) return null;
    return isVehicleAvailable(form.vehicleId, form.startDate, form.endDate, undefined, form.startTime, form.endTime);
  }, [form.vehicleId, form.startDate, form.endDate, form.startTime, form.endTime, isVehicleAvailable]);

  const feePreview = resolveReferralFee(form.referralFeeType, form.referralFeeValue, form.totalAmount);

  const submit = () => {
    setError('');
    if (!form.vehicleId || !form.customerName || !form.startDate || !form.endDate) {
      setError('Please fill in vehicle, customer name, and both dates.');
      return;
    }
    if (!isVehicleAvailable(form.vehicleId, form.startDate, form.endDate, undefined, form.startTime, form.endTime)) {
      setError('Vehicle is not available for the selected dates and times.');
      return;
    }
    if (selfReferral) {
      setError(`${bookedVehicleOwner!.name} owns this vehicle and can't be its own referrer. Set referral to Direct.`);
      return;
    }
    const data: NewBooking = {
      vehicleId: form.vehicleId,
      customerId: form.customerId,
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      customerEmail: form.customerEmail || undefined,
      customerNIC: form.customerNIC || undefined,
      startDate: form.startDate,
      endDate: form.endDate,
      startTime: form.startTime || undefined,
      endTime: form.endTime || undefined,
      totalDays: form.totalDays,
      totalAmount: form.totalAmount,
      paidAmount: form.paidAmount,
      status: form.status,
      referral: form.referral,
      referralFeeType: isPersonReferral ? form.referralFeeType : undefined,
      referralFeeValue: isPersonReferral ? form.referralFeeValue : undefined,
      notes: form.notes || undefined,
      pickupLocation: form.pickupLocation || undefined,
      dropLocation: form.dropLocation || undefined,
      driverId: form.driverId || undefined,
      depositType: form.depositType,
      depositAmount: form.depositType === 'cash' ? form.depositAmount : undefined,
      depositAssetDescription:
        form.depositType === 'vehicle' || form.depositType === 'other'
          ? form.depositAssetDescription
          : undefined,
    };
    onSubmit(data);
  };

  const referralOptions = [
    { value: 'Direct', label: 'Direct' },
    ...owners.map((o) => ({ value: o.name, label: `${o.name} (owner — earns fee)` })),
    ...REFERRAL_SOURCES.map((s) => ({ value: s, label: `${s} (marketing)` })),
    { value: '__custom__', label: 'Other / third party…' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      onShow={reset}
    >
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-row items-center justify-between px-5 py-3 border-b border-slate-100">
          <Text className="text-lg font-bold text-slate-900">New Booking</Text>
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <X size={22} color="#64748b" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
          <ScrollView contentContainerClassName="p-5 pb-24" keyboardShouldPersistTaps="handled">
            {error ? (
              <View className="flex-row items-center gap-2 bg-red-50 rounded-xl px-4 py-3 mb-4">
                <AlertTriangle size={15} color="#b91c1c" />
                <Text className="text-red-700 text-sm flex-1">{error}</Text>
              </View>
            ) : null}

            {/* Customer mode */}
            <View className="flex-row bg-slate-100 rounded-xl p-1 mb-4">
              {(['new', 'existing'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setCustomerMode(m)}
                  className={`flex-1 py-2 rounded-lg items-center ${customerMode === m ? 'bg-navy-800' : ''}`}
                >
                  <Text className={`text-xs font-semibold ${customerMode === m ? 'text-white' : 'text-slate-500'}`}>
                    {m === 'new' ? 'New Customer' : 'Existing Customer'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {customerMode === 'existing' ? (
              <Select
                label="Select Customer *"
                value={form.customerId.startsWith('c_') ? '' : form.customerId}
                onChange={(id) => {
                  const c = customers.find((x) => x.id === id);
                  if (!c) return;
                  setForm((f) => ({
                    ...f,
                    customerId: c.id,
                    customerName: c.name,
                    customerPhone: c.phone,
                    customerEmail: c.email ?? '',
                    customerNIC: c.nic ?? '',
                  }));
                }}
                options={customers.map((c) => ({ value: c.id, label: `${c.name} · ${c.phone}` }))}
                placeholder="Choose a customer"
              />
            ) : (
              <>
                <TextField label="Customer Name *" value={form.customerName} onChangeText={(v) => set('customerName', v)} placeholder="Full name" />
                <TextField label="Phone" value={form.customerPhone} onChangeText={(v) => set('customerPhone', v)} placeholder="07X XXXXXXX" keyboardType="phone-pad" />
                <TextField label="Email (for receipt)" value={form.customerEmail} onChangeText={(v) => set('customerEmail', v)} placeholder="customer@email.com" keyboardType="email-address" autoCapitalize="none" />
                <TextField label="NIC" value={form.customerNIC} onChangeText={(v) => set('customerNIC', v)} placeholder="NIC number" autoCapitalize="characters" />
              </>
            )}

            {/* Vehicle */}
            <Select
              label="Select Vehicle *"
              value={form.vehicleId}
              onChange={(v) => set('vehicleId', v)}
              options={vehicles.map((v) => ({
                value: v.id,
                label: `${v.brand} ${v.model} · ${v.vehicleNumber} · Rs ${v.dailyRent.toLocaleString()}/day`,
              }))}
              placeholder="Choose a vehicle"
            />

            {/* Dates & times */}
            <DateField label="Start Date *" value={form.startDate} onChange={(v) => set('startDate', v)} minimumDate={new Date()} />
            <DateField
              label="End Date *"
              value={form.endDate}
              onChange={(v) => set('endDate', v)}
              minimumDate={form.startDate ? new Date(`${form.startDate}T00:00:00`) : new Date()}
            />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <DateField label="Pickup Time" value={form.startTime} onChange={(v) => set('startTime', v)} mode="time" optional />
              </View>
              <View className="flex-1">
                <DateField label="Return Time" value={form.endTime} onChange={(v) => set('endTime', v)} mode="time" optional />
              </View>
            </View>

            {/* Availability banner */}
            {availability !== null && (
              <View
                className={`flex-row items-center gap-2 rounded-xl px-4 py-3 mb-3 ${
                  availability ? 'bg-emerald-50' : 'bg-red-50'
                }`}
              >
                {availability ? <CheckCircle size={16} color="#059669" /> : <XCircle size={16} color="#dc2626" />}
                <Text className={`text-sm flex-1 ${availability ? 'text-emerald-700' : 'text-red-700'}`}>
                  {availability
                    ? `Available · ${form.totalDays} day${form.totalDays !== 1 ? 's' : ''} · Rs ${form.totalAmount.toLocaleString()}`
                    : 'Selected dates/times are not available for this vehicle.'}
                </Text>
              </View>
            )}

            {/* Total summary */}
            {form.totalDays > 0 && (
              <View className="bg-navy-800 rounded-xl px-4 py-3 mb-3 flex-row items-center justify-between">
                <Text className="text-white/70 text-sm">
                  {form.totalDays} day{form.totalDays !== 1 ? 's' : ''} × Rs {(vehicles.find((v) => v.id === form.vehicleId)?.dailyRent ?? 0).toLocaleString()}
                </Text>
                <Text className="text-white text-lg font-black">Rs {form.totalAmount.toLocaleString()}</Text>
              </View>
            )}

            {/* Referral */}
            {referralCustom ? (
              <View>
                <TextField
                  label="Referral (third-party name)"
                  value={form.referral === 'Direct' ? '' : form.referral}
                  onChangeText={(v) => set('referral', v || 'Direct')}
                  placeholder="Name of the person who referred"
                />
                <TouchableOpacity onPress={() => { setReferralCustom(false); set('referral', 'Direct'); }} className="self-start mb-3">
                  <Text className="text-xs text-navy-800 font-semibold">Pick from list instead</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Select
                label="Referral (who sent this hire)"
                value={form.referral}
                onChange={(val) => {
                  if (val === '__custom__') {
                    setReferralCustom(true);
                    setForm((f) => ({ ...f, referral: '', referralFeeValue: 0 }));
                    return;
                  }
                  const isSource = REFERRAL_SOURCES.includes(val);
                  setForm((f) => ({
                    ...f,
                    referral: val || 'Direct',
                    ...(val === 'Direct' || isSource ? { referralFeeValue: 0 } : {}),
                  }));
                }}
                options={referralOptions}
                placeholder="Direct"
              />
            )}

            {selfReferral && (
              <View className="bg-red-50 rounded-xl px-4 py-3 mb-3">
                <Text className="text-sm font-bold text-red-700">{bookedVehicleOwner?.name} owns this vehicle</Text>
                <Text className="text-xs text-red-600 mt-0.5">
                  An owner can&apos;t refer their own vehicle. Set the referral to Direct to continue.
                </Text>
                <TouchableOpacity
                  onPress={() => { setReferralCustom(false); setForm((f) => ({ ...f, referral: 'Direct', referralFeeValue: 0 })); }}
                  className="self-start mt-2 bg-red-500 rounded-lg px-3 py-1.5"
                >
                  <Text className="text-xs font-semibold text-white">Set referral to Direct</Text>
                </TouchableOpacity>
              </View>
            )}

            {isPersonReferral && !selfReferral && (
              <View className="bg-slate-50 rounded-xl p-3 mb-3">
                <Text className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Referral fee for {form.referral}
                </Text>
                <View className="flex-row items-center gap-2">
                  <View className="flex-row bg-white border border-slate-200 rounded-xl p-0.5">
                    {(['fixed', 'percent'] as const).map((t) => (
                      <TouchableOpacity
                        key={t}
                        onPress={() => set('referralFeeType', t)}
                        className={`px-3 py-1.5 rounded-lg ${form.referralFeeType === t ? 'bg-navy-800' : ''}`}
                      >
                        <Text className={`text-xs font-semibold ${form.referralFeeType === t ? 'text-white' : 'text-slate-500'}`}>
                          {t === 'fixed' ? 'Rs' : '%'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View className="flex-1">
                    <NumberField label="" value={form.referralFeeValue} onChangeNumber={(n) => set('referralFeeValue', n)} placeholder={form.referralFeeType === 'percent' ? 'e.g. 5' : 'e.g. 2000'} />
                  </View>
                </View>
                {feePreview > 0 && (
                  <Text className="text-xs text-slate-500 mt-1">
                    Referrer gets Rs {feePreview.toLocaleString()} · deducted from owner payout
                  </Text>
                )}
              </View>
            )}

            {/* Payment + driver */}
            <NumberField label="Paid Amount (Rs)" value={form.paidAmount} onChangeNumber={(n) => set('paidAmount', n)} />
            <Select
              label="Assign Driver"
              value={form.driverId}
              onChange={(v) => set('driverId', v)}
              options={drivers.filter((d) => d.status === 'Available').map((d) => ({ value: d.id, label: `${d.name} · Rs ${d.dailyRate.toLocaleString()}/day` }))}
              placeholder="No driver"
            />

            {/* Locations */}
            <TextField label="Pickup Location" value={form.pickupLocation} onChangeText={(v) => set('pickupLocation', v)} placeholder="Pickup location" />
            <TextField label="Drop Location" value={form.dropLocation} onChangeText={(v) => set('dropLocation', v)} placeholder="Drop location" />

            {/* Deposit */}
            <Select
              label="Security Deposit"
              value={form.depositType ?? ''}
              onChange={(v) => set('depositType', (v || undefined) as FormState['depositType'])}
              options={[
                { value: '', label: 'None' },
                { value: 'cash', label: 'Cash' },
                { value: 'vehicle', label: 'Vehicle' },
                { value: 'other', label: 'Other' },
              ]}
              placeholder="None"
            />
            {form.depositType === 'cash' && (
              <NumberField label="Deposit Amount (Rs)" value={form.depositAmount} onChangeNumber={(n) => set('depositAmount', n)} />
            )}
            {(form.depositType === 'vehicle' || form.depositType === 'other') && (
              <TextField
                label={form.depositType === 'vehicle' ? 'Deposit Vehicle (model · color · no.)' : 'Deposit Item'}
                value={form.depositAssetDescription}
                onChangeText={(v) => set('depositAssetDescription', v)}
                placeholder={form.depositType === 'vehicle' ? 'Honda CB150R | Red | ABC-1234' : 'Describe the item held'}
              />
            )}

            <TextField label="Notes" value={form.notes} onChangeText={(v) => set('notes', v)} placeholder="Additional notes…" multiline />
          </ScrollView>
        </KeyboardAvoidingView>

        <View className="flex-row gap-3 px-5 py-3 border-t border-slate-100">
          <TouchableOpacity onPress={onClose} className="flex-1 items-center justify-center rounded-xl py-3 bg-slate-100">
            <Text className="text-slate-700 font-semibold">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={submit}
            disabled={selfReferral}
            className={`flex-1 items-center justify-center rounded-xl py-3 bg-navy-800 ${selfReferral ? 'opacity-50' : ''}`}
          >
            <Text className="text-white font-semibold">Confirm Booking</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

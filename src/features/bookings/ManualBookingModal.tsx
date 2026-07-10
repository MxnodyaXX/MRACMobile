import { differenceInDays, parseISO } from 'date-fns';
import { AlertCircle, CheckCircle2, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DateField } from '@/src/components/ui/DateField';
import { NumberField, TextField } from '@/src/components/ui/FormField';
import { Select } from '@/src/components/ui/Select';
import { creditResponsibilityOf } from '@/src/lib/credit';
import { resolveReferralFee } from '@/src/lib/referral';
import { sendSms } from '@/src/lib/sms';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useStore } from '@/src/store/useStore';
import type { Booking } from '@/src/types';

const REFERRAL_SOURCES = ['WhatsApp', 'Facebook', 'Instagram', 'TikTok', 'Google', 'Word of Mouth'];
const PAYMENT_METHODS = ['Cash', 'Card', 'Bank Transfer', 'Online'];
const STATUSES: Booking['status'][] = ['Completed', 'Ongoing', 'Confirmed', 'Cancelled'];
const genOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
const rs = (n: number) => `Rs ${Math.round(n).toLocaleString()}`;

type Form = {
  vehicleId: string; customerName: string; customerPhone: string; customerEmail: string;
  customerNIC: string; customerAddress: string;
  startDate: string; endDate: string; startTime: string; endTime: string;
  totalDays: number; dailyRateUsed: number; totalAmount: number;
  paidAmount: number; advanceAmount: number; discount: number; paymentMethod: string;
  status: Booking['status'];
  referral: string; referralFeeType: 'fixed' | 'percent'; referralFeeValue: number;
  referralAlreadyPaid: boolean; commissionAlreadyPaid: boolean;
  notes: string; pickupLocation: string; dropLocation: string; driverId: string;
  depositType?: 'cash' | 'vehicle' | 'other';
  depositAmount: number; depositAssetDescription: string;
};

const empty = (): Form => ({
  vehicleId: '', customerName: '', customerPhone: '', customerEmail: '', customerNIC: '', customerAddress: '',
  startDate: '', endDate: '', startTime: '', endTime: '',
  totalDays: 0, dailyRateUsed: 0, totalAmount: 0,
  paidAmount: 0, advanceAmount: 0, discount: 0, paymentMethod: 'Cash',
  status: 'Completed',
  referral: 'Direct', referralFeeType: 'fixed', referralFeeValue: 0,
  referralAlreadyPaid: false, commissionAlreadyPaid: true,
  notes: '', pickupLocation: '', dropLocation: '', driverId: '',
  depositType: undefined, depositAmount: 0, depositAssetDescription: '',
});

export function ManualBookingModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const vehicles = useStore((s) => s.vehicles);
  const owners = useStore((s) => s.owners);
  const drivers = useStore((s) => s.drivers);
  const customers = useStore((s) => s.customers);
  const addManualBooking = useStore((s) => s.addManualBooking);
  const currentUser = useAuthStore((s) => s.currentUser);

  // Owners can only record bookings against their own vehicles.
  const selectable = currentUser?.role === 'owner' ? vehicles.filter((v) => v.ownerId === currentUser.ownerId) : vehicles;

  const [form, setForm] = useState<Form>(empty());
  const [error, setError] = useState('');
  const [custFound, setCustFound] = useState<null | 'found' | 'new'>(null);
  const [referralCustom, setReferralCustom] = useState(false);
  const [creditChoice, setCreditChoice] = useState<'discount' | 'credit'>('credit');
  const [creditAck, setCreditAck] = useState(false);
  const [otp, setOtp] = useState<{ sent: boolean; code: string; input: string; verified: boolean; fallback?: string }>({ sent: false, code: '', input: '', verified: false });

  const reset = () => {
    setForm(empty()); setError(''); setCustFound(null); setReferralCustom(false);
    setCreditChoice('credit'); setCreditAck(false); setOtp({ sent: false, code: '', input: '', verified: false });
  };

  const vehicle = vehicles.find((v) => v.id === form.vehicleId);
  const vehicleOwner = owners.find((o) => o.id === vehicle?.ownerId);

  const referralFee = resolveReferralFee(form.referralFeeType, form.referralFeeValue, form.totalAmount);
  const billAmount = Math.max(0, form.totalAmount - (form.discount || 0));
  const paidTotal = (form.paidAmount || 0) + (form.advanceAmount || 0);
  const due = Math.max(0, billAmount - paidTotal);

  const isOwnerReferral = !!form.referral && form.referral !== 'Direct' && form.referral !== 'Company' && !REFERRAL_SOURCES.includes(form.referral);
  const isSocialReferral = REFERRAL_SOURCES.includes(form.referral);
  const companyResponsible = form.referral === 'Company';
  // A credit on another party's vehicle needs that owner's OTP approval.
  const needsOwnerOtp = creditChoice === 'credit' && due > 0 && !isSocialReferral && !companyResponsible && !!vehicleOwner;

  const set = <K extends keyof Form>(field: K, value: Form[K]) => {
    setForm((f) => {
      const u = { ...f, [field]: value };
      if (field === 'startDate' || field === 'endDate' || field === 'vehicleId' || field === 'dailyRateUsed') {
        const v = vehicles.find((x) => x.id === u.vehicleId);
        if (field === 'vehicleId' && v) u.dailyRateUsed = v.dailyRent;
        if (u.startDate && u.endDate && u.startDate <= u.endDate) {
          const days = differenceInDays(parseISO(u.endDate), parseISO(u.startDate)) + 1;
          const rate = u.dailyRateUsed || v?.dailyRent || 0;
          u.totalDays = days;
          u.dailyRateUsed = rate;
          u.totalAmount = days * rate;
        }
      }
      return u;
    });
  };

  // Auto-fill from an existing customer when the phone matches.
  useEffect(() => {
    if (form.customerPhone.length < 7) { setCustFound(null); return; }
    const existing = customers.find((c) => c.phone === form.customerPhone);
    if (existing) {
      setCustFound('found');
      setForm((f) => ({ ...f, customerName: existing.name, customerEmail: existing.email ?? '', customerNIC: existing.nic ?? '', customerAddress: existing.address ?? '' }));
    } else {
      setCustFound('new');
    }
  }, [form.customerPhone, customers]);

  const sendOwnerOtp = async () => {
    if (!vehicleOwner) return;
    const code = genOtp();
    const ok = await sendSms(
      vehicleOwner.phone,
      `EMRAC: A credit of ${rs(due)} for ${form.customerName || 'a customer'} is being recorded against your vehicle. Approve with code ${code}.`,
      { category: 'creditOtp', role: 'owner', transactional: true },
    );
    setOtp({ sent: true, code, input: '', verified: false, fallback: ok ? undefined : code });
  };

  const referralOptions = useMemo(
    () => [
      { value: 'Direct', label: 'Direct' },
      { value: 'Company', label: 'Company (company-liable)' },
      ...owners.map((o) => ({ value: o.name, label: `${o.name} (owner — earns fee)` })),
      ...REFERRAL_SOURCES.map((s) => ({ value: s, label: `${s} (marketing)` })),
      { value: '__custom__', label: 'Other / third party…' },
    ],
    [owners],
  );

  const save = () => {
    setError('');
    if (!form.vehicleId) return setError('Please select a vehicle.');
    if (!form.customerName) return setError('Customer name is required.');
    if (!form.customerPhone) return setError('Customer phone is required.');
    if (!form.startDate || !form.endDate) return setError('Start and end dates are required.');
    if (form.startDate > form.endDate) return setError('End date must be after start date.');
    if (form.totalAmount <= 0) return setError('Total amount must be greater than 0.');

    let discount = form.discount || 0;
    let creditAmount = 0;
    if (due > 0) {
      if (isSocialReferral && creditChoice === 'credit') {
        return setError('Social-media referral bookings must be fully paid — credit is not allowed. Waive the balance as a discount or record full payment.');
      }
      if (creditChoice === 'discount') {
        discount += due; // waive the remaining balance
      } else {
        if (!creditAck) return setError('Please acknowledge the credit responsibility notice.');
        if (needsOwnerOtp && !otp.verified) return setError(`Owner approval (OTP) is required to record this credit on ${vehicleOwner?.name}'s vehicle.`);
        creditAmount = due;
      }
    }

    const creditResponsibility = creditResponsibilityOf(form.referral, isOwnerReferral);
    const pickupAt = form.startTime ? `${form.startDate}T${form.startTime}` : undefined;
    const returnAt = form.endTime ? `${form.endDate}T${form.endTime}` : undefined;

    addManualBooking({
      vehicleId: form.vehicleId,
      customerId: '',
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      customerEmail: form.customerEmail || undefined,
      customerNIC: form.customerNIC || undefined,
      customerAddress: form.customerAddress || undefined,
      startDate: form.startDate,
      endDate: form.endDate,
      startTime: form.startTime || undefined,
      endTime: form.endTime || undefined,
      totalDays: form.totalDays,
      totalAmount: form.totalAmount,
      dailyRateUsed: form.dailyRateUsed,
      paidAmount: form.paidAmount,
      advanceAmount: form.advanceAmount || undefined,
      discount,
      creditAmount,
      creditResponsibility,
      paymentMethod: form.paymentMethod,
      status: form.status,
      referral: form.referral,
      referralFeeType: isOwnerReferral ? form.referralFeeType : undefined,
      referralFeeValue: isOwnerReferral ? form.referralFeeValue : undefined,
      referralAlreadyPaid: form.referralAlreadyPaid,
      commissionAlreadyPaid: form.commissionAlreadyPaid,
      notes: form.notes || undefined,
      pickupLocation: form.pickupLocation || undefined,
      dropLocation: form.dropLocation || undefined,
      driverId: form.driverId || undefined,
      depositType: form.depositType,
      depositAmount: form.depositType === 'cash' ? form.depositAmount : undefined,
      depositAssetDescription: form.depositType && form.depositType !== 'cash' ? form.depositAssetDescription : undefined,
      pickupAt,
      returnAt,
      insertedByAdmin: currentUser?.role === 'admin',
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose} onShow={reset}>
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-row items-center justify-between px-5 py-3 border-b border-slate-100">
          <View>
            <Text className="text-lg font-bold text-slate-900">Manual Booking</Text>
            <Text className="text-xs text-slate-400">Record a past booking that was missed</Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={10}><X size={22} color="#64748b" /></TouchableOpacity>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
          <ScrollView contentContainerClassName="p-5 pb-24" keyboardShouldPersistTaps="handled">
            {error ? (
              <View className="flex-row items-center gap-2 bg-red-50 rounded-xl px-4 py-3 mb-4">
                <AlertCircle size={15} color="#b91c1c" />
                <Text className="text-red-700 text-sm flex-1">{error}</Text>
              </View>
            ) : null}

            <Section title="Vehicle" />
            <Select label="Vehicle *" value={form.vehicleId} onChange={(v) => set('vehicleId', v)} placeholder="Select vehicle"
              options={selectable.map((v) => ({ value: v.id, label: `${v.brand} ${v.model} · ${v.vehicleNumber} · ${rs(v.dailyRent)}/day` }))} />
            {vehicleOwner && <Text className="text-xs text-slate-400 -mt-1 mb-3">Owner: {vehicleOwner.name}</Text>}

            <Section title="Customer" />
            <TextField label="Phone *" value={form.customerPhone} onChangeText={(v) => set('customerPhone', v)} placeholder="07X XXXXXXX" keyboardType="phone-pad" />
            {custFound === 'found' && (
              <View className="flex-row items-center gap-1.5 bg-emerald-50 rounded-lg px-3 py-2 -mt-1 mb-3">
                <CheckCircle2 size={13} color="#047857" />
                <Text className="text-xs text-emerald-700">Existing customer — details auto-filled</Text>
              </View>
            )}
            {custFound === 'new' && (
              <Text className="text-xs text-slate-400 -mt-1 mb-3">New customer — a profile will be created.</Text>
            )}
            <TextField label="Customer Name *" value={form.customerName} onChangeText={(v) => set('customerName', v)} />
            <TextField label="Email" value={form.customerEmail} onChangeText={(v) => set('customerEmail', v)} keyboardType="email-address" autoCapitalize="none" />
            <TextField label="NIC" value={form.customerNIC} onChangeText={(v) => set('customerNIC', v)} autoCapitalize="characters" />
            <TextField label="Address" value={form.customerAddress} onChangeText={(v) => set('customerAddress', v)} />

            <Section title="Rental Period" />
            <DateField label="Start Date *" value={form.startDate} onChange={(v) => set('startDate', v)} />
            <DateField label="End Date *" value={form.endDate} onChange={(v) => set('endDate', v)} />
            <View className="flex-row gap-3">
              <View className="flex-1"><DateField label="Pickup Time" value={form.startTime} onChange={(v) => set('startTime', v)} mode="time" optional /></View>
              <View className="flex-1"><DateField label="Return Time" value={form.endTime} onChange={(v) => set('endTime', v)} mode="time" optional /></View>
            </View>
            <NumberField label="Daily Rate Used (Rs)" value={form.dailyRateUsed} onChangeNumber={(n) => set('dailyRateUsed', n)} />
            {form.totalDays > 0 && (
              <View className="bg-navy-800 rounded-xl px-4 py-3 mb-3 flex-row items-center justify-between">
                <Text className="text-white/70 text-sm">{form.totalDays} day{form.totalDays !== 1 ? 's' : ''} × {rs(form.dailyRateUsed)}</Text>
                <Text className="text-white text-lg font-black">{rs(form.totalAmount)}</Text>
              </View>
            )}

            <Section title="Payment" />
            <NumberField label="Paid Amount (Rs)" value={form.paidAmount} onChangeNumber={(n) => set('paidAmount', n)} />
            <NumberField label="Advance (Rs)" value={form.advanceAmount} onChangeNumber={(n) => set('advanceAmount', n)} />
            <NumberField label="Discount (Rs)" value={form.discount} onChangeNumber={(n) => set('discount', n)} />
            <Select label="Payment Method" value={form.paymentMethod} onChange={(v) => set('paymentMethod', v)} options={PAYMENT_METHODS.map((m) => ({ value: m, label: m }))} />

            {/* Money summary */}
            <View className="bg-slate-50 rounded-xl p-3 mb-3">
              <Row label="Total" value={rs(form.totalAmount)} />
              {form.discount > 0 && <Row label="Discount" value={`− ${rs(form.discount)}`} color="#047857" />}
              <Row label="Bill" value={rs(billAmount)} bold />
              <Row label="Received" value={rs(paidTotal)} color="#1d4ed8" />
              <Row label="Balance due" value={rs(due)} color={due > 0 ? '#b91c1c' : '#047857'} bold />
            </View>

            {/* Outstanding balance resolution */}
            {due > 0 && (
              <View className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
                <Text className="text-sm font-semibold text-amber-800 mb-2">There is {rs(due)} unpaid. How should it be recorded?</Text>
                <View className="flex-row gap-2 mb-2">
                  {(['credit', 'discount'] as const).map((c) => (
                    <TouchableOpacity key={c} onPress={() => setCreditChoice(c)} className={`flex-1 items-center py-2 rounded-xl ${creditChoice === c ? 'bg-navy-800' : 'bg-white border border-slate-200'}`}>
                      <Text className={`text-xs font-semibold ${creditChoice === c ? 'text-white' : 'text-slate-600'}`}>
                        {c === 'credit' ? 'Customer credit' : 'Waive as discount'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {isSocialReferral && creditChoice === 'credit' && (
                  <Text className="text-xs text-red-600">Marketing-referral bookings must be fully paid — credit is not allowed.</Text>
                )}

                {creditChoice === 'credit' && !isSocialReferral && (
                  <>
                    <TouchableOpacity onPress={() => setCreditAck((v) => !v)} className="flex-row items-start gap-2 mt-1">
                      <View className={`w-5 h-5 rounded-md items-center justify-center mt-0.5 ${creditAck ? 'bg-emerald-600' : 'bg-white border border-slate-300'}`}>
                        {creditAck && <CheckCircle2 size={13} color="#fff" />}
                      </View>
                      <Text className="text-xs text-amber-800 flex-1">
                        I understand the credit is owed by the customer and is the liability of{' '}
                        {companyResponsible ? 'the company' : isOwnerReferral ? 'the referring owner' : `${vehicleOwner?.name ?? 'the vehicle owner'}`}.
                      </Text>
                    </TouchableOpacity>

                    {needsOwnerOtp && (
                      <View className="mt-3 bg-white rounded-xl p-3">
                        <Text className="text-xs font-semibold text-slate-700 mb-2">Owner approval required ({vehicleOwner?.name})</Text>
                        {!otp.sent ? (
                          <TouchableOpacity onPress={sendOwnerOtp} className="bg-navy-800 rounded-lg py-2 items-center">
                            <Text className="text-white text-xs font-semibold">Send approval code</Text>
                          </TouchableOpacity>
                        ) : otp.verified ? (
                          <View className="flex-row items-center gap-1.5">
                            <CheckCircle2 size={14} color="#047857" />
                            <Text className="text-xs text-emerald-700 font-semibold">Owner approved</Text>
                          </View>
                        ) : (
                          <>
                            {otp.fallback && (
                              <Text className="text-xs text-amber-700 mb-2">SMS not configured — code: <Text className="font-bold">{otp.fallback}</Text></Text>
                            )}
                            <TextField label="" value={otp.input} onChangeText={(v) => setOtp((s) => ({ ...s, input: v.replace(/\D/g, '') }))} placeholder="000000" keyboardType="numeric" />
                            <TouchableOpacity onPress={() => setOtp((s) => ({ ...s, verified: s.input.trim() === s.code }))} className="bg-navy-800 rounded-lg py-2 items-center">
                              <Text className="text-white text-xs font-semibold">Verify</Text>
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    )}
                  </>
                )}
              </View>
            )}

            <Section title="Referral" />
            {referralCustom ? (
              <>
                <TextField label="Referral (third-party name)" value={form.referral === 'Direct' ? '' : form.referral} onChangeText={(v) => set('referral', v || 'Direct')} />
                <TouchableOpacity onPress={() => { setReferralCustom(false); set('referral', 'Direct'); }} className="self-start mb-3">
                  <Text className="text-xs text-navy-800 font-semibold">Pick from list instead</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Select label="Referred by" value={form.referral} onChange={(v) => {
                if (v === '__custom__') { setReferralCustom(true); setForm((f) => ({ ...f, referral: '', referralFeeValue: 0 })); return; }
                setForm((f) => ({ ...f, referral: v || 'Direct', ...(REFERRAL_SOURCES.includes(v) || v === 'Direct' || v === 'Company' ? { referralFeeValue: 0 } : {}) }));
              }} options={referralOptions} />
            )}

            {isOwnerReferral && (
              <View className="bg-slate-50 rounded-xl p-3 mb-3">
                <Text className="text-[11px] font-semibold text-slate-500 uppercase mb-2">Referral fee for {form.referral}</Text>
                <View className="flex-row items-center gap-2">
                  <View className="flex-row bg-white border border-slate-200 rounded-xl p-0.5">
                    {(['fixed', 'percent'] as const).map((t) => (
                      <TouchableOpacity key={t} onPress={() => set('referralFeeType', t)} className={`px-3 py-1.5 rounded-lg ${form.referralFeeType === t ? 'bg-navy-800' : ''}`}>
                        <Text className={`text-xs font-semibold ${form.referralFeeType === t ? 'text-white' : 'text-slate-500'}`}>{t === 'fixed' ? 'Rs' : '%'}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View className="flex-1"><NumberField label="" value={form.referralFeeValue} onChangeNumber={(n) => set('referralFeeValue', n)} /></View>
                </View>
                {referralFee > 0 && <Text className="text-xs text-slate-500">Referrer gets {rs(referralFee)} · deducted from owner payout</Text>}
                <Toggle label="Referral fee already paid" on={form.referralAlreadyPaid} onPress={() => set('referralAlreadyPaid', !form.referralAlreadyPaid)} />
              </View>
            )}

            <Section title="Booking Record" />
            <Select label="Status" value={form.status} onChange={(v) => set('status', v as Booking['status'])} options={STATUSES.map((s) => ({ value: s, label: s }))} />
            <Toggle label="Owner payout already settled" on={form.commissionAlreadyPaid} onPress={() => set('commissionAlreadyPaid', !form.commissionAlreadyPaid)} />

            <Select label="Assign Driver" value={form.driverId} onChange={(v) => set('driverId', v)} placeholder="No driver"
              options={drivers.map((d) => ({ value: d.id, label: d.name }))} />
            <TextField label="Pickup Location" value={form.pickupLocation} onChangeText={(v) => set('pickupLocation', v)} />
            <TextField label="Drop Location" value={form.dropLocation} onChangeText={(v) => set('dropLocation', v)} />

            <Select label="Security Deposit" value={form.depositType ?? ''} onChange={(v) => set('depositType', (v || undefined) as Form['depositType'])}
              options={[{ value: '', label: 'None' }, { value: 'cash', label: 'Cash' }, { value: 'vehicle', label: 'Vehicle' }, { value: 'other', label: 'Other' }]} />
            {form.depositType === 'cash' && <NumberField label="Deposit Amount (Rs)" value={form.depositAmount} onChangeNumber={(n) => set('depositAmount', n)} />}
            {(form.depositType === 'vehicle' || form.depositType === 'other') && (
              <TextField label={form.depositType === 'vehicle' ? 'Deposit Vehicle (model | color | no.)' : 'Deposit Item'} value={form.depositAssetDescription} onChangeText={(v) => set('depositAssetDescription', v)} />
            )}

            <TextField label="Notes" value={form.notes} onChangeText={(v) => set('notes', v)} multiline />
          </ScrollView>
        </KeyboardAvoidingView>

        <View className="flex-row gap-3 px-5 py-3 border-t border-slate-100">
          <TouchableOpacity onPress={onClose} className="flex-1 items-center justify-center rounded-xl py-3 bg-slate-100">
            <Text className="text-slate-700 font-semibold">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={save} className="flex-1 items-center justify-center rounded-xl py-3 bg-navy-800">
            <Text className="text-white font-semibold">Save Booking</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function Section({ title }: { title: string }) {
  return <Text className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-3 mb-2">{title}</Text>;
}

function Row({ label, value, color, bold }: { label: string; value: string; color?: string; bold?: boolean }) {
  return (
    <View className="flex-row justify-between py-0.5">
      <Text className={`text-xs ${bold ? 'font-semibold text-slate-700' : 'text-slate-500'}`}>{label}</Text>
      <Text className={`text-xs ${bold ? 'font-bold' : 'font-semibold'}`} style={{ color: color ?? '#1e293b' }}>{value}</Text>
    </View>
  );
}

function Toggle({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} className="flex-row items-center justify-between bg-white rounded-xl px-3 py-2.5 mt-2">
      <Text className="text-xs text-slate-700 flex-1">{label}</Text>
      <View style={{ width: 40, height: 22, borderRadius: 11, backgroundColor: on ? '#10b981' : '#cbd5e1', justifyContent: 'center' }}>
        <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff', marginLeft: on ? 20 : 2 }} />
      </View>
    </TouchableOpacity>
  );
}

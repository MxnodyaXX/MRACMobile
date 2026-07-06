import { useRouter } from 'expo-router';
import { AlertTriangle, MessageSquare, Plus, X } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PageScreen } from '@/src/components/PageScreen';
import { StatusBadge } from '@/src/components/StatusBadge';
import { DateField } from '@/src/components/ui/DateField';
import { TextField } from '@/src/components/ui/FormField';
import { Select } from '@/src/components/ui/Select';
import { useStore } from '@/src/store/useStore';
import { Inquiry } from '@/src/types';

const SOURCES = ['Direct', 'Walk-in', 'Phone Call', 'WhatsApp', 'Facebook', 'Instagram', 'TikTok', 'Google', 'YouTube', 'Word of Mouth', 'Website'];
const LOST_REASONS = ['No vehicle available', 'Dates not available', 'Budget mismatch', 'Customer cancelled', 'Found elsewhere', 'Other'];
type IStatus = 'Pending' | 'Converted' | 'Lost';
const TABS: ('All' | IStatus)[] = ['All', 'Pending', 'Converted', 'Lost'];

type IForm = Omit<Inquiry, 'id' | 'createdAt'>;
const empty = (): IForm => ({ customerName: '', customerPhone: '', requestedVehicle: '', preferredBrand: '', startDate: '', endDate: '', referral: '', status: 'Pending', notes: '' });

export default function InquiriesScreen() {
  const router = useRouter();
  const inquiries = useStore((s) => s.inquiries);
  const owners = useStore((s) => s.owners);
  const addInquiry = useStore((s) => s.addInquiry);
  const updateInquiry = useStore((s) => s.updateInquiry);

  const [tab, setTab] = useState<'All' | IStatus>('All');
  const [addOpen, setAddOpen] = useState(false);
  const [viewing, setViewing] = useState<Inquiry | null>(null);
  const [lostTarget, setLostTarget] = useState<Inquiry | null>(null);

  const filtered = (tab === 'All' ? inquiries : inquiries.filter((i) => i.status === tab)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const convert = (inq: Inquiry) => {
    updateInquiry(inq.id, { status: 'Converted' });
    setViewing(null);
    router.push('/bookings');
  };

  return (
    <PageScreen
      title="Inquiries"
      right={
        <TouchableOpacity onPress={() => setAddOpen(true)} className="flex-row items-center gap-1 bg-navy-800 rounded-xl px-3 py-2">
          <Plus size={15} color="#fff" />
          <Text className="text-white font-semibold text-xs">Add</Text>
        </TouchableOpacity>
      }
    >
      <View className="flex-row flex-wrap gap-2 px-4 pt-3 pb-2">
        {TABS.map((t) => {
          const active = tab === t;
          const count = t === 'All' ? inquiries.length : inquiries.filter((i) => i.status === t).length;
          return (
            <TouchableOpacity key={t} onPress={() => setTab(t)} className={`px-3 py-1.5 rounded-xl ${active ? 'bg-navy-800' : 'bg-white border border-slate-200'}`}>
              <Text className={`text-xs font-medium ${active ? 'text-white' : 'text-slate-500'}`}>{t} {t !== 'All' ? count : ''}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerClassName="p-4 pb-28">
        {filtered.length === 0 ? (
          <Text className="text-slate-400 text-sm text-center py-16">No inquiries found.</Text>
        ) : (
          filtered.map((inq) => (
            <TouchableOpacity key={inq.id} activeOpacity={0.85} onPress={() => setViewing(inq)} className="bg-white rounded-2xl border border-slate-100 p-4 mb-3">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-3 flex-1">
                  <View className="w-9 h-9 rounded-xl bg-slate-50 items-center justify-center">
                    <MessageSquare size={16} color="#64748b" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-slate-900" numberOfLines={1}>{inq.customerName}</Text>
                    <Text className="text-xs text-slate-400">{inq.customerPhone || '—'}</Text>
                  </View>
                </View>
                <StatusBadge status={inq.status} />
              </View>
              <View className="flex-row flex-wrap mb-1">
                <Cell label="Requested" value={inq.requestedVehicle} />
                <Cell label="Referral" value={inq.referral || '—'} />
                <Cell label="From" value={inq.startDate || '—'} />
                <Cell label="To" value={inq.endDate || '—'} />
              </View>
              {inq.status === 'Lost' && inq.lostReason ? (
                <View className="flex-row items-center gap-1.5 bg-red-50 rounded-lg px-3 py-2 mb-2">
                  <AlertTriangle size={11} color="#dc2626" />
                  <Text className="text-xs text-red-600">{inq.lostReason}</Text>
                </View>
              ) : null}
              {inq.status === 'Pending' && (
                <View className="flex-row gap-2 border-t border-slate-50 pt-3 mt-1">
                  <TouchableOpacity onPress={() => convert(inq)} className="flex-1 items-center py-2 rounded-xl bg-emerald-50">
                    <Text className="text-xs font-medium text-emerald-700">✓ Convert</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setLostTarget(inq)} className="flex-1 items-center py-2 rounded-xl bg-red-50">
                    <Text className="text-xs font-medium text-red-600">✕ Mark Lost</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Add */}
      <AddInquiryModal visible={addOpen} owners={owners.map((o) => o.name)} onClose={() => setAddOpen(false)} onSubmit={(f) => { addInquiry(f); setAddOpen(false); }} />

      {/* View */}
      <Modal visible={!!viewing} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setViewing(null)}>
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
          <View className="flex-row items-center justify-between px-5 py-3 border-b border-slate-100">
            <Text className="text-lg font-bold text-slate-900">Inquiry Details</Text>
            <TouchableOpacity onPress={() => setViewing(null)} hitSlop={10}><X size={22} color="#64748b" /></TouchableOpacity>
          </View>
          {viewing && (
            <ScrollView contentContainerClassName="p-5 pb-24">
              <View className="flex-row items-center justify-between mb-4">
                <View><Text className="text-lg font-bold text-slate-900">{viewing.customerName}</Text><Text className="text-sm text-slate-400">{viewing.customerPhone}</Text></View>
                <StatusBadge status={viewing.status} size="md" />
              </View>
              <View className="flex-row flex-wrap -mx-1">
                {[['Requested', viewing.requestedVehicle], ['Referral', viewing.referral || '—'], ['Start Date', viewing.startDate || '—'], ['End Date', viewing.endDate || '—']].map(([l, v]) => (
                  <View key={l} className="w-1/2 px-1 mb-2"><View className="bg-slate-50 rounded-xl p-3"><Text className="text-xs text-slate-400">{l}</Text><Text className="text-sm font-semibold text-slate-800">{v}</Text></View></View>
                ))}
              </View>
              {viewing.status === 'Lost' && viewing.lostReason ? (
                <View className="bg-red-50 rounded-xl p-3 mt-1"><Text className="text-xs text-red-400">Lost Reason</Text><Text className="text-sm font-semibold text-red-700">{viewing.lostReason}</Text></View>
              ) : null}
              {viewing.notes ? <View className="bg-slate-50 rounded-xl p-3 mt-2"><Text className="text-xs text-slate-400 mb-1">Notes</Text><Text className="text-sm text-slate-700">{viewing.notes}</Text></View> : null}
            </ScrollView>
          )}
          {viewing?.status === 'Pending' && (
            <View className="flex-row gap-3 px-5 py-3 border-t border-slate-100">
              <TouchableOpacity onPress={() => setLostTarget(viewing)} className="flex-1 items-center justify-center rounded-xl py-3 bg-red-50"><Text className="text-red-600 font-semibold">Mark Lost</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => convert(viewing)} className="flex-1 items-center justify-center rounded-xl py-3 bg-emerald-600"><Text className="text-white font-semibold">Convert to Booking</Text></TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* Lost reason */}
      <LostModal
        target={lostTarget}
        onClose={() => setLostTarget(null)}
        onConfirm={(reason) => {
          if (lostTarget) updateInquiry(lostTarget.id, { status: 'Lost', lostReason: reason });
          setLostTarget(null);
          setViewing(null);
        }}
      />
    </PageScreen>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <View className="w-1/2 mb-2"><Text className="text-xs text-slate-400">{label}</Text><Text className="text-xs font-medium text-slate-700" numberOfLines={1}>{value}</Text></View>
  );
}

function AddInquiryModal({ visible, owners, onClose, onSubmit }: { visible: boolean; owners: string[]; onClose: () => void; onSubmit: (f: IForm) => void }) {
  const [form, setForm] = useState<IForm>(empty());
  const set = <K extends keyof IForm>(k: K, v: IForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const canSave = form.customerName.trim() && form.requestedVehicle.trim();
  const options = [...SOURCES.map((s) => ({ value: s, label: s })), ...owners.map((n) => ({ value: n, label: `${n} (owner)` }))];
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose} onShow={() => setForm(empty())}>
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-row items-center justify-between px-5 py-3 border-b border-slate-100">
          <Text className="text-lg font-bold text-slate-900">Add Inquiry</Text>
          <TouchableOpacity onPress={onClose} hitSlop={10}><X size={22} color="#64748b" /></TouchableOpacity>
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
          <ScrollView contentContainerClassName="p-5 pb-24" keyboardShouldPersistTaps="handled">
            <TextField label="Customer Name *" value={form.customerName} onChangeText={(v) => set('customerName', v)} />
            <TextField label="Phone" value={form.customerPhone} onChangeText={(v) => set('customerPhone', v)} keyboardType="phone-pad" />
            <TextField label="Requested Vehicle *" value={form.requestedVehicle} onChangeText={(v) => set('requestedVehicle', v)} placeholder="Axio, Prius, Van…" />
            <Select label="Referral / Source" value={form.referral} onChange={(v) => set('referral', v)} placeholder="How did they hear about us?" options={options} />
            <DateField label="Start Date" value={form.startDate} onChange={(v) => set('startDate', v)} />
            <DateField label="End Date" value={form.endDate} onChange={(v) => set('endDate', v)} />
            <TextField label="Notes" value={form.notes ?? ''} onChangeText={(v) => set('notes', v)} multiline />
          </ScrollView>
        </KeyboardAvoidingView>
        <View className="flex-row gap-3 px-5 py-3 border-t border-slate-100">
          <TouchableOpacity onPress={onClose} className="flex-1 items-center justify-center rounded-xl py-3 bg-slate-100"><Text className="text-slate-700 font-semibold">Cancel</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => canSave && onSubmit(form)} disabled={!canSave} className={`flex-1 items-center justify-center rounded-xl py-3 bg-navy-800 ${canSave ? '' : 'opacity-50'}`}><Text className="text-white font-semibold">Save Inquiry</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function LostModal({ target, onClose, onConfirm }: { target: Inquiry | null; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState(LOST_REASONS[0]);
  const [custom, setCustom] = useState('');
  const finalReason = reason === 'Other' ? custom.trim() || 'Other' : reason;
  const canConfirm = reason !== 'Other' || custom.trim();
  return (
    <Modal visible={!!target} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose} onShow={() => { setReason(LOST_REASONS[0]); setCustom(''); }}>
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-row items-center justify-between px-5 py-3 border-b border-slate-100">
          <Text className="text-lg font-bold text-slate-900">Mark as Lost</Text>
          <TouchableOpacity onPress={onClose} hitSlop={10}><X size={22} color="#64748b" /></TouchableOpacity>
        </View>
        <ScrollView contentContainerClassName="p-5">
          <Text className="text-sm text-slate-600 mb-3">Why was {target?.customerName}&apos;s inquiry lost?</Text>
          <Select label="Reason *" value={reason} onChange={(v) => { setReason(v); if (v !== 'Other') setCustom(''); }} options={LOST_REASONS.map((r) => ({ value: r, label: r }))} />
          {reason === 'Other' && <TextField label="Custom Reason" value={custom} onChangeText={setCustom} placeholder="Describe why this inquiry was lost…" />}
        </ScrollView>
        <View className="flex-row gap-3 px-5 py-3 border-t border-slate-100">
          <TouchableOpacity onPress={onClose} className="flex-1 items-center justify-center rounded-xl py-3 bg-slate-100"><Text className="text-slate-700 font-semibold">Cancel</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => canConfirm && onConfirm(finalReason)} disabled={!canConfirm} className={`flex-1 items-center justify-center rounded-xl py-3 bg-red-600 ${canConfirm ? '' : 'opacity-50'}`}><Text className="text-white font-semibold">Confirm Lost</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

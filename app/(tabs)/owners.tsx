import { Car, FileText, Lock, Plus, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PageScreen } from '@/src/components/PageScreen';
import { StatusBadge } from '@/src/components/StatusBadge';
import { NumberField, TextField } from '@/src/components/ui/FormField';
import { Select } from '@/src/components/ui/Select';
import { vehicleNetRevenue } from '@/src/lib/revenue';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useStore } from '@/src/store/useStore';
import { Owner } from '@/src/types';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const initials = (n: string) => n.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase();

type OwnerForm = Omit<Owner, 'id' | 'createdAt' | 'totalEarnings' | 'pendingPayout'>;
const empty = (): OwnerForm => ({ name: '', phone: '', email: '', address: '', bankName: '', branchName: '', accountNumber: '', accountHolderName: '', commissionRate: 0, smsOptIn: true });

export default function OwnersScreen() {
  const owners = useStore((s) => s.owners);
  const vehicles = useStore((s) => s.vehicles);
  const bookings = useStore((s) => s.bookings);
  const commissions = useStore((s) => s.commissions);
  const addOwner = useStore((s) => s.addOwner);
  const updateOwner = useStore((s) => s.updateOwner);
  const currentUser = useAuthStore((s) => s.currentUser);
  const isAdmin = useAuthStore((s) => s.isAdmin);

  const myOwnerId = currentUser?.ownerId ?? '';
  const isOwnerRole = !isAdmin() && currentUser?.role === 'owner';

  const [mode, setMode] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Owner | null>(null);
  const [viewing, setViewing] = useState<Owner | null>(null);
  const [statement, setStatement] = useState<Owner | null>(null);

  const canSee = (o: Owner) => isAdmin() || o.id === myOwnerId;

  const renderCard = (o: Owner) => {
    const ov = vehicles.filter((v) => v.ownerId === o.id);
    const ob = bookings.filter((b) => ov.some((v) => v.id === b.vehicleId));
    const rev = ov.reduce((s, v) => s + vehicleNetRevenue(v, ob), 0);
    const pending = commissions.filter((c) => c.ownerId === o.id && c.status === 'Pending').reduce((s, c) => s + c.ownerPayout, 0);
    const mine = canSee(o);

    return (
      <TouchableOpacity key={o.id} activeOpacity={mine ? 0.85 : 1} onPress={() => mine && setViewing(o)} className="bg-white rounded-2xl border border-slate-100 p-4 mb-3">
        <View className="flex-row items-center gap-3 mb-3">
          <View style={{ backgroundColor: o.id === myOwnerId ? '#0D1B45' : '#64748b' }} className="w-12 h-12 rounded-xl items-center justify-center">
            <Text className="text-white font-bold text-sm">{initials(o.name)}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-slate-900" numberOfLines={1}>{o.name}</Text>
            <Text className="text-xs text-slate-400">{mine ? o.phone : '••••••••••'}</Text>
            {mine && o.email ? <Text className="text-xs text-slate-400" numberOfLines={1}>{o.email}</Text> : null}
          </View>
          {!mine && <Lock size={14} color="#cbd5e1" />}
        </View>

        <View className="flex-row gap-2 mb-3">
          <MiniStat value={ov.length} label="Vehicles" />
          <MiniStat value={ob.length} label="Bookings" />
          <MiniStat value={`Rs ${(rev / 1000).toFixed(0)}k`} label="Revenue" />
        </View>

        {ov.map((v) => (
          <View key={v.id} className="flex-row items-center gap-2 mb-1.5">
            <Car size={12} color="#94a3b8" />
            <Text className="text-xs text-slate-600 flex-1" numberOfLines={1}>{v.brand} {v.model} · {v.vehicleNumber}</Text>
            <StatusBadge status={v.status} />
          </View>
        ))}

        {mine && pending > 0 && (
          <View className="flex-row items-center justify-between bg-amber-50 rounded-xl px-3 py-2 mt-2">
            <Text className="text-xs text-amber-700">Pending payout</Text>
            <Text className="text-xs font-bold text-amber-700">Rs {pending.toLocaleString()}</Text>
          </View>
        )}

        {mine && (
          <View className="flex-row gap-2 mt-3">
            <TouchableOpacity onPress={() => { setEditing(o); setMode('edit'); }} className="flex-1 items-center py-2 rounded-xl bg-slate-50">
              <Text className="text-xs font-medium text-slate-600">Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStatement(o)} className="flex-row items-center gap-1 px-3 py-2 rounded-xl bg-blue-50">
              <FileText size={11} color="#2563eb" />
              <Text className="text-xs font-medium text-blue-600">Statement</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const myOwner = owners.find((o) => o.id === myOwnerId);
  const others = owners.filter((o) => o.id !== myOwnerId);

  return (
    <PageScreen
      title="Owners"
      right={
        isAdmin() ? (
          <TouchableOpacity onPress={() => { setEditing(null); setMode('add'); }} className="flex-row items-center gap-1 bg-navy-800 rounded-xl px-3 py-2">
            <Plus size={15} color="#fff" />
            <Text className="text-white font-semibold text-xs">Add</Text>
          </TouchableOpacity>
        ) : undefined
      }
    >
      <ScrollView contentContainerClassName="p-4 pb-28">
        {isOwnerRole ? (
          <>
            {myOwner && (<><SectionLabel text="My Profile" count={1} />{renderCard(myOwner)}</>)}
            {others.length > 0 && (<><SectionLabel text="Other Owners" count={others.length} />{others.map(renderCard)}</>)}
          </>
        ) : (
          owners.length === 0 ? <Text className="text-slate-400 text-sm text-center py-16">No owners yet.</Text> : owners.map(renderCard)
        )}
      </ScrollView>

      {/* Add / Edit */}
      <OwnerFormModal
        visible={mode !== null}
        mode={mode === 'edit' ? 'edit' : 'add'}
        initial={editing}
        onClose={() => { setMode(null); setEditing(null); }}
        onSubmit={(form) => {
          if (mode === 'edit' && editing) updateOwner(editing.id, form);
          else addOwner(form);
          setMode(null);
          setEditing(null);
        }}
      />

      {/* View */}
      <OwnerViewModal owner={viewing} onClose={() => setViewing(null)} onStatement={(o) => { setViewing(null); setStatement(o); }} onEdit={(o) => { setViewing(null); setEditing(o); setMode('edit'); }} />

      {/* Statement */}
      <StatementModal owner={statement} onClose={() => setStatement(null)} />
    </PageScreen>
  );
}

function MiniStat({ value, label }: { value: string | number; label: string }) {
  return (
    <View className="flex-1 bg-slate-50 rounded-xl p-2.5 items-center">
      <Text className="text-base font-bold text-slate-900">{value}</Text>
      <Text className="text-xs text-slate-400">{label}</Text>
    </View>
  );
}

function SectionLabel({ text, count }: { text: string; count: number }) {
  return (
    <View className="flex-row items-center gap-2 mb-3 mt-1">
      <Text className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{text}</Text>
      <View className="bg-slate-100 rounded-full px-2 py-0.5"><Text className="text-xs text-slate-500 font-medium">{count}</Text></View>
      <View className="flex-1 h-px bg-slate-100" />
    </View>
  );
}

function OwnerFormModal({ visible, mode, initial, onClose, onSubmit }: { visible: boolean; mode: 'add' | 'edit'; initial: Owner | null; onClose: () => void; onSubmit: (f: OwnerForm) => void }) {
  const [form, setForm] = useState<OwnerForm>(empty());
  useEffect(() => { if (visible) setForm(initial ? { ...initial } : empty()); }, [visible, initial]);
  const set = <K extends keyof OwnerForm>(k: K, v: OwnerForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const canSave = form.name.trim();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-row items-center justify-between px-5 py-3 border-b border-slate-100">
          <Text className="text-lg font-bold text-slate-900">{mode === 'add' ? 'Add Owner' : 'Edit Profile'}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={10}><X size={22} color="#64748b" /></TouchableOpacity>
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
          <ScrollView contentContainerClassName="p-5 pb-24" keyboardShouldPersistTaps="handled">
            <TextField label="Full Name *" value={form.name} onChangeText={(v) => set('name', v)} />
            <TextField label="Phone" value={form.phone} onChangeText={(v) => set('phone', v)} keyboardType="phone-pad" />
            <TextField label="Email" value={form.email} onChangeText={(v) => set('email', v)} keyboardType="email-address" autoCapitalize="none" />
            <TextField label="Address" value={form.address ?? ''} onChangeText={(v) => set('address', v)} />
            <NumberField label="Commission Rate (%)" value={form.commissionRate} onChangeNumber={(n) => set('commissionRate', n)} />
            <Text className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-3 mb-2">Banking Details</Text>
            <TextField label="Bank Name" value={form.bankName ?? ''} onChangeText={(v) => set('bankName', v)} placeholder="e.g. Commercial Bank" />
            <TextField label="Branch Name" value={form.branchName ?? ''} onChangeText={(v) => set('branchName', v)} placeholder="e.g. Colombo 07" />
            <TextField label="Account Number" value={form.accountNumber ?? ''} onChangeText={(v) => set('accountNumber', v)} keyboardType="numeric" />
            <TextField label="Account Holder Name" value={form.accountHolderName ?? ''} onChangeText={(v) => set('accountHolderName', v)} />
            <TouchableOpacity onPress={() => set('smsOptIn', !(form.smsOptIn ?? true))} className="flex-row items-center justify-between bg-slate-50 rounded-xl px-3.5 py-3 mt-1">
              <View>
                <Text className="text-sm font-medium text-slate-700">Receive SMS notifications</Text>
                <Text className="text-xs text-slate-400">Booking, payout and referral texts</Text>
              </View>
              <View style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: form.smsOptIn ?? true ? '#10b981' : '#cbd5e1', justifyContent: 'center' }}>
                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', marginLeft: form.smsOptIn ?? true ? 22 : 2 }} />
              </View>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
        <View className="flex-row gap-3 px-5 py-3 border-t border-slate-100">
          <TouchableOpacity onPress={onClose} className="flex-1 items-center justify-center rounded-xl py-3 bg-slate-100"><Text className="text-slate-700 font-semibold">Cancel</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => canSave && onSubmit(form)} disabled={!canSave} className={`flex-1 items-center justify-center rounded-xl py-3 bg-navy-800 ${canSave ? '' : 'opacity-50'}`}><Text className="text-white font-semibold">{mode === 'add' ? 'Add Owner' : 'Save'}</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function OwnerViewModal({ owner, onClose, onStatement, onEdit }: { owner: Owner | null; onClose: () => void; onStatement: (o: Owner) => void; onEdit: (o: Owner) => void }) {
  const vehicles = useStore((s) => s.vehicles);
  const commissions = useStore((s) => s.commissions);
  if (!owner) return null;
  const ov = vehicles.filter((v) => v.ownerId === owner.id);
  const oc = commissions.filter((c) => c.ownerId === owner.id);
  const pending = oc.filter((c) => c.status === 'Pending').reduce((s, c) => s + c.ownerPayout, 0);
  const paid = oc.filter((c) => c.status === 'Paid').reduce((s, c) => s + c.ownerPayout, 0);

  return (
    <Modal visible={!!owner} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-row items-center justify-between px-5 py-3 border-b border-slate-100">
          <Text className="text-lg font-bold text-slate-900">Owner Details</Text>
          <TouchableOpacity onPress={onClose} hitSlop={10}><X size={22} color="#64748b" /></TouchableOpacity>
        </View>
        <ScrollView contentContainerClassName="p-5 pb-24">
          <View className="flex-row items-center gap-4 mb-4">
            <View className="w-14 h-14 rounded-xl bg-navy-800 items-center justify-center"><Text className="text-white font-bold text-lg">{initials(owner.name)}</Text></View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-slate-900">{owner.name}</Text>
              <Text className="text-sm text-slate-400">{owner.phone} · {owner.email}</Text>
            </View>
          </View>
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-navy-800 rounded-xl p-3 items-center"><Text className="text-white/70 text-xs">Paid Out</Text><Text className="text-white font-bold text-base">Rs {(paid / 1000).toFixed(0)}k</Text></View>
            <View className="flex-1 bg-amber-50 rounded-xl p-3 items-center"><Text className="text-amber-600 text-xs">Pending</Text><Text className="text-amber-700 font-bold text-base">Rs {(pending / 1000).toFixed(0)}k</Text></View>
            <View className="flex-1 bg-blue-50 rounded-xl p-3 items-center"><Text className="text-blue-500 text-xs">Vehicles</Text><Text className="text-blue-700 font-bold text-base">{ov.length}</Text></View>
          </View>
          <Text className="text-sm font-bold text-slate-700 mb-2">Vehicles</Text>
          {ov.map((v) => (
            <View key={v.id} className="flex-row items-center gap-3 bg-slate-50 rounded-xl p-3 mb-2">
              <Car size={16} color="#64748b" />
              <View className="flex-1"><Text className="text-sm font-medium text-slate-800">{v.brand} {v.model}</Text><Text className="text-xs text-slate-400">{v.vehicleNumber} · Rs {v.dailyRent.toLocaleString()}/day</Text></View>
              <StatusBadge status={v.status} />
            </View>
          ))}
          {(owner.bankName || owner.accountNumber) && (
            <View className="bg-slate-50 rounded-xl p-4 mt-2">
              <Text className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Banking Details</Text>
              <View className="flex-row flex-wrap">
                {owner.bankName ? <BankCell label="Bank" value={owner.bankName} /> : null}
                {owner.branchName ? <BankCell label="Branch" value={owner.branchName} /> : null}
                {owner.accountNumber ? <BankCell label="Account Number" value={owner.accountNumber} /> : null}
                {owner.accountHolderName ? <BankCell label="Account Holder" value={owner.accountHolderName} /> : null}
              </View>
            </View>
          )}
        </ScrollView>
        <View className="flex-row gap-3 px-5 py-3 border-t border-slate-100">
          <TouchableOpacity onPress={() => onEdit(owner)} className="flex-1 items-center justify-center rounded-xl py-3 bg-slate-100"><Text className="text-slate-700 font-semibold">Edit</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => onStatement(owner)} className="flex-1 items-center justify-center rounded-xl py-3 bg-navy-800"><Text className="text-white font-semibold">Statement</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function BankCell({ label, value }: { label: string; value: string }) {
  return (
    <View className="w-1/2 mb-2">
      <Text className="text-xs text-slate-400">{label}</Text>
      <Text className="text-sm font-medium text-slate-800">{value}</Text>
    </View>
  );
}

function StatementModal({ owner, onClose }: { owner: Owner | null; onClose: () => void }) {
  const commissions = useStore((s) => s.commissions);
  const vehicles = useStore((s) => s.vehicles);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  if (!owner) return null;

  const rows = commissions.filter((c) => {
    if (c.ownerId !== owner.id) return false;
    const d = new Date(c.createdAt);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });
  const income = rows.reduce((s, c) => s + c.totalIncome, 0);
  const referral = rows.reduce((s, c) => s + (c.coordinatorFee ?? 0), 0);
  const payout = rows.reduce((s, c) => s + c.ownerPayout, 0);
  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i);

  return (
    <Modal visible={!!owner} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-row items-center justify-between px-5 py-3 border-b border-slate-100">
          <Text className="text-lg font-bold text-slate-900">Monthly Statement</Text>
          <TouchableOpacity onPress={onClose} hitSlop={10}><X size={22} color="#64748b" /></TouchableOpacity>
        </View>
        <ScrollView contentContainerClassName="p-5 pb-24">
          <Text className="text-base font-bold text-slate-900 mb-3">{owner.name}</Text>
          <View className="flex-row gap-3">
            <View className="flex-1"><Select label="" value={String(month)} onChange={(v) => setMonth(Number(v))} options={MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))} /></View>
            <View style={{ width: 110 }}><Select label="" value={String(year)} onChange={(v) => setYear(Number(v))} options={years.map((y) => ({ value: String(y), label: String(y) }))} /></View>
          </View>

          {rows.length === 0 ? (
            <Text className="text-center text-slate-400 text-sm py-8">No bookings in {MONTHS[month - 1]} {year}.</Text>
          ) : (
            <>
              {rows.map((c) => {
                const v = vehicles.find((x) => x.id === c.vehicleId);
                return (
                  <View key={c.id} className="bg-slate-50 rounded-xl p-3 mb-2">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-sm font-semibold text-slate-800">{v ? `${v.brand} ${v.model}` : '—'}</Text>
                      <View className={`px-2 py-0.5 rounded-full ${c.status === 'Paid' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                        <Text className={`text-[10px] font-semibold ${c.status === 'Paid' ? 'text-emerald-700' : 'text-amber-700'}`}>{c.status}</Text>
                      </View>
                    </View>
                    <Text className="text-xs text-slate-400">Referral: {c.referral}</Text>
                    <View className="flex-row justify-between mt-1">
                      <Text className="text-xs text-slate-500">Income Rs {c.totalIncome.toLocaleString()}</Text>
                      <Text className="text-xs font-semibold text-emerald-700">Payout Rs {c.ownerPayout.toLocaleString()}</Text>
                    </View>
                  </View>
                );
              })}
              <View className="flex-row gap-3 mt-2">
                <View className="flex-1 bg-slate-100 rounded-xl p-3 items-center"><Text className="text-xs text-slate-400">Income</Text><Text className="text-sm font-bold text-slate-800">Rs {income.toLocaleString()}</Text></View>
                <View className="flex-1 bg-amber-50 rounded-xl p-3 items-center"><Text className="text-xs text-amber-500">Referral</Text><Text className="text-sm font-bold text-amber-700">Rs {referral.toLocaleString()}</Text></View>
                <View className="flex-1 bg-emerald-50 rounded-xl p-3 items-center"><Text className="text-xs text-emerald-500">Payout</Text><Text className="text-sm font-bold text-emerald-700">Rs {payout.toLocaleString()}</Text></View>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

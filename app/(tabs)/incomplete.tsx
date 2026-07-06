import { formatDistanceToNow, parseISO } from 'date-fns';
import { useRouter } from 'expo-router';
import { AlertTriangle, Clock, CreditCard, FileText, LucideIcon, Play, RotateCcw, Trash2 } from 'lucide-react-native';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { PageScreen } from '@/src/components/PageScreen';
import { useStore } from '@/src/store/useStore';
import { ProcessDraft } from '@/src/types';

const META: Record<ProcessDraft['type'], { label: string; icon: LucideIcon; color: string; bg: string }> = {
  return: { label: 'Vehicle Return', icon: RotateCcw, color: '#b45309', bg: '#fffbeb' },
  booking: { label: 'Manual Booking', icon: FileText, color: '#1d4ed8', bg: '#eff6ff' },
  payment: { label: 'Payment Settlement', icon: CreditCard, color: '#7e22ce', bg: '#faf5ff' },
};
const RESUME: Record<ProcessDraft['type'], string> = { return: '/handovers', payment: '/handovers', booking: '/settings' };

export default function IncompleteScreen() {
  const router = useRouter();
  const drafts = useStore((s) => s.drafts);
  const discardDraft = useStore((s) => s.discardDraft);

  const age = (iso: string) => {
    try { return formatDistanceToNow(parseISO(iso), { addSuffix: true }); } catch { return ''; }
  };

  return (
    <PageScreen title="Incomplete">
      {drafts.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-14 h-14 rounded-2xl bg-emerald-50 items-center justify-center mb-4"><AlertTriangle size={24} color="#10b981" /></View>
          <Text className="text-sm font-semibold text-slate-700">No incomplete processes</Text>
          <Text className="text-xs text-slate-400 mt-1">Everything is up to date.</Text>
        </View>
      ) : (
        <ScrollView contentContainerClassName="p-4 pb-28">
          <View className="flex-row flex-wrap gap-2 mb-4">
            {(['return', 'booking', 'payment'] as const).map((t) => {
              const list = drafts.filter((d) => d.type === t);
              if (list.length === 0) return null;
              const m = META[t];
              return (
                <View key={t} style={{ backgroundColor: m.bg }} className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl">
                  <m.icon size={14} color={m.color} />
                  <Text style={{ color: m.color }} className="text-xs font-semibold">{list.length} {m.label}{list.length !== 1 ? 's' : ''}</Text>
                </View>
              );
            })}
          </View>

          {drafts.map((d) => {
            const m = META[d.type];
            return (
              <View key={d.id} className="bg-white rounded-2xl border border-slate-100 shadow-[0px_6px_16px_rgba(2,6,23,0.08)] p-4 mb-3">
                <View className="flex-row items-start gap-3">
                  <View style={{ backgroundColor: m.bg }} className="w-10 h-10 rounded-xl items-center justify-center"><m.icon size={16} color={m.color} /></View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-0.5">
                      <View style={{ backgroundColor: m.bg }} className="px-2 py-0.5 rounded-full"><Text style={{ color: m.color }} className="text-[10px] font-bold uppercase">{m.label}</Text></View>
                      <View className="flex-row items-center gap-1"><Clock size={9} color="#94a3b8" /><Text className="text-[10px] text-slate-400">{age(d.updatedAt)}</Text></View>
                    </View>
                    <Text className="text-sm font-semibold text-slate-800" numberOfLines={1}>{d.label}</Text>
                    {d.sublabel ? <Text className="text-xs text-slate-400 mt-0.5" numberOfLines={1}>{d.sublabel}</Text> : null}
                  </View>
                </View>
                <View className="flex-row gap-2 justify-end mt-3">
                  <TouchableOpacity onPress={() => discardDraft(d.id)} className="w-9 h-9 rounded-lg bg-red-50 items-center justify-center"><Trash2 size={15} color="#dc2626" /></TouchableOpacity>
                  <TouchableOpacity onPress={() => router.push(RESUME[d.type] as never)} className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl bg-navy-800">
                    <Play size={11} color="#fff" /><Text className="text-white text-xs font-semibold">Continue</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {drafts.length > 1 && (
            <TouchableOpacity
              onPress={() => Alert.alert('Discard all', 'Discard all incomplete processes?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Discard all', style: 'destructive', onPress: () => drafts.forEach((d) => discardDraft(d.id)) }])}
              className="flex-row items-center justify-center gap-2 py-3"
            >
              <Trash2 size={13} color="#ef4444" /><Text className="text-xs text-red-500">Discard all incomplete processes</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </PageScreen>
  );
}

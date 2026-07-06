import { ArrowUpRight, LucideIcon } from 'lucide-react-native';
import { ReactNode } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export const rs = (n: number) => `Rs ${Math.round(n).toLocaleString()}`;
export const pct = (n: number) => `${Math.round(n * 100)}%`;

/** Small KPI card: icon + label + big value + sub. */
export function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  onPress,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: LucideIcon;
  color: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.85}
      className="bg-white rounded-2xl p-3.5 border border-slate-100 flex-1"
    >
      <View style={{ backgroundColor: color }} className="w-9 h-9 rounded-xl items-center justify-center mb-2">
        <Icon size={17} color="#fff" />
      </View>
      <Text className="text-[11px] text-slate-400 font-medium" numberOfLines={1}>
        {label}
      </Text>
      <Text className="text-lg font-black text-slate-900" numberOfLines={1}>
        {value}
      </Text>
      <Text className="text-[10px] text-slate-400" numberOfLines={1}>
        {sub}
      </Text>
    </TouchableOpacity>
  );
}

/** Wider stat tile (row layout) used by Money Insights / Customer Insights. */
export function StatTile({
  icon: Icon,
  label,
  value,
  sub,
  color,
  tone,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub: string;
  color: string;
  tone?: 'red' | 'emerald';
  onPress?: () => void;
}) {
  const valColor = tone === 'red' ? 'text-red-600' : tone === 'emerald' ? 'text-emerald-600' : 'text-slate-900';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.85}
      className="bg-white rounded-2xl p-3.5 border border-slate-100 flex-row items-start gap-3 flex-1"
    >
      <View style={{ backgroundColor: color }} className="w-9 h-9 rounded-xl items-center justify-center">
        <Icon size={16} color="#fff" />
      </View>
      <View className="flex-1">
        <Text className="text-[11px] text-slate-400 font-medium" numberOfLines={1}>
          {label}
        </Text>
        <Text className={`text-base font-black ${valColor}`} numberOfLines={1}>
          {value}
        </Text>
        <Text className="text-[10px] text-slate-400" numberOfLines={1}>
          {sub}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

/** Card with a titled header, optional count badge, and tap affordance. */
export function Panel({
  title,
  icon: Icon,
  iconColor = '#64748b',
  badge,
  badgeTone = 'muted',
  onPress,
  children,
}: {
  title: string;
  icon: LucideIcon;
  iconColor?: string;
  badge?: number;
  badgeTone?: 'red' | 'blue' | 'amber' | 'muted';
  onPress?: () => void;
  children: ReactNode;
}) {
  const toneCls = {
    red: 'bg-red-100',
    blue: 'bg-blue-100',
    amber: 'bg-amber-100',
    muted: 'bg-slate-100',
  }[badgeTone];
  const toneText = {
    red: 'text-red-600',
    blue: 'text-blue-600',
    amber: 'text-amber-700',
    muted: 'text-slate-500',
  }[badgeTone];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.9}
      className="bg-white rounded-2xl p-4 border border-slate-100 mb-3"
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <Icon size={15} color={iconColor} />
          <Text className="text-sm font-bold text-slate-800">{title}</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          {badge !== undefined && (
            <View className={`px-2 py-0.5 rounded-lg ${toneCls}`}>
              <Text className={`text-xs font-bold ${toneText}`}>{badge}</Text>
            </View>
          )}
          {onPress && <ArrowUpRight size={14} color="#cbd5e1" />}
        </View>
      </View>
      {children}
    </TouchableOpacity>
  );
}

/** Horizontal progress bar with label + value (utilization / profit). */
export function ProgressBar({
  label,
  sub,
  ratio,
  display,
  tone,
}: {
  label: string;
  sub?: string;
  ratio: number;
  display: string;
  tone: 'blue' | 'emerald' | 'red';
}) {
  const bg = { blue: '#4B7BE5', emerald: '#10B981', red: '#EF4444' }[tone];
  return (
    <View className="mb-3">
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-xs text-slate-700 font-medium flex-1" numberOfLines={1}>
          {label}
          {sub ? <Text className="text-slate-400 font-normal"> · {sub}</Text> : null}
        </Text>
        <Text className="text-xs font-semibold text-slate-800 ml-2">{display}</Text>
      </View>
      <View className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <View style={{ width: `${Math.max(2, Math.min(100, ratio * 100))}%`, backgroundColor: bg }} className="h-full rounded-full" />
      </View>
    </View>
  );
}

export function Empty({ text }: { text: string }) {
  return <Text className="text-slate-400 text-xs text-center py-6">{text}</Text>;
}

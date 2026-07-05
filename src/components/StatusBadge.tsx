import { Text, View } from 'react-native';

// Full static class strings so NativeWind's compiler can pick them up.
const bg: Record<string, string> = {
  Available: 'bg-emerald-50',
  Reserved: 'bg-blue-50',
  Ongoing: 'bg-amber-50',
  Maintenance: 'bg-red-50',
  Confirmed: 'bg-blue-50',
  Completed: 'bg-emerald-50',
  Cancelled: 'bg-slate-100',
  Pending: 'bg-amber-50',
  Converted: 'bg-emerald-50',
  Lost: 'bg-red-50',
  Paid: 'bg-emerald-50',
  Credit: 'bg-purple-50',
  'On Duty': 'bg-blue-50',
  Off: 'bg-slate-100',
};

const text: Record<string, string> = {
  Available: 'text-emerald-700',
  Reserved: 'text-blue-700',
  Ongoing: 'text-amber-700',
  Maintenance: 'text-red-700',
  Confirmed: 'text-blue-700',
  Completed: 'text-emerald-700',
  Cancelled: 'text-slate-500',
  Pending: 'text-amber-700',
  Converted: 'text-emerald-700',
  Lost: 'text-red-600',
  Paid: 'text-emerald-700',
  Credit: 'text-purple-700',
  'On Duty': 'text-blue-700',
  Off: 'text-slate-500',
};

const dot: Record<string, string> = {
  Available: 'bg-emerald-500',
  Reserved: 'bg-blue-500',
  Ongoing: 'bg-amber-500',
  Maintenance: 'bg-red-500',
  Confirmed: 'bg-blue-500',
  Completed: 'bg-emerald-500',
  Cancelled: 'bg-slate-400',
  Pending: 'bg-amber-500',
  Converted: 'bg-emerald-500',
  Lost: 'bg-red-500',
  Paid: 'bg-emerald-500',
  Credit: 'bg-purple-500',
  'On Duty': 'bg-blue-500',
  Off: 'bg-slate-400',
};

export function StatusBadge({ status, size = 'sm' }: { status: string; size?: 'sm' | 'md' }) {
  return (
    <View
      className={`flex-row items-center rounded-full ${bg[status] ?? 'bg-slate-100'} ${
        size === 'sm' ? 'px-2.5 py-0.5' : 'px-3 py-1'
      }`}
    >
      <View className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dot[status] ?? 'bg-slate-400'}`} />
      <Text className={`font-medium ${text[status] ?? 'text-slate-600'} ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
        {status}
      </Text>
    </View>
  );
}

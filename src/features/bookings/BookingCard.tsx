import { Car, CheckCircle, ChevronRight, PlayCircle } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';

import { StatusBadge } from '@/src/components/StatusBadge';
import { Booking, Vehicle } from '@/src/types';
import { bookingBalance, fmt12, fmtDateShort } from './format';

const ACCENT: Record<string, string> = {
  Confirmed: '#4B7BE5',
  Ongoing: '#10B981',
  Completed: '#6B7280',
  Cancelled: '#EF4444',
};

export function BookingCard({
  booking,
  vehicle,
  onView,
  onStart,
  onComplete,
}: {
  booking: Booking;
  vehicle?: Vehicle;
  onView: () => void;
  onStart: () => void;
  onComplete: () => void;
}) {
  const b = booking;
  const balance = bookingBalance(b);

  return (
    <TouchableOpacity onPress={onView} activeOpacity={0.85} className="bg-white rounded-2xl mb-3 border border-slate-100 overflow-hidden">
      <View style={{ height: 4, backgroundColor: ACCENT[b.status] ?? '#E8EFF8' }} />
      <View className="p-4">
        {/* vehicle + status */}
        <View className="flex-row items-center gap-3 mb-3">
          <View className="w-11 h-11 rounded-xl bg-slate-50 items-center justify-center">
            <Car size={18} color="#475569" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-slate-900" numberOfLines={1}>
              {vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Vehicle'}
            </Text>
            <Text className="text-[11px] text-slate-400">{vehicle?.vehicleNumber ?? '—'}</Text>
          </View>
          <StatusBadge status={b.status} />
        </View>

        {/* customer */}
        <Text className="text-sm font-semibold text-slate-700" numberOfLines={1}>
          {b.customerName}
        </Text>
        <Text className="text-[11px] text-slate-400 mb-3">{b.customerPhone || '—'}</Text>

        {/* timeline */}
        <View className="flex-row items-center bg-slate-50 rounded-xl px-3 py-2 mb-3">
          <View className="flex-1 items-center">
            <Text className="text-sm font-black text-slate-800">{fmt12(b.startTime) || fmtDateShort(b.startDate)}</Text>
            <Text className="text-[10px] text-slate-500 mt-0.5">{fmtDateShort(b.startDate)}</Text>
          </View>
          <View className="items-center px-2">
            <Text className="text-[9px] text-slate-400">{b.totalDays}d</Text>
            <Car size={12} color="#60a5fa" />
          </View>
          <View className="flex-1 items-center">
            <Text className="text-sm font-black text-slate-800">{fmt12(b.endTime) || fmtDateShort(b.endDate)}</Text>
            <Text className="text-[10px] text-slate-500 mt-0.5">{fmtDateShort(b.endDate)}</Text>
          </View>
        </View>

        {/* price + action */}
        <View className="flex-row items-end justify-between">
          <View>
            <Text className="text-lg font-black text-slate-900">Rs {b.totalAmount.toLocaleString()}</Text>
            {balance > 0 ? (
              <Text className="text-[11px] text-red-500 font-semibold">Rs {balance.toLocaleString()} due</Text>
            ) : (
              <Text className="text-[11px] text-emerald-600 font-semibold">Fully paid</Text>
            )}
          </View>

          {b.status === 'Confirmed' ? (
            <TouchableOpacity onPress={onStart} className="flex-row items-center gap-1 bg-blue-600 rounded-lg px-3.5 py-2">
              <PlayCircle size={14} color="#fff" />
              <Text className="text-white text-xs font-semibold">Start</Text>
            </TouchableOpacity>
          ) : b.status === 'Ongoing' ? (
            <TouchableOpacity onPress={onComplete} className="flex-row items-center gap-1 bg-blue-600 rounded-lg px-3.5 py-2">
              <CheckCircle size={14} color="#fff" />
              <Text className="text-white text-xs font-semibold">Complete</Text>
            </TouchableOpacity>
          ) : (
            <View className="flex-row items-center gap-1">
              <Text className="text-xs font-semibold text-blue-600">Details</Text>
              <ChevronRight size={13} color="#2563eb" />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

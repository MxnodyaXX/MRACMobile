import { Image } from 'expo-image';
import { AlertTriangle, Car, Hash, Pencil, Trash2 } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';

import { StatusBadge } from '@/src/components/StatusBadge';
import { isInsuranceComplete } from '@/src/lib/insurance';
import { vehicleNetRevenue } from '@/src/lib/revenue';
import { Booking, Owner, Vehicle } from '@/src/types';

export function VehicleCard({
  vehicle,
  owner,
  bookings,
  mine,
  canEdit,
  canDelete,
  onView,
  onEdit,
  onDelete,
}: {
  vehicle: Vehicle;
  owner?: Owner;
  bookings: Booking[];
  mine: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const v = vehicle;

  return (
    <TouchableOpacity
      onPress={onView}
      activeOpacity={0.85}
      className="bg-white rounded-2xl p-4 mb-3 border border-slate-100"
    >
      {/* Image / placeholder */}
      <View className="h-28 rounded-xl bg-slate-100 mb-3 overflow-hidden items-center justify-center">
        {v.imageUrl ? (
          <Image source={{ uri: v.imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        ) : (
          <Car size={30} color="#cbd5e1" />
        )}
        <View className="absolute top-2 right-2">
          <StatusBadge status={v.status} />
        </View>
        {!mine && (
          <View className="absolute top-2 left-2 bg-navy-700/70 rounded-full px-2 py-0.5">
            <Text className="text-[10px] text-white">View only</Text>
          </View>
        )}
      </View>

      {/* Title */}
      <View className="flex-row items-center gap-3 mb-3">
        <View className="w-9 h-9 rounded-xl bg-slate-50 items-center justify-center">
          <Car size={16} color="#475569" />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-slate-900" numberOfLines={1}>
            {v.brand} {v.model}
          </Text>
          <Text className="text-xs text-slate-400">
            {v.vehicleNumber} · {v.year}
          </Text>
        </View>
      </View>

      {/* Spec grid */}
      <View className="flex-row flex-wrap mb-3">
        <Spec label="Owner" value={owner?.name ?? '—'} />
        <Spec label="Daily Rent" value={`Rs ${v.dailyRent.toLocaleString()}`} />
        <Spec label="Fuel" value={v.fuelType ?? '—'} />
        <Spec label="Transmission" value={v.transmission ?? '—'} />
      </View>

      {mine && !isInsuranceComplete(v) && (
        <View className="flex-row items-center gap-1.5 bg-orange-50 rounded-lg px-2.5 py-1.5 mb-3">
          <AlertTriangle size={11} color="#ea580c" />
          <Text className="text-[11px] text-orange-600">Insurance details incomplete</Text>
        </View>
      )}

      {/* Footer */}
      <View className="flex-row items-center justify-between border-t border-slate-50 pt-3">
        <View className="flex-row items-center gap-4">
          <View>
            <Text className="text-xs text-slate-400">Revenue</Text>
            <Text className="text-sm font-bold text-slate-700">
              Rs {vehicleNetRevenue(v, bookings).toLocaleString()}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Hash size={11} color="#94a3b8" />
            <Text className="text-xs font-semibold text-slate-500">{v.rentCount ?? 0} rentals</Text>
          </View>
        </View>

        {mine && (
          <View className="flex-row gap-1">
            {canEdit && (
              <TouchableOpacity onPress={onEdit} hitSlop={8} className="w-9 h-9 rounded-lg items-center justify-center bg-slate-50">
                <Pencil size={15} color="#475569" />
              </TouchableOpacity>
            )}
            {canDelete && (
              <TouchableOpacity onPress={onDelete} hitSlop={8} className="w-9 h-9 rounded-lg items-center justify-center bg-red-50">
                <Trash2 size={15} color="#dc2626" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <View className="w-1/2 mb-2">
      <Text className="text-xs text-slate-400">{label}</Text>
      <Text className="text-xs font-medium text-slate-700" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

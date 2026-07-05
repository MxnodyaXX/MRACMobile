import { Image } from 'expo-image';
import { Camera, X } from 'lucide-react-native';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StatusBadge } from '@/src/components/StatusBadge';
import { vehicleNetRevenue } from '@/src/lib/revenue';
import { Booking, Owner, Vehicle } from '@/src/types';

export function VehicleDetailModal({
  vehicle,
  owner,
  bookings,
  canEdit,
  onClose,
  onEdit,
}: {
  vehicle: Vehicle | null;
  owner?: Owner;
  bookings: Booking[];
  canEdit: boolean;
  onClose: () => void;
  onEdit: () => void;
}) {
  const v = vehicle;
  const specs: [string, string | number][] = v
    ? [
        ['Owner', owner?.name ?? '—'],
        ['Daily Rent', `Rs ${v.dailyRent.toLocaleString()}`],
        ['Included km', `${v.includedKmPerDay ?? 100} km/day`],
        ['Extra km rate', `Rs ${v.extraKmRate ?? 50}/km`],
        ['Color', v.color ?? '—'],
        ['Fuel', v.fuelType ?? '—'],
        ['Transmission', v.transmission ?? '—'],
        ['Seats', v.seats ?? '—'],
        ['Mileage', v.mileage ? `${v.mileage.toLocaleString()} km` : '—'],
        ['Revenue', `Rs ${vehicleNetRevenue(v, bookings).toLocaleString()}`],
        ['Total Rentals', v.rentCount ?? 0],
      ]
    : [];

  return (
    <Modal visible={!!v} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-row items-center justify-between px-5 py-3 border-b border-slate-100">
          <Text className="text-lg font-bold text-slate-900">Vehicle Details</Text>
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <X size={22} color="#64748b" />
          </TouchableOpacity>
        </View>

        {v && (
          <ScrollView contentContainerClassName="p-5 pb-24">
            <View className="h-44 rounded-2xl bg-slate-100 overflow-hidden items-center justify-center mb-4">
              {v.imageUrl ? (
                <Image source={{ uri: v.imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              ) : (
                <View className="items-center gap-1.5">
                  <Camera size={20} color="#cbd5e1" />
                  <Text className="text-xs text-slate-400">No photo yet</Text>
                </View>
              )}
            </View>

            <View className="flex-row items-center gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-xl font-bold text-slate-900">
                  {v.brand} {v.model}
                </Text>
                <Text className="text-sm text-slate-400">
                  {v.vehicleNumber} · {v.year}
                </Text>
              </View>
              <StatusBadge status={v.status} size="md" />
            </View>

            <View className="flex-row flex-wrap -mx-1">
              {specs.map(([label, val]) => (
                <View key={label} className="w-1/2 px-1 mb-2">
                  <View className="bg-slate-50 rounded-xl p-3">
                    <Text className="text-xs text-slate-400">{label}</Text>
                    <Text className="text-sm font-semibold text-slate-800 mt-0.5">{String(val)}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View className="bg-slate-50 rounded-xl p-4 mt-2">
              <Text className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Insurance</Text>
              <View className="flex-row flex-wrap">
                <InsCell label="Provider" value={v.insurance.provider || '—'} />
                <InsCell label="Policy #" value={v.insurance.policyNumber || '—'} />
                <InsCell label="Expiry" value={v.insurance.expiryDate || '—'} />
                <InsCell label="Premium" value={`Rs ${v.insurance.premium.toLocaleString()}`} />
              </View>
            </View>
          </ScrollView>
        )}

        <View className="flex-row gap-3 px-5 py-3 border-t border-slate-100">
          {canEdit && (
            <TouchableOpacity onPress={onEdit} className="flex-1 items-center justify-center rounded-xl py-3 bg-slate-100">
              <Text className="text-slate-700 font-semibold">Edit</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onClose} className="flex-1 items-center justify-center rounded-xl py-3 bg-navy-800">
            <Text className="text-white font-semibold">Close</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function InsCell({ label, value }: { label: string; value: string }) {
  return (
    <View className="w-1/2 mb-2">
      <Text className="text-xs text-slate-400">{label}</Text>
      <Text className="text-sm font-medium text-slate-700">{value}</Text>
    </View>
  );
}

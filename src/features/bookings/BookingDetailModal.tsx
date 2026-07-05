import { CheckCircle, PlayCircle, X } from 'lucide-react-native';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StatusBadge } from '@/src/components/StatusBadge';
import { Booking, Driver, Owner, Vehicle } from '@/src/types';
import { bookingBalance } from './format';

export function BookingDetailModal({
  booking,
  vehicle,
  owner,
  driver,
  onClose,
  onStart,
  onComplete,
  onCancel,
}: {
  booking: Booking | null;
  vehicle?: Vehicle;
  owner?: Owner;
  driver?: Driver;
  onClose: () => void;
  onStart: () => void;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const b = booking;
  const balance = b ? bookingBalance(b) : 0;

  const rows: [string, string][] = b
    ? [
        ['Vehicle', `${vehicle?.brand ?? ''} ${vehicle?.model ?? ''}`.trim() || '—'],
        ['Reg. No.', vehicle?.vehicleNumber ?? '—'],
        ['Owner', owner?.name ?? '—'],
        ['Start Date', b.startDate + (b.startTime ? ` ${b.startTime}` : '')],
        ['End Date', b.endDate + (b.endTime ? ` ${b.endTime}` : '')],
        ['Duration', `${b.totalDays} day${b.totalDays !== 1 ? 's' : ''}`],
        ['Referral', b.referral ?? 'Direct'],
        ...((b.referralFee ?? 0) > 0 ? ([['Referral Fee', `Rs ${(b.referralFee ?? 0).toLocaleString()}`]] as [string, string][]) : []),
        ['Driver', driver?.name ?? '—'],
        ['Pickup', b.pickupLocation || '—'],
        ['Drop', b.dropLocation || '—'],
        ...(b.depositType ? ([['Deposit', b.depositType === 'cash' ? `Cash · Rs ${(b.depositAmount ?? 0).toLocaleString()}` : `${b.depositType} · ${b.depositAssetDescription ?? ''}`]] as [string, string][]) : []),
      ]
    : [];

  return (
    <Modal visible={!!b} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="flex-row items-center justify-between px-5 py-3 border-b border-slate-100">
          <Text className="text-lg font-bold text-slate-900">Booking Details</Text>
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <X size={22} color="#64748b" />
          </TouchableOpacity>
        </View>

        {b && (
          <ScrollView contentContainerClassName="p-5 pb-24">
            <View className="flex-row items-start justify-between mb-4">
              <View className="flex-1 pr-3">
                <Text className="text-xl font-bold text-slate-900">{b.customerName}</Text>
                <Text className="text-sm text-slate-400">
                  {b.customerPhone}
                  {b.customerNIC ? ` · ${b.customerNIC}` : ''}
                </Text>
              </View>
              <StatusBadge status={b.status} size="md" />
            </View>

            {/* Financials */}
            <View className="bg-navy-800 rounded-2xl p-4 mb-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-white/60 text-sm">Total</Text>
                <Text className="text-white font-bold">Rs {b.totalAmount.toLocaleString()}</Text>
              </View>
              {(b.discount ?? 0) > 0 && (
                <View className="flex-row justify-between mb-2">
                  <Text className="text-white/60 text-sm">Discount</Text>
                  <Text className="text-white font-bold">− Rs {(b.discount ?? 0).toLocaleString()}</Text>
                </View>
              )}
              <View className="flex-row justify-between mb-2">
                <Text className="text-white/60 text-sm">Paid</Text>
                <Text className="text-white font-bold">Rs {b.paidAmount.toLocaleString()}</Text>
              </View>
              <View className="border-t border-white/10 pt-2 flex-row justify-between">
                <Text className="text-white/60 text-sm">Balance</Text>
                <Text className={`font-black ${balance > 0 ? 'text-red-300' : 'text-emerald-300'}`}>
                  {balance > 0 ? `Rs ${balance.toLocaleString()} due` : 'Fully paid'}
                </Text>
              </View>
            </View>

            <View className="flex-row flex-wrap -mx-1">
              {rows.map(([label, val]) => (
                <View key={label} className="w-1/2 px-1 mb-2">
                  <View className="bg-slate-50 rounded-xl p-3">
                    <Text className="text-xs text-slate-400">{label}</Text>
                    <Text className="text-sm font-semibold text-slate-800 mt-0.5">{val}</Text>
                  </View>
                </View>
              ))}
            </View>

            {b.notes ? (
              <View className="bg-slate-50 rounded-xl p-3 mt-2">
                <Text className="text-xs text-slate-400 mb-1">Notes</Text>
                <Text className="text-sm text-slate-700">{b.notes}</Text>
              </View>
            ) : null}
          </ScrollView>
        )}

        {/* Actions */}
        {b && (
          <View className="px-5 py-3 border-t border-slate-100 gap-2">
            {b.status === 'Confirmed' && (
              <View className="flex-row gap-3">
                <TouchableOpacity onPress={onCancel} className="flex-1 items-center justify-center rounded-xl py-3 bg-red-50">
                  <Text className="text-red-600 font-semibold">Cancel Booking</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onStart} className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-3 bg-blue-600">
                  <PlayCircle size={16} color="#fff" />
                  <Text className="text-white font-semibold">Start Rental</Text>
                </TouchableOpacity>
              </View>
            )}
            {b.status === 'Ongoing' && (
              <TouchableOpacity onPress={onComplete} className="flex-row items-center justify-center gap-1.5 rounded-xl py-3 bg-blue-600">
                <CheckCircle size={16} color="#fff" />
                <Text className="text-white font-semibold">Complete Rental</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} className="items-center justify-center rounded-xl py-3 bg-slate-100">
              <Text className="text-slate-700 font-semibold">Close</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

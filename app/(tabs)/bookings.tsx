import { Plus } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SkeletonCard } from '@/src/components/Skeleton';
import { TabScreen } from '@/src/components/TabScreen';
import { BookingCard } from '@/src/features/bookings/BookingCard';
import { BookingDetailModal } from '@/src/features/bookings/BookingDetailModal';
import { BookingFormModal, NewBooking } from '@/src/features/bookings/BookingFormModal';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useStore } from '@/src/store/useStore';
import { Booking } from '@/src/types';

const TABS = ['All', 'Confirmed', 'Ongoing', 'Completed', 'Cancelled'] as const;
type Tab = (typeof TABS)[number];

export default function BookingsScreen() {
  const vehicles = useStore((s) => s.vehicles);
  const bookings = useStore((s) => s.bookings);
  const drivers = useStore((s) => s.drivers);
  const owners = useStore((s) => s.owners);
  const customers = useStore((s) => s.customers);
  const loaded = useStore((s) => s.loaded);
  const loadAll = useStore((s) => s.loadAll);
  const addBooking = useStore((s) => s.addBooking);
  const startBooking = useStore((s) => s.startBooking);
  const completeBooking = useStore((s) => s.completeBooking);
  const cancelBooking = useStore((s) => s.cancelBooking);
  const isVehicleAvailable = useStore((s) => s.isVehicleAvailable);

  const currentUser = useAuthStore((s) => s.currentUser);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const can = useAuthStore((s) => s.can);

  const [tab, setTab] = useState<Tab>('All');
  const [refreshing, setRefreshing] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [viewing, setViewing] = useState<Booking | null>(null);

  useEffect(() => {
    if (!loaded) loadAll();
  }, [loaded, loadAll]);

  // Owners see only bookings for their own vehicles.
  const myVehicleIds = useMemo(
    () =>
      currentUser?.role === 'owner'
        ? vehicles.filter((v) => v.ownerId === currentUser.ownerId).map((v) => v.id)
        : null,
    [currentUser, vehicles],
  );
  const visible = myVehicleIds ? bookings.filter((b) => myVehicleIds.includes(b.vehicleId)) : bookings;
  const bookable = myVehicleIds ? vehicles.filter((v) => myVehicleIds.includes(v.id)) : vehicles;

  const filtered = useMemo(
    () =>
      [...visible]
        .filter((b) => tab === 'All' || b.status === tab)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [visible, tab],
  );

  const refresh = async () => {
    setRefreshing(true);
    try {
      await loadAll();
    } finally {
      setRefreshing(false);
    }
  };

  const canBook = isAdmin() || can('canBook');

  const submit = (data: NewBooking) => {
    addBooking(data);
    setFormOpen(false);
  };

  const confirmCancel = (b: Booking) => {
    Alert.alert('Cancel booking', `Cancel ${b.customerName}'s booking?`, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel booking',
        style: 'destructive',
        onPress: () => {
          cancelBooking(b.id);
          setViewing(null);
        },
      },
    ]);
  };

  // Keep the open detail modal in sync after a lifecycle action mutates the store.
  const synced = viewing ? bookings.find((b) => b.id === viewing.id) ?? null : null;

  return (
    <TabScreen>
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="flex-row items-center justify-between px-5 pt-2 pb-3">
        <View>
          <Text className="text-2xl font-black text-slate-900">Bookings</Text>
          <Text className="text-sm text-slate-500">{visible.length} reservations</Text>
        </View>
        {canBook && (
          <TouchableOpacity onPress={() => setFormOpen(true)} className="flex-row items-center gap-1.5 bg-navy-800 rounded-xl px-3.5 py-2.5">
            <Plus size={16} color="#fff" />
            <Text className="text-white font-semibold text-sm">New</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View className="flex-row flex-wrap gap-2 px-5 pb-3">
        {TABS.map((t) => {
          const active = tab === t;
          const count = t === 'All' ? visible.length : visible.filter((b) => b.status === t).length;
          return (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              className={`px-3 py-1.5 rounded-xl ${active ? 'bg-navy-800' : 'bg-white border border-slate-200'}`}
            >
              <Text className={`text-xs font-medium ${active ? 'text-white' : 'text-slate-500'}`}>
                {t} {t !== 'All' ? count : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(b) => b.id}
        contentContainerClassName="px-5 pb-32"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#0D1B45" />}
        renderItem={({ item }) => (
          <BookingCard
            booking={item}
            vehicle={vehicles.find((v) => v.id === item.vehicleId)}
            onView={() => setViewing(item)}
            onStart={() => startBooking(item.id)}
            onComplete={() => completeBooking(item.id)}
          />
        )}
        ListEmptyComponent={
          loaded ? (
            <View className="items-center py-20">
              <Text className="text-slate-400 text-sm">No bookings found.</Text>
            </View>
          ) : (
            <View>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </View>
          )
        }
      />

      <BookingFormModal
        visible={formOpen}
        vehicles={bookable}
        customers={customers}
        drivers={drivers}
        owners={owners}
        isVehicleAvailable={isVehicleAvailable}
        onClose={() => setFormOpen(false)}
        onSubmit={submit}
      />

      <BookingDetailModal
        booking={synced}
        vehicle={synced ? vehicles.find((v) => v.id === synced.vehicleId) : undefined}
        owner={synced ? owners.find((o) => o.id === vehicles.find((v) => v.id === synced.vehicleId)?.ownerId) : undefined}
        driver={synced ? drivers.find((d) => d.id === synced.driverId) : undefined}
        onClose={() => setViewing(null)}
        onStart={() => synced && startBooking(synced.id)}
        onComplete={() => synced && completeBooking(synced.id)}
        onCancel={() => synced && confirmCancel(synced)}
      />
    </SafeAreaView>
    </TabScreen>
  );
}

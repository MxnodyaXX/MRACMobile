import { Plus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SkeletonCard } from '@/src/components/Skeleton';
import { TabScreen } from '@/src/components/TabScreen';
import { VehicleCard } from '@/src/features/vehicles/VehicleCard';
import { VehicleDetailModal } from '@/src/features/vehicles/VehicleDetailModal';
import { VehicleForm, VehicleFormModal } from '@/src/features/vehicles/VehicleFormModal';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useStore } from '@/src/store/useStore';
import { Vehicle, VehicleStatus } from '@/src/types';

const STATUS_OPTIONS: VehicleStatus[] = ['Available', 'Reserved', 'Ongoing', 'Maintenance'];
const FILTERS = ['All', ...STATUS_OPTIONS] as const;
type Filter = (typeof FILTERS)[number];

export default function VehiclesScreen() {
  const vehicles = useStore((s) => s.vehicles);
  const owners = useStore((s) => s.owners);
  const bookings = useStore((s) => s.bookings);
  const loaded = useStore((s) => s.loaded);
  const loadAll = useStore((s) => s.loadAll);
  const addVehicle = useStore((s) => s.addVehicle);
  const updateVehicle = useStore((s) => s.updateVehicle);
  const deleteVehicle = useStore((s) => s.deleteVehicle);

  const currentUser = useAuthStore((s) => s.currentUser);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const can = useAuthStore((s) => s.can);

  const [filter, setFilter] = useState<Filter>('All');
  const [refreshing, setRefreshing] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [viewing, setViewing] = useState<Vehicle | null>(null);

  useEffect(() => {
    if (!loaded) loadAll();
  }, [loaded, loadAll]);

  const canActOn = (v: Vehicle) => isAdmin() || v.ownerId === currentUser?.ownerId;
  const canAdd = isAdmin() || can('canEditVehicle');

  const filtered = filter === 'All' ? vehicles : vehicles.filter((v) => v.status === filter);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await loadAll();
    } finally {
      setRefreshing(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setFormMode('add');
  };
  const openEdit = (v: Vehicle) => {
    setViewing(null);
    setEditing(v);
    setFormMode('edit');
  };
  const confirmDelete = (v: Vehicle) => {
    Alert.alert('Delete vehicle', `Remove ${v.brand} ${v.model} (${v.vehicleNumber}) from the fleet?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteVehicle(v.id) },
    ]);
  };

  const submit = (form: VehicleForm) => {
    if (formMode === 'edit' && editing) {
      updateVehicle(editing.id, form);
    } else {
      addVehicle(form);
    }
    setFormMode(null);
    setEditing(null);
  };

  return (
    <TabScreen>
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-2 pb-3">
        <View>
          <Text className="text-2xl font-black text-slate-900">Vehicles</Text>
          <Text className="text-sm text-slate-500">{vehicles.length} in your fleet</Text>
        </View>
        {canAdd && (
          <TouchableOpacity onPress={openAdd} className="flex-row items-center gap-1.5 bg-navy-800 rounded-xl px-3.5 py-2.5">
            <Plus size={16} color="#fff" />
            <Text className="text-white font-semibold text-sm">Add</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips */}
      <View className="flex-row flex-wrap gap-2 px-5 pb-3">
        {FILTERS.map((f) => {
          const active = filter === f;
          const count = f === 'All' ? vehicles.length : vehicles.filter((v) => v.status === f).length;
          return (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl ${active ? 'bg-navy-800' : 'bg-white border border-slate-200'}`}
            >
              <Text className={`text-xs font-medium ${active ? 'text-white' : 'text-slate-500'}`}>
                {f} {f !== 'All' ? count : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(v) => v.id}
        contentContainerClassName="px-5 pb-32"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#0D1B45" />}
        renderItem={({ item }) => (
          <VehicleCard
            vehicle={item}
            owner={owners.find((o) => o.id === item.ownerId)}
            bookings={bookings}
            mine={canActOn(item)}
            canEdit={canActOn(item) && can('canEditVehicle')}
            canDelete={isAdmin()}
            onView={() => setViewing(item)}
            onEdit={() => openEdit(item)}
            onDelete={() => confirmDelete(item)}
          />
        )}
        ListEmptyComponent={
          loaded ? (
            <View className="items-center py-20">
              <Text className="text-slate-400 text-sm">No vehicles found.</Text>
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

      {/* Add / Edit */}
      <VehicleFormModal
        visible={formMode !== null}
        mode={formMode === 'edit' ? 'edit' : 'add'}
        initial={editing}
        owners={owners}
        onClose={() => {
          setFormMode(null);
          setEditing(null);
        }}
        onSubmit={submit}
      />

      {/* Detail */}
      <VehicleDetailModal
        vehicle={viewing}
        owner={viewing ? owners.find((o) => o.id === viewing.ownerId) : undefined}
        bookings={bookings}
        canEdit={!!viewing && canActOn(viewing) && can('canEditVehicle')}
        onClose={() => setViewing(null)}
        onEdit={() => viewing && openEdit(viewing)}
      />
    </SafeAreaView>
    </TabScreen>
  );
}

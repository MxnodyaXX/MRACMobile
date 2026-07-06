import { useRouter } from 'expo-router';
import {
  AlertTriangle, Bell, CalendarDays, Car, Contact, CreditCard, HandCoins, LayoutDashboard,
  LucideIcon, MessageSquare, Percent, Receipt, Settings, ShieldCheck, Truck, UserCheck, Users,
} from 'lucide-react-native';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TabScreen } from '@/src/components/TabScreen';
import { OwnerPermissions } from '@/src/types/auth';
import { useAuthStore } from '@/src/store/useAuthStore';

type PermKey = keyof Omit<OwnerPermissions, 'disabled'>;

type Item = {
  label: string;
  icon: LucideIcon;
  route: string;
  always?: boolean;
  admin?: boolean;
  perm?: PermKey;
};

const ITEMS: Item[] = [
  { label: 'Dashboard', icon: LayoutDashboard, route: '/', always: true },
  { label: 'Vehicles', icon: Car, route: '/vehicles', always: true },
  { label: 'Bookings', icon: CalendarDays, route: '/bookings', always: true },
  { label: 'Commissions', icon: Percent, route: '/commissions', always: true },
  { label: 'Referrals', icon: HandCoins, route: '/referrals', perm: 'canViewReferrals' },
  { label: 'Owners', icon: Users, route: '/owners', admin: true },
  { label: 'Expenses', icon: Receipt, route: '/expenses', perm: 'canViewExpenses' },
  { label: 'Drivers', icon: UserCheck, route: '/drivers', perm: 'canViewDrivers' },
  { label: 'Handovers', icon: Truck, route: '/handovers', perm: 'canViewHandovers' },
  { label: 'Customers', icon: Contact, route: '/customers', perm: 'canViewCustomers' },
  { label: 'Inquiries', icon: MessageSquare, route: '/inquiries', perm: 'canViewInquiries' },
  { label: 'Notifications', icon: Bell, route: '/alerts', always: true },
  { label: 'Incomplete', icon: AlertTriangle, route: '/incomplete', perm: 'canViewIncomplete' },
  { label: 'Credit', icon: CreditCard, route: '/credit', admin: true },
  { label: 'Permissions', icon: ShieldCheck, route: '/permissions', admin: true },
  { label: 'Settings', icon: Settings, route: '/settings', always: true },
];

export default function MoreScreen() {
  const router = useRouter();
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const can = useAuthStore((s) => s.can);

  const visible = ITEMS.filter((it) => {
    if (isAdmin()) return true;
    if (it.admin) return false;
    if (it.always) return true;
    if (it.perm) return can(it.perm);
    return false;
  });

  return (
    <TabScreen>
      <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
        <View className="px-5 pt-2 pb-3">
          <Text className="text-2xl font-black text-slate-900">All Pages</Text>
          <Text className="text-sm text-slate-500">Every section of the system</Text>
        </View>

        <ScrollView contentContainerClassName="px-4 pb-32">
          <View className="flex-row flex-wrap">
            {visible.map((it) => (
              <View key={it.route + it.label} className="w-1/3 p-1.5">
                <TouchableOpacity
                  onPress={() => router.push(it.route as never)}
                  activeOpacity={0.85}
                  className="bg-white rounded-2xl border border-slate-100 shadow-[0px_6px_16px_rgba(2,6,23,0.08)] items-center justify-center py-5 px-2"
                >
                  <View className="w-12 h-12 rounded-2xl bg-navy-50 items-center justify-center mb-2">
                    <it.icon size={22} color="#0D1B45" />
                  </View>
                  <Text className="text-xs font-semibold text-slate-700 text-center" numberOfLines={1}>
                    {it.label}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </TabScreen>
  );
}

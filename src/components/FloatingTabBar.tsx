import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Bell, CalendarDays, Car, Home, LucideIcon, Percent } from 'lucide-react-native';
import { Platform, Pressable, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS: Record<string, { icon: LucideIcon; label: string }> = {
  index: { icon: Home, label: 'Home' },
  bookings: { icon: CalendarDays, label: 'Bookings' },
  vehicles: { icon: Car, label: 'Vehicles' },
  alerts: { icon: Bell, label: 'Alerts' },
  commissions: { icon: Percent, label: 'Fees' },
};

const ACTIVE = '#0D1B45';
const INACTIVE = 'rgba(255,255,255,0.6)';

function TabItem({
  focused,
  label,
  Icon,
  onPress,
  onLongPress,
}: {
  focused: boolean;
  label: string;
  Icon: LucideIcon;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const press = useSharedValue(0);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 - press.value * 0.1 }] }));

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => (press.value = withTiming(1, { duration: 90 }))}
      onPressOut={() => (press.value = withTiming(0, { duration: 150 }))}
      hitSlop={4}
    >
      {/* Active item: white highlight pill with the label. Inactive: icon only.
          Rendering the label only when focused keeps the layout correct on every
          platform (no dependence on an animated width). */}
      <Animated.View
        style={pressStyle}
        className={`flex-row items-center justify-center rounded-full ${
          focused ? 'bg-white px-4' : 'px-3'
        }`}
        // eslint-disable-next-line react-native/no-inline-styles
      >
        <View style={{ height: 40, justifyContent: 'center' }}>
          <Icon size={21} color={focused ? ACTIVE : INACTIVE} strokeWidth={focused ? 2.4 : 2} />
        </View>
        {focused && (
          <Animated.Text
            entering={FadeIn.duration(200)}
            numberOfLines={1}
            style={{ color: ACTIVE, fontWeight: '700', fontSize: 13, marginLeft: 8 }}
          >
            {label}
          </Animated.Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={{ paddingBottom: Math.max(insets.bottom, 12), paddingTop: 8, backgroundColor: '#f8fafc' }}
      className="items-center"
    >
      <View
        className="flex-row items-center rounded-full px-2 py-1.5"
        style={{
          gap: 4,
          backgroundColor: '#0D1B45',
          shadowColor: '#0D1B45',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.35,
          shadowRadius: 20,
          elevation: 12,
          ...(Platform.OS === 'web' ? { boxShadow: '0 12px 32px rgba(13,27,69,0.4)' } : null),
        }}
      >
        {state.routes.map((route, index) => {
          const cfg = TABS[route.name];
          if (!cfg) return null;
          const focused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          const onLongPress = () => navigation.emit({ type: 'tabLongPress', target: route.key });

          return (
            <TabItem
              key={route.key}
              focused={focused}
              label={cfg.label}
              Icon={cfg.icon}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
}

import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Bell, CalendarDays, Car, Home, LucideIcon, Percent } from 'lucide-react-native';
import { useEffect } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  index: { icon: Home, label: 'Home' },
  bookings: { icon: CalendarDays, label: 'Bookings' },
  vehicles: { icon: Car, label: 'Vehicles' },
  alerts: { icon: Bell, label: 'Alerts' },
  commissions: { icon: Percent, label: 'Fees' },
};

const ACTIVE = '#ffffff';
const INACTIVE = 'rgba(255,255,255,0.55)';

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
  const p = useSharedValue(focused ? 1 : 0);
  const press = useSharedValue(0);

  useEffect(() => {
    p.value = withSpring(focused ? 1 : 0, { damping: 16, stiffness: 160, mass: 0.6 });
  }, [focused, p]);

  // Estimated label width so we can animate the reveal without measuring.
  const estW = label.length * 8.5 + 6;

  const pillStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(255,255,255,${0.16 * p.value})`,
    transform: [{ scale: 1 - press.value * 0.08 }],
  }));
  const labelStyle = useAnimatedStyle(() => ({
    width: p.value * estW,
    opacity: p.value,
    marginLeft: p.value * 8,
  }));

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => (press.value = withTiming(1, { duration: 90 }))}
      onPressOut={() => (press.value = withTiming(0, { duration: 140 }))}
      hitSlop={6}
    >
      <Animated.View style={pillStyle} className="flex-row items-center rounded-full px-3.5 py-2.5">
        <Icon size={21} color={focused ? ACTIVE : INACTIVE} strokeWidth={focused ? 2.4 : 2} />
        <Animated.View style={[labelStyle, { overflow: 'hidden' }]}>
          <Text numberOfLines={1} style={{ width: estW, color: ACTIVE, fontWeight: '700', fontSize: 13 }}>
            {label}
          </Text>
        </Animated.View>
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
          const cfg = ICONS[route.name];
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

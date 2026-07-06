import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Bell, CalendarDays, Car, Home, LucideIcon, Percent } from 'lucide-react-native';
import { Platform, Pressable, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS: Record<string, { icon: LucideIcon; label: string }> = {
  index: { icon: Home, label: 'Home' },
  bookings: { icon: CalendarDays, label: 'Bookings' },
  vehicles: { icon: Car, label: 'Vehicles' },
  alerts: { icon: Bell, label: 'Alerts' },
  commissions: { icon: Percent, label: 'Fees' },
};

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
      hitSlop={6}
    >
      {/* Active tab: white highlight pill with icon + name side-by-side.
          Layout is set via explicit style (not className) because NativeWind
          doesn't reliably process className on a reanimated Animated.View —
          without this the row falls back to a column and the name stacks under
          the icon. */}
      <Animated.View
        style={[
          pressStyle,
          {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            height: 44,
            borderRadius: 999,
            paddingHorizontal: focused ? 16 : 12,
            backgroundColor: focused ? 'rgba(255,255,255,0.16)' : 'transparent',
          },
        ]}
      >
        <Icon size={21} color={focused ? '#ffffff' : 'rgba(255,255,255,0.6)'} strokeWidth={focused ? 2.6 : 2} />
        {focused && (
          <Animated.Text
            entering={FadeIn.duration(200)}
            numberOfLines={1}
            style={{ color: '#ffffff', fontWeight: '700', fontSize: 13, marginLeft: 8 }}
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
  const { width } = useWindowDimensions();
  const barWidth = Math.min(width - 24, 460); // wide, but capped on large screens

  return (
    // Absolutely positioned so it floats OVER the screen content (no panel strip).
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingBottom: Math.max(insets.bottom, 14) }}
    >
      <View
        className="flex-row items-center rounded-full py-2 px-3"
        style={{
          width: barWidth,
          justifyContent: 'space-between',
          backgroundColor: '#0D1B45',
          shadowColor: '#0D1B45',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.35,
          shadowRadius: 24,
          elevation: 14,
          ...(Platform.OS === 'web' ? { boxShadow: '0 14px 36px rgba(13,27,69,0.45)' } : null),
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

import { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

/** Shimmering placeholder block used while data loads. */
export function Skeleton({ height = 20, width, radius = 12, style }: { height?: number; width?: number | string; radius?: number; style?: ViewStyle }) {
  const shimmer = useSharedValue(0);
  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }), -1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style2 = useAnimatedStyle(() => ({ opacity: 0.4 + shimmer.value * 0.5 }));
  return (
    <Animated.View
      style={[
        style2,
        { height, width: (width as number) ?? '100%', borderRadius: radius, backgroundColor: '#e2e8f0' },
        style,
      ]}
    />
  );
}

/** A card-shaped skeleton (icon + two lines). */
export function SkeletonCard() {
  return (
    <View className="bg-white rounded-2xl p-4 border border-slate-100 mb-3">
      <View className="flex-row items-center gap-3 mb-3">
        <Skeleton width={40} height={40} radius={12} />
        <View className="flex-1">
          <Skeleton height={12} width="60%" />
          <View style={{ height: 8 }} />
          <Skeleton height={10} width="40%" />
        </View>
      </View>
      <Skeleton height={64} radius={14} />
    </View>
  );
}

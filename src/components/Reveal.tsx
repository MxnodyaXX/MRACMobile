import { ReactNode } from 'react';
import { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

/** Fades + slides its children up on mount. `delay` (ms) enables staggered cascades. */
export function Reveal({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: ViewStyle }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const animStyle = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateY: (1 - p.value) * 16 }],
  }));
  return <Animated.View style={[animStyle, style]}>{children}</Animated.View>;
}

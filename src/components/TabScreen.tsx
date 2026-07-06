import { useIsFocused } from '@react-navigation/native';
import { ReactNode, useEffect } from 'react';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

/**
 * Wraps a tab screen so its content fades + slides up every time the tab
 * becomes focused (screens stay mounted, so a plain mount animation wouldn't
 * re-fire on tab switches — this keys off focus instead).
 */
export function TabScreen({ children }: { children: ReactNode }) {
  const focused = useIsFocused();
  const p = useSharedValue(0);

  useEffect(() => {
    if (focused) {
      p.value = 0;
      p.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
    }
  }, [focused, p]);

  const style = useAnimatedStyle(() => ({
    flex: 1,
    opacity: 0.35 + p.value * 0.65,
    transform: [{ translateY: (1 - p.value) * 16 }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

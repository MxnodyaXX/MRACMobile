import { LinearGradient } from 'expo-linear-gradient';
import { Car } from 'lucide-react-native';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

/** Branded full-screen loader: pulsing logo + shimmering brand name + dots. */
export function LoadingScreen({ label = 'Loading…' }: { label?: string }) {
  const pulse = useSharedValue(0);
  const dots = [useSharedValue(0), useSharedValue(0), useSharedValue(0)];

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }), -1, true);
    dots.forEach((d, i) => {
      d.value = withRepeat(
        withSequence(
          withTiming(0, { duration: i * 160 }),
          withTiming(1, { duration: 320 }),
          withTiming(0, { duration: 320 }),
          withTiming(0, { duration: 640 - i * 160 }),
        ),
        -1,
        false,
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.08 }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.5 - pulse.value * 0.35,
    transform: [{ scale: 1 + pulse.value * 0.5 }],
  }));

  return (
    <LinearGradient colors={['#0D1B45', '#1B2B6B', '#0F2060']} style={{ flex: 1 }}>
      <View className="flex-1 items-center justify-center">
        <View className="items-center justify-center" style={{ width: 96, height: 96 }}>
          <Animated.View
            style={[ringStyle, { position: 'absolute', width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.15)' }]}
          />
          <Animated.View
            style={logoStyle}
            className="w-16 h-16 rounded-2xl bg-white/10 items-center justify-center"
          >
            <Car size={30} color="#ffffff" />
          </Animated.View>
        </View>

        <Text className="text-2xl font-black text-white tracking-tight mt-5">EMRAC</Text>

        <View className="flex-row items-center gap-1.5 mt-3">
          {dots.map((d, i) => (
            <Dot key={i} v={d} />
          ))}
        </View>
        <Text className="text-white/40 text-xs mt-3">{label}</Text>
      </View>
    </LinearGradient>
  );
}

function Dot({ v }: { v: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({
    opacity: 0.3 + v.value * 0.7,
    transform: [{ translateY: -v.value * 5 }],
  }));
  return <Animated.View style={[style, { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' }]} />;
}

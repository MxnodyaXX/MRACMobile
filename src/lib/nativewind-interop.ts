import { LinearGradient } from 'expo-linear-gradient';
import { cssInterop } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * NativeWind only wires `className` -> `style` for core React Native components.
 * Third-party components must be registered explicitly, otherwise `className` is
 * silently dropped on native — the view then has no flex/background and collapses
 * to zero size, which renders as a blank (black in dark mode) screen.
 *
 * Web happens to work without this, which is why the app looked fine in a browser
 * but blank on the device.
 *
 * Import this once, before any screen renders (see app/_layout.tsx).
 */
cssInterop(SafeAreaView, { className: 'style' });
cssInterop(LinearGradient, { className: 'style' });

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * During Expo Web's static render (SSR) the code runs in Node, where there is no
 * `window` — so AsyncStorage's web implementation (which reads window.localStorage)
 * throws "window is not defined". This only happens on the web server-render pass;
 * native (iOS/Android) and the web browser both have real storage.
 *
 * We detect that one case and swap in a no-op store, then let the real client-side
 * pass (where window exists) hydrate normally.
 */
export const isServerRender = Platform.OS === 'web' && typeof window === 'undefined';

const noopStorage = {
  getItem: async (_key: string): Promise<string | null> => null,
  setItem: async (_key: string, _value: string): Promise<void> => {},
  removeItem: async (_key: string): Promise<void> => {},
};

/** AsyncStorage on native and web-browser; a safe no-op during web SSR. */
export const appStorage = isServerRender ? noopStorage : AsyncStorage;

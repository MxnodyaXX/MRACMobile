import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import { appStorage, isServerRender } from './storage'

// Expo exposes env vars prefixed with EXPO_PUBLIC_* on process.env at build time.
// Set these in mrac-mobile/.env (see .env.example).
const url = process.env.EXPO_PUBLIC_SUPABASE_URL
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

export const supabaseEnabled =
  typeof url === 'string' && url.startsWith('https://') &&
  typeof key === 'string' && key.length > 20

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: ReturnType<typeof createClient<any>> = supabaseEnabled
  ? createClient<any>(url!, key!, {
      auth: {
        // React Native has no localStorage — persist the session in AsyncStorage.
        // During web SSR (no window) appStorage is a no-op and persistence is off
        // so client init never touches window.localStorage.
        storage: appStorage,
        autoRefreshToken: !isServerRender,
        persistSession: !isServerRender,
        detectSessionInUrl: false, // no URL-based auth redirects on native
      },
    })
  : (null as any)

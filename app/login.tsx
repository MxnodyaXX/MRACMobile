import { LinearGradient } from 'expo-linear-gradient';
import { Redirect } from 'expo-router';
import { Car, Eye, EyeOff, LogIn } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/src/store/useAuthStore';

export default function LoginScreen() {
  const login = useAuthStore((s) => s.login);
  const loadUsers = useAuthStore((s) => s.loadUsers);
  const currentUser = useAuthStore((s) => s.currentUser);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Merge any DB-stored login profiles into the built-in defaults on mount.
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Already signed in → send to the app.
  if (currentUser) return <Redirect href="/" />;

  const submit = () => {
    setError('');
    setLoading(true);
    setTimeout(() => {
      const ok = login(username.trim(), password);
      if (!ok) setError('Invalid credentials or account disabled.');
      setLoading(false);
      // On success, currentUser becomes set and the <Redirect> above fires.
    }, 300);
  };

  const disabled = loading || !username || !password;

  return (
    <LinearGradient colors={['#0D1B45', '#1B2B6B', '#0F2060']} className="flex-1">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 items-center justify-center px-6"
        >
          <View className="w-full max-w-sm">
            {/* Logo / brand */}
            <View className="items-center mb-8">
              <View className="w-16 h-16 rounded-2xl bg-white/10 items-center justify-center mb-4">
                <Car size={32} color="#ffffff" />
              </View>
              <Text className="text-2xl font-black text-white tracking-tight">EMRAC</Text>
              <Text className="text-white/50 text-sm mt-1">Vehicle Fleet Management</Text>
            </View>

            {/* Card */}
            <View className="bg-white/[0.07] border border-white/10 rounded-2xl p-6">
              {/* Username */}
              <Text className="text-white/60 text-xs font-medium mb-1.5">Username</Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="admin / kasun / nimesh"
                placeholderTextColor="rgba(255,255,255,0.25)"
                autoCapitalize="none"
                autoCorrect={false}
                className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white text-sm mb-4"
              />

              {/* Password */}
              <Text className="text-white/60 text-xs font-medium mb-1.5">Password</Text>
              <View className="relative justify-center">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  secureTextEntry={!show}
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 pr-11 text-white text-sm"
                />
                <TouchableOpacity
                  onPress={() => setShow((v) => !v)}
                  className="absolute right-3"
                  hitSlop={10}
                >
                  {show ? (
                    <EyeOff size={16} color="rgba(255,255,255,0.5)" />
                  ) : (
                    <Eye size={16} color="rgba(255,255,255,0.5)" />
                  )}
                </TouchableOpacity>
              </View>

              {error ? (
                <Text className="text-red-400 text-xs bg-red-400/10 rounded-xl px-3 py-2 mt-4">
                  {error}
                </Text>
              ) : null}

              {/* Sign in */}
              <TouchableOpacity
                onPress={submit}
                disabled={disabled}
                className={`flex-row items-center justify-center gap-2 bg-white rounded-xl py-3 mt-5 ${
                  disabled ? 'opacity-50' : ''
                }`}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#0D1B45" />
                ) : (
                  <LogIn size={16} color="#0D1B45" />
                )}
                <Text className="text-navy-800 font-semibold text-sm">
                  {loading ? 'Signing in…' : 'Sign In'}
                </Text>
              </TouchableOpacity>

              <View className="border-t border-white/10 mt-4 pt-3">
                <Text className="text-white/30 text-[11px] text-center">
                  Admin: <Text className="text-white/50">admin / admin123</Text>
                  {'   |   '}
                  Owner: <Text className="text-white/50">kasun / owner123</Text>
                </Text>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

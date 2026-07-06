import { useRouter } from 'expo-router';
import { ChevronLeft, LucideIcon } from 'lucide-react-native';
import { ReactNode } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Standard stack-page shell: a header with a back button + title, then content. */
export function PageScreen({ title, children }: { title: string; children?: ReactNode }) {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="flex-row items-center gap-2 px-4 py-3 bg-white border-b border-slate-100">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} className="w-9 h-9 rounded-xl items-center justify-center bg-slate-50">
          <ChevronLeft size={20} color="#0D1B45" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-slate-900">{title}</Text>
      </View>
      {children}
    </SafeAreaView>
  );
}

/** Placeholder body for pages whose full UI is still being built. */
export function ComingSoonBody({ icon: Icon, note }: { icon: LucideIcon; note?: string }) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="w-16 h-16 rounded-2xl bg-navy-800 items-center justify-center mb-5">
        <Icon size={30} color="#ffffff" />
      </View>
      <Text className="text-slate-500 text-center leading-5">{note ?? 'This screen is coming soon.'}</Text>
    </View>
  );
}

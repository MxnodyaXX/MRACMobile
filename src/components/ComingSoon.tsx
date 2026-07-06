import { LucideIcon } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TabScreen } from './TabScreen';

/**
 * Placeholder shown for tabs whose full screen lands in a later phase.
 */
export function ComingSoon({
  title,
  icon: Icon,
  note = 'This screen will be built in a later phase.',
}: {
  title: string;
  icon: LucideIcon;
  note?: string;
}) {
  return (
    <TabScreen>
      <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-16 h-16 rounded-2xl bg-navy-800 items-center justify-center mb-5">
            <Icon size={30} color="#ffffff" />
          </View>
          <Text className="text-2xl font-black text-slate-900">{title}</Text>
          <Text className="text-slate-500 text-center mt-2 leading-5">{note}</Text>
        </View>
      </SafeAreaView>
    </TabScreen>
  );
}

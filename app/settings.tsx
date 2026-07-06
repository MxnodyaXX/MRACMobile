import { Settings } from 'lucide-react-native';

import { ComingSoonBody, PageScreen } from '@/src/components/PageScreen';

export default function SettingsPage() {
  return (
    <PageScreen title="Settings">
      <ComingSoonBody icon={Settings} note="Settings will be built out next." />
    </PageScreen>
  );
}

import { UserCheck } from 'lucide-react-native';

import { ComingSoonBody, PageScreen } from '@/src/components/PageScreen';

export default function DriversPage() {
  return (
    <PageScreen title="Drivers">
      <ComingSoonBody icon={UserCheck} note="Drivers will be built out next." />
    </PageScreen>
  );
}

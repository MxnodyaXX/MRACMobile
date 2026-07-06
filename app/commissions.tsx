import { Percent } from 'lucide-react-native';

import { ComingSoonBody, PageScreen } from '@/src/components/PageScreen';

export default function CommissionsPage() {
  return (
    <PageScreen title="Commissions">
      <ComingSoonBody icon={Percent} note="Commissions will be built out next." />
    </PageScreen>
  );
}

import { Users } from 'lucide-react-native';

import { ComingSoonBody, PageScreen } from '@/src/components/PageScreen';

export default function OwnersPage() {
  return (
    <PageScreen title="Owners">
      <ComingSoonBody icon={Users} note="Owners will be built out next." />
    </PageScreen>
  );
}

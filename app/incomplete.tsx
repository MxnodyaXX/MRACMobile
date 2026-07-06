import { AlertTriangle } from 'lucide-react-native';

import { ComingSoonBody, PageScreen } from '@/src/components/PageScreen';

export default function IncompletePage() {
  return (
    <PageScreen title="Incomplete">
      <ComingSoonBody icon={AlertTriangle} note="Incomplete will be built out next." />
    </PageScreen>
  );
}

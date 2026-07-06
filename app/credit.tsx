import { CreditCard } from 'lucide-react-native';

import { ComingSoonBody, PageScreen } from '@/src/components/PageScreen';

export default function CreditPage() {
  return (
    <PageScreen title="Credit">
      <ComingSoonBody icon={CreditCard} note="Credit will be built out next." />
    </PageScreen>
  );
}

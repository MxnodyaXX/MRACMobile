import { HandCoins } from 'lucide-react-native';

import { ComingSoonBody, PageScreen } from '@/src/components/PageScreen';

export default function ReferralsPage() {
  return (
    <PageScreen title="Referrals">
      <ComingSoonBody icon={HandCoins} note="Referrals will be built out next." />
    </PageScreen>
  );
}

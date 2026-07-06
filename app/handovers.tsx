import { Truck } from 'lucide-react-native';

import { ComingSoonBody, PageScreen } from '@/src/components/PageScreen';

export default function HandoversPage() {
  return (
    <PageScreen title="Handovers">
      <ComingSoonBody icon={Truck} note="Handovers will be built out next." />
    </PageScreen>
  );
}

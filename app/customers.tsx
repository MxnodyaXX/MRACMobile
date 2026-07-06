import { Contact } from 'lucide-react-native';

import { ComingSoonBody, PageScreen } from '@/src/components/PageScreen';

export default function CustomersPage() {
  return (
    <PageScreen title="Customers">
      <ComingSoonBody icon={Contact} note="Customers will be built out next." />
    </PageScreen>
  );
}

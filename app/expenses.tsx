import { Receipt } from 'lucide-react-native';

import { ComingSoonBody, PageScreen } from '@/src/components/PageScreen';

export default function ExpensesPage() {
  return (
    <PageScreen title="Expenses">
      <ComingSoonBody icon={Receipt} note="Expenses will be built out next." />
    </PageScreen>
  );
}

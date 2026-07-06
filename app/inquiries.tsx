import { MessageSquare } from 'lucide-react-native';

import { ComingSoonBody, PageScreen } from '@/src/components/PageScreen';

export default function InquiriesPage() {
  return (
    <PageScreen title="Inquiries">
      <ComingSoonBody icon={MessageSquare} note="Inquiries will be built out next." />
    </PageScreen>
  );
}

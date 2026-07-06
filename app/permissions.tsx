import { ShieldCheck } from 'lucide-react-native';

import { ComingSoonBody, PageScreen } from '@/src/components/PageScreen';

export default function PermissionsPage() {
  return (
    <PageScreen title="Permissions">
      <ComingSoonBody icon={ShieldCheck} note="Permissions will be built out next." />
    </PageScreen>
  );
}

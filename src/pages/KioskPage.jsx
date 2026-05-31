import { Text } from '../components/ui/Text.jsx';
import { PageContainer } from '../components/layout/PageContainer.jsx';

export default function KioskPage() {
  return (
    <PageContainer narrow>
      <Text as="p" variant="body" style={{ color: 'var(--color-text-muted)' }}>
        Student checkout kiosk — coming in Phase 4.
      </Text>
    </PageContainer>
  );
}

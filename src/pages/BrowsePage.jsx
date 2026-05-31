import { Text } from '../components/ui/Text.jsx';
import { PageContainer } from '../components/layout/PageContainer.jsx';

export default function BrowsePage() {
  return (
    <PageContainer>
      <Text as="p" variant="body" style={{ color: 'var(--color-text-muted)' }}>
        Browse library — coming in Phase 2.
      </Text>
    </PageContainer>
  );
}

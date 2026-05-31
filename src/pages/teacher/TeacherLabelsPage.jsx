import { Text } from '../../components/ui/Text.jsx';
import { PageContainer } from '../../components/layout/PageContainer.jsx';

export default function TeacherLabelsPage() {
  return (
    <PageContainer>
      <Text as="p" variant="body" style={{ color: 'var(--color-text-muted)' }}>
        Print labels — coming in Phase 3.
      </Text>
    </PageContainer>
  );
}

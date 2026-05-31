import { Text } from '../../components/ui/Text.jsx';
import { PageContainer } from '../../components/layout/PageContainer.jsx';

export default function TeacherOverduePage() {
  return (
    <PageContainer>
      <Text as="p" variant="body" style={{ color: 'var(--color-text-muted)' }}>
        Overdue books — coming in Phase 4.
      </Text>
    </PageContainer>
  );
}

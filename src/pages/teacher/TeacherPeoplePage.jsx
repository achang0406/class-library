import { Text } from '../../components/ui/Text.jsx';
import { PageContainer } from '../../components/layout/PageContainer.jsx';

export default function TeacherPeoplePage() {
  return (
    <PageContainer>
      <Text as="p" variant="body" style={{ color: 'var(--color-text-muted)' }}>
        Manage borrowers — coming in Phase 4.
      </Text>
    </PageContainer>
  );
}

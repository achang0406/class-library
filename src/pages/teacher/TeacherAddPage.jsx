import { Text } from '../../components/ui/Text.jsx';
import { PageContainer } from '../../components/layout/PageContainer.jsx';

export default function TeacherAddPage() {
  return (
    <PageContainer>
      <Text as="p" variant="body" style={{ color: 'var(--color-text-muted)' }}>
        Add book with Open Library autosuggest — coming in Phase 2.
      </Text>
    </PageContainer>
  );
}

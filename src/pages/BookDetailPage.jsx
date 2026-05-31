import { useParams } from 'react-router-dom';
import { Text } from '../components/ui/Text.jsx';
import { PageContainer } from '../components/layout/PageContainer.jsx';

export default function BookDetailPage() {
  const { id } = useParams();
  return (
    <PageContainer>
      <Text as="p" variant="body" style={{ color: 'var(--color-text-muted)' }}>
        Book detail for {id} — coming in Phase 2.
      </Text>
    </PageContainer>
  );
}

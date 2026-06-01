import { useNavigate } from 'react-router-dom';
import { LabelVerifyPanel } from '../../components/labels/LabelVerifyPanel.jsx';
import { Stack } from '../../components/ui/Stack.jsx';
import { Text } from '../../components/ui/Text.jsx';
import { SupabaseBanner } from '../../components/layout/SupabaseBanner.jsx';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { useBooks } from '../../hooks/useBooks.js';

export default function TeacherLabelsVerifyPage() {
  const navigate = useNavigate();
  const filters = { needsLabel: true };
  const { books, loading } = useBooks(filters);

  return (
    <PageContainer>
      <Stack gap="var(--space-4)">
        <SupabaseBanner />
        <Text variant="body" style={{ color: 'var(--color-text-muted)' }}>
          Run this after printing and applying stickers — scan each book&apos;s LIB- code in any
          order.
        </Text>
        {loading ? (
          <Text variant="label">Loading books…</Text>
        ) : (
          <LabelVerifyPanel
            initialBooks={books}
            onDone={() => navigate('/teacher/dashboard')}
          />
        )}
      </Stack>
    </PageContainer>
  );
}

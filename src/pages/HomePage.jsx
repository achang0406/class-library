import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button.jsx';
import { Stack } from '../components/ui/Stack.jsx';
import { Text } from '../components/ui/Text.jsx';
import { PageContainer } from '../components/layout/PageContainer.jsx';
import { InstallAppLink } from '../components/layout/InstallAppLink.jsx';
import { TeacherModeBanner } from '../components/layout/TeacherModeBanner.jsx';

export default function HomePage() {
  return (
    <>
      <TeacherModeBanner />
      <PageContainer narrow>
      <Stack
        gap="var(--space-6)"
        style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-8)' }}
      >
        <Stack gap="var(--space-2)" align="center" style={{ textAlign: 'center' }}>
          <Text as="h1" variant="display">
            Class Library
          </Text>
          <Text variant="body" style={{ color: 'var(--color-text-muted)' }}>
            Mrs. Chang&apos;s classroom books
          </Text>
        </Stack>
        <Stack gap="var(--space-3)">
          <Link to="/browse" style={{ textDecoration: 'none' }}>
            <Button variant="primary" fullWidth>
              Browse Library
            </Button>
          </Link>
          <Link to="/kiosk" style={{ textDecoration: 'none' }}>
            <Button variant="kiosk" fullWidth>
              Check Out / Return
            </Button>
          </Link>
          <Link to="/teacher" style={{ textDecoration: 'none', textAlign: 'center' }}>
            <Text variant="emphasis" style={{ color: 'var(--color-primary)' }}>
              Teacher Login
            </Text>
          </Link>
        </Stack>
        <InstallAppLink />
      </Stack>
    </PageContainer>
    </>
  );
}

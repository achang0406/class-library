import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Inline } from '../../components/ui/Inline.jsx';
import { Stack } from '../../components/ui/Stack.jsx';
import { Text } from '../../components/ui/Text.jsx';
import { PageContainer } from '../../components/layout/PageContainer.jsx';

const LINKS = [
  { to: '/teacher/add', label: 'Add Book' },
  { to: '/teacher/labels', label: 'Print Labels' },
  { to: '/teacher/people', label: 'Manage People' },
  { to: '/teacher/overdue', label: 'Overdue Books' },
  { to: '/teacher/import', label: 'Import CSV' },
];

export default function TeacherDashboardPage() {
  return (
    <PageContainer>
      <Stack gap="var(--space-5)" style={{ paddingTop: 'var(--space-4)' }}>
        <Text as="h1" variant="title">
          Teacher Dashboard
        </Text>
        <Inline gap="var(--space-3)" wrap style={{ width: '100%' }}>
          {['Books', 'Out', 'Overdue'].map((label) => (
            <Card key={label} style={{ flex: '1 1 100px', minWidth: 100 }}>
              <Text variant="display" style={{ fontSize: 'var(--font-title)' }}>
                —
              </Text>
              <Text variant="label">{label}</Text>
            </Card>
          ))}
        </Inline>
        <Stack gap="var(--space-3)">
          {LINKS.map(({ to, label }) => (
            <Link key={to} to={to} style={{ textDecoration: 'none' }}>
              <Button variant="secondary" fullWidth>
                {label}
              </Button>
            </Link>
          ))}
        </Stack>
      </Stack>
    </PageContainer>
  );
}

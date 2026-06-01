import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Inline } from '../../components/ui/Inline.jsx';
import { Stack } from '../../components/ui/Stack.jsx';
import { Text } from '../../components/ui/Text.jsx';
import { SupabaseBanner } from '../../components/layout/SupabaseBanner.jsx';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { getBookStats } from '../../lib/books.js';
import { listOverdueCheckouts } from '../../lib/checkouts.js';
import { isSupabaseConfigured } from '../../lib/supabase.js';
import { setTeacherLoggedIn } from '../../lib/teacherSession.js';

const LINKS = [
  { to: '/teacher/add', label: 'Add Book' },
  { to: '/teacher/add?mode=rapid', label: 'Rapid Add' },
  { to: '/teacher/labels', label: 'Print Labels' },
  { to: '/teacher/labels/verify', label: 'Validate Labels' },
  { to: '/teacher/people', label: 'Manage People' },
  { to: '/teacher/reading', label: 'Class Reading' },
  { to: '/teacher/overdue', label: 'Overdue Books' },
  { to: '/teacher/import', label: 'Import CSV' },
];

export default function TeacherDashboardPage() {
  const [stats, setStats] = useState({ total: '—', checkedOut: '—', overdue: '—' });

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    Promise.all([getBookStats(), listOverdueCheckouts({ borrowerType: 'all' })])
      .then(([bookStats, overdue]) => {
        setStats({
          total: bookStats.total,
          checkedOut: bookStats.checkedOut,
          overdue: overdue.length,
        });
      })
      .catch(() => {});
  }, []);

  function signOut() {
    setTeacherLoggedIn(false);
    window.location.href = '/';
  }

  return (
    <PageContainer>
      <Stack gap="var(--space-5)" style={{ paddingTop: 'var(--space-4)' }}>
        <SupabaseBanner />
        <Stack
          gap="var(--space-2)"
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Text as="h1" variant="title">
            Teacher Dashboard
          </Text>
          <Button variant="ghost" onClick={signOut}>
            Sign out
          </Button>
        </Stack>
        <Inline gap="var(--space-3)" wrap style={{ width: '100%' }}>
          {[
            { label: 'Books', value: stats.total },
            { label: 'Out', value: stats.checkedOut },
            { label: 'Overdue', value: stats.overdue },
          ].map(({ label, value }) => (
            <Card key={label} style={{ flex: '1 1 100px', minWidth: 100 }}>
              <Text variant="display" style={{ fontSize: 'var(--font-title)' }}>
                {value}
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

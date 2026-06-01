import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Inline } from '../../components/ui/Inline.jsx';
import { Stack } from '../../components/ui/Stack.jsx';
import { Text } from '../../components/ui/Text.jsx';
import { SupabaseBanner } from '../../components/layout/SupabaseBanner.jsx';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { getClassReadingReport } from '../../lib/classReadingStats.js';
import { isSupabaseConfigured } from '../../lib/supabase.js';

function StatCard({ label, value }) {
  return (
    <Card style={{ flex: '1 1 100px', minWidth: 100 }}>
      <Text variant="display" style={{ fontSize: 'var(--font-title)' }}>
        {value}
      </Text>
      <Text variant="label">{label}</Text>
    </Card>
  );
}

function formatLastCheckout(daysSinceLast, lastCheckoutAt) {
  if (lastCheckoutAt == null) return 'Never';
  if (daysSinceLast === 0) return 'Today';
  if (daysSinceLast === 1) return 'Yesterday';
  return `${daysSinceLast} days ago`;
}

export default function TeacherClassReadingPage() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    getClassReadingReport()
      .then(setReport)
      .catch((err) => setError(err.message ?? 'Failed to load class reading report'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PageContainer>
        <Text>Loading class reading report…</Text>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <Text style={{ color: 'var(--color-overdue)' }}>{error}</Text>
      </PageContainer>
    );
  }

  if (!report) return null;

  const { summary, students, inactiveStudents, popularBooks, genreBreakdown } = report;

  return (
    <PageContainer>
      <Stack gap="var(--space-5)" style={{ paddingTop: 'var(--space-4)' }}>
        <SupabaseBanner />

        <Stack gap="var(--space-1)">
          <Text as="h1" variant="title">
            Class reading
          </Text>
          <Text variant="body" style={{ color: 'var(--color-text-muted)' }}>
            Overview for all students on the roster. Tap a name for full history and recommendations.
          </Text>
        </Stack>

        <Inline gap="var(--space-3)" wrap style={{ width: '100%' }}>
          <StatCard label="Students" value={summary.studentCount} />
          <StatCard label="Active readers" value={summary.activeReaders} />
          <StatCard label="Books read" value={summary.totalBooksRead} />
          <StatCard label="Currently out" value={summary.currentlyOut} />
        </Inline>

        <Text variant="label" style={{ color: 'var(--color-text-muted)' }}>
          Active = checked out a book within the last {summary.inactiveDays} days.
        </Text>

        {genreBreakdown.length > 0 ? (
          <Stack gap="var(--space-2)">
            <Text variant="emphasis">Class genre breakdown</Text>
            <Inline gap="var(--space-2)" wrap>
              {genreBreakdown.map(({ label, count }) => (
                <Badge key={label} variant="neutral">
                  {label} ({count})
                </Badge>
              ))}
            </Inline>
          </Stack>
        ) : null}

        <Stack gap="var(--space-3)">
          <Text as="h2" variant="title">
            Students
          </Text>
          {students.length === 0 ? (
            <Text style={{ color: 'var(--color-text-muted)' }}>No students on the roster yet.</Text>
          ) : (
            <Stack gap="var(--space-2)">
              {students.map((row) => (
                <Stack
                  key={row.id}
                  gap="var(--space-2)"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    padding: 'var(--space-3)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-card)',
                  }}
                >
                  <Link
                    to={`/teacher/students/${row.id}`}
                    style={{ color: 'inherit', textDecoration: 'none', flex: '1 1 140px' }}
                  >
                    <Text variant="emphasis">{row.name}</Text>
                  </Link>
                  <Inline gap="var(--space-2)" wrap>
                    <Badge variant="neutral">{row.stats.booksCompleted} read</Badge>
                    {row.stats.currentLoans > 0 ? (
                      <Badge variant="checked-out">{row.stats.currentLoans} out</Badge>
                    ) : null}
                    {row.topGenre ? <Badge variant="neutral">{row.topGenre}</Badge> : null}
                    {row.inactive ? (
                      <Badge variant="needs-label">Inactive</Badge>
                    ) : (
                      <Badge variant="available">Active</Badge>
                    )}
                  </Inline>
                  <Text variant="label" style={{ color: 'var(--color-text-muted)', flex: '1 1 100%' }}>
                    Last checkout: {formatLastCheckout(row.daysSinceLast, row.stats.lastCheckoutAt)}
                  </Text>
                </Stack>
              ))}
            </Stack>
          )}
        </Stack>

        {inactiveStudents.length > 0 ? (
          <Stack gap="var(--space-2)">
            <Text as="h2" variant="title">
              Haven&apos;t checked out recently
            </Text>
            <Text variant="body" style={{ color: 'var(--color-text-muted)' }}>
              No checkout in the last {summary.inactiveDays} days — may be worth a nudge during library time.
            </Text>
            <Inline gap="var(--space-2)" wrap>
              {inactiveStudents.map((row) => (
                <Link key={row.id} to={`/teacher/students/${row.id}`} style={{ textDecoration: 'none' }}>
                  <Badge variant="needs-label">{row.name}</Badge>
                </Link>
              ))}
            </Inline>
          </Stack>
        ) : null}

        {popularBooks.length > 0 ? (
          <Stack gap="var(--space-2)">
            <Text as="h2" variant="title">
              Most popular in our library
            </Text>
            {popularBooks.map(({ book, count }) => (
              <Stack
                key={book.id}
                gap="var(--space-2)"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-2) var(--space-3)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-card)',
                }}
              >
                <Link to={`/books/${book.id}`} style={{ color: 'inherit', textDecoration: 'none', flex: 1 }}>
                  <Text variant="emphasis">{book.title}</Text>
                  {book.author ? (
                    <Text variant="label" style={{ color: 'var(--color-text-muted)' }}>
                      {book.author}
                    </Text>
                  ) : null}
                </Link>
                <Badge variant="neutral">
                  {count} checkout{count === 1 ? '' : 's'}
                </Badge>
              </Stack>
            ))}
          </Stack>
        ) : null}
      </Stack>
    </PageContainer>
  );
}

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BookCard } from '../../components/books/BookCard.jsx';
import { Avatar } from '../../components/ui/Avatar.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { BookCover } from '../../components/ui/BookCover.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Inline } from '../../components/ui/Inline.jsx';
import { Stack } from '../../components/ui/Stack.jsx';
import { StatCard } from '../../components/ui/StatCard.jsx';
import { Text } from '../../components/ui/Text.jsx';
import { SupabaseBanner } from '../../components/layout/SupabaseBanner.jsx';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { getBorrowerById } from '../../lib/borrowers.js';
import { checkoutDuration } from '../../lib/checkouts.js';
import { getExternalRecommendationsForStudent } from '../../lib/externalRecommendations.js';
import { getStudentRecommendationContext } from '../../lib/recommendations.js';
import { resolveBookReadingDisplay } from '../../lib/lexile.js';
import { daysSince } from '../../lib/settings.js';
import { isSupabaseConfigured } from '../../lib/supabase.js';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function ExternalBookCard({ book }) {
  const href = book.openLibraryKey
    ? `https://openlibrary.org${book.openLibraryKey}`
    : 'https://openlibrary.org';

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
      <Card
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
          height: '100%',
          padding: 'var(--space-3)',
        }}
      >
        <BookCover src={book.coverUrl} alt={book.title} width="100%" style={{ width: '100%' }} />
        <Text
          variant="emphasis"
          style={{
            lineClamp: 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {book.title}
        </Text>
        <Text variant="label">{book.author ?? 'Unknown author'}</Text>
        <Text variant="label" style={{ color: 'var(--color-text-muted)' }}>
          {book.reason}
        </Text>
        <Badge variant="neutral">Open Library</Badge>
      </Card>
    </a>
  );
}

export default function TeacherStudentPage() {
  const { id } = useParams();
  const [borrower, setBorrower] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [externalRecs, setExternalRecs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !id) return;

    setLoading(true);
    setError('');

    Promise.all([
      getBorrowerById(id),
      getStudentRecommendationContext(id),
      getExternalRecommendationsForStudent(id),
    ])
      .then(([b, context, external]) => {
        if (!b || b.borrower_type !== 'student') {
          setError('Student not found.');
          return;
        }
        setBorrower(b);
        setHistory(context.history);
        setStats(context.stats);
        setRecommendations(context.recommendations);
        setExternalRecs(external);
      })
      .catch((err) => {
        setError(err.message ?? 'Failed to load student profile');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <PageContainer>
        <Text>Loading student profile…</Text>
      </PageContainer>
    );
  }

  if (error || !borrower) {
    return (
      <PageContainer>
        <Stack gap="var(--space-4)">
          <Text style={{ color: 'var(--color-overdue)' }}>{error || 'Student not found.'}</Text>
        </Stack>
      </PageContainer>
    );
  }

  const recentReads = history.filter((checkout) => checkout.returned_at).slice(0, 5);

  return (
    <PageContainer>
      <Stack gap="var(--space-5)" style={{ paddingTop: 'var(--space-4)' }}>
        <SupabaseBanner />

        <Stack gap="var(--space-2)" style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Avatar name={borrower.display_name} size={56} />
          <Stack gap="var(--space-1)">
            <Text as="h1" variant="title">
              {borrower.display_name}
            </Text>
            <Text variant="body" style={{ color: 'var(--color-text-muted)' }}>
              Reading profile
            </Text>
          </Stack>
        </Stack>

        {stats ? (
          <Inline gap="var(--space-3)" wrap style={{ width: '100%' }}>
            <StatCard label="Books read" value={stats.booksCompleted} />
            <StatCard label="Currently out" value={stats.currentLoans} />
            <StatCard label="Avg days out" value={stats.avgDaysOut || '—'} />
            <StatCard label="Re-reads" value={stats.repeatCheckouts} />
            <StatCard
              label="Avg Lexile read"
              value={stats.avgLexileLabel ?? '—'}
              detail={
                stats.avgLexileLabel
                  ? [
                      stats.avgLexileGrade,
                      `${stats.lexileBooksRead} book${stats.lexileBooksRead === 1 ? '' : 's'}`,
                    ]
                      .filter(Boolean)
                      .join(' · ')
                  : undefined
              }
            />
          </Inline>
        ) : null}

        {stats?.lastCheckoutAt ? (
          <Text variant="body" style={{ color: 'var(--color-text-muted)' }}>
            Last checkout: {formatDate(stats.lastCheckoutAt)} ({daysSince(stats.lastCheckoutAt)} days ago)
          </Text>
        ) : null}

        {stats?.topGenres.length || stats?.topAuthors.length ? (
          <Stack gap="var(--space-2)">
            <Text variant="emphasis">Reading interests</Text>
            <Inline gap="var(--space-2)" wrap>
              {stats.topGenres.map(({ label, count }) => (
                <Badge key={`genre-${label}`} variant="neutral">
                  {label} ({count})
                </Badge>
              ))}
              {stats.topAuthors.map(({ label, count }) => (
                <Badge key={`author-${label}`} variant="neutral">
                  {label} ({count})
                </Badge>
              ))}
            </Inline>
          </Stack>
        ) : null}

        {recommendations.length > 0 ? (
          <Stack gap="var(--space-3)">
            <Text as="h2" variant="title">
              Recommended from our library
            </Text>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 'var(--space-3)',
              }}
            >
              {recommendations.map(({ book, reason }) => (
                <Stack key={book.id} gap="var(--space-1)">
                  <BookCard book={book} />
                  <Text variant="label" style={{ color: 'var(--color-text-muted)', padding: '0 var(--space-1)' }}>
                    {reason}
                  </Text>
                </Stack>
              ))}
            </div>
          </Stack>
        ) : (
          <Text style={{ color: 'var(--color-text-muted)' }}>
            No recommendations yet — all available books may already be checked out or this student has read everything available.
          </Text>
        )}

        {externalRecs.length > 0 ? (
          <Stack gap="var(--space-3)">
            <Text as="h2" variant="title">
              Explore beyond our library
            </Text>
            <Text variant="body" style={{ color: 'var(--color-text-muted)' }}>
              Suggestions from Open Library based on this student&apos;s reading history. These titles are not in your classroom collection.
            </Text>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 'var(--space-3)',
              }}
            >
              {externalRecs.map((book) => (
                <ExternalBookCard key={book.openLibraryKey ?? book.title} book={book} />
              ))}
            </div>
          </Stack>
        ) : null}

        {recentReads.length > 0 ? (
          <Stack gap="var(--space-3)">
            <Text as="h2" variant="title">
              Recently read
            </Text>
            <Stack gap="var(--space-2)">
              {recentReads.map((checkout) => {
                const book = checkout.books;
                const reading = resolveBookReadingDisplay(book ?? {});
                const days = checkoutDuration(checkout);

                return (
                  <Stack
                    key={checkout.id}
                    gap="var(--space-2)"
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 'var(--space-3)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--color-card)',
                    }}
                  >
                    <BookCover src={book?.cover_url} alt="" width={48} />
                    <Stack gap="var(--space-1)" style={{ flex: 1 }}>
                      <Text variant="emphasis">{book?.title ?? 'Unknown book'}</Text>
                      {book?.author ? (
                        <Text variant="label" style={{ color: 'var(--color-text-muted)' }}>
                          {book.author}
                        </Text>
                      ) : null}
                      <Text variant="label" style={{ color: 'var(--color-text-muted)' }}>
                        Returned {formatDate(checkout.returned_at)} · {days} day{days === 1 ? '' : 's'}
                        {reading.lexileLabel ? ` · ${reading.lexileLabel}` : ''}
                      </Text>
                    </Stack>
                  </Stack>
                );
              })}
            </Stack>
          </Stack>
        ) : null}

        <Stack gap="var(--space-3)">
          <Text as="h2" variant="title">
            Checkout history
          </Text>
          {history.length === 0 ? (
            <Text style={{ color: 'var(--color-text-muted)' }}>No checkouts yet.</Text>
          ) : (
            <Stack gap="var(--space-2)">
              {history.map((checkout) => {
                const book = checkout.books;
                const days = checkout.returned_at
                  ? checkoutDuration(checkout)
                  : daysSince(checkout.checked_out_at);
                const isActive = !checkout.returned_at;

                return (
                  <Stack
                    key={checkout.id}
                    gap="var(--space-2)"
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 'var(--space-3)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--color-card)',
                    }}
                  >
                    <BookCover src={book?.cover_url} alt="" width={48} />
                    <Stack gap="var(--space-1)" style={{ flex: 1 }}>
                      <Text variant="emphasis">{book?.title ?? 'Unknown book'}</Text>
                      {book?.author ? (
                        <Text variant="label" style={{ color: 'var(--color-text-muted)' }}>
                          {book.author}
                        </Text>
                      ) : null}
                      <Text variant="label" style={{ color: 'var(--color-text-muted)' }}>
                        {formatDate(checkout.checked_out_at)}
                        {checkout.returned_at ? ` → ${formatDate(checkout.returned_at)}` : ' → now'}
                        {' · '}
                        {days} day{days === 1 ? '' : 's'}
                      </Text>
                    </Stack>
                    <Badge variant={isActive ? 'checked-out' : 'available'}>
                      {isActive ? 'Out' : 'Returned'}
                    </Badge>
                  </Stack>
                );
              })}
            </Stack>
          )}
        </Stack>
      </Stack>
    </PageContainer>
  );
}

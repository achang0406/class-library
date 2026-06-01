import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge } from '../components/ui/Badge.jsx';
import { BookCover } from '../components/ui/BookCover.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { Stack } from '../components/ui/Stack.jsx';
import { Text } from '../components/ui/Text.jsx';
import { SupabaseBanner } from '../components/layout/SupabaseBanner.jsx';
import { PageContainer } from '../components/layout/PageContainer.jsx';
import { getBookById, deleteBook, markLabelsNeeded } from '../lib/books.js';
import { getActiveCheckoutForBook, enrichCheckout } from '../lib/checkouts.js';
import { getOverdueDays } from '../lib/settings.js';
import { isTeacherLoggedIn } from '../lib/teacherSession.js';

export default function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [checkout, setCheckout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState(false);
  const [labelBusy, setLabelBusy] = useState(false);
  const isTeacher = isTeacherLoggedIn();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const b = await getBookById(id);
        if (cancelled) return;
        if (!b) {
          setError('Book not found.');
          setBook(null);
          return;
        }
        setBook(b);
        if (b.status === 'checked_out') {
          const c = await getActiveCheckoutForBook(b.id);
          if (!cancelled) setCheckout(c ? enrichCheckout(c) : null);
        } else {
          setCheckout(null);
        }
      } catch (err) {
        if (!cancelled) setError(err.message ?? 'Failed to load book');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  function printLabel() {
    navigate(`/teacher/labels/print?ids=${book.id}`);
  }

  async function handleMarkNeedsLabel() {
    setLabelBusy(true);
    setError('');
    try {
      await markLabelsNeeded([book.id]);
      setBook((b) => ({ ...b, label_printed_at: null }));
    } catch (err) {
      setError(err.message ?? 'Failed to update label status');
    } finally {
      setLabelBusy(false);
    }
  }

  async function handleRemove() {
    if (
      !confirm(
        `Remove "${book.title}" from the library? This cannot be undone. Checkout history will also be deleted.`,
      )
    ) {
      return;
    }
    setRemoving(true);
    setError('');
    try {
      await deleteBook(book.id);
      navigate('/browse', { replace: true });
    } catch (err) {
      setError(err.message ?? 'Failed to remove book');
    } finally {
      setRemoving(false);
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <Stack align="center" style={{ padding: 'var(--space-8)' }}>
          <Spinner />
        </Stack>
      </PageContainer>
    );
  }

  if (error || !book) {
    return (
      <PageContainer>
        <Text style={{ color: 'var(--color-overdue)' }}>{error || 'Not found'}</Text>
      </PageContainer>
    );
  }

  const overdueDays = getOverdueDays();
  const isOverdue = checkout && checkout.daysOut > overdueDays;

  return (
    <PageContainer>
      <Stack gap="var(--space-5)">
        <SupabaseBanner />
        <Stack gap="var(--space-4)" style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <BookCover src={book.cover_url} alt={book.title} width={140} />
          <Stack gap="var(--space-2)" style={{ flex: 1 }}>
            <Text as="h1" variant="title">
              {book.title}
            </Text>
            {book.author ? (
              <Text variant="body" style={{ color: 'var(--color-text-muted)' }}>
                {book.author}
              </Text>
            ) : null}
            <Stack gap="var(--space-2)" style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              <Badge variant={book.status === 'available' ? 'available' : 'checked-out'}>
                {book.status === 'available' ? 'Available' : 'Checked out'}
              </Badge>
              {book.genre ? <Badge variant="neutral">{book.genre}</Badge> : null}
              {!book.label_printed_at ? <Badge variant="needs-label">Needs label</Badge> : null}
            </Stack>
            {book.publish_year ? <Text variant="label">Published {book.publish_year}</Text> : null}
            {book.isbn ? <Text variant="label">ISBN {book.isbn}</Text> : null}
            <Text variant="label" style={{ fontFamily: 'var(--font-mono)' }}>
              {book.barcode}
            </Text>
          </Stack>
        </Stack>
        {checkout ? (
          <Stack gap="var(--space-1)">
            <Text variant="emphasis">
              Checked out to {checkout.borrower_name} ({checkout.borrower_type})
            </Text>
            <Text
              variant="body"
              style={{ color: isOverdue ? 'var(--color-overdue)' : 'var(--color-text-muted)' }}
            >
              {checkout.daysOut} day{checkout.daysOut === 1 ? '' : 's'} out
              {isOverdue ? ` — overdue (>${overdueDays} days)` : ''}
            </Text>
          </Stack>
        ) : null}
        <Button variant="secondary" fullWidth onClick={printLabel}>
          {book.label_printed_at ? 'Re-print label' : 'Print label'}
        </Button>
        {isTeacher && book.label_printed_at ? (
          <Button variant="ghost" fullWidth loading={labelBusy} onClick={handleMarkNeedsLabel}>
            Mark as needs label
          </Button>
        ) : null}
        {isTeacher ? (
          <Button variant="ghost" fullWidth loading={removing} onClick={handleRemove}>
            Remove from library
          </Button>
        ) : null}
        {error ? <Text style={{ color: 'var(--color-overdue)' }}>{error}</Text> : null}
        <Link to="/browse" style={{ textAlign: 'center' }}>
          <Text variant="emphasis" style={{ color: 'var(--color-primary)' }}>
            Back to browse
          </Text>
        </Link>
      </Stack>
    </PageContainer>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge } from '../components/ui/Badge.jsx';
import { BookCover } from '../components/ui/BookCover.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { Stack } from '../components/ui/Stack.jsx';
import { Text } from '../components/ui/Text.jsx';
import { SupabaseBanner } from '../components/layout/SupabaseBanner.jsx';
import { PageContainer } from '../components/layout/PageContainer.jsx';
import { getBookById, deleteBook, markLabelsNeeded, updateBook } from '../lib/books.js';
import { getActiveCheckoutForBook, enrichCheckout } from '../lib/checkouts.js';
import { resolveBookReadingDisplay, normalizeLexile, formatLexile, readingLevelFromLexile } from '../lib/lexile.js';
import { getOverdueDays } from '../lib/settings.js';
import { useTeacherSession } from '../components/layout/TeacherSessionProvider.jsx';

export default function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [checkout, setCheckout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState(false);
  const [labelBusy, setLabelBusy] = useState(false);
  const [lexileInput, setLexileInput] = useState('');
  const [lexileBusy, setLexileBusy] = useState(false);
  const { isTeacher } = useTeacherSession();

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
        setLexileInput(b.lexile != null ? formatLexile(b.lexile) ?? '' : '');
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

  async function handleSaveLexile() {
    const trimmed = lexileInput.trim();
    const parsed = trimmed ? normalizeLexile(trimmed) : null;

    if (trimmed && parsed == null) {
      setError('Enter a Lexile like 720L or BR100L');
      return;
    }

    if (parsed === book.lexile) return;

    setLexileBusy(true);
    setError('');
    try {
      const updated = await updateBook(book.id, {
        lexile: parsed,
        reading_level: parsed != null ? readingLevelFromLexile(parsed) : null,
      });
      setBook(updated);
      setLexileInput(parsed != null ? formatLexile(parsed) ?? '' : '');
    } catch (err) {
      setError(err.message ?? 'Failed to save Lexile');
    } finally {
      setLexileBusy(false);
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
  const reading = isTeacher ? resolveBookReadingDisplay(book) : null;

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
              {isTeacher && reading?.readingLevel ? (
                <Badge variant="neutral">{reading.readingLevel}</Badge>
              ) : null}
              {!book.label_printed_at ? <Badge variant="needs-label">Needs label</Badge> : null}
            </Stack>
            {book.publish_year ? <Text variant="label">Published {book.publish_year}</Text> : null}
            {isTeacher && reading?.lexileLabel ? (
              <Text variant="label">
                Lexile {reading.lexileLabel}
                {reading.readingLevel ? ` · ${reading.readingLevel}` : ''}
              </Text>
            ) : isTeacher ? (
              <Stack gap="var(--space-1)">
                <Text variant="label" style={{ color: 'var(--color-text-muted)' }}>
                  Add Lexile
                </Text>
                <Stack
                  gap="var(--space-2)"
                  style={{ flexDirection: 'row', alignItems: 'center', maxWidth: 220 }}
                >
                  <input
                    value={lexileInput}
                    onChange={(e) => setLexileInput(e.target.value)}
                    placeholder="720L"
                    aria-label="Lexile measure"
                    style={{
                      flex: 1,
                      minWidth: 0,
                      minHeight: 40,
                      padding: 'var(--space-2)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-input-bg)',
                      color: 'var(--color-text)',
                      fontSize: 'var(--font-input)',
                      fontFamily: 'var(--font-mono)',
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveLexile();
                      }
                    }}
                  />
                  <Button
                    variant="secondary"
                    loading={lexileBusy}
                    onClick={handleSaveLexile}
                    style={{ minHeight: 40, padding: '0 var(--space-3)', flexShrink: 0 }}
                  >
                    Save
                  </Button>
                </Stack>
              </Stack>
            ) : null}
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
      </Stack>
    </PageContainer>
  );
}

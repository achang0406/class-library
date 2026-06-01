import { useEffect, useState } from 'react';
import { BarcodeScanner } from '../scanner/BarcodeScanner.jsx';
import { Button } from '../ui/Button.jsx';
import { Stack } from '../ui/Stack.jsx';
import { Text } from '../ui/Text.jsx';
import { getBookByBarcode, markLabelsPrinted } from '../../lib/books.js';

export function LabelVerifyPanel({ initialBooks, onDone }) {
  const [pending, setPending] = useState(initialBooks);
  const [scanFeedback, setScanFeedback] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPending(initialBooks);
  }, [initialBooks]);

  async function confirmBook(book) {
    setScanFeedback(null);
    setBusy(true);
    try {
      await markLabelsPrinted([book.id]);
      const wasInList = pending.some((b) => b.id === book.id);
      const remaining = wasInList ? pending.length - 1 : pending.length;
      setPending((prev) => prev.filter((b) => b.id !== book.id));
      setScanFeedback({ status: 'success', book, remaining });
    } catch (err) {
      setScanFeedback({
        status: 'error',
        message: err.message ?? 'Could not save label status.',
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleScan(raw) {
    const barcode = raw.trim().toUpperCase();
    let book = pending.find((b) => b.barcode === barcode);

    if (!book) {
      try {
        const fromDb = await getBookByBarcode(barcode);
        if (!fromDb) {
          setScanFeedback({ status: 'error', message: `No book found for ${barcode}.` });
          return;
        }
        if (fromDb.label_printed_at) {
          setScanFeedback({ status: 'already-validated', book: fromDb });
          return;
        }
        book = fromDb;
      } catch (err) {
        setScanFeedback({ status: 'error', message: err.message ?? 'Lookup failed.' });
        return;
      }
    }

    await confirmBook(book);
  }

  async function markAllWithoutScanning() {
    if (!pending.length) return;
    if (
      !confirm(
        `Mark ${pending.length} book${pending.length === 1 ? '' : 's'} as labeled without scanning? Use this only if every sticker is on the right book.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setScanFeedback(null);
    try {
      await markLabelsPrinted(pending.map((b) => b.id));
      setPending([]);
    } catch (err) {
      setScanFeedback({
        status: 'error',
        message: err.message ?? 'Could not save label status.',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Stack gap="var(--space-4)">
      <Stack gap="var(--space-1)">
        <Text variant="emphasis">Validate labels</Text>
        <Text variant="label" style={{ color: 'var(--color-text-muted)' }}>
          Scan each LIB- sticker after it&apos;s on a book to clear the &ldquo;Needs label&rdquo;
          badge.{' '}
          {pending.length > 0
            ? `${pending.length} book${pending.length === 1 ? '' : 's'} waiting.`
            : 'All caught up.'}
        </Text>
      </Stack>

      <BarcodeScanner scannerId="cl-label-verify" mode="qr" active={!busy} onScan={handleScan} />

      {scanFeedback?.status === 'success' ? (
        <Stack
          gap="var(--space-1)"
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-sm)',
            border: '2px solid var(--color-available)',
            background: 'color-mix(in srgb, var(--color-available) 14%, var(--color-card))',
          }}
          role="status"
          aria-live="polite"
        >
          <Text variant="emphasis" style={{ color: 'var(--color-primary)' }}>
            Validated
          </Text>
          <Text variant="body">
            {scanFeedback.book.title}
            {scanFeedback.book.author ? ` — ${scanFeedback.book.author}` : ''}
          </Text>
          <Text variant="label" style={{ fontFamily: 'var(--font-mono)' }}>
            {scanFeedback.book.barcode}
          </Text>
          <Text variant="label" style={{ color: 'var(--color-text-muted)' }}>
            {scanFeedback.remaining > 0
              ? `${scanFeedback.remaining} book${scanFeedback.remaining === 1 ? '' : 's'} left to validate.`
              : 'All labels validated — you\'re done!'}
          </Text>
        </Stack>
      ) : null}

      {scanFeedback?.status === 'already-validated' ? (
        <Stack
          gap="var(--space-1)"
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-sm)',
            border: '2px solid var(--color-accent)',
            background: 'color-mix(in srgb, var(--color-accent) 18%, var(--color-card))',
          }}
          role="status"
          aria-live="polite"
        >
          <Text variant="emphasis" style={{ color: 'var(--color-text)' }}>
            Already validated
          </Text>
          <Text variant="body">
            {scanFeedback.book.title}
            {scanFeedback.book.author ? ` — ${scanFeedback.book.author}` : ''}
          </Text>
          <Text variant="label" style={{ fontFamily: 'var(--font-mono)' }}>
            {scanFeedback.book.barcode}
          </Text>
          <Text variant="label" style={{ color: 'var(--color-text-muted)' }}>
            This label was confirmed earlier — no action needed.
          </Text>
        </Stack>
      ) : null}

      {scanFeedback?.status === 'error' ? (
        <Stack
          gap="var(--space-1)"
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-sm)',
            border: '2px solid var(--color-overdue)',
            background: 'color-mix(in srgb, var(--color-overdue) 10%, var(--color-card))',
          }}
          role="alert"
          aria-live="polite"
        >
          <Text variant="emphasis" style={{ color: 'var(--color-overdue)' }}>
            Could not validate
          </Text>
          <Text variant="body">{scanFeedback.message}</Text>
        </Stack>
      ) : null}

      {pending.length > 0 ? (
        <Stack gap="var(--space-2)">
          <Text variant="label">Still needs validation</Text>
          {pending.map((book) => (
            <Stack
              key={book.id}
              gap="var(--space-2)"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 'var(--space-2) var(--space-3)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-card)',
              }}
            >
              <code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{book.barcode}</code>
              <Text variant="label" style={{ flex: 1, minWidth: 0 }}>
                {book.title}
                {book.author ? ` — ${book.author}` : ''}
              </Text>
            </Stack>
          ))}
        </Stack>
      ) : (
        <Text variant="body" style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>
          No books waiting for label validation.
        </Text>
      )}

      {pending.length > 0 ? (
        <Button variant="ghost" fullWidth disabled={busy} onClick={markAllWithoutScanning}>
          Mark all as applied without scanning
        </Button>
      ) : null}
      {onDone ? (
        <Button variant="primary" fullWidth disabled={busy} onClick={onDone}>
          Done
        </Button>
      ) : null}
    </Stack>
  );
}

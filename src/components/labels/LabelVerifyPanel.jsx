import { useEffect, useState } from 'react';
import { BarcodeScanner } from '../scanner/BarcodeScanner.jsx';
import { Button } from '../ui/Button.jsx';
import { Stack } from '../ui/Stack.jsx';
import { Text } from '../ui/Text.jsx';
import { getBookByBarcode, markLabelsPrinted } from '../../lib/books.js';

export function LabelVerifyPanel({ initialBooks, onDone }) {
  const [pending, setPending] = useState(initialBooks);
  const [scanError, setScanError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPending(initialBooks);
  }, [initialBooks]);

  async function confirmBook(book) {
    setScanError('');
    setBusy(true);
    try {
      await markLabelsPrinted([book.id]);
      setPending((prev) => prev.filter((b) => b.id !== book.id));
    } catch (err) {
      setScanError(err.message ?? 'Could not save label status.');
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
          setScanError(`No book found for ${barcode}.`);
          return;
        }
        if (fromDb.label_printed_at) {
          setScanError(`${barcode} is already validated.`);
          return;
        }
        book = fromDb;
      } catch (err) {
        setScanError(err.message ?? 'Lookup failed.');
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
    setScanError('');
    try {
      await markLabelsPrinted(pending.map((b) => b.id));
      setPending([]);
    } catch (err) {
      setScanError(err.message ?? 'Could not save label status.');
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

      {scanError ? <Text style={{ color: 'var(--color-overdue)' }}>{scanError}</Text> : null}

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

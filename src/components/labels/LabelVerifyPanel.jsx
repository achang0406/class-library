import { useState } from 'react';
import { BarcodeScanner } from '../scanner/BarcodeScanner.jsx';
import { Button } from '../ui/Button.jsx';
import { Stack } from '../ui/Stack.jsx';
import { Text } from '../ui/Text.jsx';
import { markLabelsPrinted } from '../../lib/books.js';

export function LabelVerifyPanel({ books, onDone }) {
  const [confirmed, setConfirmed] = useState(
    () => new Set(books.filter((b) => b.label_printed_at).map((b) => b.id)),
  );
  const [scanError, setScanError] = useState('');
  const [busy, setBusy] = useState(false);

  const pendingCount = books.length - confirmed.size;

  async function handleScan(raw) {
    const barcode = raw.trim().toUpperCase();
    const book = books.find((b) => b.barcode === barcode);
    if (!book) {
      setScanError(`${barcode} is not in this batch. Scan a sticker you just printed.`);
      return;
    }
    if (confirmed.has(book.id)) {
      setScanError(`${barcode} already confirmed.`);
      return;
    }
    setScanError('');
    setBusy(true);
    try {
      await markLabelsPrinted([book.id]);
      setConfirmed((prev) => new Set([...prev, book.id]));
    } catch (err) {
      setScanError(err.message ?? 'Could not save label status.');
    } finally {
      setBusy(false);
    }
  }

  async function markAllWithoutScanning() {
    const pendingIds = books.filter((b) => !confirmed.has(b.id)).map((b) => b.id);
    if (!pendingIds.length) return;
    if (
      !confirm(
        `Mark ${pendingIds.length} book${pendingIds.length === 1 ? '' : 's'} as labeled without scanning? Use this only if every sticker is on the right book.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setScanError('');
    try {
      await markLabelsPrinted(pendingIds);
      setConfirmed(new Set(books.map((b) => b.id)));
    } catch (err) {
      setScanError(err.message ?? 'Could not save label status.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Stack gap="var(--space-4)" style={{ padding: 'var(--space-4)' }}>
      <Stack gap="var(--space-1)">
        <Text variant="emphasis">Confirm labels applied</Text>
        <Text variant="label" style={{ color: 'var(--color-text-muted)' }}>
          After putting each sticker on a book, scan it here to clear the &ldquo;Needs label&rdquo;
          badge. {pendingCount > 0 ? `${pendingCount} left.` : 'All confirmed.'}
        </Text>
      </Stack>

      <BarcodeScanner scannerId="cl-label-verify" mode="qr" active={!busy} onScan={handleScan} />

      <Stack gap="var(--space-2)">
        {books.map((book) => (
          <Stack
            key={book.id}
            gap="var(--space-2)"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 'var(--space-2) var(--space-3)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              background: confirmed.has(book.id) ? 'var(--color-surface)' : 'var(--color-card)',
            }}
          >
            <Text variant="label" style={{ minWidth: '1.25rem' }}>
              {confirmed.has(book.id) ? '✓' : '○'}
            </Text>
            <code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{book.barcode}</code>
            <Text variant="label" style={{ flex: 1, minWidth: 0 }}>
              {book.title}
            </Text>
          </Stack>
        ))}
      </Stack>

      {scanError ? <Text style={{ color: 'var(--color-overdue)' }}>{scanError}</Text> : null}

      {pendingCount > 0 ? (
        <Button variant="ghost" fullWidth disabled={busy} onClick={markAllWithoutScanning}>
          Mark all applied without scanning
        </Button>
      ) : null}
      <Button variant="primary" fullWidth disabled={busy} onClick={onDone}>
        Done
      </Button>
    </Stack>
  );
}

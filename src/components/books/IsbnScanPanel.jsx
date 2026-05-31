import { useState } from 'react';
import { BarcodeScanner } from '../scanner/BarcodeScanner.jsx';
import { Button } from '../ui/Button.jsx';
import { Input } from '../ui/Input.jsx';
import { Spinner } from '../ui/Spinner.jsx';
import { Stack } from '../ui/Stack.jsx';
import { Text } from '../ui/Text.jsx';

const ISBN_SCANNER_ID = 'cl-isbn-scanner';

export function IsbnScanPanel({ onLookup, onCancel, busy = false, error = '' }) {
  const [manualIsbn, setManualIsbn] = useState('');

  function submitManual(e) {
    e?.preventDefault();
    const trimmed = manualIsbn.trim();
    if (trimmed) onLookup(trimmed);
  }

  return (
    <Stack
      gap="var(--space-4)"
      style={{
        padding: 'var(--space-4)',
        border: '1px solid var(--color-primary)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-surface)',
      }}
    >
      <Stack gap="var(--space-1)">
        <Text variant="emphasis">Scan ISBN on back cover</Text>
        <Text variant="label" style={{ color: 'var(--color-text-muted)' }}>
          Use the printed barcode above the ISBN number — not your LIB- checkout sticker.
        </Text>
      </Stack>

      <BarcodeScanner
        scannerId={ISBN_SCANNER_ID}
        mode="isbn"
        active={!busy}
        onScan={onLookup}
      />

      <form onSubmit={submitManual}>
        <Stack gap="var(--space-2)">
          <Input
            label="Or type ISBN"
            placeholder="9780142401080"
            value={manualIsbn}
            onChange={(e) => setManualIsbn(e.target.value.replace(/[^\d-]/g, ''))}
            inputMode="numeric"
          />
          <Button type="submit" variant="secondary" fullWidth disabled={!manualIsbn.trim() || busy}>
            Look up ISBN
          </Button>
        </Stack>
      </form>

      {busy ? (
        <Stack align="center" gap="var(--space-2)">
          <Spinner />
          <Text variant="label">Looking up on Open Library…</Text>
        </Stack>
      ) : null}

      {error ? <Text style={{ color: 'var(--color-overdue)' }}>{error}</Text> : null}

      {onCancel ? (
        <Button variant="ghost" fullWidth onClick={onCancel}>
          Cancel scan
        </Button>
      ) : null}
    </Stack>
  );
}

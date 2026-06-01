import { useRef, useState } from 'react';
import { BarcodeScanner } from '../scanner/BarcodeScanner.jsx';
import { Button } from '../ui/Button.jsx';
import { Input } from '../ui/Input.jsx';
import { Spinner } from '../ui/Spinner.jsx';
import { Stack } from '../ui/Stack.jsx';
import { Text } from '../ui/Text.jsx';
import { captureIsbnFrame, readIsbnFromPhotoFile } from '../../lib/isbnCapture.js';

const ISBN_SCANNER_ID = 'cl-isbn-scanner';

export function IsbnScanPanel({ onLookup, onCancel, busy = false, error = '' }) {
  const [manualIsbn, setManualIsbn] = useState('');
  const [captureBusy, setCaptureBusy] = useState(false);
  const [captureError, setCaptureError] = useState('');
  const photoInputRef = useRef(null);

  const lookupBusy = busy;
  const displayError = error || captureError;

  function submitManual(e) {
    e?.preventDefault();
    const trimmed = manualIsbn.trim();
    if (trimmed) onLookup(trimmed);
  }

  async function handleCapture() {
    setCaptureError('');
    let file;
    try {
      file = await captureIsbnFrame(ISBN_SCANNER_ID);
    } catch (err) {
      setCaptureError(err.message ?? 'Could not read ISBN from camera.');
      return;
    }

    setCaptureBusy(true);
    try {
      const isbn = await readIsbnFromPhotoFile(file);
      await onLookup(isbn);
    } catch (err) {
      setCaptureError(err.message ?? 'Could not read ISBN from camera.');
    } finally {
      setCaptureBusy(false);
    }
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setCaptureBusy(true);
    setCaptureError('');
    try {
      const isbn = await readIsbnFromPhotoFile(file);
      await onLookup(isbn);
    } catch (err) {
      setCaptureError(err.message ?? 'Could not read ISBN from photo.');
    } finally {
      setCaptureBusy(false);
    }
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
          Live scan reads the barcode automatically. Tap the preview to focus, or hold 8–12″ back if
          blurry. Use Capture ISBN for printed numbers — not your LIB- checkout sticker.
        </Text>
      </Stack>

      <BarcodeScanner
        scannerId={ISBN_SCANNER_ID}
        mode="isbn"
        active={!lookupBusy}
        onScan={onLookup}
      />

      <Stack gap="var(--space-2)">
        <Button variant="accent" fullWidth disabled={lookupBusy || captureBusy} onClick={handleCapture}>
          Capture ISBN from camera
        </Button>
        <Text variant="label" style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>
          Hold the printed ISBN number in the frame, then tap capture.
        </Text>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handlePhotoChange}
        />
        <Button
          variant="secondary"
          fullWidth
          disabled={lookupBusy || captureBusy}
          onClick={() => photoInputRef.current?.click()}
        >
          Upload ISBN photo
        </Button>
      </Stack>

      <form onSubmit={submitManual}>
        <Stack gap="var(--space-2)">
          <Input
            label="Or type ISBN"
            placeholder="9780142401080"
            value={manualIsbn}
            onChange={(e) => setManualIsbn(e.target.value.replace(/[^\d-]/g, ''))}
            inputMode="numeric"
          />
          <Button
            type="submit"
            variant="secondary"
            fullWidth
            disabled={!manualIsbn.trim() || lookupBusy || captureBusy}
          >
            Look up ISBN
          </Button>
        </Stack>
      </form>

      {lookupBusy || captureBusy ? (
        <Stack align="center" gap="var(--space-2)">
          <Spinner />
          <Text variant="label">
            {lookupBusy ? 'Looking up on Open Library…' : 'Reading ISBN from image…'}
          </Text>
        </Stack>
      ) : null}

      {displayError ? <Text style={{ color: 'var(--color-overdue)' }}>{displayError}</Text> : null}

      {onCancel ? (
        <Button variant="ghost" fullWidth onClick={onCancel} disabled={lookupBusy || captureBusy}>
          Cancel scan
        </Button>
      ) : null}
    </Stack>
  );
}

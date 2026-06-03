import { useRef, useState } from 'react';
import { BarcodeScanner } from '../scanner/BarcodeScanner.jsx';
import { Button } from '../ui/Button.jsx';
import { Input } from '../ui/Input.jsx';
import { Spinner } from '../ui/Spinner.jsx';
import { Stack } from '../ui/Stack.jsx';
import { StatusBanner } from '../ui/StatusBanner.jsx';
import { Text } from '../ui/Text.jsx';
import { textLinkStyle } from '../ui/TextLink.jsx';
import { captureIsbnFromScanner, normalizeScannedIsbn, readIsbnFromPhotoFile } from '../../lib/isbnCapture.js';

const ISBN_SCANNER_ID = 'cl-isbn-scanner';

const INPUT_MODES = {
  camera: 'camera',
  manual: 'manual',
};

export function IsbnScanPanel({ onLookup, onCancel, busy = false, error = '' }) {
  const [inputMode, setInputMode] = useState(INPUT_MODES.camera);
  const [manualIsbn, setManualIsbn] = useState('');
  const [captureBusy, setCaptureBusy] = useState(false);
  const [captureError, setCaptureError] = useState('');
  const photoInputRef = useRef(null);

  const lookupBusy = busy;
  const displayError = error || captureError;
  const disabled = lookupBusy || captureBusy;

  function switchMode(mode) {
    setInputMode(mode);
    setCaptureError('');
  }

  function submitManual(e) {
    e?.preventDefault();
    const trimmed = manualIsbn.trim();
    if (trimmed) onLookup(trimmed);
  }

  function handleLiveScan(raw) {
    const isbn = normalizeScannedIsbn(raw);
    if (!isbn) {
      setCaptureError('Not a valid ISBN barcode. Try Capture ISBN or switch to Photo or type.');
      return;
    }
    setCaptureError('');
    onLookup(isbn);
  }

  async function handleCapture() {
    setCaptureError('');
    setCaptureBusy(true);
    try {
      const isbn = await captureIsbnFromScanner(ISBN_SCANNER_ID);
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
    <Stack gap="var(--space-4)">
      <Stack gap="var(--space-1)">
        <Text as="h2" variant="title">
          Add by ISBN
        </Text>
        <Text variant="label" style={{ color: 'var(--color-text-muted)' }}>
          Use the ISBN on the back cover — not your LIB- checkout sticker.
        </Text>
      </Stack>

      <Stack gap="var(--space-2)" style={{ flexDirection: 'row' }}>
        <Button
          variant={inputMode === INPUT_MODES.camera ? 'primary' : 'secondary'}
          onClick={() => switchMode(INPUT_MODES.camera)}
          style={{ flex: 1 }}
          disabled={disabled}
        >
          Scan barcode
        </Button>
        <Button
          variant={inputMode === INPUT_MODES.manual ? 'primary' : 'secondary'}
          onClick={() => switchMode(INPUT_MODES.manual)}
          style={{ flex: 1 }}
          disabled={disabled}
        >
          Photo or type
        </Button>
      </Stack>

      {inputMode === INPUT_MODES.camera ? (
        <Stack gap="var(--space-3)">
          <BarcodeScanner
            scannerId={ISBN_SCANNER_ID}
            mode="isbn"
            compact
            active={!disabled}
            onScan={handleLiveScan}
          />
          <Button variant="accent" fullWidth disabled={disabled} onClick={handleCapture}>
            Capture ISBN
          </Button>
        </Stack>
      ) : (
        <Stack gap="var(--space-3)">
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
            disabled={disabled}
            onClick={() => photoInputRef.current?.click()}
          >
            Upload ISBN photo
          </Button>
          <form onSubmit={submitManual}>
            <Stack gap="var(--space-2)">
              <Input
                label="ISBN"
                placeholder="9780142401080"
                value={manualIsbn}
                onChange={(e) => setManualIsbn(e.target.value.replace(/[^\d-]/g, ''))}
                inputMode="numeric"
              />
              <Button type="submit" variant="primary" fullWidth disabled={!manualIsbn.trim() || disabled}>
                Look up ISBN
              </Button>
            </Stack>
          </form>
        </Stack>
      )}

      {lookupBusy || captureBusy ? (
        <Stack align="center" gap="var(--space-2)">
          <Spinner />
          <Text variant="label">
            {lookupBusy ? 'Looking up on Open Library…' : 'Reading ISBN…'}
          </Text>
        </Stack>
      ) : null}

      {displayError ? (
        <StatusBanner variant="error" title="Could not read ISBN" role="alert">
          <Text variant="body">{displayError}</Text>
        </StatusBanner>
      ) : null}

      {onCancel ? (
        <button
          type="button"
          onClick={onCancel}
          disabled={disabled}
          style={{
            ...textLinkStyle,
            display: 'block',
            width: '100%',
            textAlign: 'center',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          Cancel
        </button>
      ) : null}
    </Stack>
  );
}

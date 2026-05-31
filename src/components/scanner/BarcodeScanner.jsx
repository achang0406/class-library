import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Text } from '../ui/Text.jsx';
import { Button } from '../ui/Button.jsx';

const SCANNER_ID = 'cl-barcode-scanner';

const SCAN_MODES = {
  qr: {
    formats: undefined,
    qrbox: { width: 260, height: 260 },
    hint: 'Point camera at the QR sticker on the book',
  },
  isbn: {
    formats: [Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.EAN_8],
    qrbox: { width: 280, height: 120 },
    hint: 'Point camera at the ISBN barcode on the back cover',
  },
};

export function BarcodeScanner({
  onScan,
  active = true,
  scannerId = SCANNER_ID,
  mode = 'qr',
}) {
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const scannerRef = useRef(null);
  const handledRef = useRef(false);
  const onScanRef = useRef(onScan);
  const modeConfig = SCAN_MODES[mode] ?? SCAN_MODES.qr;
  const scanFormats = modeConfig.formats;
  const scanQrbox = modeConfig.qrbox;
  const scanHint = modeConfig.hint;

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!active) return undefined;

    let cancelled = false;
    handledRef.current = false;

    async function start() {
      try {
        const config = scanFormats
          ? { verbose: false, formatsToSupport: scanFormats }
          : { verbose: false };
        const scanner = new Html5Qrcode(scannerId, config);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: scanQrbox },
          (decoded) => {
            if (handledRef.current) return;
            handledRef.current = true;
            const value = mode === 'qr' ? decoded.trim().toUpperCase() : decoded.trim();
            onScanRef.current(value);
          },
          () => {},
        );
        if (!cancelled) setRunning(true);
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.message ?? 'Could not access camera. Use HTTPS or allow camera permission.',
          );
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner?.isScanning) {
        scanner.stop().catch(() => {});
      }
    };
  }, [active, scannerId, mode, scanFormats, scanQrbox]);

  return (
    <div style={{ width: '100%' }}>
      <div
        id={scannerId}
        style={{
          width: '100%',
          minHeight: mode === 'isbn' ? 200 : 240,
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          border: '2px dashed var(--color-primary)',
          background: 'var(--color-card)',
        }}
      />
      {error ? (
        <Text style={{ color: 'var(--color-overdue)', marginTop: 'var(--space-3)' }}>{error}</Text>
      ) : (
        <Text
          variant="label"
          style={{ marginTop: 'var(--space-2)', textAlign: 'center', display: 'block' }}
        >
          {running ? scanHint : 'Starting camera…'}
        </Text>
      )}
    </div>
  );
}

export function ManualBarcodeEntry({ onSubmit, placeholder = 'LIB-000001', label = 'Or enter barcode manually' }) {
  const [value, setValue] = useState('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <Text variant="label">{label}</Text>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        style={{
          minHeight: 44,
          padding: 'var(--space-2) var(--space-3)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          fontFamily: placeholder.startsWith('LIB') ? 'var(--font-mono)' : 'inherit',
        }}
      />
      <Button
        variant="secondary"
        fullWidth
        onClick={() => {
          const trimmed = value.trim();
          if (trimmed) onSubmit(trimmed);
        }}
      >
        Look up
      </Button>
    </div>
  );
}

export function BarcodeScannerPanel({ onScan, onCancel, active = true, mode = 'qr' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <BarcodeScanner onScan={onScan} active={active} mode={mode} />
      {mode === 'qr' ? <ManualBarcodeEntry onSubmit={onScan} /> : null}
      {onCancel ? (
        <Button variant="ghost" fullWidth onClick={onCancel}>
          Cancel
        </Button>
      ) : null}
    </div>
  );
}

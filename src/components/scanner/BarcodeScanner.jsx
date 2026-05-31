import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Text } from '../ui/Text.jsx';
import { Button } from '../ui/Button.jsx';

const SCANNER_ID = 'cl-barcode-scanner';

export function BarcodeScanner({ onScan, active = true }) {
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const scannerRef = useRef(null);
  const handledRef = useRef(false);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!active) return undefined;

    let cancelled = false;
    handledRef.current = false;

    async function start() {
      try {
        const scanner = new Html5Qrcode(SCANNER_ID);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 260, height: 260 } },
          (decoded) => {
            if (handledRef.current) return;
            handledRef.current = true;
            onScanRef.current(decoded.trim().toUpperCase());
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
  }, [active]);

  return (
    <div style={{ width: '100%' }}>
      <div
        id={SCANNER_ID}
        style={{
          width: '100%',
          minHeight: 240,
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
          {running ? 'Point camera at the QR sticker on the book' : 'Starting camera…'}
        </Text>
      )}
    </div>
  );
}

export function ManualBarcodeEntry({ onSubmit }) {
  const [value, setValue] = useState('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <Text variant="label">Or enter barcode manually</Text>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value.toUpperCase())}
        placeholder="LIB-000001"
        style={{
          minHeight: 44,
          padding: 'var(--space-2) var(--space-3)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          fontFamily: 'var(--font-mono)',
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

export function BarcodeScannerPanel({ onScan, onCancel, active = true }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <BarcodeScanner onScan={onScan} active={active} />
      <ManualBarcodeEntry onSubmit={onScan} />
      {onCancel ? (
        <Button variant="ghost" fullWidth onClick={onCancel}>
          Cancel
        </Button>
      ) : null}
    </div>
  );
}

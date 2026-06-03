import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Text } from '../ui/Text.jsx';
import { Button } from '../ui/Button.jsx';
import { Stack } from '../ui/Stack.jsx';
import {
  applyTapFocus,
  getScannerVideoTrack,
  normalizedPointFromTap,
} from '../../lib/cameraFocus.js';

const SCANNER_ID = 'cl-barcode-scanner';
const SCAN_COOLDOWN_MS = 1200;
const FOCUS_RING_MS = 900;

const ISBN_BARCODE_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
];

const DEFAULT_CAMERA_CONSTRAINTS = { facingMode: 'environment' };

/** Prefer higher quality on devices that support it; fall back if start fails. */
const ISBN_CAMERA_CONSTRAINTS = [
  { facingMode: 'environment' },
  DEFAULT_CAMERA_CONSTRAINTS,
];

function formatCameraError(err) {
  const message =
    typeof err === 'string' ? err : err?.message ?? err?.name ?? '';
  if (!message) {
    return 'Could not access camera. Use HTTPS or allow camera permission.';
  }
  if (/NotAllowed|Permission/i.test(message)) {
    return 'Camera permission denied. Allow camera access in browser settings, then reload.';
  }
  if (/NotFound|DevicesNotFound/i.test(message)) {
    return 'No camera found on this device.';
  }
  if (/NotReadable|TrackStart|in use/i.test(message)) {
    return 'Camera is in use by another app. Close other camera apps and try again.';
  }
  if (/Overconstrained|Constraint/i.test(message)) {
    return 'Camera settings not supported on this device. Reload and try again.';
  }
  if (!/^https:/i.test(window.location.protocol) && window.location.hostname !== 'localhost') {
    return `${message} Camera requires HTTPS. Open https://class-library.vercel.app instead.`;
  }
  return message;
}

async function startScannerCamera(scanner, preferredConstraints, cameraConfig, onDecode) {
  const attempts =
    preferredConstraints === DEFAULT_CAMERA_CONSTRAINTS
      ? [DEFAULT_CAMERA_CONSTRAINTS]
      : Array.isArray(preferredConstraints)
        ? preferredConstraints
        : [preferredConstraints, DEFAULT_CAMERA_CONSTRAINTS];

  let lastError;
  for (const constraints of attempts) {
    try {
      await scanner.start(constraints, cameraConfig, onDecode, () => {});
      return;
    } catch (err) {
      lastError = err;
      if (scanner.isScanning) {
        await scanner.stop().catch(() => {});
      }
    }
  }
  throw lastError;
}

function getScanRegionGuideStyle(mode) {
  if (mode === 'isbn') {
    return {
      position: 'absolute',
      left: '4%',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '92%',
      height: '28%',
      border: '2px solid var(--color-accent)',
      borderRadius: 'var(--radius-sm)',
      boxShadow: '0 0 0 1px color-mix(in srgb, var(--color-accent) 35%, transparent)',
      pointerEvents: 'none',
    };
  }

  return {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: 'min(72%, 260px)',
    aspectRatio: '1',
    border: '2px solid var(--color-accent)',
    borderRadius: 'var(--radius-sm)',
    boxShadow: '0 0 0 1px color-mix(in srgb, var(--color-accent) 35%, transparent)',
    pointerEvents: 'none',
  };
}

const SCAN_MODES = {
  qr: {
    formats: undefined,
    qrbox: { width: 260, height: 260 },
    fps: 10,
    hint: 'Point at the QR sticker · tap to focus',
    cameraConstraints: DEFAULT_CAMERA_CONSTRAINTS,
  },
  isbn: {
    formats: ISBN_BARCODE_FORMATS,
    qrbox: (viewfinderWidth, viewfinderHeight) => ({
      width: Math.floor(viewfinderWidth * 0.92),
      height: Math.max(72, Math.floor(viewfinderHeight * 0.28)),
    }),
    fps: 15,
    hint: 'Line up the ISBN barcode · tap to focus',
    cameraConstraints: ISBN_CAMERA_CONSTRAINTS,
  },
};

export function BarcodeScanner({
  onScan,
  active = true,
  scannerId = SCANNER_ID,
  mode = 'qr',
  compact = false,
}) {
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const [focusRing, setFocusRing] = useState(null);
  const scannerRef = useRef(null);
  const viewportRef = useRef(null);
  const focusTimerRef = useRef(null);
  const handledRef = useRef(false);
  const onScanRef = useRef(onScan);
  const modeConfig = SCAN_MODES[mode] ?? SCAN_MODES.qr;
  const scanFormats = modeConfig.formats;
  const scanQrbox = modeConfig.qrbox;
  const scanFps = modeConfig.fps;
  const scanHint = modeConfig.hint;
  const tapToFocusEnabled = running;

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!active) return undefined;

    let cancelled = false;
    handledRef.current = false;
    setError('');

    async function start() {
      try {
        const config = scanFormats
          ? {
              verbose: false,
              formatsToSupport: scanFormats,
              useBarCodeDetectorIfSupported: true,
            }
          : { verbose: false };
        const scanner = new Html5Qrcode(scannerId, config);
        scannerRef.current = scanner;

        const cameraConfig = {
          fps: scanFps,
          ...(scanQrbox ? { qrbox: scanQrbox } : {}),
        };

        await startScannerCamera(
          scanner,
          modeConfig.cameraConstraints,
          cameraConfig,
          (decoded) => {
            if (handledRef.current) return;
            handledRef.current = true;
            const value = mode === 'qr' ? decoded.trim().toUpperCase() : decoded.trim();
            onScanRef.current(value);
            window.setTimeout(() => {
              handledRef.current = false;
            }, SCAN_COOLDOWN_MS);
          },
        );

        if (!cancelled) {
          setRunning(true);
        }
      } catch (err) {
        if (!cancelled) {
          setError(formatCameraError(err));
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      setRunning(false);
      if (focusTimerRef.current) {
        window.clearTimeout(focusTimerRef.current);
        focusTimerRef.current = null;
      }
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner?.isScanning) {
        scanner.stop().catch(() => {});
      }
    };
  }, [active, scannerId, mode, modeConfig, scanFormats, scanQrbox, scanFps]);

  async function handleTapFocus(event) {
    if (!tapToFocusEnabled || !viewportRef.current) return;

    const container = viewportRef.current;
    const point = normalizedPointFromTap(container, event.clientX, event.clientY);
    const ringX = event.clientX - container.getBoundingClientRect().left;
    const ringY = event.clientY - container.getBoundingClientRect().top;

    setFocusRing({ x: ringX, y: ringY });
    if (focusTimerRef.current) window.clearTimeout(focusTimerRef.current);
    focusTimerRef.current = window.setTimeout(() => {
      setFocusRing(null);
      focusTimerRef.current = null;
    }, FOCUS_RING_MS);

    const track = getScannerVideoTrack(scannerId);
    if (!track) return;
    await applyTapFocus(track, point);
  }

  return (
    <div style={{ width: '100%' }}>
      <div
        ref={viewportRef}
        style={{
          position: 'relative',
          width: '100%',
          minHeight: 240,
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          border: '2px dashed var(--color-primary)',
          background: 'var(--color-card)',
        }}
      >
        <div id={scannerId} style={{ width: '100%', minHeight: 240 }} />
        {running ? (
          <div aria-hidden style={getScanRegionGuideStyle(mode)} />
        ) : null}
        {tapToFocusEnabled ? (
          <button
            type="button"
            aria-label="Tap to focus camera on this spot"
            onPointerDown={handleTapFocus}
            style={{
              position: 'absolute',
              inset: 0,
              margin: 0,
              padding: 0,
              border: 'none',
              background: 'transparent',
              cursor: 'crosshair',
              touchAction: 'manipulation',
            }}
          />
        ) : null}
        {focusRing ? (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: focusRing.x,
              top: focusRing.y,
              width: 56,
              height: 56,
              transform: 'translate(-50%, -50%)',
              border: '2px solid var(--color-accent)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: '0 0 0 1px rgba(0,0,0,0.25)',
              pointerEvents: 'none',
            }}
          />
        ) : null}
      </div>
      {error ? (
        <Text style={{ color: 'var(--color-overdue)', marginTop: 'var(--space-3)' }}>{error}</Text>
      ) : (
        <Text
          variant="label"
          style={{
            textAlign: 'center',
            display: 'block',
            marginTop: 'var(--space-2)',
            color: compact ? 'var(--color-text-muted)' : 'var(--color-text)',
          }}
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
          fontSize: 'var(--font-input)',
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

export function BarcodeScannerPanel({
  onScan,
  onCancel,
  active = true,
  mode = 'qr',
  betweenScannerAndManual = null,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <BarcodeScanner onScan={onScan} active={active} mode={mode} />
      {betweenScannerAndManual ? (
        <Stack gap="var(--space-3)">{betweenScannerAndManual}</Stack>
      ) : null}
      {mode === 'qr' ? <ManualBarcodeEntry onSubmit={onScan} /> : null}
      {onCancel ? (
        <Button variant="ghost" fullWidth onClick={onCancel}>
          Cancel
        </Button>
      ) : null}
    </div>
  );
}

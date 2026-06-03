import { useEffect, useState } from 'react';
import { textLinkStyle } from '../ui/TextLink.jsx';

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

function detectPlatform() {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'android';
  if (/iPad|iPhone|iPod/i.test(ua)) return 'ios';
  return 'other';
}

export function InstallAppLink() {
  const [installed, setInstalled] = useState(isStandalone);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const platform = detectPlatform();

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return undefined;
    }

    function onBeforeInstallPrompt(event) {
      event.preventDefault();
      setDeferredPrompt(event);
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  }, []);

  if (installed) return null;

  if (deferredPrompt) {
    return (
      <button
        type="button"
        onClick={async () => {
          deferredPrompt.prompt();
          await deferredPrompt.userChoice;
          setDeferredPrompt(null);
          if (isStandalone()) setInstalled(true);
        }}
        style={{
          ...textLinkStyle,
          display: 'block',
          margin: '0 auto',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
        }}
      >
        Install app
      </button>
    );
  }

  const hintStyle = {
    fontSize: 'var(--font-label)',
    color: 'var(--color-text-muted)',
    textAlign: 'center',
    margin: 0,
  };

  if (platform === 'ios') {
    return (
      <p style={hintStyle}>
        Install on iPhone or iPad: tap Share, then Add to Home Screen
      </p>
    );
  }

  if (platform === 'android') {
    return (
      <p style={hintStyle}>
        Install on Android: open the browser menu, then Install app or Add to Home screen
      </p>
    );
  }

  return (
    <p style={hintStyle}>
      Install: use your browser&apos;s Install app or Add to Home Screen option
    </p>
  );
}

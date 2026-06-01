export function getScannerVideoTrack(scannerId) {
  const video = document.querySelector(`#${scannerId} video`);
  const stream = video?.srcObject;
  if (!stream || typeof stream.getVideoTracks !== 'function') return null;
  return stream.getVideoTracks()[0] ?? null;
}

export function supportsTapFocus(track) {
  if (!track?.getCapabilities) return false;
  const caps = track.getCapabilities();
  return Boolean(caps.pointsOfInterest || caps.focusMode?.length);
}

export function normalizedPointFromTap(container, clientX, clientY) {
  const rect = container.getBoundingClientRect();
  if (!rect.width || !rect.height) return { x: 0.5, y: 0.5 };
  return {
    x: Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)),
    y: Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)),
  };
}

/** Tap-to-focus where supported; otherwise re-trigger single-shot autofocus. */
export async function applyTapFocus(track, normalizedPoint) {
  if (!track?.applyConstraints) {
    return { ok: false, mode: 'unsupported' };
  }

  const caps = track.getCapabilities?.() ?? {};
  const modes = caps.focusMode ?? [];
  const advanced = [];

  if (caps.pointsOfInterest) {
    advanced.push({ pointsOfInterest: [normalizedPoint] });
  }

  if (modes.includes('single-shot')) {
    advanced.push({
      focusMode: 'single-shot',
      ...(caps.pointsOfInterest ? { pointsOfInterest: [normalizedPoint] } : {}),
    });
  } else if (modes.includes('continuous')) {
    advanced.push({
      focusMode: 'continuous',
      ...(caps.pointsOfInterest ? { pointsOfInterest: [normalizedPoint] } : {}),
    });
  }

  if (!advanced.length) {
    return { ok: false, mode: 'unsupported' };
  }

  try {
    await track.applyConstraints({ advanced });

    if (modes.includes('single-shot') && modes.includes('continuous')) {
      window.setTimeout(() => {
        track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }).catch(() => {});
      }, 700);
    }

    return {
      ok: true,
      mode: caps.pointsOfInterest ? 'point' : 'refocus',
    };
  } catch {
    return { ok: false, mode: 'failed' };
  }
}

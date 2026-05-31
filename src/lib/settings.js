import { DEFAULT_OVERDUE_DAYS } from '../constants/genres.js';

const KEY = 'class_library_overdue_days';

export function getOverdueDays() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const n = parseInt(raw, 10);
      if (n > 0) return n;
    }
  } catch {
    // ignore
  }
  return DEFAULT_OVERDUE_DAYS;
}

export function setOverdueDays(days) {
  try {
    localStorage.setItem(KEY, String(days));
  } catch {
    // ignore
  }
}

export function daysSince(isoDate) {
  if (!isoDate) return 0;
  const ms = Date.now() - new Date(isoDate).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

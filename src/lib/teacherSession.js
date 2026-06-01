const SESSION_KEY = 'class_library_teacher_session';
const EXPIRES_KEY = 'class_library_teacher_expires';

/** Sign out after this much idle time (ms). */
export const TEACHER_SESSION_INACTIVITY_MS = 30 * 60 * 1000;

function readExpiresAt() {
  try {
    const raw = sessionStorage.getItem(EXPIRES_KEY);
    if (!raw) return null;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function writeExpiresAt(expiresAt) {
  try {
    sessionStorage.setItem(EXPIRES_KEY, String(expiresAt));
  } catch {
    // Storage unavailable
  }
}

function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(EXPIRES_KEY);
  } catch {
    // Storage unavailable
  }
}

function expectedPasscode() {
  return (
    import.meta.env.VITE_TEACHER_PASSCODE ??
    import.meta.env.VITE_TEACHER_PASSWORD ??
    ''
  );
}

export function isTeacherLoggedIn() {
  try {
    if (sessionStorage.getItem(SESSION_KEY) !== 'true') return false;
    const expiresAt = readExpiresAt();
    if (!expiresAt || Date.now() >= expiresAt) {
      clearSession();
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function getTeacherSessionExpiresAt() {
  if (!isTeacherLoggedIn()) return null;
  return readExpiresAt();
}

export function setTeacherLoggedIn(value) {
  try {
    if (value) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      writeExpiresAt(Date.now() + TEACHER_SESSION_INACTIVITY_MS);
    } else {
      clearSession();
    }
  } catch {
    // Storage unavailable
  }
}

/** Extend idle timeout after user activity. Returns true if session is still active. */
export function touchTeacherActivity() {
  if (!isTeacherLoggedIn()) return false;
  writeExpiresAt(Date.now() + TEACHER_SESSION_INACTIVITY_MS);
  return true;
}

export function signOutTeacher() {
  setTeacherLoggedIn(false);
}

export function verifyTeacherPasscode(code) {
  const expected = expectedPasscode();
  if (!/^\d{4}$/.test(String(code))) return false;
  if (!/^\d{4}$/.test(String(expected))) return false;
  return code === expected;
}

/** @deprecated use verifyTeacherPasscode */
export function verifyTeacherPassword(password) {
  return verifyTeacherPasscode(password);
}

export function isTeacherPasscodeConfigured() {
  return /^\d{4}$/.test(String(expectedPasscode()));
}

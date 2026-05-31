const SESSION_KEY = 'class_library_teacher_session';

export function isTeacherLoggedIn() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setTeacherLoggedIn(value) {
  try {
    if (value) {
      sessionStorage.setItem(SESSION_KEY, 'true');
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  } catch {
    // Storage unavailable
  }
}

export function verifyTeacherPassword(password) {
  const expected = import.meta.env.VITE_TEACHER_PASSWORD ?? '';
  return expected.length > 0 && password === expected;
}

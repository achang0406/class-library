/* eslint-disable react-refresh/only-export-components -- context provider co-locates hook */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getTeacherSessionExpiresAt,
  isTeacherLoggedIn,
  setTeacherLoggedIn,
  signOutTeacher,
  TEACHER_SESSION_INACTIVITY_MS,
  touchTeacherActivity,
} from '../../lib/teacherSession.js';

const TeacherSessionContext = createContext(null);

export function TeacherSessionProvider({ children }) {
  const [isTeacher, setIsTeacher] = useState(() => isTeacherLoggedIn());
  const [expiresAt, setExpiresAt] = useState(() => getTeacherSessionExpiresAt());
  const [now, setNow] = useState(() => Date.now());

  const syncSession = useCallback(() => {
    const active = isTeacherLoggedIn();
    setIsTeacher(active);
    setExpiresAt(active ? getTeacherSessionExpiresAt() : null);
    return active;
  }, []);

  const signIn = useCallback(() => {
    setTeacherLoggedIn(true);
    syncSession();
  }, [syncSession]);

  const signOut = useCallback(() => {
    signOutTeacher();
    setIsTeacher(false);
    setExpiresAt(null);
  }, []);

  useEffect(() => {
    let debounceTimer;
    function handleActivity() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (touchTeacherActivity()) {
          setExpiresAt(getTeacherSessionExpiresAt());
        }
      }, 800);
    }

    document.addEventListener('pointerdown', handleActivity);
    document.addEventListener('keydown', handleActivity);
    return () => {
      clearTimeout(debounceTimer);
      document.removeEventListener('pointerdown', handleActivity);
      document.removeEventListener('keydown', handleActivity);
    };
  }, []);

  useEffect(() => {
    if (!isTeacher) return undefined;
    const interval = setInterval(() => {
      setNow(Date.now());
      setExpiresAt(getTeacherSessionExpiresAt());
    }, 60_000);
    return () => clearInterval(interval);
  }, [isTeacher]);

  useEffect(() => {
    const interval = setInterval(() => {
      syncSession();
    }, 30_000);
    return () => clearInterval(interval);
  }, [syncSession]);

  const minutesRemaining =
    expiresAt != null ? Math.max(0, Math.ceil((expiresAt - now) / 60_000)) : null;

  const value = useMemo(
    () => ({
      isTeacher,
      signIn,
      signOut,
      syncSession,
      expiresAt,
      minutesRemaining,
      inactivityMinutes: TEACHER_SESSION_INACTIVITY_MS / 60_000,
    }),
    [isTeacher, signIn, signOut, syncSession, expiresAt, minutesRemaining],
  );

  return <TeacherSessionContext.Provider value={value}>{children}</TeacherSessionContext.Provider>;
}

export function useTeacherSession() {
  const ctx = useContext(TeacherSessionContext);
  if (!ctx) {
    throw new Error('useTeacherSession must be used within TeacherSessionProvider');
  }
  return ctx;
}

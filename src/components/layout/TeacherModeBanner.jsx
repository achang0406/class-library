import { useLocation } from 'react-router-dom';
import { Button } from '../ui/Button.jsx';
import { Text } from '../ui/Text.jsx';
import { useTeacherSession } from './TeacherSessionProvider.jsx';

export function TeacherModeBanner() {
  const location = useLocation();
  const { isTeacher, signOut, minutesRemaining, inactivityMinutes } = useTeacherSession();
  const onStudentView = !location.pathname.startsWith('/teacher');

  if (!isTeacher || !onStudentView) return null;

  return (
    <div
      role="status"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 'var(--space-2) var(--space-3)',
        padding: 'var(--space-2) var(--layout-gutter)',
        background: 'var(--color-accent)',
        borderBottom: '2px solid #e6a500',
        color: 'var(--color-text)',
      }}
    >
      <Text variant="emphasis" style={{ flex: '1 1 12rem', minWidth: 0 }}>
        Teacher mode — Lexile &amp; grade levels are visible
      </Text>
      <Text variant="label" style={{ color: 'var(--color-text)' }}>
        Auto sign-out in ~{minutesRemaining ?? inactivityMinutes} min idle
      </Text>
      <Button
        variant="secondary"
        onClick={signOut}
        style={{ flexShrink: 0, minHeight: 36, padding: '0 var(--space-3)' }}
      >
        Sign out
      </Button>
    </div>
  );
}

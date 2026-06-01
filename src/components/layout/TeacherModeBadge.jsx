import { useLocation } from 'react-router-dom';
import { Badge } from '../ui/Badge.jsx';
import { useTeacherSession } from './TeacherSessionProvider.jsx';

export function TeacherModeBadge() {
  const location = useLocation();
  const { isTeacher, signOut, minutesRemaining, inactivityMinutes } = useTeacherSession();
  const onStudentView = !location.pathname.startsWith('/teacher');

  if (!isTeacher || !onStudentView) return null;

  const idleMin = minutesRemaining ?? inactivityMinutes;

  return (
    <button
      type="button"
      onClick={signOut}
      title={`Teacher mode — Lexile visible. Auto sign-out in ~${idleMin} min idle. Click to sign out.`}
      aria-label="Teacher mode active. Sign out."
      style={{
        border: 'none',
        background: 'none',
        padding: 0,
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      <Badge variant="needs-label">Teacher</Badge>
    </button>
  );
}

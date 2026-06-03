import { useLocation, useNavigate } from 'react-router-dom';
import { Badge } from '../ui/Badge.jsx';
import { textLinkStyle } from '../ui/TextLink.jsx';
import { useTeacherSession } from './TeacherSessionProvider.jsx';

export function TeacherHeaderAction() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isTeacher, signOut, minutesRemaining, inactivityMinutes } = useTeacherSession();

  if (!isTeacher) return null;

  const onTeacherRoute = location.pathname.startsWith('/teacher');

  if (onTeacherRoute) {
    return (
      <button
        type="button"
        onClick={() => {
          signOut();
          navigate('/');
        }}
        title="Sign out of teacher mode"
        aria-label="Sign out"
        style={{
          ...textLinkStyle,
          border: 'none',
          background: 'none',
          padding: 0,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        Sign out
      </button>
    );
  }

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

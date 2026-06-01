import { Link } from 'react-router-dom';
import { Text } from '../ui/Text.jsx';
import { TeacherModeBadge } from './TeacherModeBadge.jsx';

export function AppHeader({ title = 'Class Library', backTo }) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-3) var(--layout-gutter)',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-card)',
      }}
    >
      {backTo ? (
        <Link to={backTo} style={{ fontWeight: 600, fontSize: 'var(--font-body)' }}>
          ← Back
        </Link>
      ) : null}
      <Text as="h1" variant="emphasis" style={{ flex: 1, minWidth: 0 }}>
        {title}
      </Text>
      <TeacherModeBadge />
    </header>
  );
}

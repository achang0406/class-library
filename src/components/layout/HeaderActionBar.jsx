import { TeacherHeaderAction } from './TeacherHeaderAction.jsx';

/** Matches AppHeader chrome so the teacher badge stays in the same place without a full title bar. */
export function HeaderActionBar() {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 'var(--space-3)',
        padding: 'var(--space-3) var(--layout-gutter)',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-card)',
      }}
    >
      <TeacherHeaderAction />
    </header>
  );
}

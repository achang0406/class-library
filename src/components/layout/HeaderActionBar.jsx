import { TeacherHeaderAction } from './TeacherHeaderAction.jsx';

/** Top-right teacher badge slot — same inset as AppHeader, without header chrome. */
export function HeaderActionBar() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: 'var(--space-3) var(--layout-gutter)',
      }}
    >
      <TeacherHeaderAction />
    </div>
  );
}

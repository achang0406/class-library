import { Outlet } from 'react-router-dom';
import { AppHeader } from './AppHeader.jsx';
import { TeacherHeaderAction } from './TeacherHeaderAction.jsx';

export function AppShell({ title, backTo, showHeader = true }) {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {showHeader ? <AppHeader title={title} backTo={backTo} /> : null}
      {!showHeader ? (
        <div
          style={{
            position: 'absolute',
            top: 'var(--space-3)',
            right: 'var(--layout-gutter)',
            zIndex: 10,
          }}
        >
          <TeacherHeaderAction />
        </div>
      ) : null}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
}

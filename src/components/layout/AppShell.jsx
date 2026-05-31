import { Outlet } from 'react-router-dom';
import { AppHeader } from './AppHeader.jsx';

export function AppShell({ title, backTo, showHeader = true }) {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {showHeader ? <AppHeader title={title} backTo={backTo} /> : null}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
}

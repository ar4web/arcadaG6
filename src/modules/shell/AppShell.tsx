import * as React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import type { AppId } from '@/types';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { NotificationStrip } from './NotificationStrip';
import { CommandPalette } from './CommandPalette';

const OVERVIEW_PATHS = new Set(['/hr', '/me', '/finance']);

export function AppShell({ app }: { app: AppId }) {
  const location = useLocation();
  // The drawer records the route it was opened on, so navigating closes it
  // without a setState-in-effect round trip.
  const [drawer, setDrawer] = React.useState({ open: false, path: location.pathname });
  const mobileOpen = drawer.open && drawer.path === location.pathname;

  React.useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className="flex min-h-dvh bg-canvas">
      <Sidebar app={app} mobileOpen={mobileOpen} onCloseMobile={() => setDrawer((d) => ({ ...d, open: false }))} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header app={app} onOpenMobile={() => setDrawer({ open: true, path: location.pathname })} />
        <main id="main" className="min-w-0 flex-1 px-3 py-4 sm:px-4 lg:px-6 lg:py-5">
          <div className="mx-auto w-full max-w-[100rem]">
            {OVERVIEW_PATHS.has(location.pathname) ? <NotificationStrip className="mb-4" /> : null}
            <Outlet />
          </div>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}

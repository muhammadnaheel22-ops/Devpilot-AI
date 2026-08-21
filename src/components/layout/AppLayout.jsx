import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { CommandPalette } from './CommandPalette';
import { readStoredValue } from '../../utils/storage';
export function AppLayout() {
  useEffect(() => {
    document.documentElement.classList.toggle(
      'compact',
      readStoredValue('devpilot-compact') === '1',
    );
  }, []);

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:pl-72">
        <Topbar />
        <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}

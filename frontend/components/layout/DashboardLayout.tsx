'use client';
import Sidebar from './Sidebar';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getUser, clearTokens } from '@/lib/auth';
import { Menu } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function DashboardLayout({ children, title, subtitle }: Props) {
  const router = useRouter();
  const [ready,            setReady]            = useState(false);
  const [mobileOpen,       setMobileOpen]       = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDesktop,        setIsDesktop]        = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace('/login'); return; }
    setReady(true);

    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  const sidebarW  = isDesktop ? (sidebarCollapsed ? 64 : 256) : 0;
  const user      = getUser();
  const handleLogout = () => { clearTokens(); router.push('/login'); };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(c => !c)}
      />

      {/* Fixed top header */}
      <header
        className="fixed top-0 right-0 z-20 bg-white border-b border-gray-200 flex items-center justify-between px-4"
        style={{ left: sidebarW, height: 56, transition: 'left 0.3s' }}
      >
        {/* Left — hamburger (mobile) + title */}
        <div className="flex items-center gap-3 min-w-0">
          {!isDesktop && (
            <button
              onClick={() => setMobileOpen(o => !o)}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors shrink-0"
            >
              <Menu size={20} />
            </button>
          )}
          <div className="min-w-0">
            <h2 className="font-bold text-sm text-gray-900 leading-tight truncate">{title}</h2>
            {subtitle && (
              <p className="text-xs text-gray-500 leading-tight truncate hidden sm:block">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right — user + logout */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {user?.first_name?.[0]?.toUpperCase() || 'A'}
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[100px] truncate">
            {user?.full_name || 'Admin'}
          </span>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Page content */}
      <div
        style={{ marginLeft: sidebarW, paddingTop: 56, transition: 'margin-left 0.3s' }}
      >
        <div className="p-4 md:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

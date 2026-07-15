'use client';
import { Menu, LogOut } from 'lucide-react';
import { getUser, clearTokens } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface Props {
  title: string;
  subtitle?: string;
  onMobileMenuToggle?: () => void;
  showMobileMenu?: boolean;
}

export default function Header({ title, subtitle, onMobileMenuToggle, showMobileMenu }: Props) {
  const user   = getUser();
  const router = useRouter();
  const handleLogout = () => { clearTokens(); router.push('/login'); };

  return (
    <header className="fixed top-0 left-0 right-0 lg:left-auto z-20 flex items-center justify-between px-4 md:px-6 border-b bg-white"
      style={{ height: 56, borderColor: '#e5e7eb' }}
    >
      {/* Left: hamburger (mobile only) + title */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger — only shown on small screens */}
        {showMobileMenu && (
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <Menu size={18} />
          </button>
        )}
        {/* Desktop menu icon (decorative) */}
        <div className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
          <Menu size={16} />
        </div>
        <div>
          <h2 className="font-bold text-sm text-gray-900 leading-tight">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500 leading-tight hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      {/* Right: avatar + name + logout */}
      <div className="flex items-center gap-2 md:gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
          style={{ background: '#4f46e5' }}
        >
          {user?.first_name?.[0]?.toUpperCase() || 'A'}
        </div>
        <span className="text-sm font-medium text-gray-700 hidden sm:block truncate max-w-[120px]">
          {user?.full_name || 'Admin'}
        </span>
        <button
          onClick={handleLogout}
          className="px-2 md:px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <LogOut size={14} className="md:hidden" />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}

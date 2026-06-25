'use client';
import { Menu, LogOut } from 'lucide-react';
import { getUser, clearTokens } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface Props { title: string; subtitle?: string; }

export default function Header({ title, subtitle }: Props) {
  const user   = getUser();
  const router = useRouter();
  const handleLogout = () => { clearTokens(); router.push('/login'); };

  return (
    <header
      className="fixed top-0 right-0 z-20 flex items-center justify-between px-6 border-b bg-white"
      style={{ left: 260, height: 56, borderColor: '#e5e7eb' }}
    >
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500">
          <Menu size={16} />
        </div>
        <div>
          <h2 className="font-bold text-sm text-gray-900 leading-tight">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500 leading-tight">{subtitle}</p>}
        </div>
      </div>

      {/* Right: avatar + name + logout */}
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
          style={{ background: '#4f46e5' }}
        >
          {user?.first_name?.[0]?.toUpperCase() || 'A'}
        </div>
        <span className="text-sm font-medium text-gray-700">
          {user?.full_name || 'Admin'}
        </span>
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
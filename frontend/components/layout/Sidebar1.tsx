'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Home, Church, Calendar, ClipboardList,
  DollarSign, FileText, MessageSquare, BarChart3, Settings,
  ChevronDown, LogOut, Heart, BookOpen
} from 'lucide-react';
import { useState } from 'react';
import { clearTokens } from '@/lib/auth';
import { useRouter } from 'next/navigation';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Members', href: '/members', icon: Users },
  { label: 'Families', href: '/families', icon: Home },
  {
    label: 'Ministries & Groups', icon: Church, children: [
      { label: 'Ministries', href: '/ministries' },
    ]
  },
  {
    label: 'Events & Services', icon: Calendar, children: [
      { label: 'Events', href: '/events' },
      { label: 'Attendance', href: '/attendance' },
    ]
  },
  { label: 'Donations & Finance', href: '/donations', icon: DollarSign },
  { label: 'Pledges', href: '/pledges', icon: Heart },
  { label: 'Expenses', href: '/expenses', icon: FileText },
  { label: 'Communication', href: '/communication', icon: MessageSquare },
  { label: 'Users', href: '/users', icon: Settings },
  { label: 'Reports & Analytics', href: '/reports', icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const toggleMenu = (label: string) => {
    setOpenMenus(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
  };

  const handleLogout = () => {
    clearTokens();
    router.push('/login');
  };

  return (
    <div className="w-48 bg-gray-900 text-white flex flex-col h-screen fixed left-0 top-0 z-30">
      <div className="p-4 border-b border-gray-700">
        <h1 className="font-bold text-base">Grace Church</h1>
        <p className="text-gray-400 text-xs mt-0.5">Admin Portal</p>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const isOpen = openMenus.includes(item.label);
          if (item.children) {
            return (
              <div key={item.label}>
                <button onClick={() => toggleMenu(item.label)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-gray-300 hover:text-white hover:bg-gray-800 text-xs transition-colors">
                  <span className="flex items-center gap-2.5"><Icon size={14} />{item.label}</span>
                  <ChevronDown size={12} className={"transition-transform " + (isOpen ? "rotate-180" : "")} />
                </button>
                {isOpen && (
                  <div className="bg-gray-800">
                    {item.children.map(child => (
                      <Link key={child.href} href={child.href}
                        className={"block px-8 py-2 text-xs transition-colors " + (pathname === child.href ? "text-white bg-indigo-600" : "text-gray-400 hover:text-white hover:bg-gray-700")}>
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          return (
            <Link key={item.href} href={item.href!}
              className={"flex items-center gap-2.5 px-4 py-2.5 text-xs transition-colors " + (pathname === item.href ? "text-white bg-indigo-600" : "text-gray-300 hover:text-white hover:bg-gray-800")}>
              <Icon size={14} />{item.label}
            </Link>
          );
        })}
      </nav>
      <button onClick={handleLogout}
        className="flex items-center gap-2.5 px-4 py-3 text-xs text-gray-400 hover:text-white hover:bg-gray-800 border-t border-gray-700 transition-colors">
        <LogOut size={14} /> Logout
      </button>
    </div>
  );
}
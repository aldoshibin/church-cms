'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Home, Church, Calendar,
  DollarSign, FileText, MessageSquare, BarChart3,
  Settings, ChevronDown, ChevronRight, LogOut,
  Heart, ClipboardList, BookOpen
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { clearTokens } from '@/lib/auth';
import { useRouter } from 'next/navigation';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Members', href: '/members', icon: Users },
  { label: 'Families', href: '/families', icon: Home },
  // {
  //   label: 'Ministries & Groups', icon: Church,
  //   children: [
  //     { label: 'Ministries', href: '/ministries' },
  //   ]
  // },
  {
  label: 'Ministries & Groups', icon: Church,
  children: [
    { label: 'Ministries', href: '/ministries' },
    // { label: 'Add Ministry',   href: '/ministries/add' },
  ]
},
{
  label: 'Events & Services', icon: Calendar,
  children: [
    { label: 'Church Services', href: '/events/church-services' },
    { label: 'Special Events',  href: '/events/special-events'  },
  ]
},
  // {
  //   label: 'Events & Services', icon: Calendar,
  //   children: [
  //     { label: 'Events', href: '/events' },
  //     { label: 'Attendance', href: '/attendance' },
  //   ]
  // },
  { label: 'Attendance', href: '/attendance', icon: ClipboardList },
  {
    label: 'Donations & Finance', icon: DollarSign,
    children: [
      { label: 'Donations', href: '/donations' },
      { label: 'Funds', href: '/funds' },
    ]
  },
  { label: 'Pledges', href: '/pledges', icon: Heart },
  { label: 'Expenses', href: '/expenses', icon: FileText },
  { label: 'Communication', href: '/communication', icon: MessageSquare },
  { label: 'Documents', href: '/documents', icon: BookOpen },
  { label: 'Users', href: '/users', icon: Settings },
  { label: 'Reports & Analytics', href: '/reports', icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState<string[]>([]);


  useEffect(() => {
    navItems.forEach(item => {
      if ('children' in item && item.children) {
        const activeChild = item.children.some(
          child => pathname === child.href
        );

        if (activeChild) {
          setOpen(prev =>
            prev.includes(item.label)
              ? prev
              : [...prev, item.label]
          );
        }
      }
    });
  }, [pathname]);

  const toggle = (label: string) =>
    setOpen(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);

  // const isActive = (href: string) => pathname === href;
           const isActive = (href: string) => {
  return pathname === href || pathname.startsWith(`${href}/`);
};
  const isParentActive = (children: { href: string }[]) =>
    children.some(c => pathname === c.href);

  const handleLogout = () => { clearTokens(); router.push('/login'); };

  return (
    <div
      className="flex flex-col h-screen fixed left-0 top-0 z-30"
      style={{ width: 260, background: '#1a1f2e', color: 'white' }}
    >
      {/* Logo */}
      <div className="px-6 py-5 border-b" style={{ borderColor: '#2d3348' }}>
        <h1 className="font-bold text-xl text-white tracking-tight">Grace Church</h1>
        <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>Admin Portal</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        {navItems.map(item => {
          const Icon = item.icon;

          /* ── Parent with children ── */
          if ('children' in item && item.children) {
            const isOpen = open.includes(item.label);
            const parentOn = isParentActive(item.children);
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggle(item.label)}
                  className="w-full flex items-center justify-between px-6 py-2.5 text-sm transition-colors"
                  style={{ color: parentOn ? '#fff' : '#9ca3af' }}
                // style={{ color: '#fff' }}
                >
                  <span className="flex items-center gap-3">
                    {/* <Icon size={16} /> */}
                    {item.label}
                  </span>
                  <span className="text-lg font-semibold">
                    {isOpen ? '−' : '+'}
                  </span>
                  {/* {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />} */}
                </button>



                {isOpen && (
                  <div style={{ background: '#141824' }}>
                    {item.children.map(child => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="flex items-center gap-3 pr-6 py-2 text-sm transition-colors relative"
                        style={{ paddingLeft: '40px', color: isActive(child.href) ? '#fff' : '#6b7280', borderLeft: isActive(child.href) ? '3px solid #f59e0b' : '3px solid transparent',}}
                      >
                        {isActive(child.href) && (
                          <span
                            className="absolute left-0 top-0 bottom-0 w-1 rounded-r"
                            style={{ background: '#f97316' }}
                          />
                        )}
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          /* ── Simple item ── */
          const active = isActive(item.href!);
 
          return (
            <Link
              key={item.href}
              href={item.href!}
              className="flex items-center gap-3 px-6 py-2.5 text-sm transition-colors relative"
              style={{ color: active ? '#fff' : '#9ca3af', background: active ? '#2d3348' : 'transparent', borderLeft: active ? '3px solid #f59e0b' : '3px solid transparent', }}
            >
              {active && (
                <span
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-r"
                  style={{ background: '#f97316' }}
                />
              )}
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-6 py-4 text-sm transition-colors border-t"
        style={{ color: '#6b7280', borderColor: '#2d3348' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
        onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
      >
        <LogOut size={15} />
        Logout
      </button>
    </div>
  );
}
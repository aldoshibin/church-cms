'use client';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, Home, Church, Calendar, CheckCircle,
  DollarSign, HandCoins, Receipt, MessageSquare, FileText,
  UserCog, BarChart3, ChevronDown, ChevronRight, Shield
} from 'lucide-react';
import { canViewMenu, getAdminUser } from '@/lib/auth-permissions';

interface NavChild { label: string; href: string; }
interface NavItem {
  key: string;            // matches Role.menu_permissions entries
  label: string;
  icon: any;
  href?: string;          // leaf item
  children?: NavChild[];  // parent with submenu
}

const NAV: NavItem[] = [
  { key: 'dashboard',     label: 'Dashboard',          icon: LayoutDashboard, href: '/dashboard' },
  { key: 'members',       label: 'Members',            icon: Users,           href: '/members' },
  { key: 'families',      label: 'Families',           icon: Home,            href: '/families' },
  {
    key: 'ministries', label: 'Ministries & Groups', icon: Church,
    children: [
      { label: 'All Ministries', href: '/ministries' },
      { label: 'Add Ministry',   href: '/ministries/add' },
    ]
  },
  {
    key: 'events', label: 'Events & Services', icon: Calendar,
    children: [
      // { label: 'Church Services', href: '/events/church-services' },
      // { label: 'Special Events',  href: '/events/special-events' },
      { label: 'Church Services',    href: '/events/church-services' },
      { label: 'Service Types',      href: '/events/service-types' },
      { label: 'Special Events',     href: '/events/special-events' },
      { label: 'Special Event Types',href: '/events/special-event-types' },

    ]
  },
  { key: 'attendance',    label: 'Attendance',         icon: CheckCircle,     href: '/attendance' },
  { key: 'donations',     label: 'Donations & Finance', icon: DollarSign,     href: '/donations' },
  { key: 'pledges',       label: 'Pledges',             icon: HandCoins,      href: '/pledges' },
  { key: 'expenses',      label: 'Expenses',            icon: Receipt,        href: '/expenses' },
  { key: 'communication', label: 'Communication',       icon: MessageSquare, href: '/communication' },
  { key: 'documents',     label: 'Documents',           icon: FileText,       href: '/documents' },
  {
    key: 'users', label: 'Users', icon: UserCog,
    children: [
      { label: 'Staff Accounts', href: '/users' },
      { label: 'Roles & Permissions', href: '/users/roles' },
    ]
  },
  { key: 'reports',       label: 'Reports',             icon: BarChart3,      href: '/reports' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [openKey, setOpenKey] = useState<string | null>(null);

  const adminUser = getAdminUser();
  const visibleNav = NAV.filter(item => canViewMenu(item.key));

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-screen fixed left-0 top-0 z-30">
      <div className="p-5 border-b border-gray-800">
        <h1 className="font-bold text-lg text-white">Grace Church</h1>
        <p className="text-gray-400 text-xs mt-0.5">Management System</p>
      </div>

      {adminUser && (
        <div className="px-5 py-3 border-b border-gray-800 bg-gray-800/40">
          <div className="flex items-center gap-2">
            {adminUser.is_super_admin && <Shield size={12} className="text-amber-400" />}
            <p className="text-xs font-semibold text-gray-300 truncate">{adminUser.role_name}</p>
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-3">
        {visibleNav.map(item => {
          const Icon = item.icon;
          const hasChildren = !!item.children?.length;
          const isOpen = openKey === item.key;
          const isActiveParent = hasChildren && item.children!.some(c => pathname.startsWith(c.href));
          const isActiveLeaf = item.href && pathname === item.href;

          if (!hasChildren) {
            return (
              <button
                key={item.key}
                onClick={() => router.push(item.href!)}
                className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors text-left relative ${
                  isActiveLeaf ? 'text-white bg-gray-800' : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                }`}
              >
                {isActiveLeaf && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-orange-500" />}
                <Icon size={16} />
                {item.label}
              </button>
            );
          }

          return (
            <div key={item.key}>
              <button
                onClick={() => setOpenKey(isOpen ? null : item.key)}
                className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors text-left relative ${
                  isActiveParent ? 'text-white bg-gray-800' : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                }`}
              >
                {isActiveParent && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-orange-500" />}
                <Icon size={16} />
                <span className="flex-1">{item.label}</span>
                {isOpen || isActiveParent ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {(isOpen || isActiveParent) && (
                <div className="bg-gray-950/40">
                  {item.children!.map(child => {
                    const isChildActive = pathname === child.href;
                    return (
                      <button
                        key={child.href}
                        onClick={() => router.push(child.href)}
                        className={`w-full flex items-center gap-2 pl-12 pr-5 py-2 text-xs transition-colors text-left ${
                          isChildActive ? 'text-orange-400 font-semibold' : 'text-gray-500 hover:text-gray-200'
                        }`}
                      >
                        {child.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}

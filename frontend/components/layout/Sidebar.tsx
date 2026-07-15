'use client';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, Home, Church, Calendar,
  DollarSign, MessageSquare, UserCog, BarChart3,
  ChevronDown, ChevronRight, Shield, X, ChevronLeft
} from 'lucide-react';
import { canViewMenu, getAdminUser } from '@/lib/auth-permissions';

interface NavChild { label: string; href: string; }
interface NavItem {
  key: string;
  label: string;
  icon: any;
  href?: string;
  children?: NavChild[];
}

const NAV: NavItem[] = [
  { key: 'dashboard',     label: 'Dashboard',          icon: LayoutDashboard, href: '/dashboard' },
  { key: 'members',       label: 'Members',            icon: Users,           href: '/members' },
  { key: 'families',      label: 'Families',           icon: Home,            href: '/families' },
  {
    key: 'ministries', label: 'Ministries & Groups', icon: Church,
    children: [{ label: 'All Ministries', href: '/ministries' }]
  },
  {
    key: 'events', label: 'Events & Services', icon: Calendar,
    children: [
      { label: 'Church Services',     href: '/events/church-services' },
      { label: 'Service Types',       href: '/events/service-types' },
      { label: 'Special Events',      href: '/events/special-events' },
      { label: 'Special Event Types', href: '/events/special-event-types' },
    ]
  },
  {
    key: 'donations', label: 'Donations & Finance', icon: DollarSign,
    children: [
      { label: 'Funds',              href: '/funds' },
      { label: 'Fund Types',         href: '/funds/fund-types' },
      { label: 'Donations',          href: '/donations' },
      { label: 'Pledges',            href: '/pledges' },
      { label: 'Expenses',           href: '/expenses' },
      { label: 'Expense Categories', href: '/expenses/categories' },
      { label: 'Approval Summary',   href: '/expenses/approvals' },
    ]
  },
  { key: 'communication', label: 'Communication', icon: MessageSquare, href: '/communication' },
  {
    key: 'users', label: 'Users', icon: UserCog,
    children: [
      { label: 'Staff Accounts',      href: '/users' },
      { label: 'Roles & Permissions', href: '/users/roles' },
    ]
  },
  { key: 'reports', label: 'Reports', icon: BarChart3, href: '/reports' },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose, collapsed, onToggleCollapse }: SidebarProps) {
  const pathname   = usePathname();
  const router     = useRouter();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const adminUser  = getAdminUser();
  const visibleNav = NAV.filter(item => canViewMenu(item.key));

  // Auto-close mobile sidebar on route change
  useEffect(() => { onMobileClose(); }, [pathname]);

  const navigate = (href: string) => {
    router.push(href);
    onMobileClose();
  };

  const NavContent = ({ isCollapsed }: { isCollapsed: boolean }) => (
    <div className={`bg-gray-900 text-white flex flex-col h-full ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Logo */}
      <div className={`flex items-center border-b border-gray-800 shrink-0 ${isCollapsed ? 'h-14 justify-center' : 'h-14 px-5'}`}>
        {isCollapsed ? (
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">G</span>
          </div>
        ) : (
          <div>
            <h1 className="font-bold text-base text-white leading-tight">Grace Church</h1>
            <p className="text-gray-400 text-xs">Management System</p>
          </div>
        )}
      </div>

      {/* Role badge */}
      {adminUser && !isCollapsed && (
        <div className="px-5 py-2.5 border-b border-gray-800 bg-gray-800/40 shrink-0">
          <div className="flex items-center gap-2">
            {adminUser.is_super_admin && <Shield size={12} className="text-amber-400 shrink-0" />}
            <p className="text-xs font-semibold text-gray-300 truncate">{adminUser.role_name}</p>
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-2">
        {visibleNav.map(item => {
          const Icon = item.icon;
          const hasChildren = !!item.children?.length;
          const isOpen = openKey === item.key;
          const isActiveParent = hasChildren && item.children!.some(c => pathname.startsWith(c.href));
          const isActiveLeaf = !hasChildren && item.href && pathname === item.href;
          const isActive = isActiveLeaf || isActiveParent;

          if (!hasChildren) {
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.href!)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 py-2.5 text-sm transition-colors text-left relative
                  ${isCollapsed ? 'justify-center px-0' : 'px-5'}
                  ${isActive ? 'text-white bg-gray-800' : 'text-gray-400 hover:text-white hover:bg-gray-800/60'}`}
              >
                {isActive && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-orange-500" />}
                <Icon size={16} className="shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          }

          return (
            <div key={item.key}>
              <button
                onClick={() => isCollapsed ? navigate(item.children![0].href) : setOpenKey(isOpen ? null : item.key)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 py-2.5 text-sm transition-colors text-left relative
                  ${isCollapsed ? 'justify-center px-0' : 'px-5'}
                  ${isActiveParent ? 'text-white bg-gray-800' : 'text-gray-400 hover:text-white hover:bg-gray-800/60'}`}
              >
                {isActiveParent && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-orange-500" />}
                <Icon size={16} className="shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {isOpen || isActiveParent ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />}
                  </>
                )}
              </button>
              {!isCollapsed && (isOpen || isActiveParent) && (
                <div className="bg-gray-950/40">
                  {item.children!.map(child => {
                    const isChildActive = pathname === child.href || pathname.startsWith(child.href + '/');
                    return (
                      <button
                        key={child.href}
                        onClick={() => navigate(child.href)}
                        className={`w-full flex items-center pl-12 pr-5 py-2 text-xs transition-colors text-left ${
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

      {/* Desktop collapse toggle */}
      <button
        onClick={onToggleCollapse}
        className="hidden lg:flex items-center justify-center py-3 border-t border-gray-800 text-gray-500 hover:text-white hover:bg-gray-800/60 transition-colors shrink-0 gap-2 text-xs"
      >
        {isCollapsed
          ? <ChevronRight size={14} />
          : <><ChevronLeft size={14} /><span>Collapse</span></>
        }
      </button>
    </div>
  );

  return (
    <>
      {/* ── MOBILE: dark overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* ── MOBILE: slide-in drawer ── */}
      <div
        className={`fixed top-0 left-0 h-full z-50 lg:hidden transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <NavContent isCollapsed={false} />
        {/* X close button — floats to the right of the drawer, below the header */}
        <button
          onClick={onMobileClose}
          className="absolute top-4 right-3  w-9 h-9 flex items-center justify-center rounded-full bg-gray-700 text-white hover:bg-gray-600 transition-colors shadow-lg"
        >
          <X size={18} />
        </button>
      </div>

      {/* ── DESKTOP: fixed sidebar ── */}
      <div className={`hidden lg:flex fixed top-0 left-0 h-screen z-30 flex-col transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}>
        <NavContent isCollapsed={collapsed} />
      </div>
    </>
  );
}

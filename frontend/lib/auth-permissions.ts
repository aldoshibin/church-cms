// Helper functions for reading the logged-in admin/staff user's
// role + permissions from localStorage (saved at login time).

export interface AdminUser {
  id: number;
  email: string;
  full_name: string;
  role_id: number;
  role_name: string;
  is_super_admin: boolean;
  menu_permissions: string[];
}

export function getAdminUser(): AdminUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function canViewMenu(key: string): boolean {
  const user = getAdminUser();
  if (!user) return false;
  if (user.is_super_admin) return true;
  return (user.menu_permissions || []).includes(key);
}

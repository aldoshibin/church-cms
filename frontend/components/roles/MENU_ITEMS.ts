// Shared constant — single source of truth for menu keys + labels.
// Used by both the Sidebar (to render/filter nav items) and the
// Role form (to render permission checkboxes). Keep this file in
// frontend/lib/ or frontend/components/roles/ and import from both.

export interface MenuItemDef {
  key: string;
  label: string;
}

export const MENU_ITEMS: MenuItemDef[] = [
  { key: 'dashboard',     label: 'Dashboard' },
  { key: 'members',       label: 'Members' },
  { key: 'families',      label: 'Families' },
  { key: 'ministries',    label: 'Ministries & Groups' },
  { key: 'events',        label: 'Events & Services' },
  { key: 'attendance',    label: 'Attendance' },
  { key: 'donations',     label: 'Donations & Finance' },
  { key: 'pledges',       label: 'Pledges' },
  { key: 'expenses',      label: 'Expenses' },
  { key: 'communication', label: 'Communication' },
  { key: 'documents',     label: 'Documents' },
  { key: 'users',         label: 'Users (Staff & Roles)' },
  { key: 'reports',       label: 'Reports' },
];

'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { rolesApi } from '@/lib/api';
import { Plus, Edit2, Trash2, Shield, Users, RefreshCw, Lock } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { MENU_ITEMS } from '@/components/roles/MENU_ITEMS';

export default function RolesPage() {
  const router = useRouter();
  const [roles,    setRoles]    = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const { data } = await rolesApi.list();
      setRoles(data.results || data);
    } catch { toast.error('Failed to load roles'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRoles(); }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await rolesApi.delete(deleteId);
      toast.success('Role deleted');
      fetchRoles();
    } catch (err: any) {
      toast.error('Delete failed', err.response?.data?.detail || 'Could not delete role.');
    } finally { setDeleteId(null); }
  };

  return (
    <DashboardLayout title="Roles & Permissions" subtitle="Manage staff roles and sidebar access">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="text-gray-500 text-sm mt-1">{roles.length} roles defined</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchRoles}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => router.push('/users/roles/add')}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
            <Plus size={16} /> Add Role
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              {['Role Name', 'Menu Access', 'Staff Assigned', 'Actions'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={4} className="text-center py-16">
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                  <span className="text-sm">Loading roles...</span>
                </div>
              </td></tr>
            ) : roles.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-16">
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <Shield size={32} className="text-gray-200" />
                  <p className="font-medium text-gray-500">No roles yet</p>
                  <p className="text-xs">Click "Add Role" to create your first custom role.</p>
                </div>
              </td></tr>
            ) : roles.map((role: any) => (
              <tr key={role.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      role.is_super_admin ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'
                    }`}>
                      {role.is_super_admin ? <Lock size={15} /> : <Shield size={15} />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{role.name}</p>
                      {role.description && <p className="text-xs text-gray-400">{role.description}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  {role.is_super_admin ? (
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                      Full Access
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1 max-w-md">
                      {role.menu_permissions.length === 0 ? (
                        <span className="text-xs text-gray-400">No menu access</span>
                      ) : role.menu_permissions.slice(0, 4).map((key: string) => {
                        const item = MENU_ITEMS.find(m => m.key === key);
                        return (
                          <span key={key} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs">
                            {item?.label || key}
                          </span>
                        );
                      })}
                      {role.menu_permissions.length > 4 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">
                          +{role.menu_permissions.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Users size={13} className="text-gray-400" />{role.user_count}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => router.push(`/users/roles/${role.id}/edit`)} title="Edit"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => !role.is_super_admin && setDeleteId(role.id)}
                      title={role.is_super_admin ? 'Super Admin cannot be deleted' : 'Delete'}
                      disabled={role.is_super_admin}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                        role.is_super_admin ? 'text-gray-300 cursor-not-allowed' : 'text-red-400 hover:bg-red-50 hover:text-red-600'
                      }`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deleteId && (
        <ConfirmDialog
          title="Delete Role"
          message="Staff members with this role will lose admin access until reassigned. Continue?"
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </DashboardLayout>
  );
}

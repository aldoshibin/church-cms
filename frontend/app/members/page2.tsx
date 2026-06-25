'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { membersApi } from '@/lib/api';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function MembersPage() {
  const router = useRouter();
  const [members,  setMembers]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('');
  const [total,    setTotal]    = useState(0);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data } = await membersApi.list({ search, status: filter || undefined });
      setMembers(data.results || data);
      setTotal(data.count || (data.results || data).length);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMembers(); }, [search, filter]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await membersApi.delete(deleteId);
      toast.success('Member deleted');
      fetchMembers();
    } catch { toast.error('Delete failed'); }
    finally { setDeleteId(null); }
  };

  return (
    <DashboardLayout title="Members" subtitle="Manage church member records">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Member List</h1>
          <p className="text-gray-500 text-sm mt-1">
            {total} total members
          </p>
        </div>
        <button
          onClick={() => router.push('/members/add')}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} /> Add Member
        </button>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

        {/* Search + filter bar */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, phone..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
            />
          </div>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="visitor">Visitor</option>
            <option value="transferred">Transferred</option>
          </select>
        </div>

        {/* Table */}
        <table className="w-full">
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              {['Name', 'Email', 'Phone', 'Family', 'Membership Date', 'Status', 'Actions'].map(h => (
                <th
                  key={h}
                  className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider"
                  style={{ color: '#455a64' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                    <span className="text-sm">Loading members...</span>
                  </div>
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Search size={28} className="text-gray-200" />
                    <p className="font-medium text-gray-500">No members found</p>
                    <p className="text-xs">
                      {search ? 'Try a different search.' : 'Click "Add Member" to add your first member.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : members.map(m => (
              <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: '#4f46e5' }}
                    >
                      {m.first_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <span className="text-sm font-semibold text-[#263238]">
                      {m.full_name || `${m.first_name} ${m.last_name}`}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-[#263238]">{m.email || '—'}</td>
                <td className="px-5 py-3 text-sm text-[#263238]">{m.phone || '—'}</td>
                <td className="px-5 py-3 text-sm text-[#263238]">{m.family_name || '—'}</td>
                <td className="px-5 py-3 text-sm text-[#263238]">{m.membership_date || '—'}</td>
                <td className="px-5 py-3">
                  <span className={`px-2.5 py-1 text-xs font-semibold capitalize ${
                    m.status === 'active'      ? 'bg-[#e8f5e9] text-[#2e7d32]'  :
                    m.status === 'inactive'    ? 'bg-gray-100 text-gray-500'   :
                    m.status === 'visitor'     ? 'bg-amber-100 text-amber-700' :
                    m.status === 'transferred' ? 'bg-blue-100 text-blue-600'   :
                    'bg-red-100 text-red-600'
                  }`}>
                    {m.status}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/members/${m.id}/edit`)}
                      title="Edit"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteId(m.id)}
                      title="Delete"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
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
          title="Delete Member"
          message="Are you sure you want to delete this member? This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </DashboardLayout>
  );
}
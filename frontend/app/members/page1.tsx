'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { membersApi } from '@/lib/api';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import MemberModal from '@/components/members/MemberModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { toast } from '@/components/ui/Toast';

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMember, setEditMember] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data } = await membersApi.list({ search, status: filter || undefined });
      setMembers(data.results || data);
      setTotal(data.count || (data.results || data).length);
    } catch { /* silent — empty state shown */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMembers(); }, [search, filter]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await membersApi.delete(deleteId);
      toast.success('Member deleted', 'The member has been removed.');
      fetchMembers();
    } catch {
      toast.error('Delete failed', 'Could not delete this member.');
    } finally { setDeleteId(null); }
  };

  return (
    <DashboardLayout title="Members" subtitle="Manage church members">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="text-gray-500 text-sm mt-1">{total} total members</p>
        </div>
        <button onClick={() => { setEditMember(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition-colors">
          <Plus size={14} /> Add Member
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="visitor">Visitor</option>
          </select>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>{["Name","Email","Phone","Status","Membership Date","Actions"].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-16 text-gray-400">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                  <span className="text-sm">Loading members...</span>
                </div>
              </td></tr>
            ) : members.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-16 text-gray-400">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-1">
                    <Search size={20} className="text-gray-300" />
                  </div>
                  <p className="font-medium text-gray-500">No members found</p>
                  <p className="text-xs">Try adjusting your search or add a new member.</p>
                </div>
              </td></tr>
            ) : members.map(m => (
              <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">
                      {m.first_name?.[0] || '?'}
                    </div>
                    <span className="text-sm font-medium text-gray-800">{m.full_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{m.email || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{m.phone || '-'}</td>
                <td className="px-4 py-3">
                  <span className={"px-2 py-0.5 rounded-full text-xs font-medium " +
                    (m.status==='active' ? 'bg-green-100 text-green-700' : m.status==='inactive' ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-700')}>
                    {m.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{m.membership_date || '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditMember(m); setShowModal(true); }}
                      className="text-indigo-500 hover:text-indigo-700 transition-colors"><Edit2 size={14} /></button>
                    <button onClick={() => setDeleteId(m.id)}
                      className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <MemberModal member={editMember} onClose={() => setShowModal(false)}
          onSaved={() => { fetchMembers(); toast.success(editMember ? 'Member updated' : 'Member added', editMember ? 'Member details saved.' : 'New member added successfully.'); }} />
      )}

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
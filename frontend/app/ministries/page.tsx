'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ministriesApi } from '@/lib/api';
import { Plus, Edit2, Trash2, Search, Users, Calendar, Clock, RefreshCw, Church, Eye } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

/* Card accent colors cycle through these for visual variety */
const CARD_COLORS = [
  { bg: 'bg-indigo-50', text: 'text-indigo-600', ring: 'ring-indigo-100' },
  { bg: 'bg-purple-50', text: 'text-purple-600', ring: 'ring-purple-100' },
  { bg: 'bg-blue-50',   text: 'text-blue-600',   ring: 'ring-blue-100'   },
  { bg: 'bg-amber-50',  text: 'text-amber-600',  ring: 'ring-amber-100'  },
  { bg: 'bg-green-50',  text: 'text-green-600',  ring: 'ring-green-100'  },
  { bg: 'bg-pink-50',   text: 'text-pink-600',   ring: 'ring-pink-100'   },
];

export default function MinistriesPage() {
  const router = useRouter();
  const [ministries, setMinistries] = useState<any[]>([]);
  const [filtered,   setFiltered]   = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [deleteId,   setDeleteId]   = useState<number | null>(null);

  const fetchMinistries = async () => {
    setLoading(true);
    try {
      const { data } = await ministriesApi.list();
      const list = data.results || data;
      setMinistries(list);
      setFiltered(list);
    } catch { toast.error('Failed to load ministries'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMinistries(); }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(ministries); return; }
    const q = search.toLowerCase();
    setFiltered(ministries.filter((m: any) =>
      m.name?.toLowerCase().includes(q) ||
      m.description?.toLowerCase().includes(q) ||
      m.meeting_day?.toLowerCase().includes(q)
    ));
  }, [search, ministries]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await ministriesApi.delete(deleteId);
      toast.success('Ministry deleted');
      fetchMinistries();
    } catch { toast.error('Delete failed'); }
    finally { setDeleteId(null); }
  };

  const totalMembers = ministries.reduce((sum, m) => sum + (m.member_count ?? 0), 0);

  return (
    <DashboardLayout title="Ministries & Groups" subtitle="Manage church ministries and groups">
      {/* Page header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ministries & Groups</h1>
          <p className="text-gray-500 text-sm mt-1">
            {ministries.length} ministries · {totalMembers} total members assigned
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchMinistries}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => router.push('/ministries/add')}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
            <Plus size={16} /> Add Ministry
          </button>
        </div>
      </div>

      {/* ── Ministry Summary Cards ── */}
      {!loading && ministries.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {ministries.map((m: any, i: number) => {
            const color = CARD_COLORS[i % CARD_COLORS.length];
            return (
              <button
                key={m.id}
                onClick={() => router.push(`/ministries/${m.id}`)}
                className={`text-left bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-indigo-200 transition-all ring-1 ring-transparent hover:${color.ring}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 ${color.bg} ${color.text} rounded-xl flex items-center justify-center shrink-0`}>
                    <Church size={18} />
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    m.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {m.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm font-bold text-gray-800 truncate mb-1">{m.name}</p>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Users size={13} />
                  <span className="text-lg font-bold text-gray-700">{m.member_count ?? 0}</span>
                  <span className="text-xs">member{(m.member_count ?? 0) !== 1 ? 's' : ''}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Table card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
        {/* Search + filter */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, day..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
            />
          </div>
          <select
            onChange={e => {
              const v = e.target.value;
              setFiltered(v === '' ? ministries : ministries.filter((m: any) =>
                v === 'active' ? m.is_active : !m.is_active
              ));
            }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Table */}
        <table className="w-full">
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              {['Ministry Name', 'Leader', 'Meeting Day', 'Meeting Time', 'Members', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-16">
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                  <span className="text-sm">Loading ministries...</span>
                </div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-16">
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <Church size={32} className="text-gray-200" />
                  <p className="font-medium text-gray-500">{search ? 'No ministries match' : 'No ministries yet'}</p>
                  <p className="text-xs">{search ? 'Try a different search.' : 'Click "Add Ministry" to get started.'}</p>
                </div>
              </td></tr>
            ) : filtered.map((m: any) => (
              <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                {/* Name */}
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                      <Church size={15} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{m.name}</p>
                      {m.description && (
                        <p className="text-xs text-gray-400 truncate max-w-xs">{m.description}</p>
                      )}
                    </div>
                  </div>
                </td>
                {/* Leader */}
                <td className="px-5 py-3">
                  {m.leader_name ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                        {m.leader_name[0]}
                      </div>
                      <span className="text-sm text-gray-700">{m.leader_name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </td>
                {/* Meeting Day */}
                <td className="px-5 py-3">
                  {m.meeting_day ? (
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-gray-400" />
                      <span className="text-sm text-gray-700">{m.meeting_day}</span>
                    </div>
                  ) : <span className="text-sm text-gray-400">—</span>}
                </td>
                {/* Meeting Time */}
                <td className="px-5 py-3">
                  {m.meeting_time ? (
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-gray-400" />
                      <span className="text-sm text-gray-700">{m.meeting_time}</span>
                    </div>
                  ) : <span className="text-sm text-gray-400">—</span>}
                </td>
                {/* Member count */}
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1.5">
                    <Users size={13} className="text-gray-400" />
                    <span className="text-sm font-semibold text-gray-700">{m.member_count ?? 0}</span>
                  </div>
                </td>
                {/* Status */}
                <td className="px-5 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    m.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {m.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                {/* Actions */}
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/ministries/${m.id}`)}
                      title="View Details"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => router.push(`/ministries/${m.id}/edit`)}
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
          title="Delete Ministry"
          message="Are you sure you want to delete this ministry? This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </DashboardLayout>
  );
}

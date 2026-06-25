'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ministriesApi } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  ArrowLeft, Edit2, Trash2, Calendar, Clock, Users,
  Church, Mail, Phone, User as UserIcon, Search
} from 'lucide-react';

export default function MinistryDetailPage() {
  const params     = useParams();
  const router     = useRouter();
  const ministryId = params?.id ? parseInt(String(params.id)) : undefined;

  const [ministry,   setMinistry]   = useState<any>(null);
  const [members,    setMembers]    = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const fetchData = async () => {
    if (!ministryId) return;
    setLoading(true);
    try {
      const [minRes, memRes] = await Promise.all([
        ministriesApi.get(ministryId),
        ministriesApi.members(ministryId),
      ]);
      setMinistry(minRes.data);
      setMembers(Array.isArray(memRes.data) ? memRes.data : []);
    } catch {
      toast.error('Load failed', 'Could not load ministry details.');
      router.push('/ministries');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [ministryId]);

  const handleDelete = async () => {
    if (!ministryId) return;
    try {
      await ministriesApi.delete(ministryId);
      toast.success('Ministry deleted');
      router.push('/ministries');
    } catch { toast.error('Delete failed'); }
    finally { setDeleteOpen(false); }
  };

  const filteredMembers = members.filter((m: any) => {
    const name = m.full_name || `${m.first_name} ${m.last_name}`;
    return name.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) {
    return (
      <DashboardLayout title="Ministry Details" subtitle="Loading...">
        <div className="flex items-center justify-center py-24 text-gray-400">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
            <span className="text-sm">Loading ministry details...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!ministry) return null;

  return (
    <DashboardLayout title="Ministry Details" subtitle={ministry.name}>

      {/* Top bar */}
      <div className="flex justify-between items-start mb-6">
        <button onClick={() => router.push('/ministries')}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft size={15} /> Back to Ministries
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push(`/ministries/${ministryId}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors">
            <Edit2 size={14} /> Edit Ministry
          </button>
          <button onClick={() => setDeleteOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* Hero card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="p-6 flex items-start gap-5">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
            <Church size={28} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{ministry.name}</h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                ministry.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {ministry.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            {ministry.description && (
              <p className="text-gray-500 text-sm mt-2 max-w-2xl">{ministry.description}</p>
            )}
          </div>
        </div>

        {/* Quick facts row */}
        <div className="grid grid-cols-4 border-t border-gray-100 divide-x divide-gray-100">
          <div className="p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Leader</p>
            {ministry.leader_name ? (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                  {ministry.leader_name[0]}
                </div>
                <span className="text-sm font-semibold text-gray-800">{ministry.leader_name}</span>
              </div>
            ) : <span className="text-sm text-gray-400">Not assigned</span>}
          </div>
          <div className="p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Meeting Day</p>
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-gray-400" />
              <span className="text-sm font-semibold text-gray-800">{ministry.meeting_day || '—'}</span>
            </div>
          </div>
          <div className="p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Meeting Time</p>
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-gray-400" />
              <span className="text-sm font-semibold text-gray-800">{ministry.meeting_time || '—'}</span>
            </div>
          </div>
          <div className="p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Total Members</p>
            <div className="flex items-center gap-1.5">
              <Users size={14} className="text-gray-400" />
              <span className="text-sm font-bold text-indigo-600">{members.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Members table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <h3 className="font-bold text-gray-800">
            Members <span className="text-gray-400 font-normal text-sm ml-1">({filteredMembers.length})</span>
          </h3>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search members..."
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 w-56"
            />
          </div>
        </div>

        <table className="w-full">
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              {['Name', 'Email', 'Phone', 'Status'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <UserIcon size={28} className="text-gray-200" />
                    <p className="font-medium text-gray-500">
                      {search ? 'No members match your search' : 'No members assigned to this ministry yet'}
                    </p>
                    {!search && (
                      <button onClick={() => router.push(`/ministries/${ministryId}/edit`)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium mt-1">
                        Click here to assign members
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : filteredMembers.map((m: any) => {
              const name = m.full_name || `${m.first_name} ${m.last_name}`;
              return (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ background: '#4f46e5' }}>
                        {name[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-gray-800">{name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {m.email ? (
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Mail size={13} className="text-gray-400" />{m.email}
                      </div>
                    ) : <span className="text-sm text-gray-400">—</span>}
                  </td>
                  <td className="px-5 py-3">
                    {m.phone ? (
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Phone size={13} className="text-gray-400" />{m.phone}
                      </div>
                    ) : <span className="text-sm text-gray-400">—</span>}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                      m.status === 'active'   ? 'bg-green-100 text-green-700' :
                      m.status === 'inactive' ? 'bg-gray-100 text-gray-500'  :
                      m.status === 'visitor'  ? 'bg-amber-100 text-amber-700':
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {m.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {deleteOpen && (
        <ConfirmDialog
          title="Delete Ministry"
          message="Are you sure you want to delete this ministry? This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteOpen(false)}
        />
      )}
    </DashboardLayout>
  );
}

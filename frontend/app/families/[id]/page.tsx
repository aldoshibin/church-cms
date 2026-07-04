'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { familiesApi } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  ArrowLeft, Edit2, Trash2, Home, Users, Phone, MapPin,
  Calendar, CheckCircle, DollarSign, Clock, User as UserIcon
} from 'lucide-react';

function formatDate(d: string) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return d; }
}

export default function FamilyDetailPage() {
  const params   = useParams();
  const router   = useRouter();
  const familyId = params?.id ? parseInt(String(params.id)) : undefined;

  const [data,       setData]       = useState<any>(null);
  const [loading,     setLoading]   = useState(true);
  const [deleteOpen,  setDeleteOpen] = useState(false);

  useEffect(() => {
    if (!familyId) return;
    setLoading(true);
    familiesApi.dashboard(familyId)
      .then(({ data }) => setData(data))
      .catch(() => {
        toast.error('Load failed', 'Could not load family details.');
        router.push('/families');
      })
      .finally(() => setLoading(false));
  }, [familyId]);

  const handleDelete = async () => {
    if (!familyId) return;
    try {
      await familiesApi.delete(familyId);
      toast.success('Family deleted');
      router.push('/families');
    } catch { toast.error('Delete failed'); }
    finally { setDeleteOpen(false); }
  };

  if (loading) {
    return (
      <DashboardLayout title="Family Details" subtitle="Loading...">
        <div className="flex items-center justify-center py-24 text-gray-400">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
            <span className="text-sm">Loading family details...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) return null;
  const { family, members, stats, recent_donations, recent_attendance, upcoming_events } = data;

  return (
    <DashboardLayout title="Family Details" subtitle={family.name}>

      {/* Top bar */}
      <div className="flex justify-between items-start mb-6">
        <button onClick={() => router.push('/families')}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft size={15} /> Back to Families
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push(`/families/${familyId}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors">
            <Edit2 size={14} /> Edit Family
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
            <Home size={28} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{family.name}</h1>
              <span className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold tracking-widest font-mono">
                {family.family_id}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-2">
              {family.phone && <span className="flex items-center gap-1.5"><Phone size={13} />{family.phone}</span>}
              {(family.address || family.city) && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} />
                  {[family.address, family.city].filter(Boolean).join(', ')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-4 border-t border-gray-100 divide-x divide-gray-100">
          <div className="p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Members</p>
            <div className="flex items-center gap-1.5">
              <Users size={14} className="text-gray-400" />
              <span className="text-lg font-bold text-gray-800">{stats.total_members}</span>
            </div>
          </div>
          <div className="p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Total Giving</p>
            <div className="flex items-center gap-1.5">
              <DollarSign size={14} className="text-green-500" />
              <span className="text-lg font-bold text-green-600">₹{Number(stats.total_giving).toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Donations</p>
            <div className="flex items-center gap-1.5">
              <DollarSign size={14} className="text-gray-400" />
              <span className="text-lg font-bold text-gray-800">{stats.total_donations}</span>
            </div>
          </div>
          <div className="p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Events Attended</p>
            <div className="flex items-center gap-1.5">
              <CheckCircle size={14} className="text-gray-400" />
              <span className="text-lg font-bold text-gray-800">{stats.events_attended}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Members table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-800">
            Family Members <span className="text-gray-400 font-normal text-sm ml-1">({members.length})</span>
          </h3>
        </div>
        <table className="w-full">
          <thead style={{ background: '#fafbfc' }}>
            <tr>
              {['Member ID', 'Name', 'Email', 'Phone', 'Membership Date', 'Status'].map(h => (
                <th key={h} className="text-left px-5 py-2.5 text-xs font-bold uppercase tracking-wider" style={{ color: '#94a3b8' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <UserIcon size={26} className="text-gray-200" />
                    <p className="text-sm font-medium text-gray-500">No members assigned yet</p>
                  </div>
                </td>
              </tr>
            ) : members.map((m: any) => (
              <tr key={m.id} className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => router.push(`/members/${m.id}`)}>
                {/* Member ID */}
                <td className="px-5 py-3">
                  {m.member_id ? (
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-bold font-mono tracking-wider">
                      {m.member_id}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300 italic">—</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                      {m.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{m.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-gray-600">{m.email || '—'}</td>
                <td className="px-5 py-3 text-sm text-gray-600">{m.phone || '—'}</td>
                <td className="px-5 py-3 text-sm text-gray-600">{formatDate(m.membership_date)}</td>
                <td className="px-5 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                    m.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>{m.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Two-column: Donations + Attendance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        {/* Recent Donations */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <DollarSign size={14} className="text-green-500" />
            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Recent Donations</p>
          </div>
          <div className="p-3">
            {recent_donations.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No donations recorded yet</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {recent_donations.map((d: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2.5 px-2">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{d.member}</p>
                      <p className="text-xs text-gray-400">{d.fund} · {formatDate(d.date)}</p>
                    </div>
                    <span className="text-sm font-bold text-green-600">₹{Number(d.amount).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Attendance */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <CheckCircle size={14} className="text-indigo-500" />
            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Recent Attendance</p>
          </div>
          <div className="p-3">
            {recent_attendance.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No attendance records yet</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {recent_attendance.map((a: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 py-2.5 px-2">
                    <CheckCircle size={14} className="text-green-500 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{a.event}</p>
                      <p className="text-xs text-gray-400">{a.member} · {formatDate(a.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <Calendar size={14} className="text-amber-500" />
          <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Upcoming Events</p>
        </div>
        <div className="p-5">
          {upcoming_events.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No upcoming events</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {upcoming_events.map((ev: any) => (
                <div key={ev.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
                    <Calendar size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{ev.title}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                      <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(ev.date)}</span>
                      <span className="flex items-center gap-1"><Clock size={11} />{ev.time}</span>
                    </div>
                    {ev.location && <p className="text-xs text-gray-400 mt-0.5">{ev.location}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {deleteOpen && (
        <ConfirmDialog
          title="Delete Family"
          message="Are you sure you want to delete this family? This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteOpen(false)}
        />
      )}
    </DashboardLayout>
  );
}

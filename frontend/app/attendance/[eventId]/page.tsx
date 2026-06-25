'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { eventsApi, membersApi, attendanceApi } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  ArrowLeft, UserCheck, Search, Calendar, Clock, MapPin, Users,
  Trash2, Download, UserPlus, X, Mic
} from 'lucide-react';

const DAY_LABELS: Record<string, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
};

function formatEventDate(ev: any): string {
  if (ev.start_datetime) {
    const d = new Date(ev.start_datetime);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  return '';
}
function formatEventTime(ev: any): string {
  if (ev.start_datetime) {
    const d = new Date(ev.start_datetime);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  }
  return '';
}

export default function AttendanceDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const eventId = params?.eventId ? parseInt(String(params.eventId)) : undefined;

  const [event,       setEvent]       = useState<any>(null);
  const [attendance,  setAttendance]  = useState<any[]>([]);
  const [members,     setMembers]     = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [adding,      setAdding]      = useState(false);
  const [memberId,    setMemberId]    = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone,setVisitorPhone]= useState('');
  const [saving,      setSaving]      = useState(false);
  const [deleteId,    setDeleteId]    = useState<number | null>(null);

  const fetchAll = async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const [evRes, attRes, memRes] = await Promise.all([
        eventsApi.get(eventId),
        attendanceApi.byEvent(eventId),
        membersApi.list({ page_size: 500 }),
      ]);
      setEvent(evRes.data);
      setAttendance(attRes.data.results || attRes.data);
      setMembers(memRes.data.results || memRes.data);
    } catch {
      toast.error('Load failed', 'Could not load attendance details.');
      router.push('/attendance');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [eventId]);

  const handleMark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId && !visitorName.trim()) {
      toast.warning('Select a member or enter a visitor name');
      return;
    }
    setSaving(true);
    try {
      await attendanceApi.create({
        event: eventId!,
        member: memberId ? parseInt(memberId) : null,
        visitor_name: memberId ? '' : visitorName.trim(),
        visitor_phone: memberId ? '' : visitorPhone.trim(),
      });
      toast.success('Attendance marked');
      setAdding(false);
      setMemberId(''); setVisitorName(''); setVisitorPhone('');
      fetchAll();
    } catch (err: any) {
      const msg = err.response?.data?.non_field_errors?.[0] || err.response?.data?.detail || 'Could not mark attendance — they may already be marked present.';
      toast.error('Failed', msg);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await attendanceApi.delete(deleteId);
      toast.success('Attendance record removed');
      setAttendance(prev => prev.filter(a => a.id !== deleteId));
    } catch { toast.error('Delete failed'); }
    finally { setDeleteId(null); }
  };

  const handleExport = () => {
    import('xlsx').then(XLSX => {
      const rows = filteredAttendance.map((a, i) => ({
        '#': i + 1,
        'Name': a.member_name || a.visitor_name || 'Unknown',
        'Type': a.member ? 'Member' : 'Visitor',
        'Phone': a.visitor_phone || '',
        'Checked In At': new Date(a.checked_in_at).toLocaleString('en-IN'),
        'Notes': a.notes || '',
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [{ wch: 4 }, { wch: 28 }, { wch: 10 }, { wch: 16 }, { wch: 20 }, { wch: 24 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
      const dateLabel = event?.start_datetime
        ? new Date(event.start_datetime).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      const filename = `${(event?.title || 'event').replace(/[^a-z0-9]+/gi, '_')}_attendance_${dateLabel}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success('Exported', `Saved as ${filename}`);
    }).catch(() => {
      toast.error('Export failed', 'Could not generate the Excel file.');
    });
  };

  const filteredAttendance = attendance.filter(a => {
    if (!search.trim()) return true;
    const name = (a.member_name || a.visitor_name || '').toLowerCase();
    return name.includes(search.toLowerCase());
  });

  if (loading) {
    return (
      <DashboardLayout title="Attendance" subtitle="Loading...">
        <div className="flex items-center justify-center py-24 text-gray-400">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
            <span className="text-sm">Loading attendance...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!event) return null;

  const dateText = formatEventDate(event);
  const timeText = formatEventTime(event);
  const hasDays  = !event.start_datetime && Array.isArray(event.days_of_week) && event.days_of_week.length > 0;

  return (
    <DashboardLayout title="Attendance" subtitle={event.title}>

      {/* Top bar */}
      <button onClick={() => router.push('/attendance')}
        className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors mb-6">
        <ArrowLeft size={15} /> Back to Attendance
      </button>

      {/* Event hero card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="p-6 flex items-start gap-5">
          <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
            <Calendar size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-900">{event.title}</h1>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium capitalize">
                {event.event_type?.replace('_', ' ')}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-2">
              {hasDays ? (
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} />
                  Repeats: {event.days_of_week.map((d: string) => DAY_LABELS[d] || d).join(', ')}
                </span>
              ) : dateText ? (
                <>
                  <span className="flex items-center gap-1.5"><Calendar size={13} />{dateText}</span>
                  {timeText && <span className="flex items-center gap-1.5"><Clock size={13} />{timeText}</span>}
                </>
              ) : (
                <span className="text-amber-500 flex items-center gap-1.5">
                  <Calendar size={13} />No date set for this event
                </span>
              )}
              {event.location && <span className="flex items-center gap-1.5"><MapPin size={13} />{event.location}</span>}
              {event.speaker && <span className="flex items-center gap-1.5"><Mic size={13} />{event.speaker}</span>}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-bold text-indigo-600">{attendance.length}</p>
            <p className="text-xs text-gray-400">attendee{attendance.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Attendance card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search attendees..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={attendance.length === 0}
              className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={14} /> Export Excel
            </button>
            <button
              onClick={() => setAdding(v => !v)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              {adding ? <X size={14} /> : <UserPlus size={14} />}
              {adding ? 'Cancel' : 'Mark Attendance'}
            </button>
          </div>
        </div>

        {/* Mark attendance form */}
        {adding && (
          <form onSubmit={handleMark} className="p-4 border-b border-gray-100 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Member</label>
                <select
                  value={memberId}
                  onChange={e => { setMemberId(e.target.value); if (e.target.value) { setVisitorName(''); setVisitorPhone(''); } }}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">Select member</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Or Visitor Name</label>
                <input
                  value={visitorName}
                  onChange={e => { setVisitorName(e.target.value); if (e.target.value) setMemberId(''); }}
                  disabled={!!memberId}
                  placeholder="Visitor name"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Visitor Phone</label>
                <input
                  value={visitorPhone}
                  onChange={e => setVisitorPhone(e.target.value)}
                  disabled={!!memberId}
                  placeholder="Optional"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100"
                />
              </div>
            </div>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
              {saving
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Adding...</>
                : <><UserCheck size={14} />Add Attendee</>}
            </button>
          </form>
        )}

        {/* Attendee table */}
        {filteredAttendance.length === 0 ? (
          <div className="text-center py-16">
            <Users size={28} className="mx-auto text-gray-200 mb-2" />
            <p className="font-medium text-gray-500">
              {search ? 'No attendees match your search' : 'No attendance records yet'}
            </p>
            {!search && <p className="text-xs text-gray-400 mt-1">Click "Mark Attendance" to add the first one.</p>}
          </div>
        ) : (
          <table className="w-full">
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                {['Name', 'Type', 'Phone', 'Checked In', 'Notes', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAttendance.map((a: any) => {
                const name = a.member_name || a.visitor_name || 'Unknown';
                return (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0">
                          <UserCheck size={14} />
                        </div>
                        <span className="text-sm font-semibold text-gray-800">{name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        a.member ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {a.member ? 'Member' : 'Visitor'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{a.visitor_phone || '—'}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {new Date(a.checked_in_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">{a.notes || '—'}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => setDeleteId(a.id)} title="Remove"
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {deleteId && (
        <ConfirmDialog
          title="Remove Attendance Record"
          message="Are you sure you want to remove this attendance record?"
          confirmLabel="Remove"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </DashboardLayout>
  );
}

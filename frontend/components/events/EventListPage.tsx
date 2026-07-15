'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { eventsApi } from '@/lib/api';
import { Plus, Edit2, Trash2, Search, Calendar, Clock, MapPin, RefreshCw, Users, Mic, CheckCircle, XCircle } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const DAY_LABELS: Record<string, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  ongoing:   'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
};

interface Props {
  eventKind:  'service' | 'special';
  title:      string;
  subtitle:   string;
  addPath:    string;
  editPath:   (id: number) => string;
  category: 'service' | 'special';
}

export default function EventListPage({
  eventKind, title, subtitle, addPath, editPath, category
}: Props) {
  const router = useRouter();
  const [events,   setEvents]   = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data } = await eventsApi.list();
      const all  = data.results || data;
      const list = all.filter((e: any) => e.category === category);
      setEvents(list);
      setFiltered(list);
    } catch { toast.error('Failed to load events'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, []);

  useEffect(() => {
    let list = events;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e: any) =>
        e.title?.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q) ||
        e.speaker?.toLowerCase().includes(q)
      );
    }
    if (status) list = list.filter((e: any) => e.status === status);
    setFiltered(list);
  }, [search, status, events]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await eventsApi.delete(deleteId);
      toast.success('Event deleted');
      fetchEvents();
    } catch { toast.error('Delete failed'); }
    finally { setDeleteId(null); }
  };

  const quickMarkCompleted = async (id: number) => {
    setActionId(id);
    try {
      await eventsApi.markCompleted(id);
      toast.success('Marked as Completed');
      fetchEvents();
    } catch { toast.error('Action failed'); }
    finally { setActionId(null); }
  };

  const quickMarkCancelled = async (id: number) => {
    setActionId(id);
    try {
      await eventsApi.markCancelled(id);
      toast.success('Marked as Cancelled');
      fetchEvents();
    } catch { toast.error('Action failed'); }
    finally { setActionId(null); }
  };

  const formatDT = (dt: string) => {
    if (!dt) return '—';
    const d = new Date(dt);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const formatTime = (dt: string) => {
    if (!dt) return '';
    const d = new Date(dt);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <DashboardLayout title={title} subtitle={subtitle}>
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-500 text-sm mt-1">{filtered.length} events</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchEvents}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => router.push(addPath)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
            <Plus size={16} /> Add {eventKind === 'service' ? 'Service' : 'Event'}
          </button>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
        {/* Search + filter */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, speaker, location..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400" />
          </div>
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100">
            <option value="">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Table */}
        <table className="w-full">
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              {['Title', 'Type', 'Speaker', 'Date', 'Time', 'Location', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: '#64748b' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-16">
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                  <span className="text-sm">Loading events...</span>
                </div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-16">
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <Calendar size={32} className="text-gray-200" />
                  <p className="font-medium text-gray-500">{search || status ? 'No events match' : `No ${title.toLowerCase()} yet`}</p>
                  <p className="text-xs">{search || status ? 'Try adjusting filters.' : `Click "Add ${eventKind === 'service' ? 'Service' : 'Event'}" to get started.`}</p>
                </div>
              </td></tr>
            ) : filtered.map((ev: any) => (
              <tr key={ev.id} className="hover:bg-gray-50 transition-colors">
                {/* Title */}
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                      <Calendar size={15} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{ev.title}</p>
                      {ev.is_recurring && (
                        <span className="text-xs text-indigo-500 font-medium">↻ {ev.recurrence_pattern || 'Recurring'}</span>
                      )}
                    </div>
                  </div>
                </td>
                {/* Type */}
                <td className="px-5 py-3">
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium capitalize">
                    {ev.event_type?.replace('_', ' ')}
                  </span>
                </td>
                {/* Speaker */}
                <td className="px-5 py-3">
                  {ev.speaker ? (
                    <div className="flex items-center gap-1.5">
                      <Mic size={13} className="text-purple-400 shrink-0" />
                      <div>
                        <p className="text-sm text-gray-700 truncate max-w-32">{ev.speaker}</p>
                        {ev.speaker_note && <p className="text-xs text-gray-400 truncate max-w-32">{ev.speaker_note}</p>}
                      </div>
                    </div>
                  ) : <span className="text-sm text-gray-400">—</span>}
                </td>
                {/* Date / Days */}
                <td className="px-5 py-3">
                  {!ev.start_datetime && ev.days_of_week?.length > 0 ? (
                    <div className="flex items-center gap-1 flex-wrap">
                      {ev.days_of_week.map((d: string) => (
                        <span key={d} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-semibold">
                          {DAY_LABELS[d] || d}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-700 whitespace-nowrap">{formatDT(ev.start_datetime)}</span>
                    </div>
                  )}
                </td>
                {/* Time */}
                <td className="px-5 py-3">
                  {!ev.start_datetime && ev.days_of_week?.length > 0 ? (
                    <span className="text-xs text-gray-400">Weekly</span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-700">{formatTime(ev.start_datetime)}</span>
                    </div>
                  )}
                </td>
                {/* Location */}
                <td className="px-5 py-3">
                  {ev.location ? (
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-700 truncate max-w-28">{ev.location}</span>
                    </div>
                  ) : <span className="text-sm text-gray-400">—</span>}
                </td>
                {/* Status */}
                <td className="px-5 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[ev.status] || 'bg-gray-100 text-gray-600'}`}>
                    {ev.status}
                  </span>
                </td>
                {/* Actions */}
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1.5">
                    {ev.status === 'scheduled' && (
                      <>
                        <button onClick={() => quickMarkCompleted(ev.id)} disabled={actionId === ev.id}
                          title="Mark Completed"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-green-500 hover:bg-green-50 hover:text-green-700 transition-colors disabled:opacity-40">
                          <CheckCircle size={14} />
                        </button>
                        <button onClick={() => quickMarkCancelled(ev.id)} disabled={actionId === ev.id}
                          title="Cancel"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40">
                          <XCircle size={14} />
                        </button>
                      </>
                    )}
                    <button onClick={() => router.push(editPath(ev.id))} title="Edit"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => setDeleteId(ev.id)} title="Delete"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
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
        <ConfirmDialog title="Delete Event" message="Are you sure? This cannot be undone."
          confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
      )}
    </DashboardLayout>
  );
}

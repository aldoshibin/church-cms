'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { eventsApi, attendanceApi } from '@/lib/api';
import { UserCheck, Search, Calendar, Users, ArrowRight, CheckCircle } from 'lucide-react';

const DAY_LABELS: Record<string, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
};

function formatEventDate(ev: any): { text: string; isDays: boolean } {
  if (ev.start_datetime) {
    const d = new Date(ev.start_datetime);
    return { text: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), isDays: false };
  }
  if (Array.isArray(ev.days_of_week) && ev.days_of_week.length > 0) {
    return { text: ev.days_of_week.map((d: string) => DAY_LABELS[d] || d).join(', '), isDays: true };
  }
  return { text: 'No date set', isDays: false };
}

export default function AttendancePage() {
  const router = useRouter();
  const [events,   setEvents]   = useState<any[]>([]);
  const [counts,   setCounts]   = useState<Record<number, number>>({});
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState<'' | 'service' | 'special'>('');

  useEffect(() => {
    setLoading(true);
    eventsApi.list()
      .then(async (r) => {
        const list = r.data.results || r.data;
        setEvents(list);
        // Fetch attendance counts for all events in parallel
        const results = await Promise.all(
          list.map((ev: any) =>
            attendanceApi.byEvent(ev.id).then(res => ({ id: ev.id, count: (res.data.results || res.data).length })).catch(() => ({ id: ev.id, count: 0 }))
          )
        );
        const map: Record<number, number> = {};
        results.forEach((r: any) => { map[r.id] = r.count; });
        setCounts(map);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = events.filter(ev => {
    if (category && ev.category !== category) return false;
    if (search.trim() && !ev.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Sort: dated events by most recent first, then day-of-week events, keep stable otherwise
  const sorted = [...filtered].sort((a, b) => {
    if (a.start_datetime && b.start_datetime) return new Date(b.start_datetime).getTime() - new Date(a.start_datetime).getTime();
    if (a.start_datetime && !b.start_datetime) return -1;
    if (!a.start_datetime && b.start_datetime) return 1;
    return 0;
  });

  return (
    <DashboardLayout title="Attendance" subtitle="Track event attendance">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Attendance Tracking</h1>
        <p className="text-gray-500 text-sm mt-1">Select an event to view or mark attendance</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search events..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
          />
        </div>
        <select
          value={category}
          onChange={e => setCategory(e.target.value as any)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100"
        >
          <option value="">All Events</option>
          <option value="service">Church Services</option>
          <option value="special">Special Events</option>
        </select>
      </div>

      {/* Event grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-20 text-gray-400">
          <Calendar size={32} className="text-gray-200 mb-2" />
          <p className="font-medium text-gray-500">No events found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map(ev => {
            const dateInfo = formatEventDate(ev);
            const count = counts[ev.id] ?? 0;
            return (
              <button
                key={ev.id}
                onClick={() => router.push(`/attendance/${ev.id}`)}
                className="bg-white rounded-xl border border-gray-200 p-5 text-left hover:border-indigo-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{ev.title}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium capitalize">
                      {ev.event_type?.replace('_', ' ')}
                    </span>
                  </div>
                  <ArrowRight size={16} className="text-gray-300 group-hover:text-indigo-500 transition-colors shrink-0 mt-1" />
                </div>

                <div className="flex items-center gap-1.5 mb-2">
                  <Calendar size={13} className="text-gray-400 shrink-0" />
                  {dateInfo.isDays ? (
                    <div className="flex flex-wrap gap-1">
                      {ev.days_of_week.map((d: string) => (
                        <span key={d} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-semibold">
                          {DAY_LABELS[d] || d}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-600">{dateInfo.text}</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 pt-2 border-t border-gray-50">
                  <Users size={13} className="text-gray-400" />
                  <span className="text-sm font-semibold text-gray-700">{count}</span>
                  <span className="text-sm text-gray-400">attendee{count !== 1 ? 's' : ''}</span>
                  {count > 0 && <CheckCircle size={13} className="text-green-500 ml-auto" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}

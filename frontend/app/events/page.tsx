'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { eventsApi } from '@/lib/api';
import { Plus, Calendar, MapPin, Users, Edit2, Trash2 } from 'lucide-react';

const eventTypeColors: Record<string, string> = {
  service: 'bg-indigo-100 text-indigo-700',
  fellowship: 'bg-green-100 text-green-700',
  outreach: 'bg-amber-100 text-amber-700',
  youth: 'bg-pink-100 text-pink-700',
  choir: 'bg-purple-100 text-purple-700',
  bible_study: 'bg-blue-100 text-blue-700',
  meeting: 'bg-gray-100 text-gray-700',
};

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', event_type: 'service', start_datetime: '', end_datetime: '', location: '', description: '', status: 'upcoming' });

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data } = await eventsApi.list();
      setEvents(data.results || data);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await eventsApi.create(form);
      setShowModal(false);
      fetchEvents();
    } catch(err) { console.error(err); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete event?')) return;
    await eventsApi.delete(id);
    fetchEvents();
  };

  return (
    <DashboardLayout title="Events & Services" subtitle="Manage church events">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Events & Services</h1>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">
          <Plus size={14} /> Add Event
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {loading ? <div className="col-span-2 text-center py-20 text-gray-400">Loading...</div> :
         events.length === 0 ? <div className="col-span-2 text-center py-20 text-gray-400">No events yet</div> :
         events.map(event => (
          <div key={event.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className={"px-2 py-0.5 rounded-full text-xs font-medium " + (eventTypeColors[event.event_type] || 'bg-gray-100 text-gray-700')}>
                  {event.event_type.replace('_', ' ')}
                </span>
                <h3 className="font-semibold text-gray-800 mt-2 text-base">{event.title}</h3>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleDelete(event.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="space-y-1.5 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar size={13} />
                <span>{new Date(event.start_datetime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>
              {event.location && <div className="flex items-center gap-2"><MapPin size={13} /><span>{event.location}</span></div>}
              <div className="flex items-center gap-2"><Users size={13} /><span>{event.attendee_count} attendees</span></div>
            </div>
            {event.description && <p className="text-sm text-gray-500 mt-3 line-clamp-2">{event.description}</p>}
          </div>
         ))
        }
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">Add Event</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
                <input required value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                  <select value={form.event_type} onChange={e => setForm(f => ({...f, event_type: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="service">Worship Service</option>
                    <option value="fellowship">Fellowship</option>
                    <option value="outreach">Outreach</option>
                    <option value="youth">Youth</option>
                    <option value="choir">Choir</option>
                    <option value="bible_study">Bible Study</option>
                    <option value="meeting">Meeting</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Start Date & Time *</label>
                <input required type="datetime-local" value={form.start_datetime} onChange={e => setForm(f => ({...f, start_datetime: e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">End Date & Time</label>
                <input type="datetime-local" value={form.end_datetime} onChange={e => setForm(f => ({...f, end_datetime: e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                <input value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
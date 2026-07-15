'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { communicationApi, membersApi } from '@/lib/api';
import { Send, Plus, Mail, MessageSquare } from 'lucide-react';

export default function CommunicationPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [showCompose, setShowCompose] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', message_type: 'email', subject: '', body: '', recipient_group: 'all'
  });

  const fetchMessages = async () => {
    try {
      const { data } = await communicationApi.listMessages();
      setMessages(data.results || data);
    } catch(e) { console.error(e); }
  };

  useEffect(() => { fetchMessages(); }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await communicationApi.sendMessage(form);
      setShowCompose(false);
      setForm({ title: '', message_type: 'email', subject: '', body: '', recipient_group: 'all' });
      fetchMessages();
      alert('Message sent successfully!');
    } catch(err: any) {
      alert(err.response?.data?.error || 'Failed to send message');
    } finally { setLoading(false); }
  };

  return (
    <DashboardLayout title="Communication" subtitle="Send emails and SMS to members">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Communication</h1>
        <button onClick={() => setShowCompose(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">
          <Plus size={14} /> Compose Message
        </button>
      </div>

      {/* Quick send buttons */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Send Email to All Members', icon: Mail, group: 'all', type: 'email', color: 'bg-blue-50 text-blue-700 border-blue-200' },
          { label: 'Send SMS to Active Members', icon: MessageSquare, group: 'all', type: 'sms', color: 'bg-green-50 text-green-700 border-green-200' },
          { label: 'Send Email & SMS', icon: Send, group: 'all', type: 'both', color: 'bg-purple-50 text-purple-700 border-purple-200' },
        ].map(item => {
          const Icon = item.icon;
          return (
            <button key={item.label} onClick={() => { setForm(f => ({ ...f, message_type: item.type as any, recipient_group: item.group })); setShowCompose(true); }}
              className={"border rounded-xl p-4 text-left hover:shadow-sm transition-all " + item.color}>
              <Icon size={20} className="mb-2" />
              <p className="text-sm font-medium">{item.label}</p>
            </button>
          );
        })}
      </div>

      {/* Message history */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Message History</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>{["Title", "Type", "Recipients", "Status", "Sent At"].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {messages.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400">No messages yet</td></tr>
            ) : messages.map(m => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-800">{m.title}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs capitalize">{m.message_type}</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{m.recipients_count}</td>
                <td className="px-4 py-3">
                  <span className={"px-2 py-0.5 rounded-full text-xs " + (m.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600')}>
                    {m.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {m.sent_at ? new Date(m.sent_at).toLocaleDateString() : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">Compose Message</h2>
              <button onClick={() => setShowCompose(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={handleSend} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Message Type</label>
                  <select value={form.message_type} onChange={e => setForm(f => ({...f, message_type: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="both">Email & SMS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Recipients</label>
                  <select value={form.recipient_group} onChange={e => setForm(f => ({...f, recipient_group: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="all">All Active Members</option>
                    <option value="ministry:Choir">Choir Ministry</option>
                    <option value="ministry:Youth Group">Youth Group</option>
                    <option value="ministry:Women Ministry">Women Ministry</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Title (internal)</label>
                <input required value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              {form.message_type !== 'sms' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email Subject</label>
                  <input value={form.subject} onChange={e => setForm(f => ({...f, subject: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Message Body *</label>
                <textarea required value={form.body} onChange={e => setForm(f => ({...f, body: e.target.value}))} rows={5}
                  placeholder={form.message_type === 'sms' ? 'Max 160 characters for SMS' : 'Message body (HTML supported for email)'}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                {form.message_type === 'sms' && (
                  <p className="text-xs text-gray-500 mt-1">{form.body.length}/160 characters</p>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCompose(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  <Send size={14} /> {loading ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
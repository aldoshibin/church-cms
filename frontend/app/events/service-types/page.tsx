'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { serviceTypesApi } from '@/lib/api';
import { Plus, Edit2, Trash2, Tag, RefreshCw, Calendar } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function ServiceTypesPage() {
  const router = useRouter();
  const [types,    setTypes]    = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchTypes = async () => {
    setLoading(true);
    try {
      const { data } = await serviceTypesApi.list();
      setTypes(data.results || data);
    } catch { toast.error('Failed to load service types'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTypes(); }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await serviceTypesApi.delete(deleteId);
      toast.success('Service type deleted');
      fetchTypes();
    } catch (err: any) {
      toast.error('Delete failed', err.response?.data?.detail || 'Could not delete this type.');
    } finally { setDeleteId(null); }
  };

  return (
    <DashboardLayout title="Service Types" subtitle="Manage Church Service event types">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Types</h1>
          <p className="text-gray-500 text-sm mt-1">{types.length} types defined for Church Services</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchTypes}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => router.push('/events/service-types/add')}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
            <Plus size={16} /> Add Service Type
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              {['Type Name', 'Key', 'Events Using This', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-16">
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                  <span className="text-sm">Loading service types...</span>
                </div>
              </td></tr>
            ) : types.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-16">
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <Tag size={32} className="text-gray-200" />
                  <p className="font-medium text-gray-500">No service types yet</p>
                  <p className="text-xs">Click "Add Service Type" to create your first one.</p>
                </div>
              </td></tr>
            ) : types.map((t: any) => (
              <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                      <Calendar size={15} />
                    </div>
                    <p className="text-sm font-semibold text-gray-800">{t.name}</p>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{t.key}</span>
                </td>
                <td className="px-5 py-3 text-sm text-gray-600">{t.event_count} event{t.event_count !== 1 ? 's' : ''}</td>
                <td className="px-5 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    t.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {t.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => router.push(`/events/service-types/${t.id}/edit`)} title="Edit"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => setDeleteId(t.id)} title="Delete"
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
        <ConfirmDialog
          title="Delete Service Type"
          message="Existing events using this type will keep showing the old type key. Continue?"
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </DashboardLayout>
  );
}

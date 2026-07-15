'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { expenseCategoriesApi } from '@/lib/api';
import { Plus, Edit2, Trash2, Tag, RefreshCw, Receipt, Search } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Pagination from '@/components/ui/Pagination';

export default function ExpenseCategoriesPage() {
  const router = useRouter();
  const [types,    setTypes]    = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Filters
  const [search,      setSearch]      = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination
  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [count,    setCount]    = useState(0);

  const fetchTypes = async () => {
    setLoading(true);
    try {
      const params: any = { page, page_size: pageSize };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.is_active = statusFilter === 'active';

      const { data } = await expenseCategoriesApi.list(params);
      if (Array.isArray(data)) {
        setTypes(data);
        setCount(data.length);
      } else {
        setTypes(data.results || []);
        setCount(data.count ?? (data.results || []).length);
      }
    } catch { toast.error('Failed to load expense categories'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTypes(); }, [page, pageSize, search, statusFilter]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await expenseCategoriesApi.delete(deleteId);
      toast.success('Expense category deleted');
      fetchTypes();
    } catch (err: any) {
      toast.error('Delete failed', err.response?.data?.detail || 'Could not delete this category.');
    } finally { setDeleteId(null); }
  };

  return (
    <DashboardLayout title="Expense Categories" subtitle="Manage expense categories">
      <div className="flex flex-wrap justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expense Categories</h1>
          <p className="text-gray-500 text-sm mt-1">{count} categor{count !== 1 ? 'ies' : 'y'} defined</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={fetchTypes}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => router.push('/expenses/categories/add')}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
            <Plus size={16} /> Add Category
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
        {/* Filters */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {(search || statusFilter) && (
            <button
              onClick={() => { setSearch(''); setStatusFilter(''); }}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Clear filters
            </button>
          )}
        </div>

        <table className="w-full">
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              {['Category Name', 'Key', 'Expenses Using This', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-16">
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                  <span className="text-sm">Loading expense categories...</span>
                </div>
              </td></tr>
            ) : types.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-16">
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <Tag size={32} className="text-gray-200" />
                  <p className="font-medium text-gray-500">{search || statusFilter ? 'No categories match' : 'No expense categories yet'}</p>
                  <p className="text-xs">{search || statusFilter ? 'Try adjusting filters.' : 'Click "Add Category" to create your first one.'}</p>
                </div>
              </td></tr>
            ) : types.map((t: any) => (
              <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-red-100 text-red-600 rounded-xl flex items-center justify-center shrink-0">
                      <Receipt size={15} />
                    </div>
                    <p className="text-sm font-semibold text-gray-800">{t.name}</p>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{t.key}</span>
                </td>
                <td className="px-5 py-3 text-sm text-gray-600">{t.expense_count} expense{t.expense_count !== 1 ? 's' : ''}</td>
                <td className="px-5 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    t.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {t.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => router.push(`/expenses/categories/${t.id}/edit`)} title="Edit"
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

        {!loading && types.length > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            count={count}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          />
        )}
      </div>

      {deleteId && (
        <ConfirmDialog
          title="Delete Expense Category"
          message="Existing expenses using this category will keep showing the old category key. Continue?"
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </DashboardLayout>
  );
}

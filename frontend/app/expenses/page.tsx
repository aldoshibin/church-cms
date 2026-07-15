'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { expensesApi, expenseCategoriesApi } from '@/lib/api';
import {
  Plus, Edit2, Trash2, Search, Receipt, FileText, Eye,
  Download, RefreshCw, CheckCircle, Calendar, Tag, XCircle,
  RotateCcw, ClipboardList
} from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ReasonModal from '@/components/finance/ReasonModal';
import Pagination from '@/components/ui/Pagination';

const STATUS_COLORS: Record<string, string> = {
  pending:  'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
  paid:     'bg-blue-100 text-blue-700',
};

export default function ExpensesPage() {
  const router = useRouter();
  const [expenses,   setExpenses]   = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [deleteId,    setDeleteId]    = useState<number | null>(null);
  const [approveId,   setApproveId]   = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [revertTarget, setRevertTarget] = useState<any>(null);

  // Filters
  const [search,     setSearch]     = useState('');
  const [status,     setStatus]     = useState('');
  const [category,   setCategory]   = useState('');
  const [dateFrom,   setDateFrom]   = useState('');
  const [dateTo,     setDateTo]     = useState('');

  // Pagination
  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [count,    setCount]    = useState(0);

  const buildParams = (overridePageSize?: number) => {
    const params: any = { page, page_size: overridePageSize ?? pageSize };
    if (search.trim()) params.search = search.trim();
    if (status) params.status = status;
    if (category) params.category = category;
    if (dateFrom) params.date__gte = dateFrom;
    if (dateTo) params.date__lte = dateTo;
    return params;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await expensesApi.list(buildParams());
      if (Array.isArray(data)) {
        setExpenses(data);
        setCount(data.length);
      } else {
        setExpenses(data.results || []);
        setCount(data.count ?? (data.results || []).length);
      }
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [page, pageSize, search, status, category, dateFrom, dateTo]);
  useEffect(() => { setPage(1); }, [search, status, category, dateFrom, dateTo]);
  useEffect(() => { expenseCategoriesApi.list().then(r => setCategories(r.data.results || r.data)).catch(() => {}); }, []);

  // Filter-aware summary stats
  const [stats, setStats] = useState({ this_month_total: 0, all_time_total: 0, count: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const { page: _pg, page_size: _ps, ...filterOnly } = buildParams();
      const { data } = await expensesApi.stats(filterOnly);
      setStats(data);
    } catch { /* silently fall back to zeros */ }
    finally { setStatsLoading(false); }
  };

  useEffect(() => { fetchStats(); }, [search, status, category, dateFrom, dateTo]);

  const filtered = expenses; // filtering now happens server-side

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await expensesApi.delete(deleteId); toast.success('Expense deleted'); fetchData(); }
    catch { toast.error('Delete failed'); }
    finally { setDeleteId(null); }
  };

  const handleApprove = async (id: number) => {
    setApproveId(id);
    try {
      await expensesApi.approve(id);
      toast.success('Expense approved');
      fetchData();
    } catch { toast.error('Approval failed'); }
    finally { setApproveId(null); }
  };

  const handleReject = async (reason: string) => {
    if (!rejectTarget) return;
    try {
      await expensesApi.reject(rejectTarget.id, reason);
      toast.success('Expense rejected', `${rejectTarget.title} sent back as rejected.`);
      fetchData();
    } catch (err: any) {
      toast.error('Reject failed', err.response?.data?.error || 'Could not reject this expense.');
    } finally { setRejectTarget(null); }
  };

  const handleRevert = async (reason: string) => {
    if (!revertTarget) return;
    try {
      await expensesApi.revert(revertTarget.id, reason);
      toast.success('Reverted to Pending', `${revertTarget.title} is now pending again.`);
      fetchData();
    } catch (err: any) {
      toast.error('Revert failed', err.response?.data?.error || 'Could not revert this expense.');
    } finally { setRevertTarget(null); }
  };

  const handleExport = async () => {
    // Export respects current filters but ignores pagination — fetch ALL matching rows
    let exportRows = expenses;
    try {
      const { data } = await expensesApi.list(buildParams(10000));
      exportRows = Array.isArray(data) ? data : (data.results || []);
    } catch {
      toast.warning('Exporting current page only', 'Could not fetch the full filtered list.');
    }

    import('xlsx').then(XLSX => {
      const rows = exportRows.map((e: any, i: number) => ({
        '#': i + 1,
        'Title': e.title,
        'Category': e.category_name || e.category,
        'Amount (₹)': Number(e.amount),
        'Date': e.date,
        'Vendor': e.vendor || '',
        'Status': e.status,
        'Has Receipt': e.receipt ? 'Yes' : 'No',
        'Approved By': e.approved_by_name || '',
        'Description': e.description || '',
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [{ wch: 4 }, { wch: 28 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 18 }, { wch: 28 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
      const filename = `expenses_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success('Exported', `Saved as ${filename}`);
    }).catch(() => toast.error('Export failed', 'Could not generate the Excel file.'));
  };

  return (
    <DashboardLayout title="Expenses" subtitle="Track church expenses">
      <div className="flex flex-wrap justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-500 text-sm mt-1">{count} record{count !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={fetchData}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={handleExport} disabled={filtered.length === 0}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <Download size={14} /> Export Excel
          </button>
          <button onClick={() => router.push('/expenses/categories')}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            <Tag size={14} /> Categories
          </button>
          <button onClick={() => router.push('/expenses/approvals')}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            <ClipboardList size={14} /> Approval Summary
          </button>
          <button onClick={() => router.push('/expenses/add')}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
            <Plus size={16} /> Add Expense
          </button>
        </div>
      </div>

      {/* Summary cards — recalculate based on current filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">This Month Expenses</p>
          {statsLoading ? (
            <div className="h-9 flex items-center"><div className="w-5 h-5 border-2 border-red-200 border-t-red-600 rounded-full animate-spin" /></div>
          ) : (
            <p className="text-3xl font-bold text-red-600">₹{stats.this_month_total.toLocaleString('en-IN')}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">{new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Total Expenses</p>
          {statsLoading ? (
            <div className="h-9 flex items-center"><div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>
          ) : (
            <p className="text-3xl font-bold text-indigo-600">₹{stats.all_time_total.toLocaleString('en-IN')}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">{search || status || category || dateFrom || dateTo ? 'matching filters' : 'all time'}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, vendor..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400" />
          </div>
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="paid">Paid</option>
          </select>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100">
            <option value="">All Categories</option>
            {categories.map((c: any) => <option key={c.key} value={c.key}>{c.name}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            title="From date"
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            title="To date"
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100" />
          {(search || status || category || dateFrom || dateTo) && (
            <button
              onClick={() => { setSearch(''); setStatus(''); setCategory(''); setDateFrom(''); setDateTo(''); }}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Clear filters
            </button>
          )}
        </div>

        <table className="w-full">
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              {['Title', 'Category', 'Amount', 'Date', 'Vendor', 'Status', 'Receipt', 'Actions'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-16">
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                  <span className="text-sm">Loading expenses...</span>
                </div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-16">
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <Receipt size={32} className="text-gray-200" />
                  <p className="font-medium text-gray-500">{search || status ? 'No expenses match' : 'No expenses yet'}</p>
                  <p className="text-xs">{search || status ? 'Try adjusting filters.' : 'Click "Add Expense" to record the first one.'}</p>
                </div>
              </td></tr>
            ) : filtered.map((e: any) => (
              <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-red-100 text-red-600 rounded-xl flex items-center justify-center shrink-0">
                      <Receipt size={15} />
                    </div>
                    <p className="text-sm font-semibold text-gray-800">{e.title}</p>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                    {e.category_name || e.category}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className="text-sm font-bold text-red-600">₹{Number(e.amount).toLocaleString('en-IN')}</span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Calendar size={13} className="text-gray-400" />
                    {new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-gray-600">{e.vendor || '—'}</td>
                <td className="px-5 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[e.status] || 'bg-gray-100 text-gray-600'}`}>
                    {e.status}
                  </span>
                </td>
                <td className="px-5 py-3">
                  {e.receipt ? (
                    <a href={e.receipt} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                      <FileText size={13} /> View
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1.5">
                    {e.status === 'pending' && (
                      <>
                        <button onClick={() => handleApprove(e.id)} disabled={approveId === e.id} title="Approve"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-green-500 hover:bg-green-50 hover:text-green-700 transition-colors disabled:opacity-40">
                          {approveId === e.id
                            ? <div className="w-3.5 h-3.5 border-2 border-green-300 border-t-green-600 rounded-full animate-spin" />
                            : <CheckCircle size={14} />}
                        </button>
                        <button onClick={() => setRejectTarget(e)} title="Reject"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                          <XCircle size={14} />
                        </button>
                      </>
                    )}
                    {(e.status === 'approved' || e.status === 'rejected') && (
                      <button onClick={() => setRevertTarget(e)} title="Revert to Pending"
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-amber-500 hover:bg-amber-50 hover:text-amber-700 transition-colors">
                        <RotateCcw size={14} />
                      </button>
                    )}
                    <button onClick={() => router.push(`/expenses/${e.id}/edit`)} title="Edit"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => setDeleteId(e.id)} title="Delete"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && expenses.length > 0 && (
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
        <ConfirmDialog title="Delete Expense" message="Are you sure you want to delete this expense record? This cannot be undone."
          confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
      )}

      {rejectTarget && (
        <ReasonModal
          title="Reject Expense"
          description={`Rejecting "${rejectTarget.title}" (₹${Number(rejectTarget.amount).toLocaleString('en-IN')}). Please explain why so the requester can correct and resubmit.`}
          reasonRequired
          confirmLabel="Reject Expense"
          confirmColor="red"
          onConfirm={handleReject}
          onCancel={() => setRejectTarget(null)}
        />
      )}

      {revertTarget && (
        <ReasonModal
          title="Revert to Pending"
          description={`This will undo the ${revertTarget.status} status on "${revertTarget.title}" and send it back to Pending. Useful if it was approved or rejected by mistake.`}
          reasonRequired={false}
          confirmLabel="Revert to Pending"
          confirmColor="amber"
          onConfirm={handleRevert}
          onCancel={() => setRevertTarget(null)}
        />
      )}
    </DashboardLayout>
  );
}

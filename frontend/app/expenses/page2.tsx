'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { expensesApi } from '@/lib/api';
import {
  Plus, Edit2, Trash2, Search, Receipt, FileText, Eye,
  Download, RefreshCw, CheckCircle, Calendar, Tag, XCircle,
  RotateCcw, ClipboardList
} from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ReasonModal from '@/components/finance/ReasonModal';

const STATUS_COLORS: Record<string, string> = {
  pending:  'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
  paid:     'bg-blue-100 text-blue-700',
};

export default function ExpensesPage() {
  const router = useRouter();
  const [expenses,  setExpenses]  = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [status,    setStatus]    = useState('');
  const [deleteId,  setDeleteId]  = useState<number | null>(null);
  const [approveId, setApproveId] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [revertTarget, setRevertTarget] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await expensesApi.list();
      setExpenses(data.results || data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = expenses.filter(e => {
    if (status && e.status !== status) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return e.title.toLowerCase().includes(q) || (e.vendor || '').toLowerCase().includes(q);
    }
    return true;
  });

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

  const handleExport = () => {
    import('xlsx').then(XLSX => {
      const rows = filtered.map((e, i) => ({
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

  const totalAmount = filtered.reduce((s, e) => s + Number(e.amount || 0), 0);

  return (
    <DashboardLayout title="Expenses" subtitle="Track church expenses">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-500 text-sm mt-1">{filtered.length} records — ₹{totalAmount.toLocaleString('en-IN')} total</p>
        </div>
        <div className="flex gap-2">
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

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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

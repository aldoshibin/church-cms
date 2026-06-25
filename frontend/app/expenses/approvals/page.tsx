'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { expensesApi } from '@/lib/api';
import ReasonModal from '@/components/finance/ReasonModal';
import {
  ArrowLeft, Clock, CheckCircle, XCircle, RotateCcw, User,
  Calendar, DollarSign, RefreshCw, History
} from 'lucide-react';
import { toast } from '@/components/ui/Toast';

const ACTION_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  approved: { label: 'Approved',          color: 'text-green-700', bg: 'bg-green-50',  icon: CheckCircle },
  rejected: { label: 'Rejected',           color: 'text-red-700',   bg: 'bg-red-50',    icon: XCircle     },
  reverted: { label: 'Reverted to Pending', color: 'text-amber-700', bg: 'bg-amber-50', icon: RotateCcw   },
};

export default function ApprovalSummaryPage() {
  const router = useRouter();
  const [data,        setData]        = useState<any>(null);
  const [loading,      setLoading]      = useState(true);
  const [approveId,    setApproveId]    = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<any>(null);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const { data } = await expensesApi.approvalSummary();
      setData(data);
    } catch { toast.error('Could not load approval summary'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSummary(); }, []);

  const handleApprove = async (id: number) => {
    setApproveId(id);
    try {
      await expensesApi.approve(id);
      toast.success('Expense approved');
      fetchSummary();
    } catch { toast.error('Approval failed'); }
    finally { setApproveId(null); }
  };

  const handleReject = async (reason: string) => {
    if (!rejectTarget) return;
    try {
      await expensesApi.reject(rejectTarget.id, reason);
      toast.success('Expense rejected');
      fetchSummary();
    } catch (err: any) {
      toast.error('Reject failed', err.response?.data?.error || 'Could not reject this expense.');
    } finally { setRejectTarget(null); }
  };

  if (loading) {
    return (
      <DashboardLayout title="Approval Summary" subtitle="Loading...">
        <div className="flex items-center justify-center py-24 text-gray-400">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
            <span className="text-sm">Loading approval summary...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) return null;
  const { pending_count, pending, recent_activity } = data;

  return (
    <DashboardLayout title="Approval Summary" subtitle="Pending requests and approval history">

      <button onClick={() => router.push('/expenses')}
        className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors mb-6">
        <ArrowLeft size={15} /> Back to Expenses
      </button>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approval Summary</h1>
          <p className="text-gray-500 text-sm mt-1">{pending_count} request{pending_count !== 1 ? 's' : ''} awaiting approval</p>
        </div>
        <button onClick={fetchSummary}
          className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Pending queue */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <Clock size={15} className="text-amber-500" />
          <p className="font-bold text-gray-800">Pending Approval Queue</p>
        </div>

        {pending.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle size={28} className="mx-auto text-green-200 mb-2" />
            <p className="font-medium text-gray-500">All caught up — nothing pending.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {pending.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                    <Clock size={16} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{p.title}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                      <span className="flex items-center gap-1"><User size={11} />{p.requested_by}</span>
                      <span className="flex items-center gap-1"><Calendar size={11} />{new Date(p.date).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-red-600">₹{Number(p.amount).toLocaleString('en-IN')}</span>
                  <button onClick={() => handleApprove(p.id)} disabled={approveId === p.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-semibold hover:bg-green-100 disabled:opacity-40 transition-colors">
                    {approveId === p.id
                      ? <div className="w-3 h-3 border-2 border-green-300 border-t-green-600 rounded-full animate-spin" />
                      : <CheckCircle size={13} />}
                    Approve
                  </button>
                  <button onClick={() => setRejectTarget(p)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors">
                    <XCircle size={13} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approval history log */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <History size={15} className="text-indigo-500" />
          <p className="font-bold text-gray-800">Approval Activity Log</p>
          <span className="text-xs text-gray-400 ml-1">(most recent 100 actions)</span>
        </div>

        {recent_activity.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <History size={28} className="mx-auto text-gray-200 mb-2" />
            <p className="font-medium text-gray-500">No approval activity yet.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead style={{ background: '#fafbfc' }}>
              <tr>
                {['Expense', 'Amount', 'Action', 'By', 'When', 'Reason'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#94a3b8' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recent_activity.map((log: any) => {
                const cfg = ACTION_CONFIG[log.action] || ACTION_CONFIG.reverted;
                const Icon = cfg.icon;
                return (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-sm font-medium text-gray-800">{log.expense_title}</td>
                    <td className="px-5 py-3 text-sm font-semibold text-gray-700">₹{Number(log.expense_amount).toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                        <Icon size={12} /> {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{log.performed_by_name}</td>
                    <td className="px-5 py-3 text-sm text-gray-500">
                      {new Date(log.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500 max-w-xs truncate" title={log.reason}>
                      {log.reason || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {rejectTarget && (
        <ReasonModal
          title="Reject Expense"
          description={`Rejecting "${rejectTarget.title}" (₹${Number(rejectTarget.amount).toLocaleString('en-IN')}). Please explain why.`}
          reasonRequired
          confirmLabel="Reject Expense"
          confirmColor="red"
          onConfirm={handleReject}
          onCancel={() => setRejectTarget(null)}
        />
      )}
    </DashboardLayout>
  );
}

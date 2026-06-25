'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { donationsApi, fundsApi } from '@/lib/api';
import {
  Plus, Edit2, Trash2, Search, DollarSign, FileText, Eye,
  Download, RefreshCw, TrendingUp, Calendar
} from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Pagination from '@/components/ui/Pagination';

const METHOD_COLORS: Record<string, string> = {
  cash: 'bg-green-100 text-green-700',
  check: 'bg-blue-100 text-blue-700',
  online: 'bg-purple-100 text-purple-700',
  bank_transfer: 'bg-indigo-100 text-indigo-700',
  upi: 'bg-amber-100 text-amber-700',
};

export default function DonationsPage() {
  const router = useRouter();
  const [donations, setDonations] = useState<any[]>([]);
  const [funds,      setFunds]      = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [deleteId,   setDeleteId]   = useState<number | null>(null);

  // Filters
  const [search,     setSearch]     = useState('');
  const [method,      setMethod]      = useState('');
  const [fundFilter,  setFundFilter]  = useState('');
  const [dateFrom,    setDateFrom]    = useState('');
  const [dateTo,      setDateTo]      = useState('');

  // Pagination
  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [count,    setCount]    = useState(0);

  const buildParams = (overridePageSize?: number) => {
    const params: any = { page, page_size: overridePageSize ?? pageSize };
    if (search.trim()) params.search = search.trim();
    if (method) params.payment_method = method;
    if (fundFilter) params.fund = fundFilter;
    if (dateFrom) params.date__gte = dateFrom;
    if (dateTo) params.date__lte = dateTo;
    return params;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await donationsApi.list(buildParams());
      if (Array.isArray(data)) {
        setDonations(data);
        setCount(data.length);
      } else {
        setDonations(data.results || []);
        setCount(data.count ?? (data.results || []).length);
      }
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [page, pageSize, search, method, fundFilter, dateFrom, dateTo]);
  useEffect(() => { setPage(1); }, [search, method, fundFilter, dateFrom, dateTo]);
  useEffect(() => { fundsApi.list().then(r => setFunds(r.data.results || r.data)).catch(() => {}); }, []);

  const filtered = donations; // filtering now happens server-side

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await donationsApi.delete(deleteId); toast.success('Donation deleted'); fetchData(); }
    catch { toast.error('Delete failed'); }
    finally { setDeleteId(null); }
  };

  const handleExport = async () => {
    // Export respects current filters but ignores pagination — fetch ALL matching rows
    let exportRows = donations;
    try {
      const { data } = await donationsApi.list(buildParams(10000));
      exportRows = Array.isArray(data) ? data : (data.results || []);
    } catch {
      toast.warning('Exporting current page only', 'Could not fetch the full filtered list.');
    }

    import('xlsx').then(XLSX => {
      const rows = exportRows.map((d: any, i: number) => ({
        '#': i + 1,
        'Donor': d.member_name || 'Anonymous',
        'Fund': d.fund_name || 'General',
        'Amount (₹)': Number(d.amount),
        'Date': d.date,
        'Method': d.payment_method,
        'Transaction ID': d.transaction_id || '',
        'Has Receipt': d.receipt ? 'Yes' : 'No',
        'Notes': d.notes || '',
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [{ wch: 4 }, { wch: 22 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 18 }, { wch: 10 }, { wch: 24 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Donations');
      const filename = `donations_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success('Exported', `Saved as ${filename}`);
    }).catch(() => toast.error('Export failed', 'Could not generate the Excel file.'));
  };

  // NOTE: reflects only the current page's amounts — see Funds page
  // comment for the same caveat and suggested fix (dedicated summary endpoint).
  const totalAmount = filtered.reduce((s, d) => s + Number(d.amount || 0), 0);

  return (
    <DashboardLayout title="Donations" subtitle="Manage donation records">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Donations</h1>
          <p className="text-gray-500 text-sm mt-1">{count} record{count !== 1 ? 's' : ''} — ₹{totalAmount.toLocaleString('en-IN')} (this page)</p>
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
          <button onClick={() => router.push('/donations/add')}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
            <Plus size={16} /> Record Donation
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by donor, transaction ID..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400" />
          </div>
          <select value={method} onChange={e => setMethod(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100">
            <option value="">All Methods</option>
            <option value="cash">Cash</option>
            <option value="check">Check</option>
            <option value="online">Online</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="upi">UPI</option>
          </select>
          <select value={fundFilter} onChange={e => setFundFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100">
            <option value="">All Funds</option>
            {funds.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            title="From date"
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            title="To date"
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100" />
          {(search || method || fundFilter || dateFrom || dateTo) && (
            <button
              onClick={() => { setSearch(''); setMethod(''); setFundFilter(''); setDateFrom(''); setDateTo(''); }}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Clear filters
            </button>
          )}
        </div>

        <table className="w-full">
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              {['Donor', 'Fund', 'Amount', 'Date', 'Method', 'Receipt', 'Actions'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-16">
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                  <span className="text-sm">Loading donations...</span>
                </div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-16">
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <DollarSign size={32} className="text-gray-200" />
                  <p className="font-medium text-gray-500">{search || method ? 'No donations match' : 'No donations yet'}</p>
                  <p className="text-xs">{search || method ? 'Try adjusting filters.' : 'Click "Record Donation" to add the first one.'}</p>
                </div>
              </td></tr>
            ) : filtered.map((d: any) => (
              <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                      {(d.member_name || 'A')[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{d.member_name || 'Anonymous'}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-gray-600">{d.fund_name || 'General'}</td>
                <td className="px-5 py-3">
                  <span className="text-sm font-bold text-green-600">₹{Number(d.amount).toLocaleString('en-IN')}</span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Calendar size={13} className="text-gray-400" />
                    {new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${METHOD_COLORS[d.payment_method] || 'bg-gray-100 text-gray-600'}`}>
                    {d.payment_method?.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-5 py-3">
                  {d.receipt ? (
                    <a href={d.receipt} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                      <FileText size={13} /> View
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => router.push(`/donations/${d.id}/edit`)} title="Edit"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => setDeleteId(d.id)} title="Delete"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && donations.length > 0 && (
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
        <ConfirmDialog title="Delete Donation" message="Are you sure you want to delete this donation record? This cannot be undone."
          confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
      )}
    </DashboardLayout>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { donationsApi, fundsApi } from '@/lib/api';
import {
  Plus, Edit2, Trash2, Search, DollarSign, FileText,
  Download, RefreshCw, Calendar
} from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Pagination from '@/components/ui/Pagination';

const METHOD_COLORS: Record<string, string> = {
  cash:          'bg-green-100 text-green-700',
  check:         'bg-blue-100 text-blue-700',
  online:        'bg-purple-100 text-purple-700',
  bank_transfer: 'bg-indigo-100 text-indigo-700',
  upi:           'bg-amber-100 text-amber-700',
};

/* ── Quick date-range helpers ──────────────────────────────────────────── */
function isoDate(d: Date) { return d.toISOString().split('T')[0]; }

const QUICK_RANGES: { label: string; from: () => string; to: () => string }[] = [
  {
    label: 'This Month',
    from: () => { const d = new Date(); return isoDate(new Date(d.getFullYear(), d.getMonth(), 1)); },
    to:   () => isoDate(new Date()),
  },
  {
    label: 'Last Month',
    from: () => { const d = new Date(); return isoDate(new Date(d.getFullYear(), d.getMonth() - 1, 1)); },
    to:   () => { const d = new Date(); return isoDate(new Date(d.getFullYear(), d.getMonth(), 0)); },
  },
  {
    label: 'Last 3 Months',
    from: () => { const d = new Date(); d.setMonth(d.getMonth() - 3); return isoDate(d); },
    to:   () => isoDate(new Date()),
  },
  {
    label: 'This Year',
    from: () => `${new Date().getFullYear()}-01-01`,
    to:   () => isoDate(new Date()),
  },
];

function formatDateLabel(date: string) {
  if (!date) return '';
  try {
    return new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return date; }
}

/* ── Component ─────────────────────────────────────────────────────────── */
export default function DonationsPage() {
  const router = useRouter();
  const [donations, setDonations] = useState<any[]>([]);
  const [funds,      setFunds]      = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [deleteId,   setDeleteId]   = useState<number | null>(null);

  // Filters
  const [search,     setSearch]     = useState('');
  const [method,     setMethod]     = useState('');
  const [fundFilter, setFundFilter] = useState('');
  const [dateFrom,   setDateFrom]   = useState('');
  const [dateTo,     setDateTo]     = useState('');
  const [activeQuick, setActiveQuick] = useState('');

  // Pagination
  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [count,    setCount]    = useState(0);

  // Stats
  const [stats,        setStats]        = useState({ this_month_total: 0, all_time_total: 0, count: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const hasDateFilter = !!(dateFrom || dateTo);
  const hasAnyFilter  = !!(search || method || fundFilter || dateFrom || dateTo);

  const buildParams = (overridePageSize?: number) => {
    const params: any = { page, page_size: overridePageSize ?? pageSize };
    if (search.trim()) params.search     = search.trim();
    if (method)        params.payment_method = method;
    if (fundFilter)    params.fund        = fundFilter;
    if (dateFrom)      params.date__gte   = dateFrom;
    if (dateTo)        params.date__lte   = dateTo;
    return params;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await donationsApi.list(buildParams());
      if (Array.isArray(data)) {
        setDonations(data); setCount(data.length);
      } else {
        setDonations(data.results || []);
        setCount(data.count ?? (data.results || []).length);
      }
    } catch {}
    finally { setLoading(false); }
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const filterOnly: any = {};
      if (method)     filterOnly.payment_method = method;
      if (fundFilter) filterOnly.fund           = fundFilter;
      if (dateFrom)   filterOnly.date__gte      = dateFrom;
      if (dateTo)     filterOnly.date__lte      = dateTo;
      const { data } = await donationsApi.stats(filterOnly);
      setStats(data);
    } catch {}
    finally { setStatsLoading(false); }
  };

  useEffect(() => { fetchData(); }, [page, pageSize, search, method, fundFilter, dateFrom, dateTo]);
  useEffect(() => { setPage(1); },  [search, method, fundFilter, dateFrom, dateTo]);
  useEffect(() => { fetchStats(); }, [method, fundFilter, dateFrom, dateTo]);
  useEffect(() => {
    fundsApi.list().then(r => setFunds(r.data.results || r.data)).catch(() => {});
  }, []);

  /* ── Quick filter apply ──── */
  const applyQuickRange = (label: string, from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
    setActiveQuick(label);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch(''); setMethod(''); setFundFilter('');
    setDateFrom(''); setDateTo(''); setActiveQuick('');
    setPage(1);
  };

  /* ── Card label logic ──── */
  const card1Label = () => {
    if (hasDateFilter) {
      if (dateFrom && dateTo) return `${formatDateLabel(dateFrom)} — ${formatDateLabel(dateTo)}`;
      if (dateFrom) return `From ${formatDateLabel(dateFrom)}`;
      if (dateTo)   return `Until ${formatDateLabel(dateTo)}`;
    }
    return new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  };

  const card1Value = () => {
    // When date filter active, stats API is already filtered — use all_time_total
    // (which respects the date range). When no date filter, use this_month_total.
    return hasDateFilter ? stats.all_time_total : stats.this_month_total;
  };

  const card2Label = () => {
    if (hasAnyFilter) return 'Matching filters';
    return 'All time';
  };

  /* ── Export ──── */
  const handleExport = async () => {
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
        'Donor':          d.member_name || 'Anonymous',
        'Fund':           d.fund_name || 'General',
        'Amount (₹)':    Number(d.amount),
        'Date':           d.date,
        'Method':         d.payment_method,
        'Transaction ID': d.transaction_id || '',
        'Has Receipt':    d.receipt ? 'Yes' : 'No',
        'Notes':          d.notes || '',
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Donations');
      XLSX.writeFile(wb, `donations_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Exported successfully');
    }).catch(() => toast.error('Export failed'));
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await donationsApi.delete(deleteId); toast.success('Donation deleted'); fetchData(); }
    catch { toast.error('Delete failed'); }
    finally { setDeleteId(null); }
  };

  return (
    <DashboardLayout title="Donations" subtitle="Manage donation records">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Donations</h1>
          <p className="text-gray-500 text-sm mt-1">{count} record{count !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={handleExport} disabled={donations.length === 0}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <Download size={14} /> Export Excel
          </button>
          <button onClick={() => router.push('/donations/add')}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
            <Plus size={16} /> Record Donation
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">
            {hasDateFilter ? 'Period Donations' : 'This Month Donations'}
          </p>
          {statsLoading ? (
            <div className="h-9 flex items-center">
              <div className="w-5 h-5 border-2 border-green-200 border-t-green-600 rounded-full animate-spin" />
            </div>
          ) : (
            <p className="text-3xl font-bold text-green-600">
              ₹{card1Value().toLocaleString('en-IN')}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">{card1Label()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Total Donations</p>
          {statsLoading ? (
            <div className="h-9 flex items-center">
              <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : (
            <p className="text-3xl font-bold text-indigo-600">
              ₹{stats.all_time_total.toLocaleString('en-IN')}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">{card2Label()}</p>
        </div>
      </div>

      {/* Quick date range buttons */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs text-gray-400 font-medium">Quick range:</span>
        {QUICK_RANGES.map(q => (
          <button
            key={q.label}
            onClick={() => applyQuickRange(q.label, q.from(), q.to())}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              activeQuick === q.label
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {q.label}
          </button>
        ))}
        {hasAnyFilter && (
          <button onClick={clearFilters} className="px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
            Clear all
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-sm">
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
          <div className="flex items-center gap-1.5">
            <Calendar size={13} className="text-gray-400" />
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setActiveQuick(''); }}
              title="From date"
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100" />
            <span className="text-gray-400 text-xs">to</span>
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setActiveQuick(''); }}
              title="To date"
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100" />
          </div>
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
            ) : donations.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-16">
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <DollarSign size={32} className="text-gray-200" />
                  <p className="font-medium text-gray-500">{hasAnyFilter ? 'No donations match your filters' : 'No donations yet'}</p>
                  <p className="text-xs">{hasAnyFilter ? 'Try adjusting or clearing the filters.' : 'Click "Record Donation" to add the first one.'}</p>
                </div>
              </td></tr>
            ) : donations.map((d: any) => (
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
                <td className="px-5 py-3 text-sm text-gray-600">
                  {new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
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
            page={page} pageSize={pageSize} count={count}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          />
        )}
      </div>

      {deleteId && (
        <ConfirmDialog title="Delete Donation"
          message="Are you sure you want to delete this donation record? This cannot be undone."
          confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
      )}
    </DashboardLayout>
  );
}

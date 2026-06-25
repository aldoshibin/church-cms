'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { fundsApi, donationsApi } from '@/lib/api';
import Pagination from '@/components/ui/Pagination';
import { toast } from '@/components/ui/Toast';
import {
  ArrowLeft, Edit2, Target, TrendingUp, DollarSign, Archive,
  Search, Calendar, FileText, Download, RefreshCw, User
} from 'lucide-react';

const FUND_ICONS: Record<string, any> = {
  general: DollarSign, building: Target, mission: TrendingUp,
  benevolence: DollarSign, youth: DollarSign, worship: DollarSign,
  education: DollarSign, emergency: Archive, other: DollarSign,
};

const METHOD_COLORS: Record<string, string> = {
  cash: 'bg-green-100 text-green-700',
  check: 'bg-blue-100 text-blue-700',
  online: 'bg-purple-100 text-purple-700',
  bank_transfer: 'bg-indigo-100 text-indigo-700',
  upi: 'bg-amber-100 text-amber-700',
};

export default function FundDetailPage() {
  const params = useParams();
  const router = useRouter();
  const fundId = params?.id ? parseInt(String(params.id)) : undefined;

  const [fund,       setFund]       = useState<any>(null);
  const [donations,  setDonations]  = useState<any[]>([]);
  const [fundLoading, setFundLoading] = useState(true);
  const [listLoading, setListLoading] = useState(true);

  // Filters
  const [search,  setSearch]  = useState('');
  const [method,  setMethod]  = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');

  // Pagination
  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [count,    setCount]    = useState(0);

  const buildParams = (overridePageSize?: number) => {
    const params: any = { page, page_size: overridePageSize ?? pageSize, fund: fundId };
    if (search.trim()) params.search = search.trim();
    if (method) params.payment_method = method;
    if (dateFrom) params.date__gte = dateFrom;
    if (dateTo) params.date__lte = dateTo;
    return params;
  };

  const fetchFund = async () => {
    if (!fundId) return;
    setFundLoading(true);
    try {
      const { data } = await fundsApi.get(fundId);
      setFund(data);
    } catch {
      toast.error('Load failed', 'Could not load this fund.');
      router.push('/funds');
    } finally { setFundLoading(false); }
  };

  const fetchDonations = async () => {
    if (!fundId) return;
    setListLoading(true);
    try {
      const { data } = await donationsApi.list(buildParams());
      if (Array.isArray(data)) {
        setDonations(data);
        setCount(data.length);
      } else {
        setDonations(data.results || []);
        setCount(data.count ?? (data.results || []).length);
      }
    } catch { toast.error('Could not load donations for this fund'); }
    finally { setListLoading(false); }
  };

  useEffect(() => { fetchFund(); }, [fundId]);
  useEffect(() => { fetchDonations(); }, [fundId, page, pageSize, search, method, dateFrom, dateTo]);
  useEffect(() => { setPage(1); }, [search, method, dateFrom, dateTo]);

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
        'Donor': d.member_name || 'Anonymous',
        'Amount (₹)': Number(d.amount),
        'Date': d.date,
        'Method': d.payment_method,
        'Transaction ID': d.transaction_id || '',
        'Has Receipt': d.receipt ? 'Yes' : 'No',
        'Notes': d.notes || '',
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [{ wch: 4 }, { wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 18 }, { wch: 10 }, { wch: 24 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Fund Donors');
      const filename = `${(fund?.name || 'fund').replace(/[^a-z0-9]+/gi, '_')}_donors_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success('Exported', `Saved as ${filename}`);
    }).catch(() => toast.error('Export failed', 'Could not generate the Excel file.'));
  };

  if (fundLoading) {
    return (
      <DashboardLayout title="Fund Details" subtitle="Loading...">
        <div className="flex items-center justify-center py-24 text-gray-400">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
            <span className="text-sm">Loading fund details...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!fund) return null;

  const FIcon = FUND_ICONS[fund.fund_type] || DollarSign;
  const pct = fund.target_amount > 0
    ? Math.min(100, Math.round((fund.current_amount / fund.target_amount) * 100))
    : null;

  return (
    <DashboardLayout title="Fund Details" subtitle={fund.name}>

      {/* Top bar */}
      <div className="flex justify-between items-start mb-6">
        <button onClick={() => router.push('/funds')}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft size={15} /> Back to Funds
        </button>
        <button onClick={() => router.push(`/funds/${fundId}/edit`)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors">
          <Edit2 size={14} /> Edit Fund
        </button>
      </div>

      {/* Fund hero card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="p-6 flex items-start gap-5">
          <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
            <FIcon size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-900">{fund.name}</h1>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                {fund.fund_type_name || fund.fund_type}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${fund.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {fund.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            {fund.description && <p className="text-sm text-gray-500 mt-2 max-w-2xl">{fund.description}</p>}
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-bold text-green-600">₹{Number(fund.current_amount || 0).toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-400">total collected</p>
          </div>
        </div>

        {fund.target_amount > 0 && (
          <div className="px-6 pb-6">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progress toward ₹{Number(fund.target_amount).toLocaleString('en-IN')} target</span>
              <span className="font-medium text-indigo-600">{pct}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${pct && pct >= 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 border-t border-gray-100 divide-x divide-gray-100">
          <div className="p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Total Donors</p>
            <div className="flex items-center gap-1.5">
              <User size={14} className="text-gray-400" />
              <span className="text-lg font-bold text-gray-800">{count}</span>
            </div>
          </div>
          <div className="p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Created</p>
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-gray-400" />
              <span className="text-sm text-gray-700">{new Date(fund.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Donors table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h3 className="font-bold text-gray-800">Who Paid This Fund</h3>
          <div className="flex items-center gap-2">
            <button onClick={fetchDonations}
              className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-50 transition-colors">
              <RefreshCw size={12} /> Refresh
            </button>
            <button onClick={handleExport} disabled={donations.length === 0}
              className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <Download size={12} /> Export Excel
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search donor, transaction ID..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
            />
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
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            title="From date"
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            title="To date"
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100" />
          {(search || method || dateFrom || dateTo) && (
            <button
              onClick={() => { setSearch(''); setMethod(''); setDateFrom(''); setDateTo(''); }}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Clear filters
            </button>
          )}
        </div>

        <table className="w-full">
          <thead style={{ background: '#fafbfc' }}>
            <tr>
              {['Donor', 'Amount', 'Date', 'Method', 'Transaction ID', 'Receipt'].map(h => (
                <th key={h} className="text-left px-5 py-2.5 text-xs font-bold uppercase tracking-wider" style={{ color: '#94a3b8' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {listLoading ? (
              <tr><td colSpan={6} className="text-center py-16">
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                  <span className="text-sm">Loading donors...</span>
                </div>
              </td></tr>
            ) : donations.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-16">
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <User size={28} className="text-gray-200" />
                  <p className="font-medium text-gray-500">
                    {search || method || dateFrom || dateTo ? 'No donations match your filters' : 'No one has donated to this fund yet'}
                  </p>
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
                <td className="px-5 py-3 text-sm text-gray-500">{d.transaction_id || '—'}</td>
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
              </tr>
            ))}
          </tbody>
        </table>

        {!listLoading && donations.length > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            count={count}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

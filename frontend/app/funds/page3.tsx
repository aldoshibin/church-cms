'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { fundsApi, fundTypesApi } from '@/lib/api';
import {
  Plus, Edit2, Trash2, Target, TrendingUp, DollarSign, Archive,
  Download, Tag, RefreshCw, Search
} from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Pagination from '@/components/ui/Pagination';

const FUND_ICONS: Record<string, any> = {
  general: DollarSign, building: Target, mission: TrendingUp,
  benevolence: DollarSign, youth: DollarSign, worship: DollarSign,
  education: DollarSign, emergency: Archive, other: DollarSign,
};

export default function FundsPage() {
  const router = useRouter();
  const [funds,      setFunds]      = useState<any[]>([]);
  const [fundTypes,  setFundTypes]  = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [deleteId,   setDeleteId]   = useState<number | null>(null);

  // Filters
  const [search,     setSearch]     = useState('');
  const [fundType,   setFundType]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination
  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [count,    setCount]    = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = { page, page_size: pageSize };
      if (search.trim()) params.search = search.trim();
      if (fundType) params.fund_type = fundType;
      if (statusFilter) params.is_active = statusFilter === 'active';

      const { data } = await fundsApi.list(params);
      if (Array.isArray(data)) {
        // Backend not paginated — fall back to showing everything on one page
        setFunds(data);
        setCount(data.length);
      } else {
        setFunds(data.results || []);
        setCount(data.count ?? (data.results || []).length);
      }
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [page, pageSize, search, fundType, statusFilter]);

  useEffect(() => {
    fundTypesApi.list().then(r => setFundTypes(r.data.results || r.data)).catch(() => {});
  }, []);

  // Reset to page 1 whenever a filter changes
  useEffect(() => { setPage(1); }, [search, fundType, statusFilter]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await fundsApi.delete(deleteId); toast.success('Fund deleted'); fetchData(); }
    catch { toast.error('Delete failed', 'Cannot delete a fund that has donations linked to it.'); }
    finally { setDeleteId(null); }
  };

  const handleExport = async () => {
    // Export respects current filters but ignores pagination — fetch ALL matching rows
    let exportRows = funds;
    try {
      const params: any = { page_size: 10000 };
      if (search.trim()) params.search = search.trim();
      if (fundType) params.fund_type = fundType;
      if (statusFilter) params.is_active = statusFilter === 'active';
      const { data } = await fundsApi.list(params);
      exportRows = Array.isArray(data) ? data : (data.results || []);
    } catch {
      toast.warning('Exporting current page only', 'Could not fetch the full filtered list.');
    }

    import('xlsx').then(XLSX => {
      const rows = exportRows.map((f: any, i: number) => ({
        '#': i + 1,
        'Fund Name': f.name,
        'Fund Type': f.fund_type_name || f.fund_type,
        'Description': f.description || '',
        'Collected (₹)': Number(f.current_amount || 0),
        'Target (₹)': f.target_amount != null ? Number(f.target_amount) : '',
        'Progress %': f.progress_percent ?? '',
        'Status': f.is_active ? 'Active' : 'Inactive',
        'Created': new Date(f.created_at).toLocaleDateString('en-IN'),
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [{ wch: 4 }, { wch: 24 }, { wch: 16 }, { wch: 30 }, { wch: 14 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 12 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Funds');
      const filename = `funds_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success('Exported', `Saved as ${filename}`);
    }).catch(() => toast.error('Export failed', 'Could not generate the Excel file.'));
  };

  // NOTE: these reflect only the CURRENT PAGE of results, not the
  // full filtered set, since the summary cards sum client-side data.
  // For a small/medium number of funds this is usually fine since
  // page_size defaults to 25 and most churches have well under that
  // many funds. If you need true global totals regardless of page,
  // add a dedicated /api/funds/summary/ endpoint (same pattern as
  // DonationViewSet.summary) and call it separately on mount.
  const totalCollected = funds.reduce((s, f) => s + Number(f.current_amount || 0), 0);
  const totalTarget = funds.filter(f => f.target_amount > 0).reduce((s, f) => s + Number(f.target_amount || 0), 0);
  const activeFunds = funds.filter(f => f.is_active).length;

  return (
    <DashboardLayout title="Funds Management" subtitle="Manage church giving funds">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Funds Management</h1>
          <p className="text-gray-500 text-sm mt-1">{count} fund{count !== 1 ? 's' : ''} total</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={handleExport}
            disabled={funds.length === 0}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={14} /> Export Excel
          </button>
          <button onClick={() => router.push('/funds/fund-types')}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            <Tag size={14} /> Fund Types
          </button>
          <button onClick={() => router.push('/funds/add')}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
            <Plus size={14} /> Create Fund
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Total Funds</p>
          <p className="text-3xl font-bold text-indigo-600">{funds.length}</p>
          <p className="text-xs text-gray-400 mt-1">{activeFunds} active</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Total Collected</p>
          <p className="text-3xl font-bold text-green-600">₹{totalCollected.toLocaleString('en-IN')}</p>
          <p className="text-xs text-gray-400 mt-1">across all funds</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Total Target</p>
          <p className="text-3xl font-bold text-amber-600">₹{totalTarget.toLocaleString('en-IN')}</p>
          <p className="text-xs text-gray-400 mt-1">for targeted funds</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or description..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
          />
        </div>
        <select value={fundType} onChange={e => setFundType(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100">
          <option value="">All Fund Types</option>
          {fundTypes.map((t: any) => <option key={t.key} value={t.key}>{t.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        {(search || fundType || statusFilter) && (
          <button
            onClick={() => { setSearch(''); setFundType(''); setStatusFilter(''); }}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Fund cards grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : funds.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <DollarSign size={28} className="text-gray-300" />
          </div>
          <p className="font-medium text-gray-500 text-lg">No funds yet</p>
          <p className="text-sm mt-1">Click "Create Fund" to add your first giving fund.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {funds.map(fund => {
            const FIcon = FUND_ICONS[fund.fund_type] || DollarSign;
            const pct = fund.target_amount > 0
              ? Math.min(100, Math.round((fund.current_amount / fund.target_amount) * 100))
              : null;

            return (
              <div key={fund.id}
                onClick={() => router.push(`/funds/${fund.id}`)}
                className={`bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer ${!fund.is_active ? 'opacity-60' : ''}`}>

                {/* Card header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                      <FIcon size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{fund.name}</h3>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                        {fund.fund_type_name || fund.fund_type}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${fund.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {fund.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Description */}
                {fund.description && (
                  <p className="text-xs text-gray-500 mb-4 line-clamp-2">{fund.description}</p>
                )}

                {/* Amounts */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Collected</span>
                    <span className="text-sm font-bold text-green-600">
                      ₹{Number(fund.current_amount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {fund.target_amount > 0 && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Target</span>
                        <span className="text-sm font-semibold text-gray-700">
                          ₹{Number(fund.target_amount).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>Progress</span>
                          <span className="font-medium text-indigo-600">{pct}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${pct && pct >= 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/funds/${fund.id}/edit`); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                    <Edit2 size={12} /> Edit
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteId(fund.id); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && funds.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 mt-4">
          <Pagination
            page={page}
            pageSize={pageSize}
            count={count}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          />
        </div>
      )}

      {deleteId && (
        <ConfirmDialog
          title="Delete Fund"
          message="Are you sure you want to delete this fund? This cannot be undone. Donations linked to this fund will be unlinked."
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </DashboardLayout>
  );
}

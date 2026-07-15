'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { familiesApi } from '@/lib/api';
import {
  Plus, Edit2, Trash2, Home, Search, Users, Eye, RefreshCw
} from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Pagination from '@/components/ui/Pagination';

export default function FamiliesPage() {
  const router = useRouter();
  const [families,   setFamilies]   = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [deleteId,   setDeleteId]   = useState<number | null>(null);

  // Filters
  const [search,        setSearch]        = useState('');
  const [stateFilter,   setStateFilter]   = useState('');
  const [cityFilter,    setCityFilter]    = useState('');
  const [hasMembers,    setHasMembers]    = useState('');

  // Area filter options — populated from actual data
  const [cities, setCities] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);

  // Pagination
  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [count,    setCount]    = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = { page, page_size: pageSize };
      if (search.trim()) params.search = search.trim();
      if (stateFilter) params.state = stateFilter;
      if (cityFilter) params.city = cityFilter;
      if (hasMembers) params.has_members = hasMembers;

      const { data } = await familiesApi.list(params);
      if (Array.isArray(data)) {
        setFamilies(data);
        setCount(data.length);
      } else {
        setFamilies(data.results || []);
        setCount(data.count ?? (data.results || []).length);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [page, pageSize, search, stateFilter, cityFilter, hasMembers]);
  useEffect(() => { setPage(1); }, [search, stateFilter, cityFilter, hasMembers]);

  useEffect(() => {
    familiesApi.locations()
      .then((r: any) => { setCities(r.data.cities || []); setStates(r.data.states || []); })
      .catch(() => {});
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await familiesApi.delete(deleteId); toast.success('Family deleted'); fetchData(); }
    catch { toast.error('Delete failed'); }
    finally { setDeleteId(null); }
  };

  const hasActiveFilters = search || stateFilter || cityFilter || hasMembers;

  return (
    <DashboardLayout title="Families" subtitle="Manage church families">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Families</h1>
          <p className="text-gray-500 text-sm mt-1">{count} famil{count !== 1 ? 'ies' : 'y'} registered</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => router.push('/families/add')}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
            <Plus size={16} /> Add Family
          </button>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
        {/* Legend */}
        <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-5 text-xs text-gray-400">
          <span className="font-medium text-gray-500">Actions:</span>
          <span className="flex items-center gap-1"><Eye size={11} className="text-gray-400" /> View Details</span>
          <span className="flex items-center gap-1"><Edit2 size={11} className="text-indigo-500" /> Edit</span>
          <span className="flex items-center gap-1"><Trash2 size={11} className="text-red-400" /> Delete</span>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, Family ID, phone..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900" />
          </div>
          <select value={stateFilter} onChange={e => setStateFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100">
            <option value="">All States</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={cityFilter} onChange={e => setCityFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100">
            <option value="">All Cities</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={hasMembers} onChange={e => setHasMembers(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100">
            <option value="">All Families</option>
            <option value="true">Has Members</option>
            <option value="false">No Members Assigned</option>
          </select>
          {hasActiveFilters && (
            <button
              onClick={() => { setSearch(''); setStateFilter(''); setCityFilter(''); setHasMembers(''); }}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                {['Family ID', 'Family Name', 'Phone', 'City / State', 'Members', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: '#64748b' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                    <span className="text-sm">Loading families...</span>
                  </div>
                </td></tr>
              ) : families.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Home size={32} className="text-gray-200" />
                    <p className="font-medium text-gray-500">{hasActiveFilters ? 'No families match your filters' : 'No families yet'}</p>
                    <p className="text-xs">{hasActiveFilters ? 'Try adjusting filters.' : 'Click "Add Family" to get started.'}</p>
                  </div>
                </td></tr>
              ) : families.map(fam => (
                <tr key={fam.id} className="hover:bg-gray-50 transition-colors">
                  {/* Family ID */}
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold tracking-widest font-mono">
                      {fam.family_id || '—'}
                    </span>
                  </td>
                  {/* Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                        <Home size={13} />
                      </div>
                      <p className="text-sm font-semibold text-gray-800 whitespace-nowrap">{fam.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{fam.phone || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {fam.city || fam.state ? `${fam.city || ''}${fam.city && fam.state ? ', ' : ''}${fam.state || ''}` : '—'}
                  </td>
                  {/* Member count — plain badge */}
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                      <Users size={11} />
                      {fam.member_count ?? 0} member{(fam.member_count ?? 0) !== 1 ? 's' : ''}
                    </span>
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => router.push(`/families/${fam.id}`)} title="View Details"
                        className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                        <Eye size={13} />
                      </button>
                      <button onClick={() => router.push(`/families/${fam.id}/edit`)} title="Edit"
                        className="w-7 h-7 flex items-center justify-center text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => setDeleteId(fam.id)} title="Delete"
                        className="w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && families.length > 0 && (
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
        <ConfirmDialog title="Delete Family" message="Are you sure? This cannot be undone."
          confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
      )}
    </DashboardLayout>
  );
}

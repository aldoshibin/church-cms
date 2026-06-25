'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { membersApi } from '@/lib/api';
import { Plus, Edit2, Trash2, Search, Eye, Mail } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Pagination from '@/components/ui/Pagination';

export default function MembersPage() {
  const router = useRouter();
  const [members,      setMembers]      = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [deleteId,     setDeleteId]     = useState<number | null>(null);
  const [sendingCredId, setSendingCredId] = useState<number | null>(null);

  // Filters
  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState('');
  const [genderFilter,  setGenderFilter]  = useState('');
  const [cityFilter,    setCityFilter]    = useState('');
  const [stateFilter,   setStateFilter]   = useState('');

  // Area filter options — populated from actual data
  const [cities, setCities] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);

  // Pagination
  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [count,    setCount]    = useState(0);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const params: any = { page, page_size: pageSize };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (genderFilter) params.gender = genderFilter;
      if (cityFilter) params.city = cityFilter;
      if (stateFilter) params.state = stateFilter;

      const { data } = await membersApi.list(params);
      if (Array.isArray(data)) {
        setMembers(data);
        setCount(data.length);
      } else {
        setMembers(data.results || []);
        setCount(data.count ?? (data.results || []).length);
      }
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMembers(); }, [page, pageSize, search, statusFilter, genderFilter, cityFilter, stateFilter]);
  useEffect(() => { setPage(1); }, [search, statusFilter, genderFilter, cityFilter, stateFilter]);

  useEffect(() => {
    membersApi.locations()
      .then((r: any) => { setCities(r.data.cities || []); setStates(r.data.states || []); })
      .catch(() => {});
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await membersApi.delete(deleteId);
      toast.success('Member deleted');
      fetchMembers();
    } catch { toast.error('Delete failed'); }
    finally { setDeleteId(null); }
  };

  const handleResendCredentials = async (m: any) => {
    if (!m.email) {
      toast.warning('No email address', 'Add an email address to this member first.');
      return;
    }
    setSendingCredId(m.id);
    try {
      await membersApi.resendCredentials(m.id);
      toast.success('Credentials sent!', `Login details sent to ${m.email}`);
    } catch (err: any) {
      toast.error('Send failed', err.response?.data?.error || 'Could not send credentials.');
    } finally { setSendingCredId(null); }
  };

  const hasActiveFilters = search || statusFilter || genderFilter || cityFilter || stateFilter;

  return (
    <DashboardLayout title="Members" subtitle="Manage church member records">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="text-gray-500 text-sm mt-1">{count} total member{count !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => router.push('/members/add')}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} /> Add Member
        </button>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Legend */}
        <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-5 text-xs text-gray-400">
          <span className="font-medium text-gray-500">Actions:</span>
          <span className="flex items-center gap-1"><Eye size={11} className="text-gray-400" /> View</span>
          <span className="flex items-center gap-1"><Edit2 size={11} className="text-indigo-500" /> Edit</span>
          <span className="flex items-center gap-1"><Mail size={11} className="text-green-500" /> Resend login credentials</span>
          <span className="flex items-center gap-1"><Trash2 size={11} className="text-red-400" /> Delete</span>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, phone..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="visitor">Visitor</option>
            <option value="transferred">Transferred</option>
            <option value="deceased">Deceased</option>
          </select>
          <select
            value={genderFilter}
            onChange={e => setGenderFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">All Genders</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="O">Other</option>
          </select>
          <select
            value={stateFilter}
            onChange={e => setStateFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">All States</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={cityFilter}
            onChange={e => setCityFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">All Cities</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {hasActiveFilters && (
            <button
              onClick={() => { setSearch(''); setStatusFilter(''); setGenderFilter(''); setCityFilter(''); setStateFilter(''); }}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Table */}
        <table className="w-full">
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              {['Name', 'Email', 'Phone', 'Family', 'City', 'Membership Date', 'Status', 'Actions'].map(h => (
                <th
                  key={h}
                  className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                  style={{ color: '#64748b' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                    <span className="text-sm">Loading members...</span>
                  </div>
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Search size={28} className="text-gray-200" />
                    <p className="font-medium text-gray-500">{hasActiveFilters ? 'No members match your filters' : 'No members found'}</p>
                    <p className="text-xs">
                      {hasActiveFilters ? 'Try adjusting filters.' : 'Click "Add Member" to add your first member.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : members.map(m => (
              <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: '#4f46e5' }}
                    >
                      {m.first_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <span className="text-sm font-semibold text-gray-800">
                      {m.full_name || `${m.first_name} ${m.last_name}`}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-gray-600">{m.email || '—'}</td>
                <td className="px-5 py-3 text-sm text-gray-600">{m.phone || '—'}</td>
                <td className="px-5 py-3 text-sm text-gray-600">{m.family_name || '—'}</td>
                <td className="px-5 py-3 text-sm text-gray-600">{m.city || '—'}</td>
                <td className="px-5 py-3 text-sm text-gray-600">{m.membership_date || '—'}</td>
                <td className="px-5 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                    m.status === 'active'      ? 'bg-green-100 text-green-700' :
                    m.status === 'inactive'    ? 'bg-gray-100 text-gray-500'  :
                    m.status === 'visitor'     ? 'bg-amber-100 text-amber-700' :
                    m.status === 'transferred' ? 'bg-blue-100 text-blue-600'   :
                    'bg-red-100 text-red-600'
                  }`}>
                    {m.status}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => router.push(`/members/${m.id}`)}
                      title="View Details"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => router.push(`/members/${m.id}/edit`)}
                      title="Edit"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleResendCredentials(m)}
                      title={m.email ? `Resend login credentials to ${m.email}` : 'Add email to enable resend'}
                      disabled={!m.email || sendingCredId === m.id}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                        m.email ? 'text-green-500 hover:bg-green-50 hover:text-green-700' : 'text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      {sendingCredId === m.id
                        ? <div className="w-3.5 h-3.5 border-2 border-green-300 border-t-green-600 rounded-full animate-spin" />
                        : <Mail size={14} />}
                    </button>
                    <button
                      onClick={() => setDeleteId(m.id)}
                      title="Delete"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && members.length > 0 && (
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
          title="Delete Member"
          message="Are you sure you want to delete this member? This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </DashboardLayout>
  );
}

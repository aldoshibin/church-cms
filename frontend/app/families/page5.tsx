'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { familiesApi, membersApi } from '@/lib/api';
import {
  Plus, Edit2, Trash2, Home, Search,
  ChevronDown, ChevronRight, Users, Eye, RefreshCw
} from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function FamiliesPage() {
  const router = useRouter();
  const [families,         setFamilies]         = useState<any[]>([]);
  const [filtered,         setFiltered]         = useState<any[]>([]);
  const [allMembers,       setAllMembers]        = useState<any[]>([]);
  const [familyMembersMap, setFamilyMembersMap] = useState<Record<number, any[]>>({});
  const [loading,          setLoading]          = useState(true);
  const [search,           setSearch]           = useState('');
  const [expandedId,       setExpandedId]       = useState<number | null>(null);
  const [loadingMembersId, setLoadingMembersId] = useState<number | null>(null);
  const [deleteId,         setDeleteId]         = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fRes, mRes] = await Promise.all([
        familiesApi.list(),
        membersApi.list({ page_size: 1000 }),
      ]);
      const fams = fRes.data.results || fRes.data;
      const mems = mRes.data.results || mRes.data;
      setFamilies(fams);
      setFiltered(fams);
      setAllMembers(mems);
      const map: Record<number, any[]> = {};
      fams.forEach((f: any) => {
        map[f.id] = mems.filter((m: any) => Number(m.family) === Number(f.id));
      });
      setFamilyMembersMap(map);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(families); return; }
    const q = search.toLowerCase();
    setFiltered(families.filter(f =>
      f.name?.toLowerCase().includes(q) ||
      f.phone?.includes(q) ||
      f.city?.toLowerCase().includes(q) ||
      f.family_id?.toLowerCase().includes(q)
    ));
  }, [search, families]);

  const handleExpand = async (famId: number) => {
    if (expandedId === famId) { setExpandedId(null); return; }
    setExpandedId(famId);
    setLoadingMembersId(famId);
    try {
      const { data } = await familiesApi.members(famId);
      setFamilyMembersMap(prev => ({ ...prev, [famId]: data }));
    } catch (e) { console.error(e); }
    finally { setLoadingMembersId(null); }
  };

  const getMembersForFamily = (id: number) => familyMembersMap[id] || [];

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await familiesApi.delete(deleteId); toast.success('Family deleted'); fetchData(); }
    catch { toast.error('Delete failed'); }
    finally { setDeleteId(null); }
  };

  return (
    <DashboardLayout title="Families" subtitle="Manage church families">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Families</h1>
          <p className="text-gray-500 text-sm mt-1">{families.length} families registered</p>
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
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Legend */}
        <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-5 text-xs text-gray-400">
          <span className="font-medium text-gray-500">Actions:</span>
          <span className="flex items-center gap-1"><Eye size={11} className="text-gray-400" /> View Details</span>
          <span className="flex items-center gap-1"><Edit2 size={11} className="text-indigo-500" /> Edit</span>
          <span className="flex items-center gap-1"><Trash2 size={11} className="text-red-400" /> Delete</span>
          <span className="flex items-center gap-1 ml-4"><ChevronRight size={11} className="text-indigo-400" /> Expand members</span>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, Family ID, phone, city..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th className="w-10 px-3 py-3" />
                {['Family ID', 'Family Name', 'Phone', 'City / State', 'Members', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: '#64748b' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                    <span className="text-sm">Loading families...</span>
                  </div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Home size={32} className="text-gray-200" />
                    <p className="font-medium text-gray-500">{search ? 'No families match' : 'No families yet'}</p>
                    <p className="text-xs">{search ? 'Try a different search.' : 'Click "Add Family" to get started.'}</p>
                  </div>
                </td></tr>
              ) : filtered.map(fam => {
                const famMembers  = getMembersForFamily(fam.id);
                const memberCount = famMembers.length > 0 ? famMembers.length : (fam.member_count ?? 0);
                const isExpanded  = expandedId === fam.id;
                const isLoadingM  = loadingMembersId === fam.id;
                return (
                  <React.Fragment key={fam.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      {/* Expand arrow */}
                      <td className="px-3 py-3">
                        <button onClick={() => handleExpand(fam.id)}
                          className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors">
                          {isLoadingM
                            ? <div className="w-3.5 h-3.5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                            : isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                        </button>
                      </td>
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
                      {/* Member count */}
                      <td className="px-4 py-3">
                        <button onClick={() => handleExpand(fam.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                            memberCount > 0 ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}>
                          <Users size={11} />
                          {memberCount} member{memberCount !== 1 ? 's' : ''}
                          {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                        </button>
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

                    {/* Expanded members row */}
                    {isExpanded && (
                      <tr key={`${fam.id}-exp`}>
                        <td colSpan={7} className="p-0">
                          <div className="bg-indigo-50/50 border-y border-indigo-100 px-8 py-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Users size={14} className="text-indigo-600" />
                                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                                  {famMembers.length} Member{famMembers.length !== 1 ? 's' : ''} — {fam.name}
                                </span>
                              </div>
                              <button onClick={() => router.push(`/families/${fam.id}`)}
                                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-indigo-100 transition-colors">
                                <Eye size={11} /> View Full Details
                              </button>
                            </div>
                            {isLoadingM ? (
                              <div className="flex items-center gap-2 text-gray-400 py-2">
                                <div className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                                <span className="text-sm">Loading...</span>
                              </div>
                            ) : famMembers.length === 0 ? (
                              <div className="bg-white rounded-xl border border-indigo-100 px-4 py-3">
                                <p className="text-sm font-medium text-gray-600 mb-1">No members assigned yet.</p>
                                <p className="text-xs text-gray-400">Click <strong>Edit</strong> on this family to assign members.</p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
                                {famMembers.map((m: any) => {
                                  const name = m.full_name || `${m.first_name} ${m.last_name}`;
                                  return (
                                    <div key={m.id} className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-2.5 border border-indigo-100 shadow-sm">
                                      <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                                        {name[0]?.toUpperCase()}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-xs font-semibold text-gray-800 truncate">{name}</p>
                                        <span className={`inline-block px-1.5 py-0.5 rounded-full text-xs font-medium capitalize mt-0.5 ${
                                          m.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                        }`}>{m.status}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {deleteId && (
        <ConfirmDialog title="Delete Family" message="Are you sure? This cannot be undone."
          confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
      )}
    </DashboardLayout>
  );
}

'use client';
import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { familiesApi, membersApi } from '@/lib/api';
import {
  Plus, Edit2, Trash2, Home, Search,
  ChevronDown, ChevronRight, Users, Mail, RefreshCw, X, Check
} from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

/* ─── tiny shared input style ─────────────────────────────────── */
const inp = 'w-full bg-white text-gray-900 text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder-gray-400';

function FLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
      {children}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

/* ─── Multi-select members picker ─────────────────────────────── */
function MemberPicker({
  allMembers, selected, onChange
}: {
  allMembers: any[];
  selected: number[];
  onChange: (ids: number[]) => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = allMembers.filter(m => {
    const name = (m.full_name || `${m.first_name} ${m.last_name}`).toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const toggle = (id: number) => {
    onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  };

  const selectAll = () => onChange(filtered.map(m => m.id));
  const clearAll = () => onChange([]);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Search + controls */}
      <div className="p-2 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search members..."
            className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <button type="button" onClick={selectAll}
          className="text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-50 whitespace-nowrap">
          All
        </button>
        <button type="button" onClick={clearAll}
          className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 whitespace-nowrap">
          Clear
        </button>
      </div>

      {/* Member list */}
      <div className="max-h-48 overflow-y-auto divide-y divide-gray-50">
        {filtered.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No members found</p>
        ) : filtered.map(m => {
          const isSelected = selected.includes(m.id);
          const name = m.full_name || `${m.first_name} ${m.last_name}`;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => toggle(m.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-gray-50 ${isSelected ? 'bg-indigo-50' : ''}`}
            >
              {/* Checkbox */}
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
              }`}>
                {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
              </div>
              {/* Avatar */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                {name[0].toUpperCase()}
              </div>
              {/* Name + status */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
                <p className="text-xs text-gray-400 capitalize">{m.status}</p>
              </div>
              {/* Currently in another family warning */}
              {m.family && !selected.includes(m.id) && (
                <span className="text-xs text-amber-500 shrink-0">In family</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected count */}
      <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {selected.length} member{selected.length !== 1 ? 's' : ''} selected
        </span>
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {selected.slice(0, 3).map(id => {
              const m = allMembers.find(x => x.id === id);
              if (!m) return null;
              const name = m.full_name || `${m.first_name} ${m.last_name}`;
              return (
                <span key={id} className="flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs">
                  {name.split(' ')[0]}
                  <button type="button" onClick={() => toggle(id)}><X size={9} /></button>
                </span>
              );
            })}
            {selected.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">+{selected.length - 3} more</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────────── */
export default function FamiliesPage() {
  const [families, setFamilies] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [familyMembersMap, setFamilyMembersMap] = useState<Record<number, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loadingMembersId, setLoadingMembersId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [sendingCredId, setSendingCredId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '',
    city: '', state: '', zip_code: '', head_of_family: ''
  });
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);

  /* ── fetch ── */
  const fetchData = async () => {
    setLoading(true);
    try {
      const [fRes, mRes] = await Promise.all([
        familiesApi.list(),
        membersApi.list({ page_size: 1000 })
      ]);
      const fams = fRes.data.results || fRes.data;
      const mems = mRes.data.results || mRes.data;
      setFamilies(fams);
      setFiltered(fams);
      setAllMembers(mems);

      // Pre-build member map from list
      const map: Record<number, any[]> = {};
      fams.forEach((fam: any) => {
        map[fam.id] = mems.filter((m: any) => Number(m.family) === Number(fam.id));
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
      f.email?.toLowerCase().includes(q) ||
      f.phone?.includes(q) ||
      f.city?.toLowerCase().includes(q) ||
      f.family_id?.toLowerCase().includes(q)
    ));
  }, [search, families]);

  /* ── expand row → fetch fresh members from API ── */
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

  const getMembersForFamily = (famId: number) => familyMembersMap[famId] || [];

  /* ── form helpers ── */
  const setField = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setErrors(fe => { const n = { ...fe }; delete n[k]; return n; });
  };

  const openAdd = () => {
    setEditItem(null);
    setForm({ name: '', email: '', phone: '', address: '', city: '', state: '', zip_code: '', head_of_family: '' });
    setSelectedMemberIds([]);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (fam: any) => {
    setEditItem(fam);
    setForm({
      name: fam.name || '', email: fam.email || '', phone: fam.phone || '',
      address: fam.address || '', city: fam.city || '', state: fam.state || '',
      zip_code: fam.zip_code || '', head_of_family: fam.head_of_family || ''
    });
    // Pre-select members already in this family
    const currentMembers = allMembers
      .filter((m: any) => Number(m.family) === Number(fam.id))
      .map((m: any) => m.id);
    setSelectedMemberIds(currentMembers);
    setErrors({});
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const payload = {
        ...form,
        head_of_family: form.head_of_family ? parseInt(form.head_of_family) : null,
        member_ids: selectedMemberIds,
      };
      if (editItem) await familiesApi.update(editItem.id, payload);
      else await familiesApi.create(payload);
      setShowModal(false);
      toast.success(
        editItem ? 'Family updated' : 'Family created',
        `${selectedMemberIds.length} member${selectedMemberIds.length !== 1 ? 's' : ''} assigned.`
      );
      fetchData();
    } catch (err: any) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const fe: Record<string, string> = {};
        Object.entries(data).forEach(([k, v]) => {
          fe[k] = Array.isArray(v) ? (v as string[]).join(' ') : String(v);
        });
        setErrors(fe);
        toast.error('Validation error', 'Please fix the highlighted fields.');
      } else {
        toast.error('Save failed', 'An unexpected error occurred.');
      }
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await familiesApi.delete(deleteId); toast.success('Family deleted'); fetchData(); }
    catch { toast.error('Delete failed'); }
    finally { setDeleteId(null); }
  };

  const handleResendCredentials = async (fam: any) => {
    if (!fam.email) { toast.warning('No email', 'Add an email address first.'); return; }
    setSendingCredId(fam.id);
    try {
      await familiesApi.resendCredentials(fam.id);
      toast.success('Credentials sent!', `Family ID ${fam.family_id} sent to ${fam.email}`);
    } catch { toast.error('Send failed'); }
    finally { setSendingCredId(null); }
  };

  /* ─── render ─────────────────────────────────────────────────── */
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
          <button onClick={openAdd}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition-colors">
            <Plus size={14} /> Add Family
          </button>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Legend */}
        <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-5 text-xs text-gray-400">
          <span className="font-medium text-gray-500">Actions:</span>
          <span className="flex items-center gap-1"><Edit2 size={11} className="text-indigo-500" /> Edit</span>
          <span className="flex items-center gap-1"><Mail size={11} className="text-green-500" /> Resend credentials</span>
          <span className="flex items-center gap-1"><Trash2 size={11} className="text-red-400" /> Delete</span>
          <span className="flex items-center gap-1 ml-4"><ChevronRight size={11} className="text-indigo-400" /> Expand to see members</span>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, Family ID, email, city..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-10 px-3 py-3" />
                {['Family ID', 'Family Name', 'Email', 'Phone', 'City / State', 'Members', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                    <span className="text-sm">Loading families...</span>
                  </div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Home size={32} className="text-gray-200" />
                    <p className="font-medium text-gray-500">{search ? 'No families match' : 'No families yet'}</p>
                    <p className="text-xs">{search ? 'Try a different search.' : 'Click "Add Family" to get started.'}</p>
                  </div>
                </td></tr>
              ) : filtered.map(fam => {
                const famMembers = getMembersForFamily(fam.id);
                const memberCount = famMembers.length > 0 ? famMembers.length : (fam.member_count ?? 0);
                const isExpanded = expandedId === fam.id;
                const isLoadingMembers = loadingMembersId === fam.id;

                return (
                  <React.Fragment key={fam.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-3">
                        <button onClick={() => handleExpand(fam.id)}
                          className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors">
                          {isLoadingMembers
                            ? <div className="w-3.5 h-3.5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                            : isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold tracking-widest font-mono">
                          {fam.family_id || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                            <Home size={13} />
                          </div>
                          <p className="text-sm font-semibold text-gray-800 whitespace-nowrap">{fam.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{fam.email || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{fam.phone || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {fam.city || fam.state ? `${fam.city || ''}${fam.city && fam.state ? ', ' : ''}${fam.state || ''}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleExpand(fam.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                            memberCount > 0
                              ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}>
                          <Users size={11} />
                          {memberCount} member{memberCount !== 1 ? 's' : ''}
                          {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(fam)} title="Edit"
                            className="w-7 h-7 flex items-center justify-center text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => handleResendCredentials(fam)}
                            title={fam.email ? `Resend credentials to ${fam.email}` : 'Add email first'}
                            disabled={sendingCredId === fam.id}
                            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                              fam.email ? 'text-green-500 hover:text-green-700 hover:bg-green-50' : 'text-gray-300 cursor-not-allowed'
                            }`}>
                            {sendingCredId === fam.id
                              ? <div className="w-3.5 h-3.5 border-2 border-green-300 border-t-green-600 rounded-full animate-spin" />
                              : <Mail size={13} />}
                          </button>
                          <button onClick={() => setDeleteId(fam.id)} title="Delete"
                            className="w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded members */}
                    {isExpanded && (
                      <tr key={`${fam.id}-exp`}>
                        <td colSpan={8} className="p-0">
                          <div className="bg-indigo-50/50 border-y border-indigo-100 px-8 py-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Users size={14} className="text-indigo-600" />
                                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                                  {famMembers.length} Member{famMembers.length !== 1 ? 's' : ''} — {fam.name}
                                </span>
                              </div>
                              <button onClick={() => openEdit(fam)}
                                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-indigo-100 transition-colors">
                                <Plus size={11} /> Add/Edit Members
                              </button>
                            </div>
                            {isLoadingMembers ? (
                              <div className="flex items-center gap-2 text-gray-400 py-2">
                                <div className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                                <span className="text-sm">Loading...</span>
                              </div>
                            ) : famMembers.length === 0 ? (
                              <div className="bg-white rounded-xl border border-indigo-100 px-4 py-3">
                                <p className="text-sm font-medium text-gray-600 mb-1">No members assigned yet.</p>
                                <p className="text-xs text-gray-400">Click <strong>Edit</strong> on this family to assign members using the multi-select picker.</p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
                                {famMembers.map((m: any) => {
                                  const name = m.full_name || `${m.first_name} ${m.last_name}`;
                                  return (
                                    <div key={m.id} className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-2.5 border border-indigo-100 shadow-sm">
                                      <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                                        {name[0].toUpperCase()}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-xs font-semibold text-gray-800 truncate">{name}</p>
                                        <span className={`inline-block px-1.5 py-0.5 rounded-full text-xs font-medium capitalize mt-0.5 ${
                                          m.status === 'active' ? 'bg-green-100 text-green-700' :
                                          m.status === 'visitor' ? 'bg-amber-100 text-amber-700' :
                                          'bg-gray-100 text-gray-500'
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

      {/* ── Add / Edit Modal ──────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                  <Home size={16} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    {editItem ? 'Edit Family' : 'Add Family'}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {editItem ? `Editing ${editItem.name} · ${editItem.family_id}` : 'Create a new family'}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1">
              <form id="family-form" onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

                {/* Basic info */}
                <div>
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100 mb-4">
                    <Home size={14} className="text-indigo-600" />
                    <span className="text-sm font-semibold text-gray-700">Family Details</span>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <FLabel required>Family Name</FLabel>
                      <input required value={form.name} onChange={setField('name')}
                        placeholder="e.g. Johnson Family"
                        className={inp + (errors.name ? ' border-red-400 bg-red-50' : '')} />
                      {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <FLabel>Email</FLabel>
                        <input type="email" value={form.email} onChange={setField('email')}
                          placeholder="family@email.com"
                          className={inp + (errors.email ? ' border-red-400 bg-red-50' : '')} />
                        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                      </div>
                      <div>
                        <FLabel>Phone</FLabel>
                        <input value={form.phone} onChange={setField('phone')}
                          placeholder="+91 98765 43210" className={inp} />
                      </div>
                    </div>
                    <div>
                      <FLabel>Head of Family</FLabel>
                      <select value={form.head_of_family} onChange={setField('head_of_family')} className={inp}>
                        <option value="">Select member</option>
                        {allMembers.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.full_name || `${m.first_name} ${m.last_name}`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <FLabel>Address</FLabel>
                      <input value={form.address} onChange={setField('address')}
                        placeholder="Street address" className={inp} />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div><FLabel>City</FLabel><input value={form.city} onChange={setField('city')} placeholder="Chennai" className={inp} /></div>
                      <div><FLabel>State</FLabel><input value={form.state} onChange={setField('state')} placeholder="TN" className={inp} /></div>
                      <div><FLabel>ZIP</FLabel><input value={form.zip_code} onChange={setField('zip_code')} placeholder="600001" className={inp} /></div>
                    </div>
                  </div>
                </div>

                {/* Members multi-select */}
                <div>
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100 mb-4">
                    <Users size={14} className="text-indigo-600" />
                    <span className="text-sm font-semibold text-gray-700">Assign Members</span>
                    <span className="ml-auto px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                      {selectedMemberIds.length} selected
                    </span>
                  </div>
                  <MemberPicker
                    allMembers={allMembers}
                    selected={selectedMemberIds}
                    onChange={setSelectedMemberIds}
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Selected members will have their Family field updated automatically.
                  </p>
                </div>

              </form>
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 shrink-0">
              <button type="button" onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" form="family-form" disabled={saving}
                className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2">
                {saving
                  ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                  : editItem ? '✓ Update Family' : '✓ Create Family'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <ConfirmDialog title="Delete Family" message="Are you sure? This cannot be undone."
          confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
      )}
    </DashboardLayout>
  );
}
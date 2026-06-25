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

const inp = 'w-full bg-white text-gray-900 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder-gray-400';

function FL({ children, req }: { children: React.ReactNode; req?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
      {children}{req && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

/* ── Member multi-select picker ─────────────────────────── */
function MemberPicker({ allMembers, selected, onChange }: {
  allMembers: any[]; selected: number[]; onChange: (ids: number[]) => void;
}) {
  const [q, setQ] = useState('');
  const list = allMembers.filter(m =>
    (m.full_name || `${m.first_name} ${m.last_name}`).toLowerCase().includes(q.toLowerCase())
  );
  const toggle = (id: number) =>
    onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);

  return (
    <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden h-full">
      {/* Search + bulk */}
      <div className="flex items-center gap-2 p-2 bg-gray-50 border-b border-gray-200 shrink-0">
        <div className="relative flex-1">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search..."
            className="w-full pl-6 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-900 outline-none focus:ring-1 focus:ring-indigo-300" />
        </div>
        <button type="button" onClick={() => onChange(list.map(m => m.id))}
          className="text-xs text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded whitespace-nowrap">All</button>
        <button type="button" onClick={() => onChange([])}
          className="text-xs text-gray-500 hover:bg-gray-100 px-2 py-1 rounded">Clear</button>
      </div>

      {/* Selected count badge */}
      {selected.length > 0 && (
        <div className="px-3 py-1.5 bg-indigo-50 border-b border-indigo-100 shrink-0">
          <span className="text-xs text-indigo-700 font-semibold">
            {selected.length} member{selected.length !== 1 ? 's' : ''} selected
          </span>
        </div>
      )}

      {/* Scrollable list */}
      <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
        {list.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">No members found</p>
        ) : list.map(m => {
          const isOn = selected.includes(m.id);
          const name = m.full_name || `${m.first_name} ${m.last_name}`;
          return (
            <button key={m.id} type="button" onClick={() => toggle(m.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-gray-50 ${isOn ? 'bg-indigo-50/60' : ''}`}>
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isOn ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                {isOn && <Check size={9} className="text-white" strokeWidth={3} />}
              </div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isOn ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">{name}</p>
              </div>
              <span className={`text-xs px-1.5 py-0.5 rounded-full capitalize shrink-0 ${
                m.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
              }`}>{m.status}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Family Modal ────────────────────────────────────────── */
function FamilyModal({ editItem, allMembers, onClose, onSaved }: {
  editItem: any; allMembers: any[]; onClose: () => void; onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '',
    city: '', state: '', zip_code: '', head_of_family: ''
  });
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);

  useEffect(() => {
    if (editItem) {
      setForm({
        name: editItem.name || '', email: editItem.email || '',
        phone: editItem.phone || '', address: editItem.address || '',
        city: editItem.city || '', state: editItem.state || '',
        zip_code: editItem.zip_code || '', head_of_family: editItem.head_of_family || ''
      });
      const current = allMembers.filter((m: any) => Number(m.family) === Number(editItem.id)).map((m: any) => m.id);
      setSelectedMemberIds(current);
    }
  }, [editItem]);

  const sf = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setErrors(fe => { const n = { ...fe }; delete n[k]; return n; });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setErrors({});
    try {
      const payload = {
        ...form,
        head_of_family: form.head_of_family ? parseInt(form.head_of_family) : null,
        member_ids: selectedMemberIds,
      };
      if (editItem) await familiesApi.update(editItem.id, payload);
      else await familiesApi.create(payload);
      toast.success(editItem ? 'Family updated' : 'Family created',
        `${selectedMemberIds.length} member${selectedMemberIds.length !== 1 ? 's' : ''} assigned.`);
      onSaved(); onClose();
    } catch (err: any) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const fe: Record<string, string> = {};
        Object.entries(data).forEach(([k, v]) => { fe[k] = Array.isArray(v) ? (v as string[]).join(' ') : String(v); });
        setErrors(fe); toast.error('Validation error', 'Please fix the highlighted fields.');
      } else { toast.error('Save failed'); }
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col"
        style={{ width: '100%', maxWidth: 860, height: 'min(90vh, 620px)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Home size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">{editItem ? 'Edit Family' : 'Add Family'}</h2>
              <p className="text-xs text-gray-400">{editItem ? `${editItem.name} · ${editItem.family_id}` : 'Fill in details and assign members'}</p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Two-column body */}
        <form id="fam-form" onSubmit={handleSubmit} className="flex flex-1 min-h-0">

          {/* LEFT — family details */}
          <div className="flex flex-col w-96 shrink-0 border-r border-gray-100">
            <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-100 shrink-0">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Family Details</p>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
              <div>
                <FL req>Family Name</FL>
                <input required value={form.name} onChange={sf('name')} placeholder="e.g. Johnson Family"
                  className={inp + (errors.name ? ' border-red-400 bg-red-50' : '')} />
                {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>}
              </div>
              <div>
                <FL>Email</FL>
                <input type="email" value={form.email} onChange={sf('email')} placeholder="family@email.com"
                  className={inp + (errors.email ? ' border-red-400 bg-red-50' : '')} />
                {errors.email && <p className="text-xs text-red-500 mt-0.5">{errors.email}</p>}
              </div>
              <div>
                <FL>Phone</FL>
                <input value={form.phone} onChange={sf('phone')} placeholder="+91 98765 43210" className={inp} />
              </div>
              <div>
                <FL>Head of Family</FL>
                <select value={form.head_of_family} onChange={sf('head_of_family')} className={inp}>
                  <option value="">Select member</option>
                  {allMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.full_name || `${m.first_name} ${m.last_name}`}</option>
                  ))}
                </select>
              </div>
              <div>
                <FL>Address</FL>
                <input value={form.address} onChange={sf('address')} placeholder="Street address" className={inp} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><FL>City</FL><input value={form.city} onChange={sf('city')} placeholder="Chennai" className={inp} /></div>
                <div><FL>State</FL><input value={form.state} onChange={sf('state')} placeholder="TN" className={inp} /></div>
                <div><FL>ZIP</FL><input value={form.zip_code} onChange={sf('zip_code')} placeholder="600001" className={inp} /></div>
              </div>
              {editItem?.family_id && (
                <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                  <span className="text-xs text-indigo-500 font-medium">Family ID:</span>
                  <span className="font-mono font-bold text-indigo-700 text-sm tracking-widest">{editItem.family_id}</span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — member picker */}
          <div className="flex flex-col flex-1 min-w-0 min-h-0">
            <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-100 shrink-0 flex items-center justify-between">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Assign Members</p>
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
                {selectedMemberIds.length} selected
              </span>
            </div>
            <div className="flex-1 min-h-0 p-4">
              <MemberPicker
                allMembers={allMembers}
                selected={selectedMemberIds}
                onChange={setSelectedMemberIds}
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50/60 shrink-0">
          <p className="text-xs text-gray-400">
            {selectedMemberIds.length > 0
              ? `${selectedMemberIds.length} member${selectedMemberIds.length !== 1 ? 's' : ''} will be assigned to this family`
              : 'Select members on the right to assign them'}
          </p>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" form="fam-form" disabled={saving}
              className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2">
              {saving
                ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
                : editItem ? '✓ Update Family' : '✓ Create Family'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────── */
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
  const [sendingCredId, setSendingCredId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fRes, mRes] = await Promise.all([
        familiesApi.list(),
        membersApi.list({ page_size: 1000 })
      ]);
      const fams = fRes.data.results || fRes.data;
      const mems = mRes.data.results || mRes.data;
      setFamilies(fams); setFiltered(fams); setAllMembers(mems);
      const map: Record<number, any[]> = {};
      fams.forEach((f: any) => { map[f.id] = mems.filter((m: any) => Number(m.family) === Number(f.id)); });
      setFamilyMembersMap(map);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(families); return; }
    const q = search.toLowerCase();
    setFiltered(families.filter(f =>
      f.name?.toLowerCase().includes(q) || f.email?.toLowerCase().includes(q) ||
      f.phone?.includes(q) || f.city?.toLowerCase().includes(q) || f.family_id?.toLowerCase().includes(q)
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

  const handleResendCredentials = async (fam: any) => {
    if (!fam.email) { toast.warning('No email', 'Add an email address first.'); return; }
    setSendingCredId(fam.id);
    try {
      await familiesApi.resendCredentials(fam.id);
      toast.success('Credentials sent!', `Family ID ${fam.family_id} sent to ${fam.email}`);
    } catch { toast.error('Send failed'); }
    finally { setSendingCredId(null); }
  };

  return (
    <DashboardLayout title="Families" subtitle="Manage church families">
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
          <button onClick={() => { setEditItem(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition-colors">
            <Plus size={14} /> Add Family
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-5 text-xs text-gray-400">
          <span className="font-medium text-gray-500">Actions:</span>
          <span className="flex items-center gap-1"><Edit2 size={11} className="text-indigo-500" /> Edit</span>
          <span className="flex items-center gap-1"><Mail size={11} className="text-green-500" /> Resend credentials</span>
          <span className="flex items-center gap-1"><Trash2 size={11} className="text-red-400" /> Delete</span>
          <span className="flex items-center gap-1 ml-4"><ChevronRight size={11} className="text-indigo-400" /> Expand members</span>
        </div>
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, Family ID, email, city..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-10 px-3 py-3" />
                {['Family ID','Family Name','Email','Phone','City / State','Members','Actions'].map(h => (
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
                          <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shrink-0"><Home size={13} /></div>
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
                            memberCount > 0 ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}>
                          <Users size={11} />
                          {memberCount} member{memberCount !== 1 ? 's' : ''}
                          {isExpanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setEditItem(fam); setShowModal(true); }} title="Edit"
                            className="w-7 h-7 flex items-center justify-center text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => handleResendCredentials(fam)}
                            title={fam.email ? `Resend to ${fam.email}` : 'Add email first'}
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
                              <button onClick={() => { setEditItem(fam); setShowModal(true); }}
                                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-indigo-100 transition-colors">
                                <Plus size={11} /> Add / Edit Members
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
                                <p className="text-xs text-gray-400">Click <strong>Edit</strong> on this family to assign members.</p>
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

      {showModal && (
        <FamilyModal
          editItem={editItem}
          allMembers={allMembers}
          onClose={() => setShowModal(false)}
          onSaved={fetchData}
        />
      )}

      {deleteId && (
        <ConfirmDialog title="Delete Family" message="Are you sure? This cannot be undone."
          confirmLabel="Delete"
          onConfirm={async () => {
            try { await familiesApi.delete(deleteId); toast.success('Family deleted'); fetchData(); }
            catch { toast.error('Delete failed'); }
            finally { setDeleteId(null); }
          }}
          onCancel={() => setDeleteId(null)} />
      )}
    </DashboardLayout>
  );
}
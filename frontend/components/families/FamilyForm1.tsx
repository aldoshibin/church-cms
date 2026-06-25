'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { familiesApi, membersApi } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import { ArrowLeft, Save, Search, Check, Users, X } from 'lucide-react';

const inp = 'w-full bg-white text-gray-900 text-sm border border-gray-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-indigo-100 transition-all placeholder-gray-400';
const errInp = 'w-full bg-red-50 text-gray-900 text-sm border border-red-400 rounded-lg px-3 py-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder-red-300';

const EMPTY = {
  name: '', email: '', phone: '', address: '',
  city: '', state: '', zip_code: '', head_of_family: '',
};

/* ── Section header ─────────────────────────────────── */
function SectionHead({ title }: { title: string }) {
  return (
    <div className="px-6 py-3 border-t border-b border-gray-100 bg-gray-50">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</p>
    </div>
  );
}

/* ── Field label ────────────────────────────────────── */
function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

/* ── Member multi-select picker ─────────────────────── */
function MemberPicker({ allMembers, selected, onChange }: {
  allMembers: any[];
  selected: number[];
  onChange: (ids: number[]) => void;
}) {
  const [q, setQ] = useState('');
  const list = allMembers.filter(m =>
    (m.full_name || `${m.first_name} ${m.last_name}`).toLowerCase().includes(q.toLowerCase())
  );
  const toggle = (id: number) =>
    onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
      {/* Search + bulk */}
      <div className="flex items-center gap-2 p-2 border-b border-gray-100" style={{ background: '#f9fafb' }}>
        <div className="relative flex-1">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search members..."
            className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-900 outline-none focus:ring-1 focus:ring-indigo-300" />
        </div>
        <button type="button" onClick={() => onChange(list.map(m => m.id))}
          className="text-xs text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded whitespace-nowrap font-medium">All</button>
        <button type="button" onClick={() => onChange([])}
          className="text-xs text-gray-500 hover:bg-gray-100 px-2 py-1 rounded font-medium">Clear</button>
      </div>

      {/* Selected badge */}
      {selected.length > 0 && (
        <div className="px-3 py-1.5 border-b border-indigo-100" style={{ background: '#eef2ff' }}>
          <span className="text-xs text-indigo-700 font-semibold">
            {selected.length} member{selected.length !== 1 ? 's' : ''} selected
          </span>
        </div>
      )}

      {/* Member list */}
      <div style={{ maxHeight: 220, overflowY: 'auto' }} className="divide-y divide-gray-50">
        {list.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">No members found</p>
        ) : list.map((m: any) => {
          const isOn  = selected.includes(m.id);
          const name  = m.full_name || `${m.first_name} ${m.last_name}`;
          return (
            <button key={m.id} type="button" onClick={() => toggle(m.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-gray-50 ${isOn ? 'bg-indigo-50/60' : ''}`}>
              {/* Checkbox */}
              <div style={{
                width: 16, height: 16, borderRadius: 4, border: isOn ? 'none' : '2px solid #d1d5db',
                background: isOn ? '#4f46e5' : 'white', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {isOn && <Check size={10} color="white" strokeWidth={3} />}
              </div>
              {/* Avatar */}
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: isOn ? '#4f46e5' : '#f3f4f6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
                color: isOn ? 'white' : '#374151',
              }}>
                {name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">{name}</p>
                <p className="text-xs text-gray-400 capitalize">{m.status}</p>
              </div>
              {m.family && !isOn && (
                <span className="text-xs text-amber-500 shrink-0">In family</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main FamilyForm ────────────────────────────────── */
interface Props { familyId?: number; }

export default function FamilyForm({ familyId }: Props) {
  const router  = useRouter();
  const isEdit  = !!familyId;

  const [form,              setForm]              = useState({ ...EMPTY });
  const [allMembers,        setAllMembers]        = useState<any[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [saving,            setSaving]            = useState(false);
  const [loading,           setLoading]           = useState(isEdit);
  const [errors,            setErrors]            = useState<Record<string, string>>({});

  useEffect(() => {
    // Load all members for picker
    membersApi.list({ page_size: 1000 })
      .then(r => setAllMembers(r.data.results || r.data))
      .catch(() => {});

    if (familyId) {
      setLoading(true);
      familiesApi.list()
        .then(r => {
          const fams = r.data.results || r.data;
          const fam  = fams.find((f: any) => f.id === familyId);
          if (fam) {
            setForm({
              name:           fam.name           || '',
              email:          fam.email          || '',
              phone:          fam.phone          || '',
              address:        fam.address        || '',
              city:           fam.city           || '',
              state:          fam.state          || '',
              zip_code:       fam.zip_code       || '',
              head_of_family: fam.head_of_family != null ? String(fam.head_of_family) : '',
            });
          }
        })
        .catch(() => { toast.error('Load failed'); router.push('/families'); });

      // Load current members of this family
      familiesApi.members(familyId)
        .then(r => {
          const mems = Array.isArray(r.data) ? r.data : [];
          setSelectedMemberIds(mems.map((m: any) => m.id));
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [familyId]);

  const set = (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm(f => ({ ...f, [k]: e.target.value }));
      setErrors(fe => { const n = { ...fe }; delete n[k]; return n; });
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setErrors({});
    try {
      const payload = {
        ...form,
        head_of_family: form.head_of_family ? parseInt(form.head_of_family) : null,
        member_ids:     selectedMemberIds,
      };
      if (isEdit) await familiesApi.update(familyId!, payload);
      else        await familiesApi.create(payload);

      toast.success(
        isEdit ? 'Family updated' : 'Family created',
        `${selectedMemberIds.length} member${selectedMemberIds.length !== 1 ? 's' : ''} assigned.`
      );
      router.push('/families');
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

  const getInput = (k: string, extra?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input value={(form as any)[k]} onChange={set(k)}
      className={errors[k] ? errInp : inp} {...extra} />
  );

  const getError = (k: string) =>
    errors[k] ? <p className="text-xs text-red-500 mt-1">{errors[k]}</p> : null;

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-gray-400">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
        <span className="text-sm">Loading family data...</span>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

        {/* ── Family Details ── */}
        <SectionHead title="Family Details" />
        <div className="grid grid-cols-2 gap-4 p-4">
          <div className="">
            <FieldLabel label="Family Name" required />
            {getInput('name', { required: true, placeholder: 'e.g. Johnson Family' })}
            {getError('name')}
          </div>
          <div>
            <FieldLabel label="Email Address" />
            {getInput('email', { type: 'email', placeholder: 'family@email.com' })}
            {getError('email')}
          </div>
          <div>
            <FieldLabel label="Phone Number" />
            {getInput('phone', { placeholder: '+91 98765 43210' })}
          </div>
          <div>
            <FieldLabel label="Head of Family" />
            <select value={form.head_of_family} onChange={set('head_of_family')} className={inp}>
              <option value="">Select member</option>
              {allMembers.map(m => (
                <option key={m.id} value={m.id}>
                  {m.full_name || `${m.first_name} ${m.last_name}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            {/* spacer */}
          </div>
        </div>

        {/* ── Address ── */}
        <SectionHead title="Address" />
        <div className="grid grid-cols-3 gap-4 p-4">
          <div className="col-span-3">
            <FieldLabel label="Street Address" />
            <textarea value={form.address} onChange={set('address')}
              rows={2} placeholder="Street address..."
              className={inp + ' resize-none'} />
          </div>
          <div>
            <FieldLabel label="City" />
            {getInput('city', { placeholder: 'Chennai' })}
          </div>
          <div>
            <FieldLabel label="State" />
            {getInput('state', { placeholder: 'Tamil Nadu' })}
          </div>
          <div>
            <FieldLabel label="PIN Code" />
            {getInput('zip_code', { placeholder: '600001', maxLength: 10 })}
          </div>
        </div>

        {/* ── Assign Members ── */}
        <SectionHead title={`Assign Members (${selectedMemberIds.length} selected)`} />
        <div className="p-6">
          <MemberPicker
            allMembers={allMembers}
            selected={selectedMemberIds}
            onChange={setSelectedMemberIds}
          />
          <p className="text-xs text-gray-400 mt-2">
            Selected members will have their Family field updated automatically.
          </p>
        </div>

        {/* ── Family ID (edit only) ── */}
        {isEdit && (
          <>
            <SectionHead title="Family ID" />
            <div className="p-6">
              <div className="inline-flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
                <span className="text-xs text-indigo-500 font-medium">Auto-assigned ID:</span>
                <span className="font-mono font-bold text-indigo-700 text-base tracking-widest">
                  {/* shown from URL context */}
                  FAM-ID
                </span>
                <span className="text-xs text-indigo-400">Cannot be changed</span>
              </div>
            </div>
          </>
        )}

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <button type="button" onClick={() => router.push('/families')}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft size={15} /> Back to Families
          </button>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {saving
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
              : <><Save size={15} />{isEdit ? 'Update Family' : 'Save Family'}</>}
          </button>
        </div>

      </div>
    </form>
  );
}

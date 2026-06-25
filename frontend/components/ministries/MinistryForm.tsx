'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ministriesApi, membersApi } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import { ArrowLeft, Save, Search, Check, Users } from 'lucide-react';

const inp = 'w-full bg-white text-gray-900 text-sm border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder-gray-400';
const errInp = 'w-full bg-red-50 text-gray-900 text-sm border border-red-400 rounded-lg px-3 py-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder-red-300';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const EMPTY = {
  name: '', description: '', leader: '',
  meeting_day: '', meeting_time: '', is_active: true,
};

function SectionHead({ title, extra }: { title: string; extra?: React.ReactNode }) {
  return (
    <div className="px-6 py-3 border-t border-b border-gray-100 bg-gray-50 flex items-center justify-between">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</p>
      {extra}
    </div>
  );
}

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
      {/* Search + bulk actions */}
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
      <div style={{ maxHeight: 240, overflowY: 'auto' }} className="divide-y divide-gray-50">
        {list.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">No members found</p>
        ) : list.map((m: any) => {
          const isOn = selected.includes(m.id);
          const name = m.full_name || `${m.first_name} ${m.last_name}`;
          return (
            <button key={m.id} type="button" onClick={() => toggle(m.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-gray-50 ${isOn ? 'bg-indigo-50/60' : ''}`}>
              <div style={{
                width: 16, height: 16, borderRadius: 4, border: isOn ? 'none' : '2px solid #d1d5db',
                background: isOn ? '#4f46e5' : 'white', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {isOn && <Check size={10} color="white" strokeWidth={3} />}
              </div>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: isOn ? '#4f46e5' : '#f3f4f6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: isOn ? 'white' : '#374151',
              }}>
                {name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">{name}</p>
                <p className="text-xs text-gray-400 capitalize">{m.status}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface Props { ministryId?: number; }

export default function MinistryForm({ ministryId }: Props) {
  const router = useRouter();
  const isEdit = !!ministryId;

  const [form,              setForm]              = useState({ ...EMPTY });
  const [members,           setMembers]           = useState<any[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [saving,            setSaving]            = useState(false);
  const [loading,           setLoading]           = useState(isEdit);
  const [errors,            setErrors]            = useState<Record<string, string>>({});

  useEffect(() => {
    membersApi.list({ page_size: 1000, status: 'active' })
      .then(r => setMembers(r.data.results || r.data))
      .catch(() => {});

    if (ministryId) {
      setLoading(true);
      ministriesApi.get(ministryId)
        .then(({ data }) => {
          setForm({
            name:         data.name         || '',
            description:  data.description  || '',
            leader:       data.leader != null ? String(data.leader) : '',
            meeting_day:  data.meeting_day  || '',
            meeting_time: data.meeting_time || '',
            is_active:    data.is_active ?? true,
          });
          const currentIds = (data.members || []).map((m: any) => m.id);
          setSelectedMemberIds(currentIds);
        })
        .catch(() => {
          toast.error('Load failed', 'Could not load ministry.');
          router.push('/ministries');
        })
        .finally(() => setLoading(false));
    }
  }, [ministryId]);

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
        leader:       form.leader       ? parseInt(form.leader) : null,
        meeting_time: form.meeting_time || null,
        member_ids:   selectedMemberIds,
      };
      if (isEdit) await ministriesApi.update(ministryId!, payload);
      else        await ministriesApi.create(payload);
      toast.success(
        isEdit ? 'Ministry updated' : 'Ministry created successfully',
        `${selectedMemberIds.length} member${selectedMemberIds.length !== 1 ? 's' : ''} assigned.`
      );
      router.push('/ministries');
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
        <span className="text-sm">Loading ministry data...</span>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

        {/* ── Ministry Details ── */}
        <SectionHead title="Ministry Details" />
        <div className="p-6 grid grid-cols-2 gap-5">
          <div className="col-span-2">
            <FieldLabel label="Ministry Name" required />
            {getInput('name', { required: true, placeholder: 'e.g. Youth Ministry, Choir Group...' })}
            {getError('name')}
          </div>
          <div className="col-span-2">
            <FieldLabel label="Description" />
            <textarea
              value={form.description} onChange={set('description')}
              rows={3} placeholder="Describe the purpose and activities of this ministry..."
              className={inp + ' resize-none'}
            />
          </div>
          <div>
            <FieldLabel label="Leader / Head" />
            <select value={form.leader} onChange={set('leader')} className={errors.leader ? errInp : inp}>
              <option value="">Select a leader</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>
                  {m.full_name || `${m.first_name} ${m.last_name}`}
                </option>
              ))}
            </select>
            {getError('leader')}
          </div>
          <div>
            <FieldLabel label="Status" />
            <select
              value={form.is_active ? 'true' : 'false'}
              onChange={e => setForm(f => ({ ...f, is_active: e.target.value === 'true' }))}
              className={inp}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        {/* ── Meeting Schedule ── */}
        <SectionHead title="Meeting Schedule" />
        <div className="p-6 grid grid-cols-2 gap-5">
          <div>
            <FieldLabel label="Meeting Day" />
            <select value={form.meeting_day} onChange={set('meeting_day')} className={inp}>
              <option value="">Select day</option>
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel label="Meeting Time" />
            {getInput('meeting_time', { type: 'time' })}
          </div>
        </div>

        {/* ── Assign Members ── */}
        <SectionHead
          title="Assign Members"
          extra={
            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
              <Users size={11} /> {selectedMemberIds.length} selected
            </span>
          }
        />
        <div className="p-6">
          <MemberPicker
            allMembers={members}
            selected={selectedMemberIds}
            onChange={setSelectedMemberIds}
          />
          <p className="text-xs text-gray-400 mt-2">
            Selected members will be added to this ministry. Members can belong to multiple ministries.
          </p>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <button type="button" onClick={() => router.push('/ministries')}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft size={15} /> Back to Ministries
          </button>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {saving
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
              : <><Save size={15} />{isEdit ? 'Update Ministry' : 'Save Ministry'}</>}
          </button>
        </div>

      </div>
    </form>
  );
}

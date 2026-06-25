'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ministriesApi, membersApi } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import { ArrowLeft, Save } from 'lucide-react';

const inp = 'w-full bg-white text-gray-900 text-sm border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder-gray-400';
const errInp = 'w-full bg-red-50 text-gray-900 text-sm border border-red-400 rounded-lg px-3 py-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder-red-300';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const EMPTY = {
  name: '', description: '', leader: '',
  meeting_day: '', meeting_time: '', is_active: true,
};

function SectionHead({ title }: { title: string }) {
  return (
    <div className="px-6 py-3 border-t border-b border-gray-100 bg-gray-50">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</p>
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

interface Props { ministryId?: number; }

export default function MinistryForm({ ministryId }: Props) {
  const router = useRouter();
  const isEdit = !!ministryId;

  const [form,     setForm]    = useState({ ...EMPTY });
  const [members,  setMembers] = useState<any[]>([]);
  const [saving,   setSaving]  = useState(false);
  const [loading,  setLoading] = useState(isEdit);
  const [errors,   setErrors]  = useState<Record<string, string>>({});

  useEffect(() => {
    // Load members for leader dropdown
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
      };
      if (isEdit) await ministriesApi.update(ministryId!, payload);
      else        await ministriesApi.create(payload);
      toast.success(isEdit ? 'Ministry updated' : 'Ministry created successfully');
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

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <button type="button" onClick={() => router.push('/ministries')}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft size={15} /> Back to Ministries
          </button>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {saving
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
              : <><Save size={15} />{isEdit ? 'Update Ministry' : 'Save Ministry'}</>}
          </button>
        </div>

      </div>
    </form>
  );
}

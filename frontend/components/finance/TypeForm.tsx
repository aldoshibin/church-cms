'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/Toast';
import { ArrowLeft, Save } from 'lucide-react';

const inp = 'w-full bg-white text-gray-900 text-sm border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder-gray-400';
const errInp = 'w-full bg-red-50 text-gray-900 text-sm border border-red-400 rounded-lg px-3 py-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder-red-300';

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

interface Props {
  typeId?: number;
  api: {
    get:    (id: number) => Promise<any>;
    create: (data: any) => Promise<any>;
    update: (id: number, data: any) => Promise<any>;
  };
  backPath: string;
  entityLabel: string; // "Fund Type" | "Expense Category"
  placeholder: string;
}

export default function TypeForm({ typeId, api, backPath, entityLabel, placeholder }: Props) {
  const router = useRouter();
  const isEdit  = !!typeId;

  const [name,     setName]     = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [loading,  setLoading]  = useState(isEdit);
  const [errors,   setErrors]   = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeId) {
      setLoading(true);
      api.get(typeId)
        .then(({ data }: any) => {
          setName(data.name || '');
          setIsActive(data.is_active ?? true);
        })
        .catch(() => { toast.error('Load failed'); router.push(backPath); })
        .finally(() => setLoading(false));
    }
  }, [typeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setErrors({});
    try {
      const payload = { name, is_active: isActive };
      if (isEdit) await api.update(typeId!, payload);
      else        await api.create(payload);
      toast.success(isEdit ? `${entityLabel} updated` : `${entityLabel} created successfully`);
      router.push(backPath);
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

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-gray-400">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

        <SectionHead title={`${entityLabel} Details`} />
        <div className="p-6 grid grid-cols-2 gap-5">
          <div className="col-span-2">
            <FieldLabel label="Name" required />
            <input
              value={name}
              onChange={e => { setName(e.target.value); setErrors(fe => ({ ...fe, name: '' })); }}
              required
              placeholder={placeholder}
              className={errors.name ? errInp : inp}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            {!isEdit && (
              <p className="text-xs text-gray-400 mt-1.5">
                A URL-safe key will be generated automatically from the name.
              </p>
            )}
          </div>
          <div>
            <FieldLabel label="Status" />
            <select
              value={isActive ? 'true' : 'false'}
              onChange={e => setIsActive(e.target.value === 'true')}
              className={inp}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <p className="text-xs text-gray-400 mt-1.5">
              Inactive entries won't appear in the dropdown for new records.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <button type="button" onClick={() => router.push(backPath)}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft size={15} /> Back to {entityLabel}s
          </button>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {saving
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
              : <><Save size={15} />{isEdit ? `Update ${entityLabel}` : `Save ${entityLabel}`}</>}
          </button>
        </div>

      </div>
    </form>
  );
}

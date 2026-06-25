'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fundsApi, fundTypesApi } from '@/lib/api';
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

const EMPTY = {
  name: '', fund_type: '', description: '', target_amount: '', is_active: true,
};

interface Props { fundId?: number; }

export default function FundForm({ fundId }: Props) {
  const router = useRouter();
  const isEdit  = !!fundId;

  const [form,       setForm]       = useState({ ...EMPTY });
  const [fundTypes,  setFundTypes]  = useState<any[]>([]);
  const [saving,     setSaving]     = useState(false);
  const [loading,    setLoading]    = useState(isEdit);
  const [typesLoading, setTypesLoading] = useState(true);
  const [errors,     setErrors]     = useState<Record<string, string>>({});

  useEffect(() => {
    setTypesLoading(true);
    fundTypesApi.list()
      .then(r => {
        const list = (r.data.results || r.data).filter((t: any) => t.is_active);
        setFundTypes(list);
        if (!isEdit && list.length > 0) {
          setForm(f => (f.fund_type ? f : { ...f, fund_type: list[0].key }));
        }
      })
      .catch(() => toast.error('Could not load fund types'))
      .finally(() => setTypesLoading(false));

    if (fundId) {
      setLoading(true);
      fundsApi.get(fundId)
        .then(({ data }: any) => {
          setForm({
            name:           data.name           || '',
            fund_type:      data.fund_type       || '',
            description:    data.description     || '',
            target_amount:  data.target_amount != null ? String(data.target_amount) : '',
            is_active:      data.is_active       ?? true,
          });
        })
        .catch(() => { toast.error('Load failed'); router.push('/funds'); })
        .finally(() => setLoading(false));
    }
  }, [fundId]);

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
        name:           form.name,
        fund_type:      form.fund_type,
        description:    form.description,
        target_amount:  form.target_amount ? Number(form.target_amount) : null,
        is_active:      form.is_active,
      };
      if (isEdit) await fundsApi.update(fundId!, payload);
      else        await fundsApi.create(payload);
      toast.success(isEdit ? 'Fund updated' : 'Fund created successfully');
      router.push('/funds');
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

  const getError = (k: string) =>
    errors[k] ? <p className="text-xs text-red-500 mt-1">{errors[k]}</p> : null;

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-gray-400">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
        <span className="text-sm">Loading fund data...</span>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

        <SectionHead title="Fund Details" />
        <div className="p-6 grid grid-cols-2 gap-5">
          <div className="col-span-2">
            <FieldLabel label="Fund Name" required />
            <input
              value={form.name} onChange={set('name')} required
              placeholder="e.g. New Sanctuary Fund"
              className={errors.name ? errInp : inp}
            />
            {getError('name')}
          </div>

          <div>
            <FieldLabel label="Fund Type" required />
            <select
              value={form.fund_type}
              onChange={set('fund_type')}
              disabled={typesLoading}
              className={errors.fund_type ? errInp : inp}
            >
              {typesLoading ? (
                <option>Loading types...</option>
              ) : fundTypes.length === 0 ? (
                <option value="">No types available</option>
              ) : (
                fundTypes.map((t: any) => <option key={t.key} value={t.key}>{t.name}</option>)
              )}
            </select>
            {getError('fund_type')}
            {!typesLoading && fundTypes.length === 0 && (
              <p className="text-xs text-amber-600 mt-1.5">
                No Fund Types exist yet.{' '}
                <a href="/funds/fund-types/add" className="underline font-medium">Create one here</a> first.
              </p>
            )}
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
            <p className="text-xs text-gray-400 mt-1.5">Inactive funds can't receive new donations.</p>
          </div>

          <div className="col-span-2">
            <FieldLabel label="Description" />
            <textarea
              value={form.description} onChange={set('description')}
              rows={3} placeholder="Describe the purpose of this fund..."
              className={inp + ' resize-none'}
            />
          </div>

          <div>
            <FieldLabel label="Target Amount (₹)" />
            <input
              type="number" value={form.target_amount} onChange={set('target_amount')}
              placeholder="Leave empty for no target"
              className={errors.target_amount ? errInp : inp}
            />
            {getError('target_amount')}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <button type="button" onClick={() => router.push('/funds')}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft size={15} /> Back to Funds
          </button>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {saving
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
              : <><Save size={15} />{isEdit ? 'Update Fund' : 'Save Fund'}</>}
          </button>
        </div>

      </div>
    </form>
  );
}

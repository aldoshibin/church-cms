'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { expensesApi, expenseCategoriesApi } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import { ArrowLeft, Save, Upload, FileText, Eye, X, CheckCircle } from 'lucide-react';

const inp = 'w-full bg-white text-gray-900 text-sm border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder-gray-400';
const errInp = 'w-full bg-red-50 text-gray-900 text-sm border border-red-400 rounded-lg px-3 py-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder-red-300';

const STATUS_OPTIONS = [
  { value: 'pending',  label: 'Pending',  color: 'text-amber-600', bg: 'bg-amber-50',  border: 'border-amber-200'  },
  { value: 'approved', label: 'Approved', color: 'text-green-600', bg: 'bg-green-50',  border: 'border-green-200'  },
  { value: 'rejected', label: 'Rejected', color: 'text-red-600',   bg: 'bg-red-50',    border: 'border-red-200'    },
  { value: 'paid',     label: 'Paid',     color: 'text-blue-600',  bg: 'bg-blue-50',   border: 'border-blue-200'   },
];

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
  title: '', category: '', amount: '', date: '',
  vendor: '', description: '', status: 'pending',
};

interface Props { expenseId?: number; }

export default function ExpenseForm({ expenseId }: Props) {
  const router = useRouter();
  const isEdit  = !!expenseId;

  const [form,            setForm]            = useState({ ...EMPTY });
  const [categories,      setCategories]      = useState<any[]>([]);
  const [receiptFile,     setReceiptFile]     = useState<File | null>(null);
  const [existingReceipt, setExistingReceipt] = useState<string>('');
  const [saving,          setSaving]          = useState(false);
  const [loading,         setLoading]         = useState(isEdit);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [errors,          setErrors]          = useState<Record<string, string>>({});

  useEffect(() => {
    setCategoriesLoading(true);
    expenseCategoriesApi.list()
      .then(r => {
        const list = (r.data.results || r.data).filter((c: any) => c.is_active);
        setCategories(list);
        if (!isEdit && list.length > 0) {
          setForm(f => (f.category ? f : { ...f, category: list[0].key }));
        }
      })
      .catch(() => toast.error('Could not load expense categories'))
      .finally(() => setCategoriesLoading(false));

    if (expenseId) {
      setLoading(true);
      expensesApi.get(expenseId)
        .then(({ data }: any) => {
          setForm({
            title:       data.title       || '',
            category:    data.category    || '',
            amount:      data.amount != null ? String(data.amount) : '',
            date:        data.date        || '',
            vendor:      data.vendor      || '',
            description: data.description || '',
            status:      data.status      || 'pending',
          });
          if (data.receipt) setExistingReceipt(data.receipt);
        })
        .catch(() => { toast.error('Load failed'); router.push('/expenses'); })
        .finally(() => setLoading(false));
    }
  }, [expenseId]);

  const set = (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm(f => ({ ...f, [k]: e.target.value }));
      setErrors(fe => { const n = { ...fe }; delete n[k]; return n; });
    };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setReceiptFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setErrors({});
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('category', form.category);
      fd.append('amount', form.amount);
      fd.append('date', form.date);
      fd.append('vendor', form.vendor);
      fd.append('description', form.description);
      fd.append('status', form.status);
      if (receiptFile) fd.append('receipt', receiptFile);

      if (isEdit) await expensesApi.update(expenseId!, fd);
      else        await expensesApi.create(fd);

      toast.success(isEdit ? 'Expense updated' : 'Expense recorded successfully');
      router.push('/expenses');
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
        <span className="text-sm">Loading expense data...</span>
      </div>
    </div>
  );

  const currentStatus = STATUS_OPTIONS.find(s => s.value === form.status) || STATUS_OPTIONS[0];

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

        <SectionHead title="Expense Details" />
        <div className="p-6 grid grid-cols-2 gap-5">
          <div className="col-span-2">
            <FieldLabel label="Title" required />
            <input
              value={form.title} onChange={set('title')} required
              placeholder="e.g. Electricity bill — June"
              className={errors.title ? errInp : inp}
            />
            {getError('title')}
          </div>

          <div>
            <FieldLabel label="Category" required />
            <select
              value={form.category}
              onChange={set('category')}
              disabled={categoriesLoading}
              className={errors.category ? errInp : inp}
            >
              {categoriesLoading ? (
                <option>Loading categories...</option>
              ) : categories.length === 0 ? (
                <option value="">No categories available</option>
              ) : (
                categories.map((c: any) => <option key={c.key} value={c.key}>{c.name}</option>)
              )}
            </select>
            {getError('category')}
            {!categoriesLoading && categories.length === 0 && (
              <p className="text-xs text-amber-600 mt-1.5">
                No Expense Categories exist yet.{' '}
                <a href="/expenses/categories/add" className="underline font-medium">Create one here</a> first.
              </p>
            )}
          </div>

          <div>
            <FieldLabel label="Amount (₹)" required />
            <input type="number" value={form.amount} onChange={set('amount')} required step="0.01" min="0"
              placeholder="0.00" className={errors.amount ? errInp : inp} />
            {getError('amount')}
          </div>

          <div>
            <FieldLabel label="Date" required />
            <input type="date" value={form.date} onChange={set('date')} required
              className={errors.date ? errInp : inp} />
            {getError('date')}
          </div>

          <div>
            <FieldLabel label="Vendor" />
            <input value={form.vendor} onChange={set('vendor')}
              placeholder="e.g. State Electricity Board"
              className={inp} />
          </div>

          <div className="col-span-2">
            <FieldLabel label="Description" />
            <textarea value={form.description} onChange={set('description')} rows={3}
              placeholder="Additional details about this expense..."
              className={inp + ' resize-none'} />
          </div>
        </div>

        <SectionHead title="Status" />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm text-gray-500">Current status:</span>
            <span className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${currentStatus.bg} ${currentStatus.color} ${currentStatus.border}`}>
              {currentStatus.label}
            </span>
          </div>
          <div className="max-w-xs">
            <select value={form.status} onChange={set('status')} className={inp}>
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            New expenses default to Pending. Use the Approve action on the list page for a one-click workflow.
          </p>
        </div>

        <SectionHead title="Receipt / Bill" />
        <div className="p-6">
          {existingReceipt && !receiptFile && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl mb-3">
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center border border-gray-100 shrink-0">
                <FileText size={16} className="text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">Current bill/receipt on file</p>
              </div>
              <a href={existingReceipt} target="_blank" rel="noreferrer"
                className="w-8 h-8 flex items-center justify-center text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors shrink-0">
                <Eye size={14} />
              </a>
            </div>
          )}

          <label className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 text-sm font-semibold rounded-lg border border-indigo-200 hover:bg-indigo-100 cursor-pointer transition-colors w-fit">
            <Upload size={14} /> {existingReceipt ? 'Replace Bill/Receipt' : 'Upload Bill/Receipt'}
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="hidden" />
          </label>

          {receiptFile && (
            <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
              <FileText size={14} className="text-green-500" />
              {receiptFile.name}
              <button type="button" onClick={() => setReceiptFile(null)} className="text-red-400 hover:text-red-600">
                <X size={14} />
              </button>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">PDF, JPG, or PNG — attach the bill or receipt for this expense.</p>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <button type="button" onClick={() => router.push('/expenses')}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft size={15} /> Back to Expenses
          </button>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {saving
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
              : <><Save size={15} />{isEdit ? 'Update Expense' : 'Save Expense'}</>}
          </button>
        </div>

      </div>
    </form>
  );
}

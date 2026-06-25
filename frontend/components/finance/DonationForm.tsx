'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { donationsApi, fundsApi, membersApi } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import { ArrowLeft, Save, Upload, FileText, Eye, X } from 'lucide-react';

const inp = 'w-full bg-white text-gray-900 text-sm border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder-gray-400';
const errInp = 'w-full bg-red-50 text-gray-900 text-sm border border-red-400 rounded-lg px-3 py-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder-red-300';

const PAYMENT_METHODS = [
  { value: 'cash',          label: 'Cash' },
  { value: 'check',         label: 'Check' },
  { value: 'online',        label: 'Online' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'upi',           label: 'UPI' },
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
  member: '', fund: '', amount: '', date: '',
  payment_method: 'cash', transaction_id: '', notes: '',
};

interface Props { donationId?: number; }

export default function DonationForm({ donationId }: Props) {
  const router = useRouter();
  const isEdit  = !!donationId;

  const [form,          setForm]          = useState({ ...EMPTY });
  const [members,       setMembers]       = useState<any[]>([]);
  const [funds,         setFunds]         = useState<any[]>([]);
  const [receiptFile,   setReceiptFile]   = useState<File | null>(null);
  const [existingReceipt, setExistingReceipt] = useState<string>('');
  const [saving,        setSaving]        = useState(false);
  const [loading,       setLoading]       = useState(isEdit);
  const [errors,        setErrors]        = useState<Record<string, string>>({});

  useEffect(() => {
    membersApi.list({ page_size: 1000 }).then(r => setMembers(r.data.results || r.data)).catch(() => {});
    fundsApi.list().then(r => setFunds((r.data.results || r.data).filter((f: any) => f.is_active))).catch(() => {});

    if (donationId) {
      setLoading(true);
      donationsApi.get(donationId)
        .then(({ data }: any) => {
          setForm({
            member:         data.member != null ? String(data.member) : '',
            fund:           data.fund != null ? String(data.fund) : '',
            amount:         data.amount != null ? String(data.amount) : '',
            date:           data.date || '',
            payment_method: data.payment_method || 'cash',
            transaction_id: data.transaction_id || '',
            notes:          data.notes || '',
          });
          if (data.receipt) setExistingReceipt(data.receipt);
        })
        .catch(() => { toast.error('Load failed'); router.push('/donations'); })
        .finally(() => setLoading(false));
    }
  }, [donationId]);

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
      if (form.member) fd.append('member', form.member);
      if (form.fund) fd.append('fund', form.fund);
      fd.append('amount', form.amount);
      fd.append('date', form.date);
      fd.append('payment_method', form.payment_method);
      fd.append('transaction_id', form.transaction_id);
      fd.append('notes', form.notes);
      if (receiptFile) fd.append('receipt', receiptFile);

      if (isEdit) await donationsApi.update(donationId!, fd);
      else        await donationsApi.create(fd);

      toast.success(isEdit ? 'Donation updated' : 'Donation recorded successfully');
      router.push('/donations');
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
        <span className="text-sm">Loading donation data...</span>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

        <SectionHead title="Donor & Fund" />
        <div className="p-6 grid grid-cols-2 gap-5">
          <div>
            <FieldLabel label="Member" />
            <select value={form.member} onChange={set('member')} className={inp}>
              <option value="">Anonymous / Walk-in</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.full_name || `${m.first_name} ${m.last_name}`}</option>)}
            </select>
            <p className="text-xs text-gray-400 mt-1.5">Leave blank for an anonymous donation.</p>
          </div>
          <div>
            <FieldLabel label="Fund" />
            <select value={form.fund} onChange={set('fund')} className={inp}>
              <option value="">General (no specific fund)</option>
              {funds.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
        </div>

        <SectionHead title="Donation Details" />
        <div className="p-6 grid grid-cols-2 gap-5">
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
            <FieldLabel label="Payment Method" required />
            <select value={form.payment_method} onChange={set('payment_method')} className={inp}>
              {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel label="Transaction ID" />
            <input value={form.transaction_id} onChange={set('transaction_id')}
              placeholder="Optional reference number"
              className={inp} />
          </div>
          <div className="col-span-2">
            <FieldLabel label="Notes" />
            <textarea value={form.notes} onChange={set('notes')} rows={2}
              placeholder="Any additional notes..."
              className={inp + ' resize-none'} />
          </div>
        </div>

        <SectionHead title="Receipt / Proof of Donation" />
        <div className="p-6">
          {existingReceipt && !receiptFile && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl mb-3">
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center border border-gray-100 shrink-0">
                <FileText size={16} className="text-indigo-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">Current receipt on file</p>
              </div>
              <a href={existingReceipt} target="_blank" rel="noreferrer"
                className="w-8 h-8 flex items-center justify-center text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors shrink-0">
                <Eye size={14} />
              </a>
            </div>
          )}

          <label className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 text-sm font-semibold rounded-lg border border-indigo-200 hover:bg-indigo-100 cursor-pointer transition-colors w-fit">
            <Upload size={14} /> {existingReceipt ? 'Replace Receipt' : 'Upload Receipt'}
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
          <p className="text-xs text-gray-400 mt-2">PDF, JPG, or PNG — proof/receipt of this donation (optional).</p>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <button type="button" onClick={() => router.push('/donations')}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft size={15} /> Back to Donations
          </button>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {saving
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
              : <><Save size={15} />{isEdit ? 'Update Donation' : 'Record Donation'}</>}
          </button>
        </div>

      </div>
    </form>
  );
}

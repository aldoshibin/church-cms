'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { eventsApi } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import { ArrowLeft, Save, CheckCircle, XCircle, RotateCcw, Mic } from 'lucide-react';

const inp = 'w-full bg-white text-gray-900 text-sm border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder-gray-400';
const errInp = 'w-full bg-red-50 text-gray-900 text-sm border border-red-400 rounded-lg px-3 py-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder-red-300';

const SERVICE_TYPES = [
  { value: 'service',     label: 'Worship Service' },
  { value: 'bible_study', label: 'Bible Study'     },
  { value: 'choir',       label: 'Choir'            },
  { value: 'meeting',     label: 'Meeting'          },
];

const SPECIAL_TYPES = [
  { value: 'fellowship', label: 'Fellowship'  },
  { value: 'outreach',   label: 'Outreach'    },
  { value: 'youth',      label: 'Youth'       },
  { value: 'other',      label: 'Other'       },
];

const RECURRENCE = ['Weekly', 'Bi-weekly', 'Monthly', 'Yearly'];

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled', color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200'   },
  { value: 'ongoing',   label: 'Ongoing',   color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200'  },
  { value: 'completed', label: 'Completed', color: 'text-green-600', bg: 'bg-green-50',  border: 'border-green-200'  },
  { value: 'cancelled', label: 'Cancelled', color: 'text-red-600',   bg: 'bg-red-50',    border: 'border-red-200'    },
];

const EMPTY = {
  title: '', event_type: '', description: '',
  speaker: '', speaker_note: '',
  start_date: '', start_time: '',
  end_date: '',   end_time: '',
  location: '', status: 'scheduled',
  max_capacity: '', is_recurring: false,
  recurrence_pattern: '',
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

interface Props {
  eventId?:  number;
  eventKind: 'service' | 'special';
}

export default function EventForm({ eventId, eventKind }: Props) {
  const router   = useRouter();
  const isEdit   = !!eventId;
  const backPath = eventKind === 'service' ? '/events/church-services' : '/events/special-events';
  const typeOptions = eventKind === 'service' ? SERVICE_TYPES : SPECIAL_TYPES;

  const [form,    setForm]    = useState({ ...EMPTY, event_type: typeOptions[0].value });
  const [saving,  setSaving]  = useState(false);
  const [statusActionLoading, setStatusActionLoading] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [errors,  setErrors]  = useState<Record<string, string>>({});

  useEffect(() => {
    if (eventId) {
      setLoading(true);
      eventsApi.get(eventId)
        .then(({ data }) => {
          const splitDT = (dt: string) => {
            if (!dt) return { date: '', time: '' };
            const [d, t] = dt.includes('T') ? dt.split('T') : dt.split(' ');
            return { date: d || '', time: (t || '').substring(0, 5) };
          };
          const start = splitDT(data.start_datetime);
          const end   = splitDT(data.end_datetime || '');
          setForm({
            title:              data.title              || '',
            event_type:         data.event_type         || typeOptions[0].value,
            description:        data.description        || '',
            speaker:            data.speaker            || '',
            speaker_note:       data.speaker_note        || '',
            start_date:         start.date,
            start_time:         start.time,
            end_date:           end.date,
            end_time:           end.time,
            location:           data.location           || '',
            status:             data.status             || 'scheduled',
            max_capacity:       data.max_capacity != null ? String(data.max_capacity) : '',
            is_recurring:       data.is_recurring       ?? false,
            recurrence_pattern: data.recurrence_pattern || '',
          });
        })
        .catch(() => { toast.error('Load failed'); router.push(backPath); })
        .finally(() => setLoading(false));
    }
  }, [eventId]);

  const set = (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm(f => ({ ...f, [k]: e.target.value }));
      setErrors(fe => { const n = { ...fe }; delete n[k]; return n; });
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setErrors({});
    try {
      const start_datetime = form.start_date && form.start_time
        ? `${form.start_date}T${form.start_time}:00`
        : form.start_date ? `${form.start_date}T00:00:00` : null;
      const end_datetime = form.end_date && form.end_time
        ? `${form.end_date}T${form.end_time}:00`
        : null;

      const payload = {
        title:              form.title,
        event_type:         form.event_type,
        description:        form.description,
        speaker:            form.speaker,
        speaker_note:       form.speaker_note,
        start_datetime,
        end_datetime,
        location:           form.location,
        status:             form.status,
        max_capacity:       form.max_capacity ? parseInt(form.max_capacity) : null,
        is_recurring:       form.is_recurring,
        recurrence_pattern: form.is_recurring ? form.recurrence_pattern : '',
      };

      if (isEdit) await eventsApi.update(eventId!, payload);
      else        await eventsApi.create(payload);

      toast.success(isEdit ? 'Event updated' : 'Event created successfully');
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

  /* Quick status actions — only shown in edit mode */
  const runStatusAction = async (action: 'mark_completed' | 'mark_cancelled' | 'reschedule') => {
    if (!eventId) return;
    setStatusActionLoading(true);
    try {
      let data;
      if (action === 'mark_completed') ({ data } = await eventsApi.markCompleted(eventId));
      else if (action === 'mark_cancelled') ({ data } = await eventsApi.markCancelled(eventId));
      else ({ data } = await eventsApi.reschedule(eventId, {}));
      setForm(f => ({ ...f, status: data.status }));
      toast.success(
        action === 'mark_completed' ? 'Marked as Completed' :
        action === 'mark_cancelled' ? 'Marked as Cancelled' :
        'Rescheduled — status reset to Scheduled'
      );
    } catch {
      toast.error('Action failed');
    } finally { setStatusActionLoading(false); }
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
        <span className="text-sm">Loading event data...</span>
      </div>
    </div>
  );

  const currentStatus = STATUS_OPTIONS.find(s => s.value === form.status) || STATUS_OPTIONS[0];

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

        {/* ── Quick Status Actions (edit mode only) ── */}
        {isEdit && (
          <>
            <SectionHead title="Schedule Status" />
            <div className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">Current status:</span>
                  <span className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${currentStatus.bg} ${currentStatus.color} ${currentStatus.border}`}>
                    {currentStatus.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => runStatusAction('mark_completed')}
                    disabled={statusActionLoading || form.status === 'completed'}
                    className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-semibold hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <CheckCircle size={13} /> Mark Completed
                  </button>
                  <button
                    type="button"
                    onClick={() => runStatusAction('mark_cancelled')}
                    disabled={statusActionLoading || form.status === 'cancelled'}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <XCircle size={13} /> Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => runStatusAction('reschedule')}
                    disabled={statusActionLoading || form.status === 'scheduled'}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <RotateCcw size={13} /> Reschedule
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                These buttons update status instantly. To change the date/time of a rescheduled event, edit the Date & Time fields below and click Update Event.
              </p>
            </div>
          </>
        )}

        {/* ── Event Details ── */}
        <SectionHead title="Event Details" />
        <div className="p-6 grid grid-cols-2 gap-5">
          <div className="col-span-2">
            <FieldLabel label="Event Title" required />
            {getInput('title', { required: true, placeholder: eventKind === 'service' ? 'e.g. Sunday Worship Service' : 'e.g. Christmas Celebration' })}
            {getError('title')}
          </div>
          <div>
            <FieldLabel label="Event Type" required />
            <select value={form.event_type} onChange={set('event_type')} className={inp}>
              {typeOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel label="Status" />
            <select value={form.status} onChange={set('status')} className={inp}>
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <FieldLabel label="Description" />
            <textarea
              value={form.description} onChange={set('description')}
              rows={3} placeholder="Describe this event..."
              className={inp + ' resize-none'}
            />
          </div>
          <div>
            <FieldLabel label="Location / Venue" />
            {getInput('location', { placeholder: 'Main Hall, Church Campus...' })}
          </div>
          <div>
            <FieldLabel label="Max Capacity" />
            {getInput('max_capacity', { type: 'number', min: '1', placeholder: 'Leave blank for unlimited' })}
          </div>
        </div>

        {/* ── Speaker / Pastor ── */}
        <SectionHead title="Speaker / Pastor" />
        <div className="p-6 grid grid-cols-2 gap-5">
          <div>
            <FieldLabel label="Speaker / Pastor Name" />
            <div className="relative">
              <Mic size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={form.speaker}
                onChange={set('speaker')}
                placeholder="e.g. Pastor John Wesley"
                className={(errors.speaker ? errInp : inp) + ' pl-9'}
              />
            </div>
            {getError('speaker')}
          </div>
          <div>
            <FieldLabel label="Role / Note" />
            {getInput('speaker_note', { placeholder: 'e.g. Senior Pastor, Guest Speaker...' })}
          </div>
        </div>

        {/* ── Date & Time ── */}
        <SectionHead title="Date & Time" />
        <div className="p-6 grid grid-cols-2 gap-5">
          <div>
            <FieldLabel label="Start Date" required />
            {getInput('start_date', { type: 'date', required: true })}
            {getError('start_date')}
          </div>
          <div>
            <FieldLabel label="Start Time" />
            {getInput('start_time', { type: 'time' })}
          </div>
          <div>
            <FieldLabel label="End Date" />
            {getInput('end_date', { type: 'date' })}
          </div>
          <div>
            <FieldLabel label="End Time" />
            {getInput('end_time', { type: 'time' })}
          </div>
        </div>

        {/* ── Recurrence (services only) ── */}
        {eventKind === 'service' && (
          <>
            <SectionHead title="Recurrence" />
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, is_recurring: !f.is_recurring }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.is_recurring ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    form.is_recurring ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
                <span className="text-sm text-gray-700 font-medium">
                  {form.is_recurring ? 'Recurring event' : 'One-time event'}
                </span>
              </div>
              {form.is_recurring && (
                <div className="max-w-xs">
                  <FieldLabel label="Recurrence Pattern" />
                  <select value={form.recurrence_pattern} onChange={set('recurrence_pattern')} className={inp}>
                    <option value="">Select pattern</option>
                    {RECURRENCE.map(r => <option key={r} value={r.toLowerCase()}>{r}</option>)}
                  </select>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <button type="button" onClick={() => router.push(backPath)}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft size={15} />
            Back to {eventKind === 'service' ? 'Church Services' : 'Special Events'}
          </button>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {saving
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
              : <><Save size={15} />{isEdit ? 'Update Event' : 'Save Event'}</>}
          </button>
        </div>

      </div>
    </form>
  );
}

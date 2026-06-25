'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { membersApi, familiesApi, memberDocumentsApi } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import {
  ArrowLeft, Save, Upload, Trash2, FileText,
  ImageIcon, Eye
} from 'lucide-react';

/* ─── Styles ──────────────────────────────────────────────────────────────── */
const inp = 'w-full bg-white text-gray-900 text-sm border border-gray-200 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-indigo-100 transition-all placeholder-gray-400';
const errInp = 'w-full bg-red-50 text-gray-900 text-sm border border-red-400 rounded-lg px-3 py-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 placeholder-red-300';

/* ─── Helpers defined OUTSIDE component (Turbopack safe) ──────────────────── */
function toDate(v: any): string {
  if (!v) return '';
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const dmy = s.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  if (s.includes('T')) return s.split('T')[0];
  return '';
}

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

const DOC_TYPES = [
  { value: 'certificate', label: 'Membership Certificate' },
  { value: 'baptism',     label: 'Baptism Certificate'    },
  { value: 'photo',       label: 'Photo / ID'             },
  { value: 'transfer',    label: 'Transfer Letter'        },
  { value: 'other',       label: 'Other Document'         },
];

const EMPTY_FORM = {
  first_name: '', last_name: '', email: '', phone: '', alternate_phone: '',
  gender: '', date_of_birth: '', membership_date: '', baptism_date: '',
  status: 'active', marital_status: '', occupation: '',
  address: '', city: '', state: '', zip_code: '', notes: '',
  emergency_contact_name: '', emergency_contact_phone: '',
  family: '',
};

/* ─── Main Component ──────────────────────────────────────────────────────── */
interface Props { memberId?: number; }

export default function MemberForm({ memberId }: Props) {
  const router = useRouter();
  const isEdit = !!memberId;

  const [form,           setForm]           = useState({ ...EMPTY_FORM });
  const [families,       setFamilies]       = useState<any[]>([]);
  const [saving,         setSaving]         = useState(false);
  const [loading,        setLoading]        = useState(isEdit);
  const [errors,         setErrors]         = useState<Record<string, string>>({});
  const [profileFile,    setProfileFile]    = useState<globalThis.File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string>('');
  const [removePhoto,    setRemovePhoto]    = useState(false);
  const [documents,      setDocuments]      = useState<any[]>([]);
  const [docFile,        setDocFile]        = useState<globalThis.File | null>(null);
  const [docType,        setDocType]        = useState('certificate');
  const [docTitle,       setDocTitle]       = useState('');
  const [uploading,      setUploading]      = useState(false);

  useEffect(() => {
    familiesApi.list()
      .then(r => setFamilies(r.data.results || r.data))
      .catch(() => {});

    if (memberId) {
      setLoading(true);
      Promise.all([
        membersApi.get(memberId),
        memberDocumentsApi.list(memberId),
      ]).then(([{ data: m }, { data: docs }]) => {
        setForm({
          first_name:              m.first_name              || '',
          last_name:               m.last_name               || '',
          email:                   m.email                   || '',
          phone:                   m.phone                   || '',
          alternate_phone:         m.alternate_phone         || '',
          gender:                  m.gender                  || '',
          date_of_birth:           toDate(m.date_of_birth),
          membership_date:         toDate(m.membership_date),
          baptism_date:            toDate(m.baptism_date),
          status:                  m.status                  || 'active',
          marital_status:          m.marital_status          || '',
          occupation:              m.occupation              || '',
          address:                 m.address                 || '',
          city:                    m.city                    || '',
          state:                   m.state                   || '',
          zip_code:                m.zip_code                || '',
          notes:                   m.notes                   || '',
          emergency_contact_name:  m.emergency_contact_name  || '',
          emergency_contact_phone: m.emergency_contact_phone || '',
          family:                  m.family != null ? String(m.family) : '',
        });
        if (m.profile_picture) setProfilePreview(m.profile_picture);
        setDocuments(Array.isArray(docs) ? docs : []);
      }).catch(() => {
        toast.error('Load failed', 'Could not load member.');
        router.push('/members');
      }).finally(() => setLoading(false));
    }
  }, [memberId]);

  const set = (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm(f => ({ ...f, [k]: e.target.value }));
      setErrors(fe => { const n = { ...fe }; delete n[k]; return n; });
    };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileFile(file);
    setRemovePhoto(false);
    setProfilePreview(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    setProfilePreview('');
    setProfileFile(null);
    setRemovePhoto(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setErrors({});
    try {
      const fields: Record<string, any> = {
        ...form,
        family:          form.family          ? parseInt(form.family) : null,
        date_of_birth:   form.date_of_birth   || null,
        membership_date: form.membership_date || null,
        baptism_date:    form.baptism_date    || null,
      };

      let payload: any;

      if (profileFile || removePhoto) {
        // A new photo was selected, or the existing one is being removed —
        // must send multipart/form-data so the file (or its removal) is
        // actually included in the request.
        const fd = new FormData();
        Object.entries(fields).forEach(([k, v]) => {
          if (v === null || v === undefined) {
            fd.append(k, '');
          } else {
            fd.append(k, String(v));
          }
        });
        if (profileFile) {
          fd.append('profile_picture', profileFile);
        } else if (removePhoto) {
          // Explicitly clear the existing photo on the server
          fd.append('profile_picture', '');
        }
        payload = fd;
      } else {
        // No photo change at all — plain JSON keeps existing behavior
        // for everything else (dates, family assignment, etc.)
        payload = fields;
      }

      if (isEdit) {
        await membersApi.update(memberId!, payload);
      } else {
        await membersApi.create(payload);
      }
      toast.success(isEdit ? 'Member updated' : 'Member added successfully');
      router.push('/members');
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

  const handleDocUpload = async () => {
    if (!docFile || !memberId) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', docFile);
      fd.append('doc_type', docType);
      fd.append('title', docTitle || docFile.name);
      const { data } = await memberDocumentsApi.upload(memberId, fd);
      setDocuments(prev => [data, ...prev]);
      setDocFile(null);
      setDocTitle('');
      toast.success('Document uploaded');
    } catch (err: any) {
      toast.error('Upload failed', err.response?.data?.error || 'Could not upload file.');
    } finally { setUploading(false); }
  };

  const handleDocDelete = async (docId: number) => {
    if (!memberId) return;
    try {
      await memberDocumentsApi.delete(memberId, docId);
      setDocuments(prev => prev.filter((d: any) => d.id !== docId));
      toast.success('Document deleted');
    } catch { toast.error('Delete failed'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-gray-400">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
        <span className="text-sm">Loading member data...</span>
      </div>
    </div>
  );

  const getInput = (k: string, extra?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
      value={(form as any)[k]}
      onChange={set(k)}
      className={errors[k] ? errInp : inp}
      {...extra}
    />
  );

  const getSelect = (k: string, options: React.ReactNode) => (
    <select value={(form as any)[k]} onChange={set(k)} className={errors[k] ? errInp : inp}>
      {options}
    </select>
  );

  const getError = (k: string) =>
    errors[k] ? <p className="text-xs text-red-500 mt-1">{errors[k]}</p> : null;

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

        {/* ── Profile Photo ── */}
        <SectionHead title="Profile Photo" />
        <div className="p-6 flex items-center gap-6">
          {/* Avatar circle — fixed size, overflow hidden forces image to stay inside */}
          <div
            style={{
              width: 96, height: 96, borderRadius: '50%',
              border: '2px dashed #d1d5db',
              overflow: 'hidden', flexShrink: 0,
              background: '#f9fafb',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}
          >
            {profilePreview ? (
              <img
                src={profilePreview}
                alt="Profile"
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  position: 'absolute', top: 0, left: 0,
                }}
              />
            ) : (
              <ImageIcon size={28} className="text-gray-300" />
            )}
          </div>

          {/* Upload controls */}
          <div className="flex flex-col gap-2">
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-semibold rounded-lg border border-indigo-200 hover:bg-indigo-100 cursor-pointer transition-colors w-fit">
              <Upload size={14} /> Upload Photo
              <input type="file" accept="image/*" onChange={handleProfileChange} className="hidden" />
            </label>
            <p className="text-xs text-gray-400">JPG, PNG up to 5MB. Passport size recommended.</p>
            {profilePreview && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="text-xs text-red-400 hover:text-red-600 text-left transition-colors"
              >
                Remove photo
              </button>
            )}
          </div>
        </div>

        {/* ── Personal Information ── */}
        <SectionHead title="Personal Information" />
        <div className="grid grid-cols-3 gap-4 p-4">
          <div>
            <FieldLabel label="First Name" required />
            {getInput('first_name', { required: true, placeholder: 'John' })}
            {getError('first_name')}
          </div>
          <div>
            <FieldLabel label="Last Name" required />
            {getInput('last_name', { required: true, placeholder: 'Smith' })}
            {getError('last_name')}
          </div>
          <div>
            <FieldLabel label="Gender" />
            {getSelect('gender', <>
              <option value="">Select gender</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="O">Other</option>
            </>)}
          </div>
          <div>
            <FieldLabel label="Date of Birth" />
            {getInput('date_of_birth', { type: 'date' })}
          </div>
          <div>
            <FieldLabel label="Marital Status" />
            {getSelect('marital_status', <>
              <option value="">Select</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="widowed">Widowed</option>
              <option value="divorced">Divorced</option>
            </>)}
          </div>
          <div>
            <FieldLabel label="Occupation" />
            {getInput('occupation', { placeholder: 'Engineer, Teacher...' })}
          </div>
        </div>

        {/* ── Contact Details ── */}
        <SectionHead title="Contact Details" />
        <div className="grid grid-cols-3 gap-4 p-4">
          <div>
            <FieldLabel label="Email Address" />
            {getInput('email', { type: 'email', placeholder: 'john@email.com' })}
            {getError('email')}
          </div>
          <div>
            <FieldLabel label="Phone Number" />
            {getInput('phone', { placeholder: '+91 98765 43210' })}
          </div>
          <div>
            <FieldLabel label="Alternate Phone" />
            {getInput('alternate_phone', { placeholder: '+91 98765 43210' })}
          </div>
          <div className="col-span-3">
            <FieldLabel label="Address" />
            <textarea
              value={form.address}
              onChange={set('address')}
              rows={2}
              placeholder="Street address..."
              className={inp + ' resize-none'}
            />
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
            {getError('zip_code')}
          </div>
        </div>

        {/* ── Church Information ── */}
        <SectionHead title="Church Information" />
        <div className="grid grid-cols-3 gap-4 p-4">
          <div>
            <FieldLabel label="Membership Status" />
            {getSelect('status', <>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="visitor">Visitor</option>
              <option value="transferred">Transferred</option>
              <option value="deceased">Deceased</option>
            </>)}
          </div>
          <div>
            <FieldLabel label="Membership Date" />
            {getInput('membership_date', { type: 'date' })}
          </div>
          <div>
            <FieldLabel label="Baptism Date" />
            {getInput('baptism_date', { type: 'date' })}
          </div>
          <div>
            <FieldLabel label="Family" />
            {getSelect('family', <>
              <option value="">None</option>
              {families.map(f => (
                <option key={f.id} value={String(f.id)}>
                  {f.name}{f.family_id ? ` (${f.family_id})` : ''}
                </option>
              ))}
            </>)}
          </div>
        </div>

        {/* ── Emergency Contact ── */}
        <SectionHead title="Emergency Contact" />
        <div className="grid grid-cols-3 gap-4 p-4">
          <div>
            <FieldLabel label="Contact Name" />
            {getInput('emergency_contact_name', { placeholder: 'Full name' })}
          </div>
          <div>
            <FieldLabel label="Contact Phone" />
            {getInput('emergency_contact_phone', { placeholder: '+91 98765 43210' })}
          </div>
        </div>

        {/* ── Notes ── */}
        <SectionHead title="Additional Notes" />
        <div className="p-6">
          <textarea
            value={form.notes}
            onChange={set('notes')}
            rows={3}
            placeholder="Any additional notes about this member..."
            className={inp + ' resize-none'}
          />
        </div>

        {/* ── Documents (edit mode only) ── */}
        {isEdit && (
          <>
            <SectionHead title="Documents & Certificates" />
            <div className="p-6 space-y-5">
              {/* Upload widget */}
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 bg-gray-50">
                <p className="text-sm font-semibold text-gray-700 mb-4">Upload New Document</p>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <FieldLabel label="Document Type" />
                    <select value={docType} onChange={e => setDocType(e.target.value)} className={inp}>
                      {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <FieldLabel label="Title / Description" />
                    <input
                      value={docTitle}
                      onChange={e => setDocTitle(e.target.value)}
                      placeholder="e.g. Membership Certificate 2024"
                      className={inp}
                    />
                  </div>
                  <div>
                    <FieldLabel label="File" />
                    <label className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors w-full">
                      <Upload size={14} className="text-gray-400 shrink-0" />
                      <span className="truncate">{docFile ? docFile.name : 'Choose file...'}</span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={e => setDocFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">PDF, JPG, PNG, DOC, DOCX · Max 10MB</p>
                  <button
                    type="button"
                    onClick={handleDocUpload}
                    disabled={!docFile || uploading}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {uploading
                      ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Uploading...</>
                      : <><Upload size={14} />Upload</>}
                  </button>
                </div>
              </div>

              {/* Document list */}
              {documents.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    {documents.length} Document{documents.length !== 1 ? 's' : ''}
                  </p>
                  {documents.map((doc: any) => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:border-indigo-200 transition-colors">
                      <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                        {(doc.file || '').match(/\.(jpg|jpeg|png)$/i)
                          ? <ImageIcon size={16} className="text-green-500" />
                          : <FileText size={16} className="text-red-500" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{doc.title}</p>
                        <p className="text-xs text-gray-400">
                          {DOC_TYPES.find(t => t.value === doc.doc_type)?.label || doc.doc_type}
                          {' · '}{new Date(doc.uploaded_at).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={doc.file}
                          target="_blank"
                          rel="noreferrer"
                          className="w-8 h-8 flex items-center justify-center text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye size={14} />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDocDelete(doc.id)}
                          className="w-8 h-8 flex items-center justify-center text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <FileText size={28} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-sm">No documents uploaded yet</p>
                  <p className="text-xs mt-1">Upload certificates, photos, or any other member documents above</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push('/members')}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={15} /> Back to Members
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
              : <><Save size={15} />{isEdit ? 'Update Member' : 'Save Member'}</>
            }
          </button>
        </div>

      </div>
    </form>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { membersApi, familiesApi, memberDocumentsApi } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  ArrowLeft, Edit2, Trash2, Mail, Phone, MapPin, Calendar,
  Users, Home, Heart, Briefcase, AlertCircle, FileText,
  ImageIcon, Eye as EyeIcon, User as UserIcon
} from 'lucide-react';

function formatDate(d: string) {
  if (!d) return '—';
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return d; }
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={14} className="text-gray-400" />
      </div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-0.5">{label}</p>
        <p className="text-sm text-gray-800 font-medium">{value || <span className="text-gray-400 font-normal">Not provided</span>}</p>
      </div>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
        <Icon size={14} className="text-indigo-500" />
        <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">{title}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function MemberDetailPage() {
  const params   = useParams();
  const router   = useRouter();
  const memberId = params?.id ? parseInt(String(params.id)) : undefined;

  const [member,      setMember]      = useState<any>(null);
  const [family,      setFamily]      = useState<any>(null);
  const [famMembers,  setFamMembers]  = useState<any[]>([]);
  const [documents,   setDocuments]   = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [deleteOpen,  setDeleteOpen]  = useState(false);

  useEffect(() => {
    if (!memberId) return;
    setLoading(true);
    membersApi.get(memberId)
      .then(async ({ data: m }) => {
        setMember(m);

        // Load documents
        memberDocumentsApi.list(memberId)
          .then(r => setDocuments(Array.isArray(r.data) ? r.data : []))
          .catch(() => {});

        // Load family + family members if assigned
        if (m.family) {
          try {
            const [famListRes, famMembersRes] = await Promise.all([
              familiesApi.list(),
              familiesApi.members(m.family),
            ]);
            const fams = famListRes.data.results || famListRes.data;
            const fam  = fams.find((f: any) => f.id === m.family);
            setFamily(fam || null);
            setFamMembers(Array.isArray(famMembersRes.data) ? famMembersRes.data : []);
          } catch { /* ignore */ }
        }
      })
      .catch(() => {
        toast.error('Load failed', 'Could not load member details.');
        router.push('/members');
      })
      .finally(() => setLoading(false));
  }, [memberId]);

  const handleDelete = async () => {
    if (!memberId) return;
    try {
      await membersApi.delete(memberId);
      toast.success('Member deleted');
      router.push('/members');
    } catch { toast.error('Delete failed'); }
    finally { setDeleteOpen(false); }
  };

  if (loading) {
    return (
      <DashboardLayout title="Member Details" subtitle="Loading...">
        <div className="flex items-center justify-center py-24 text-gray-400">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
            <span className="text-sm">Loading member details...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!member) return null;

  const fullName = member.full_name || `${member.first_name} ${member.last_name}`;

  return (
    <DashboardLayout title="Member Details" subtitle={fullName}>

      {/* Top bar */}
      <div className="flex justify-between items-start mb-6">
        <button onClick={() => router.push('/members')}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft size={15} /> Back to Members
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push(`/members/${memberId}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors">
            <Edit2 size={14} /> Edit Member
          </button>
          <button onClick={() => setDeleteOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* Hero card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="p-6 flex items-start gap-5">
          <div
            style={{
              width: 80, height: 80, borderRadius: '50%', overflow: 'hidden',
              background: '#eef2ff', flexShrink: 0, position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {member.profile_picture ? (
              <img src={member.profile_picture} alt={fullName}
                style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} />
            ) : (
              <span className="text-2xl font-bold text-indigo-500">{fullName[0]?.toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                member.status === 'active'      ? 'bg-green-100 text-green-700' :
                member.status === 'inactive'    ? 'bg-gray-100 text-gray-500'  :
                member.status === 'visitor'     ? 'bg-amber-100 text-amber-700' :
                member.status === 'transferred' ? 'bg-blue-100 text-blue-600'   :
                'bg-red-100 text-red-600'
              }`}>
                {member.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-2">
              {member.email && <span className="flex items-center gap-1.5"><Mail size={13} />{member.email}</span>}
              {member.phone && <span className="flex items-center gap-1.5"><Phone size={13} />{member.phone}</span>}
              {member.city && <span className="flex items-center gap-1.5"><MapPin size={13} />{member.city}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Two-column detail grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">

        {/* Personal Information */}
        <SectionCard title="Personal Information" icon={UserIcon}>
          <InfoRow icon={UserIcon} label="Full Name" value={fullName} />
          <InfoRow icon={UserIcon} label="Gender" value={member.gender === 'M' ? 'Male' : member.gender === 'F' ? 'Female' : member.gender === 'O' ? 'Other' : ''} />
          <InfoRow icon={Calendar} label="Date of Birth" value={formatDate(member.date_of_birth)} />
          <InfoRow icon={Heart} label="Marital Status" value={member.marital_status} />
          <InfoRow icon={Briefcase} label="Occupation" value={member.occupation} />
        </SectionCard>

        {/* Contact Details */}
        <SectionCard title="Contact Details" icon={Phone}>
          <InfoRow icon={Mail} label="Email Address" value={member.email} />
          <InfoRow icon={Phone} label="Phone Number" value={member.phone} />
          <InfoRow icon={Phone} label="Alternate Phone" value={member.alternate_phone} />
          <InfoRow icon={MapPin} label="Address" value={member.address} />
          <InfoRow icon={MapPin} label="City / State / PIN" value={
            [member.city, member.state, member.zip_code].filter(Boolean).join(', ') || ''
          } />
        </SectionCard>

        {/* Church Information */}
        <SectionCard title="Church Information" icon={Home}>
          <InfoRow icon={Calendar} label="Membership Date" value={formatDate(member.membership_date)} />
          <InfoRow icon={Calendar} label="Baptism Date" value={formatDate(member.baptism_date)} />
          <InfoRow icon={Home} label="Family" value={family ? `${family.name} (${family.family_id})` : ''} />
        </SectionCard>

        {/* Emergency Contact */}
        <SectionCard title="Emergency Contact" icon={AlertCircle}>
          <InfoRow icon={UserIcon} label="Contact Name" value={member.emergency_contact_name} />
          <InfoRow icon={Phone} label="Contact Phone" value={member.emergency_contact_phone} />
        </SectionCard>
      </div>

      {/* Notes */}
      {member.notes && (
        <div className="mb-6">
          <SectionCard title="Additional Notes" icon={FileText}>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{member.notes}</p>
          </SectionCard>
        </div>
      )}

      {/* Documents */}
      {documents.length > 0 && (
        <div className="mb-6">
          <SectionCard title={`Documents & Certificates (${documents.length})`} icon={FileText}>
            <div className="space-y-2">
              {documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl">
                  <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shrink-0 border border-gray-100">
                    {(doc.file || '').match(/\.(jpg|jpeg|png)$/i)
                      ? <ImageIcon size={16} className="text-green-500" />
                      : <FileText size={16} className="text-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{doc.title}</p>
                    <p className="text-xs text-gray-400">{doc.doc_type} · {new Date(doc.uploaded_at).toLocaleDateString('en-IN')}</p>
                  </div>
                  <a href={doc.file} target="_blank" rel="noreferrer"
                    className="w-8 h-8 flex items-center justify-center text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors shrink-0">
                    <EyeIcon size={14} />
                  </a>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* Family & Family Members section */}
      {family ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                <Home size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">{family.name}</p>
                <p className="text-xs text-gray-400">
                  {family.email && <>{family.email} · </>}{family.phone || ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold tracking-widest font-mono">
                {family.family_id}
              </span>
              <button onClick={() => router.push(`/families/${family.id}/edit`)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded hover:bg-indigo-100 transition-colors">
                View Family →
              </button>
            </div>
          </div>

          <div className="p-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
              Other Family Members ({famMembers.filter((fm: any) => fm.id !== memberId).length})
            </p>
            {famMembers.filter((fm: any) => fm.id !== memberId).length === 0 ? (
              <p className="text-sm text-gray-400">No other members in this family.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {famMembers.filter((fm: any) => fm.id !== memberId).map((fm: any) => {
                  const fmName = fm.full_name || `${fm.first_name} ${fm.last_name}`;
                  return (
                    <button
                      key={fm.id}
                      onClick={() => router.push(`/members/${fm.id}`)}
                      className="flex items-center gap-2.5 bg-gray-50 hover:bg-indigo-50 rounded-xl px-3 py-2.5 border border-gray-100 hover:border-indigo-200 transition-colors text-left"
                    >
                      <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                        {fmName[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{fmName}</p>
                        <span className={`inline-block px-1.5 py-0.5 rounded-full text-xs font-medium capitalize mt-0.5 ${
                          fm.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>{fm.status}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Home size={28} className="mx-auto text-gray-200 mb-2" />
          <p className="text-sm font-medium text-gray-500">Not assigned to any family</p>
          <button onClick={() => router.push(`/members/${memberId}/edit`)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium mt-1">
            Edit member to assign a family
          </button>
        </div>
      )}

      {deleteOpen && (
        <ConfirmDialog
          title="Delete Member"
          message="Are you sure you want to delete this member? This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteOpen(false)}
        />
      )}
    </DashboardLayout>
  );
}

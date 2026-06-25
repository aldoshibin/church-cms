'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { rolesApi } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import { ArrowLeft, Save, Check, Shield } from 'lucide-react';
import { MENU_ITEMS } from './MENU_ITEMS';

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

interface Props { roleId?: number; }

export default function RoleForm({ roleId }: Props) {
  const router = useRouter();
  const isEdit = !!roleId;

  const [name,        setName]        = useState('');
  const [description, setDescription] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [saving,  setSaving]  = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [errors,  setErrors]  = useState<Record<string, string>>({});

  useEffect(() => {
    if (roleId) {
      setLoading(true);
      rolesApi.get(roleId)
        .then(({ data }) => {
          setName(data.name || '');
          setDescription(data.description || '');
          setIsSuperAdmin(data.is_super_admin || false);
          setSelectedKeys(data.menu_permissions || []);
        })
        .catch(() => { toast.error('Load failed'); router.push('/users/roles'); })
        .finally(() => setLoading(false));
    }
  }, [roleId]);

  const toggleKey = (key: string) =>
    setSelectedKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setErrors({});
    try {
      const payload = {
        name,
        description,
        is_super_admin: isSuperAdmin,
        menu_permissions: isSuperAdmin ? MENU_ITEMS.map(m => m.key) : selectedKeys,
      };
      if (isEdit) await rolesApi.update(roleId!, payload);
      else        await rolesApi.create(payload);
      toast.success(isEdit ? 'Role updated' : 'Role created successfully');
      router.push('/users/roles');
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
        <span className="text-sm">Loading role data...</span>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

        {/* ── Role Details ── */}
        <SectionHead title="Role Details" />
        <div className="p-6 grid grid-cols-2 gap-5">
          <div>
            <FieldLabel label="Role Name" required />
            <input value={name} onChange={e => setName(e.target.value)} required
              placeholder="e.g. Accountant, Usher, Volunteer Coordinator"
              className={errors.name ? errInp : inp} />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <FieldLabel label="Description" />
            <input value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Optional short description"
              className={inp} />
          </div>
        </div>

        {/* ── Super Admin toggle ── */}
        <SectionHead title="Access Level" />
        <div className="p-6">
          <button
            type="button"
            onClick={() => setIsSuperAdmin(v => !v)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-colors text-left ${
              isSuperAdmin ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isSuperAdmin ? 'bg-amber-400 text-white' : 'bg-gray-100 text-gray-400'
            }`}>
              <Shield size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-800">Super Admin — Full Access</p>
              <p className="text-xs text-gray-500">Bypasses menu restrictions and sees every sidebar item automatically.</p>
            </div>
            <div style={{
              width: 20, height: 20, borderRadius: 6,
              border: isSuperAdmin ? 'none' : '2px solid #d1d5db',
              background: isSuperAdmin ? '#f59e0b' : 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {isSuperAdmin && <Check size={13} color="white" strokeWidth={3} />}
            </div>
          </button>
        </div>

        {/* ── Sidebar Menu Permissions ── */}
        {!isSuperAdmin && (
          <>
            <SectionHead title={`Sidebar Menu Access (${selectedKeys.length} of ${MENU_ITEMS.length} selected)`} />
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <button type="button" onClick={() => setSelectedKeys(MENU_ITEMS.map(m => m.key))}
                  className="text-xs text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg font-medium border border-indigo-200">
                  Select All
                </button>
                <button type="button" onClick={() => setSelectedKeys([])}
                  className="text-xs text-gray-500 hover:bg-gray-100 px-3 py-1.5 rounded-lg font-medium border border-gray-200">
                  Clear All
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {MENU_ITEMS.map(item => {
                  const isOn = selectedKeys.includes(item.key);
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => toggleKey(item.key)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                        isOn ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div style={{
                        width: 18, height: 18, borderRadius: 5,
                        border: isOn ? 'none' : '2px solid #d1d5db',
                        background: isOn ? '#4f46e5' : 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {isOn && <Check size={11} color="white" strokeWidth={3} />}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <button type="button" onClick={() => router.push('/users/roles')}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft size={15} /> Back to Roles
          </button>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {saving
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
              : <><Save size={15} />{isEdit ? 'Update Role' : 'Save Role'}</>}
          </button>
        </div>

      </div>
    </form>
  );
}

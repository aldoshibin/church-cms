'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { usersApi, rolesApi } from '@/lib/api';
import { Plus, Edit2, Trash2, Shield, User } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Modal, { FField, FInput, FSelect, FGrid } from '@/components/ui/Modal';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number|null>(null);
  const [form, setForm] = useState({
    email:'', password:'', first_name:'', last_name:'', phone:'',
    role_fk: '' as string | number,
  });
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    try { const { data } = await usersApi.list(); setUsers(data.results||data); } catch {}
  };
  const fetchRoles = async () => {
    try { const { data } = await rolesApi.list(); setRoles(data.results||data); } catch {}
  };
  useEffect(() => { fetchUsers(); fetchRoles(); }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => {
    setForm(f => ({...f,[k]:e.target.value}));
    setErrors(fe => { const n={...fe}; delete n[k]; return n; });
  };

  const openAdd = () => {
    setEditUser(null);
    setForm({ email:'', password:'', first_name:'', last_name:'', phone:'', role_fk: '' });
    setErrors({}); setShowModal(true);
  };

  const openEdit = (u: any) => {
    setEditUser(u);
    setForm({
      email:u.email, password:'', first_name:u.first_name, last_name:u.last_name,
      phone:u.phone||'', role_fk: u.role_fk != null ? String(u.role_fk) : '',
    });
    setErrors({}); setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setErrors({});
    try {
      const payload = {
        email: form.email,
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        role_fk: form.role_fk ? parseInt(String(form.role_fk)) : null,
        ...(editUser ? {} : { password: form.password }),
      };
      if (editUser) await usersApi.update(editUser.id, payload);
      else await usersApi.create(payload);
      setShowModal(false);
      toast.success(editUser?'User updated':'User created', editUser?'User details saved.':'New user created successfully.');
      fetchUsers();
    } catch(err: any) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const fe: Record<string,string> = {};
        Object.entries(data).forEach(([k,v])=>{ fe[k]=Array.isArray(v)?(v as string[]).join(' '):String(v); });
        setErrors(fe); toast.error('Validation error','Please fix the highlighted fields.');
      } else { toast.error('Save failed','An unexpected error occurred.'); }
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await usersApi.delete(deleteId); toast.success('User deleted'); fetchUsers(); }
    catch { toast.error('Delete failed'); }
    finally { setDeleteId(null); }
  };

  return (
    <DashboardLayout title="User Management" subtitle="Manage system users and roles">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 text-sm mt-1">Control access and permissions for church staff</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition-colors">
          <Plus size={14}/> Add User
        </button>
      </div>

      {/* Role summary cards — now driven entirely by YOUR created roles */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {roles.slice(0, 4).map((role: any) => (
          <div key={role.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                role.is_super_admin ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
              }`}>{role.name}</span>
              <Shield size={14} className="text-gray-400"/>
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-2">
              {users.filter(u => u.role_fk === role.id).length}
            </p>
          </div>
        ))}
        {roles.length === 0 && (
          <div className="col-span-4 bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-700">
            No roles created yet. Go to <strong>Users → Roles & Permissions</strong> to create your first role before adding staff users.
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>{["Name","Email","Phone","Role","Actions"].map(h=>(
              <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">{user.first_name[0]}</div>
                    <span className="text-sm font-medium text-gray-800">{user.full_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{user.phone||'-'}</td>
                <td className="px-4 py-3">
                  {user.role_name ? (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.is_super_admin ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {user.role_name}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-red-50 text-red-500 text-xs font-medium rounded-full">
                      No role — cannot log in
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={()=>openEdit(user)} className="text-indigo-500 hover:text-indigo-700 transition-colors"><Edit2 size={14}/></button>
                    <button onClick={()=>setDeleteId(user.id)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal
          title={editUser?'Edit User':'Add User'}
          subtitle={editUser?`Editing ${editUser.full_name}`:'Create a new staff account'}
          icon={<User size={16} className="text-white"/>}
          formId="user-form"
          onClose={()=>setShowModal(false)}
          onSubmit={handleSubmit}
          saving={saving}
          saveLabel={editUser?'Update':'Create'}
        >
          <FGrid>
            <FField label="First name" required error={errors.first_name}>
              <FInput required value={form.first_name} onChange={set('first_name')} placeholder="John" error={errors.first_name}/>
            </FField>
            <FField label="Last name" required error={errors.last_name}>
              <FInput required value={form.last_name} onChange={set('last_name')} placeholder="Smith" error={errors.last_name}/>
            </FField>
          </FGrid>
          <FField label="Email address" required error={errors.email}>
            <FInput required type="email" value={form.email} onChange={set('email')} placeholder="john@church.com" error={errors.email}/>
          </FField>
          {!editUser && (
            <FField label="Password" required error={errors.password}>
              <FInput required type="password" value={form.password} onChange={set('password')} placeholder="Min 6 characters" error={errors.password}/>
            </FField>
          )}
          <FField label="Phone" error={errors.phone}>
            <FInput value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210"/>
          </FField>

          {/* The ONLY role field now — sourced entirely from Roles & Permissions */}
          <FField label="Role" required error={errors.role_fk}>
            <FSelect required value={String(form.role_fk)} onChange={set('role_fk')} error={errors.role_fk}>
              <option value="">Select a role...</option>
              {roles.map((r: any) => (
                <option key={r.id} value={r.id}>
                  {r.name}{r.is_super_admin ? ' (Full Access)' : ''}
                </option>
              ))}
            </FSelect>
          </FField>

          {roles.length === 0 && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-600">
              No roles exist yet. Create one first under <strong>Users → Roles & Permissions</strong>, then come back here.
            </div>
          )}

          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-700">
            The selected role controls exactly which sidebar menus this user can see after logging in.
          </div>
        </Modal>
      )}

      {deleteId && (
        <ConfirmDialog title="Delete User" message="Are you sure you want to delete this user?" confirmLabel="Delete" onConfirm={handleDelete} onCancel={()=>setDeleteId(null)}/>
      )}
    </DashboardLayout>
  );
}

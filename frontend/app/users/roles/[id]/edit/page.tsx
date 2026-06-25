'use client';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RoleForm from '@/components/roles/RoleForm';

export default function EditRolePage() {
  const params = useParams();
  const roleId = params?.id ? parseInt(String(params.id)) : undefined;

  return (
    <DashboardLayout title="Edit Role" subtitle="Update role permissions">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Role</h1>
        <p className="text-gray-500 text-sm mt-1">Update the menu access for this role.</p>
      </div>
      {roleId ? <RoleForm roleId={roleId} /> : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">Invalid role ID</div>
      )}
    </DashboardLayout>
  );
}

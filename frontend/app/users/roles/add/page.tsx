'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RoleForm from '@/components/roles/RoleForm';

export default function AddRolePage() {
  return (
    <DashboardLayout title="Add Role" subtitle="Define a new staff role and its menu access">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add New Role</h1>
        <p className="text-gray-500 text-sm mt-1">Name the role and choose which sidebar menus it can see.</p>
      </div>
      <RoleForm />
    </DashboardLayout>
  );
}

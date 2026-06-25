'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MemberForm from '@/components/members/MemberForm';

export default function AddMemberPage() {
  return (
    <DashboardLayout title="Add Member" subtitle="Fill in the details to add a new member">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add New Member</h1>
        <p className="text-gray-500 text-sm mt-1">Fill in the details below and click Save Member.</p>
      </div>
      <MemberForm />
    </DashboardLayout>
  );
}
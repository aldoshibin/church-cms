'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MinistryForm from '@/components/ministries/MinistryForm';

export default function AddMinistryPage() {
  return (
    <DashboardLayout title="Add Ministry" subtitle="Create a new ministry or group">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add New Ministry</h1>
        <p className="text-gray-500 text-sm mt-1">Fill in the details, assign members, and click Save Ministry.</p>
      </div>
      <MinistryForm />
    </DashboardLayout>
  );
}

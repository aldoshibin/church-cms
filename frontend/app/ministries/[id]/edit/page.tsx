'use client';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MinistryForm from '@/components/ministries/MinistryForm';

export default function EditMinistryPage() {
  const params     = useParams();
  const ministryId = params?.id ? parseInt(String(params.id)) : undefined;

  return (
    <DashboardLayout title="Edit Ministry" subtitle="Update ministry details and members">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Ministry</h1>
        <p className="text-gray-500 text-sm mt-1">Update the ministry details below.</p>
      </div>
      {ministryId ? (
        <MinistryForm ministryId={ministryId} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          Invalid ministry ID
        </div>
      )}
    </DashboardLayout>
  );
}

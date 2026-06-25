'use client';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import FamilyForm from '@/components/families/FamilyForm';

export default function EditFamilyPage() {
  const params   = useParams();
  const familyId = params?.id ? parseInt(String(params.id)) : undefined;

  return (
    <DashboardLayout title="Edit Family" subtitle="Update family details and member assignments">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Family</h1>
        <p className="text-gray-500 text-sm mt-1">Update the family details below.</p>
      </div>
      {familyId ? (
        <FamilyForm familyId={familyId} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          Invalid family ID
        </div>
      )}
    </DashboardLayout>
  );
}

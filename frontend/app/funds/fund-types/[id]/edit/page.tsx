'use client';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TypeForm from '@/components/finance/TypeForm';
import { fundTypesApi } from '@/lib/api';

export default function EditFundTypePage() {
  const params = useParams();
  const typeId = params?.id ? parseInt(String(params.id)) : undefined;

  return (
    <DashboardLayout title="Edit Fund Type" subtitle="Update this fund type">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Fund Type</h1>
      </div>
      {typeId ? (
        <TypeForm typeId={typeId} api={fundTypesApi} backPath="/funds/fund-types" entityLabel="Fund Type" placeholder="e.g. Scholarship Fund" />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">Invalid ID</div>
      )}
    </DashboardLayout>
  );
}

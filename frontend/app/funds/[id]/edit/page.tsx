'use client';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import FundForm from '@/components/finance/FundForm';

export default function EditFundPage() {
  const params = useParams();
  const fundId = params?.id ? parseInt(String(params.id)) : undefined;

  return (
    <DashboardLayout title="Edit Fund" subtitle="Update fund details">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Fund</h1>
      </div>
      {fundId ? (
        <FundForm fundId={fundId} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">Invalid fund ID</div>
      )}
    </DashboardLayout>
  );
}

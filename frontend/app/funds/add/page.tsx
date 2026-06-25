'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import FundForm from '@/components/finance/FundForm';

export default function AddFundPage() {
  return (
    <DashboardLayout title="Create Fund" subtitle="Set up a new giving fund">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Fund</h1>
        <p className="text-gray-500 text-sm mt-1">Fill in the details and click Save Fund.</p>
      </div>
      <FundForm />
    </DashboardLayout>
  );
}

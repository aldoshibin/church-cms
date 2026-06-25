'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TypeForm from '@/components/finance/TypeForm';
import { fundTypesApi } from '@/lib/api';

export default function AddFundTypePage() {
  return (
    <DashboardLayout title="Add Fund Type" subtitle="Create a new giving fund category">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add Fund Type</h1>
        <p className="text-gray-500 text-sm mt-1">This will appear in the Fund Type dropdown when creating a fund.</p>
      </div>
      <TypeForm api={fundTypesApi} backPath="/funds/fund-types" entityLabel="Fund Type" placeholder="e.g. Scholarship Fund" />
    </DashboardLayout>
  );
}

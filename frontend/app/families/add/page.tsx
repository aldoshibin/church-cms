'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import FamilyForm from '@/components/families/FamilyForm';

export default function AddFamilyPage() {
  return (
    <DashboardLayout title="Add Family" subtitle="Fill in the details to register a new family">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add New Family</h1>
        <p className="text-gray-500 text-sm mt-1">
          Fill in the family details, assign members, and click Save Family.
        </p>
      </div>
      <FamilyForm />
    </DashboardLayout>
  );
}

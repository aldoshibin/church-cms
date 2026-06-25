'use client';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TypeForm from '@/components/finance/TypeForm';
import { expenseCategoriesApi } from '@/lib/api';

export default function EditExpenseCategoryPage() {
  const params = useParams();
  const typeId = params?.id ? parseInt(String(params.id)) : undefined;

  return (
    <DashboardLayout title="Edit Category" subtitle="Update this expense category">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Expense Category</h1>
      </div>
      {typeId ? (
        <TypeForm typeId={typeId} api={expenseCategoriesApi} backPath="/expenses/categories" entityLabel="Expense Category" placeholder="e.g. Travel, Insurance..." />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">Invalid ID</div>
      )}
    </DashboardLayout>
  );
}

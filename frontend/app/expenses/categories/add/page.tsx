'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TypeForm from '@/components/finance/TypeForm';
import { expenseCategoriesApi } from '@/lib/api';

export default function AddExpenseCategoryPage() {
  return (
    <DashboardLayout title="Add Category" subtitle="Create a new expense category">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add Expense Category</h1>
        <p className="text-gray-500 text-sm mt-1">This will appear in the Category dropdown when recording an expense.</p>
      </div>
      <TypeForm api={expenseCategoriesApi} backPath="/expenses/categories" entityLabel="Expense Category" placeholder="e.g. Travel, Insurance..." />
    </DashboardLayout>
  );
}

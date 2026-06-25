'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ExpenseForm from '@/components/finance/ExpenseForm';

export default function AddExpensePage() {
  return (
    <DashboardLayout title="Add Expense" subtitle="Record a new church expense">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add Expense</h1>
        <p className="text-gray-500 text-sm mt-1">Fill in the details and click Save Expense.</p>
      </div>
      <ExpenseForm />
    </DashboardLayout>
  );
}

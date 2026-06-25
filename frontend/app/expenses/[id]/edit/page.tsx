'use client';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ExpenseForm from '@/components/finance/ExpenseForm';

export default function EditExpensePage() {
  const params = useParams();
  const expenseId = params?.id ? parseInt(String(params.id)) : undefined;

  return (
    <DashboardLayout title="Edit Expense" subtitle="Update expense details">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Expense</h1>
      </div>
      {expenseId ? (
        <ExpenseForm expenseId={expenseId} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">Invalid expense ID</div>
      )}
    </DashboardLayout>
  );
}

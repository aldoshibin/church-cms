'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DonationForm from '@/components/finance/DonationForm';

export default function AddDonationPage() {
  return (
    <DashboardLayout title="Record Donation" subtitle="Add a new donation record">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Record Donation</h1>
        <p className="text-gray-500 text-sm mt-1">Fill in the details and click Record Donation.</p>
      </div>
      <DonationForm />
    </DashboardLayout>
  );
}

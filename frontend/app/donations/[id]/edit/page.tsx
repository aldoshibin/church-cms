'use client';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DonationForm from '@/components/finance/DonationForm';

export default function EditDonationPage() {
  const params = useParams();
  const donationId = params?.id ? parseInt(String(params.id)) : undefined;

  return (
    <DashboardLayout title="Edit Donation" subtitle="Update donation details">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Donation</h1>
      </div>
      {donationId ? (
        <DonationForm donationId={donationId} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">Invalid donation ID</div>
      )}
    </DashboardLayout>
  );
}

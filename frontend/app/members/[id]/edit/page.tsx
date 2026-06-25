'use client';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MemberForm from '@/components/members/MemberForm';

export default function EditMemberPage() {
  const params   = useParams();
  const memberId = params?.id ? parseInt(String(params.id)) : undefined;

  return (
    <DashboardLayout title="Edit Member" subtitle="Update member details">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Member</h1>
        <p className="text-gray-500 text-sm mt-1">Update the member details below.</p>
      </div>
      {memberId ? (
        <MemberForm memberId={memberId} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          Invalid member ID
        </div>
      )}
    </DashboardLayout>
  );
}
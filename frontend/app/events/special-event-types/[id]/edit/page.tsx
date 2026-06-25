'use client';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EventTypeForm from '@/components/event-types/EventTypeForm';
import { specialEventTypesApi } from '@/lib/api';

export default function EditSpecialEventTypePage() {
  const params = useParams();
  const typeId = params?.id ? parseInt(String(params.id)) : undefined;

  return (
    <DashboardLayout title="Edit Event Type" subtitle="Update this type">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Special Event Type</h1>
      </div>
      {typeId ? (
        <EventTypeForm typeId={typeId} api={specialEventTypesApi} backPath="/events/special-event-types" entityLabel="Special Event Type" />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">Invalid ID</div>
      )}
    </DashboardLayout>
  );
}

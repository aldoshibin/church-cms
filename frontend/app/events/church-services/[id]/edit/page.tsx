'use client';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EventForm from '@/components/events/EventForm';

export default function EditChurchServicePage() {
  const params  = useParams();
  const eventId = params?.id ? parseInt(String(params.id)) : undefined;
  return (
    <DashboardLayout title="Edit Church Service" subtitle="Update service details">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Church Service</h1>
        <p className="text-gray-500 text-sm mt-1">Update the service details below.</p>
      </div>
      {eventId ? <EventForm eventId={eventId} eventKind="service" /> : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">Invalid event ID</div>
      )}
    </DashboardLayout>
  );
}

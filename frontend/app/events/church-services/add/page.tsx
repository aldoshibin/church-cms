'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EventForm from '@/components/events/EventForm';

export default function AddChurchServicePage() {
  return (
    <DashboardLayout title="Add Church Service" subtitle="Schedule a new worship service or meeting">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add Church Service</h1>
        <p className="text-gray-500 text-sm mt-1">Fill in the details and click Save Event.</p>
      </div>
      <EventForm eventKind="service" />
    </DashboardLayout>
  );
}

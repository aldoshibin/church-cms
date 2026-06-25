'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EventForm from '@/components/events/EventForm';

export default function AddSpecialEventPage() {
  return (
    <DashboardLayout title="Add Special Event" subtitle="Create a new special event">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add Special Event</h1>
        <p className="text-gray-500 text-sm mt-1">Fill in the details and click Save Event.</p>
      </div>
      <EventForm eventKind="special" />
    </DashboardLayout>
  );
}

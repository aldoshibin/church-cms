'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EventTypeForm from '@/components/event-types/EventTypeForm';
import { specialEventTypesApi } from '@/lib/api';

export default function AddSpecialEventTypePage() {
  return (
    <DashboardLayout title="Add Event Type" subtitle="Create a new Special Event type">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add Special Event Type</h1>
        <p className="text-gray-500 text-sm mt-1">This will appear in the Event Type dropdown for Special Events.</p>
      </div>
      <EventTypeForm api={specialEventTypesApi} backPath="/events/special-event-types" entityLabel="Special Event Type" />
    </DashboardLayout>
  );
}

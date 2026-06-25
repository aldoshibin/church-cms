'use client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EventTypeForm from '@/components/event-types/EventTypeForm';
import { serviceTypesApi } from '@/lib/api';

export default function AddServiceTypePage() {
  return (
    <DashboardLayout title="Add Service Type" subtitle="Create a new Church Service type">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add Service Type</h1>
        <p className="text-gray-500 text-sm mt-1">This will appear in the Event Type dropdown for Church Services.</p>
      </div>
      <EventTypeForm api={serviceTypesApi} backPath="/events/service-types" entityLabel="Service Type" />
    </DashboardLayout>
  );
}

'use client';
import EventListPage from '@/components/events/EventListPage';

export default function SpecialEventsPage() {
  return (
    <EventListPage
      eventKind="special"
      title="Special Events"
      subtitle="Fellowship, outreach, youth events and more"
      addPath="/events/special-events/add"
      editPath={(id) => `/events/special-events/${id}/edit`}
      typeFilter={['fellowship', 'outreach', 'youth', 'other']}
    />
  );
}

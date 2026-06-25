'use client';
import EventListPage from '@/components/events/EventListPage';

export default function ChurchServicesPage() {
  return (
    <EventListPage
      eventKind="service"
      title="Church Services"
      subtitle="Worship services, Bible studies, choir and meetings"
      addPath="/events/church-services/add"
      editPath={(id) => `/events/church-services/${id}/edit`}
      typeFilter={['service', 'bible_study', 'choir', 'meeting']}
    />
  );
}

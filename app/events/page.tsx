import { backendFetch } from '@/app/lib/backend';
import type { EventItem } from '@/app/api_services/eventService';
import type { Metadata } from 'next';
import EventsClient from './EventsClient';

export const metadata: Metadata = {
  title: 'Events',
  description:
    'Hikes, road trips, bootcamps and outdoor fitness events with Berry Fitness for Health in Kenya.',
  alternates: { canonical: '/events' },
  openGraph: {
    title: 'Fitness Events | Berry Fitness for Health',
    description:
      'Hikes, road trips, bootcamps and outdoor fitness events with Berry Fitness for Health.',
    url: '/events',
  },
};

export default async function Page() {
  // Fetched on the server so events and their photos arrive with the page.
  let initialEvents: EventItem[] | undefined;
  try {
    const res = await backendFetch('/api/v1/events', { cache: 'no-store' });
    if (res.ok) initialEvents = ((await res.json()) as { events: EventItem[] }).events;
  } catch {
    // The client fetches them instead and shows its own error state.
  }
  return <EventsClient initialEvents={initialEvents} />;
}

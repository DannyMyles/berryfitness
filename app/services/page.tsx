import type { Metadata } from 'next';
import ServicesClient from './ServicesClient';
import { backendFetch } from '@/app/lib/backend';
import type { Training } from '@/app/api_services/trainingService';

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Weight management, kick boxing, aerobics, body building, outdoor fitness and team building, diet and nutrition, kids and weight loss programs with Berry Fitness for Health in Nairobi.',
  alternates: { canonical: '/services' },
  openGraph: {
    title: 'Training Services | Berry Fitness for Health',
    description:
      'Weight management, kick boxing, aerobics, body building, nutrition, kids and weight loss programs.',
    url: '/services',
  },
};

/** Loaded on the server so the list is in the page even if browser requests fail; null falls back to a client fetch. */
async function loadTrainings(): Promise<Training[] | null> {
  try {
    const res = await backendFetch('/api/v1/trainings', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    const list = Array.isArray(data) ? data : data.trainings;
    return Array.isArray(list) ? list : null;
  } catch {
    return null;
  }
}

export default async function Page() {
  const initialTrainings = await loadTrainings();
  return <ServicesClient initialTrainings={initialTrainings} />;
}

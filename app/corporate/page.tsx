import type { Metadata } from 'next';
import CorporateClient from './CorporateClient';

export const metadata: Metadata = {
  title: 'Corporate Fitness & Team Building',
  description:
    'Outdoor fitness, team building, bootcamps, hikes and group corporate fitness sessions with Berry Fitness for Health. Request a tailored quote.',
  alternates: { canonical: '/corporate' },
  openGraph: {
    title: 'Corporate Fitness & Team Building | Berry Fitness for Health',
    description: 'Outdoor fitness, team building and group corporate fitness sessions for your team.',
    url: '/corporate',
  },
};

export default function Page() {
  return <CorporateClient />;
}

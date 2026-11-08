import type { Metadata } from 'next';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  description:
    'Personal training, weight management, kick boxing, aerobics, body building, kids fitness, nutrition plans and outdoor team building with Berry Fitness for Health in Nairobi, Kenya.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Berry Fitness for Health | Body Goals and Health',
    description:
      'Your ultimate best personal trainer is a phone call away. Personal training and fitness programs in Nairobi, Kenya.',
    url: '/',
  },
};

export default function Page() {
  return <HomeClient />;
}

import type { Metadata } from 'next';
import AboutClient from './AboutClient';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Berry Fitness for Health is a comprehensive physical fitness program in Nairobi — personalized workout plans, nutritional guidance and experienced fitness professionals for every fitness level.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About Berry Fitness for Health',
    description:
      'Personalized workout plans, nutritional guidance and experienced fitness professionals in Nairobi, Kenya.',
    url: '/about',
  },
};

export default function Page() {
  return <AboutClient />;
}

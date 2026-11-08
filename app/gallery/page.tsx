import type { Metadata } from 'next';
import GalleryClient from './GalleryClient';

export const metadata: Metadata = {
  title: 'Photo Gallery',
  description:
    'Explore moments from hikes, bootcamps, classes and training sessions with Berry Fitness for Health in Nairobi, Kenya.',
  alternates: { canonical: '/gallery' },
  openGraph: {
    title: 'Photo Gallery | Berry Fitness for Health',
    description: 'Explore moments from hikes, bootcamps, classes and training sessions.',
    url: '/gallery',
  },
};

export default function Page() {
  return <GalleryClient />;
}

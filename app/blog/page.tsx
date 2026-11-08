import type { Metadata } from 'next';
import BlogClient from './BlogClient';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Fitness tips, training advice, and updates from Berry Fitness for Health.',
  alternates: { canonical: '/blog' },
};

export default function Page() {
  return <BlogClient />;
}

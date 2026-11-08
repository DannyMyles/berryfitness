import type { Metadata } from 'next';
import ShopClient from './ShopClient';

export const metadata: Metadata = {
  title: 'Shop',
  description:
    'Official Berry Fitness merchandise — hoodies, t-shirts, unisex vest hoodies and ladies crop tops.',
  alternates: { canonical: '/shop' },
  openGraph: {
    title: 'Store | Berry Fitness for Health',
    description: 'Official Berry Fitness merchandise — hoodies, t-shirts, vest hoodies and crop tops.',
    url: '/shop',
  },
};

export default function Page() {
  return <ShopClient />;
}

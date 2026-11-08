import type { Metadata } from 'next';
import { Suspense } from 'react';
import UnsubscribeClient from './UnsubscribeClient';

export const metadata: Metadata = {
  title: 'Unsubscribe',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense>
      <UnsubscribeClient />
    </Suspense>
  );
}

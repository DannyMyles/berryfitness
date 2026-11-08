import type { Metadata } from 'next';
import { Suspense } from 'react';
import RegisterClient from './RegisterClient';

export const metadata: Metadata = {
  title: 'Create Account',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense>
      <RegisterClient />
    </Suspense>
  );
}

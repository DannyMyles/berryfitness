import type { Metadata } from 'next';
import { Suspense } from 'react';
import VerifyEmailClient from './VerifyEmailClient';

export const metadata: Metadata = {
  title: 'Verify Email',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense>
      <VerifyEmailClient />
    </Suspense>
  );
}

import type { Metadata } from 'next';
import { Suspense } from 'react';
import ResetPasswordClient from './ResetPasswordClient';

export const metadata: Metadata = {
  title: 'Reset Password',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense>
      <ResetPasswordClient />
    </Suspense>
  );
}

import type { Metadata } from 'next';
import { Suspense } from 'react';
import LoginClient from './LoginClient';

export const metadata: Metadata = {
  title: 'Sign In',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense>
      <LoginClient />
    </Suspense>
  );
}

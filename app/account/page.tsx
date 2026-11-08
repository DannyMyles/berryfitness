import type { Metadata } from 'next';
import AccountClient from './AccountClient';

export const metadata: Metadata = {
  title: 'My Account',
  description: 'View your Berry Fitness merchandise orders and event tickets.',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AccountClient />;
}

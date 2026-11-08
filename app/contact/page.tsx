import type { Metadata } from 'next';
import ContactClient from './ContactClient';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    "Get in touch with Berry Fitness for Health in Nairobi, Kenya — phone, email and WhatsApp. Open 5:00AM to 9:00PM.",
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact Berry Fitness for Health',
    description: 'Your ultimate best personal trainer is a phone call away.',
    url: '/contact',
  },
};

export default function Page() {
  return <ContactClient />;
}

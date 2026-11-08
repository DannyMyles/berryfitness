import type { Metadata } from 'next';
import { RefreshCw } from 'lucide-react';
import LegalPageLayout from '@/components/ui/LegalPageLayout';
import { getSite, telHref } from '@/app/lib/site';

export const metadata: Metadata = {
  title: 'Refund & Returns Policy',
  description:
    'Our policy on returns, exchanges, cancellations, and refunds for Berry Fitness store orders and event bookings.',
  alternates: { canonical: '/refund-policy' },
  openGraph: {
    title: 'Refund & Returns Policy | Berry Fitness for Health',
    description:
      'Our policy on returns, exchanges, cancellations, and refunds for Berry Fitness store orders and event bookings.',
    url: '/refund-policy',
  },
};

export default async function RefundPolicyPage() {
  const site = await getSite();
  const email = site.contactEmail || 'info@berryfitnessforhealth.com';
  const phone = site.contactPhone || '+254 727 625 970';
  return (
    <LegalPageLayout
      title="Refund & Returns Policy"
      subtitle="How returns, exchanges, and refunds work for shop orders and event bookings."
      lastUpdated="26 July 2026"
      icon={RefreshCw}
    >
      <h2>1. Shop Orders — Returns & Exchanges</h2>
      <p>
        We want you happy with your Berry Fitness merchandise gear. If something isn't right, we accept returns and
        exchanges under the following conditions:
      </p>
      <ul>
        <li>Request a return or exchange within <strong>7 days</strong> of receiving your order.</li>
        <li>Items must be unworn, unwashed, and in their original condition with tags attached.</li>
        <li>To start a return or exchange, contact us with your order number at <a href={`mailto:${email}`}>{email}</a> or on WhatsApp.</li>
        <li>For a sizing exchange, we'll arrange a swap for the correct size, subject to availability.</li>
        <li>Return shipping is covered by the customer unless the item arrived damaged or incorrect, in which case we cover the cost.</li>
      </ul>

      <h2>2. Non-Returnable Items</h2>
      <ul>
        <li>Items marked as final sale at the time of purchase</li>
        <li>Items that show signs of wear, washing, or damage not present on delivery</li>
      </ul>

      <h2>3. Damaged or Incorrect Items</h2>
      <p>
        If your order arrives damaged, defective, or different from what you ordered, contact us within 48 hours
        of delivery with photos of the item. We'll arrange a replacement or full refund at no extra cost to you.
      </p>

      <h2>4. Refunds</h2>
      <ul>
        <li>Approved refunds are returned using the same method you paid with, as agreed with you on WhatsApp.</li>
        <li>Refunds are processed within 5–7 business days of us receiving and inspecting the returned item.</li>
        <li>Shipping fees are non-refundable except where the return is due to our error (damaged or incorrect item).</li>
      </ul>

      <h2>5. Order Cancellations</h2>
      <p>
        You may cancel an order for a full refund before it has shipped. Once an order has shipped, our standard
        return process (Section 1) applies instead. To cancel, contact us as soon as possible with your order
        number.
      </p>

      <h2>6. Event & Session Bookings</h2>
      <ul>
        <li>Cancel a paid event registration at least 48 hours before the event for a full refund.</li>
        <li>Cancellations within 48 hours of the event are non-refundable, but we're happy to transfer your booking to a future session where possible.</li>
        <li>If we cancel or reschedule an event, you'll receive a full refund or the option to move to the new date.</li>
      </ul>

      <h2>7. Contact Us</h2>
      <p>
        For any return, exchange, refund, or cancellation request, reach us at{' '}
        <a href={`mailto:${email}`}>{email}</a> or{' '}
        <a href={telHref(phone)}>{phone}</a>.
      </p>
    </LegalPageLayout>
  );
}

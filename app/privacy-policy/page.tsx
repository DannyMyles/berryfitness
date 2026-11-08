import type { Metadata } from 'next';
import { ShieldCheck } from 'lucide-react';
import LegalPageLayout from '@/components/ui/LegalPageLayout';
import { getSite, telHref } from '@/app/lib/site';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How Berry Fitness for Health collects, uses, and protects your personal information across our website, shop, and event bookings.',
  alternates: { canonical: '/privacy-policy' },
  openGraph: {
    title: 'Privacy Policy | Berry Fitness for Health',
    description:
      'How Berry Fitness for Health collects, uses, and protects your personal information across our website, shop, and event bookings.',
    url: '/privacy-policy',
  },
};

export default async function PrivacyPolicyPage() {
  const site = await getSite();
  const email = site.contactEmail || 'info@berryfitnessforhealth.com';
  const phone = site.contactPhone || '+254 727 625 970';
  return (
    <LegalPageLayout
      title="Privacy Policy"
      subtitle="Your privacy matters to us. Here's what we collect, why, and how it's protected."
      lastUpdated="26 July 2026"
      icon={ShieldCheck}
    >
      <p>
        This Privacy Policy explains how Berry Fitness for Health ("we", "us", "our") collects, uses, discloses, and
        safeguards your information when you visit our website, create an account, book a training session or
        event, or purchase from the Berry Fitness store. By using our website, you agree to the
        collection and use of information as described here.
      </p>

      <h2>1. Information We Collect</h2>
      <p>We collect information you provide directly to us, including:</p>
      <ul>
        <li><strong>Account information:</strong> name, username, email address, and password (stored as a secure hash — we never store your password in plain text) when you register for an account.</li>
        <li><strong>Order information:</strong> full name, email address, phone number, and shipping address when you place an order in the shop.</li>
        <li><strong>Event registration information:</strong> attendee name and phone number when you register for a training session or event.</li>
        <li><strong>Contact form information:</strong> name, phone number, email address (optional), and the content of any message you send us.</li>
        <li><strong>Newsletter information:</strong> your email address, if you subscribe to updates.</li>
        <li><strong>Payment information:</strong> this website does not take payments. Payment is arranged with you directly on WhatsApp; we only record whether an order has been paid.</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <p>We use the information we collect to:</p>
      <ul>
        <li>Create and manage your account</li>
        <li>Process and fulfil orders, including shipping and payment confirmation</li>
        <li>Confirm event and training session registrations, and send your ticket</li>
        <li>Respond to enquiries submitted through the contact form</li>
        <li>Send order confirmations, event updates, and — where you've opted in — newsletter content</li>
        <li>Maintain the security of our platform and prevent fraud or abuse</li>
        <li>Improve our services and website experience</li>
      </ul>

      <h2>3. How We Share Your Information</h2>
      <p>
        We do not sell your personal information. We share information only where necessary to operate our
        business:
      </p>
      <ul>
        <li>With WhatsApp (Meta), when you choose to send us your order or booking there</li>
        <li>With email delivery providers to send order confirmations, tickets, and account-related emails</li>
        <li>Where required by law, regulation, or a valid legal process</li>
      </ul>

      <h2>4. Data Retention</h2>
      <p>
        We retain your account, order, and registration information for as long as your account is active or as
        needed to provide services, comply with legal obligations, resolve disputes, and enforce our agreements.
        You may request deletion of your account at any time by contacting us — see Section 8.
      </p>

      <h2>5. Data Security</h2>
      <p>
        We use industry-standard measures to protect your information, including password hashing, encrypted
        connections (HTTPS), and access controls on our systems. No method of transmission or storage is 100%
        secure, and we cannot guarantee absolute security.
      </p>

      <h2>6. Children's Privacy</h2>
      <p>
        Our services are not directed at children under 16. We do not knowingly collect personal information
        from children. If you believe a child has provided us with personal information, please contact us so
        we can remove it.
      </p>

      <h2>7. Your Rights</h2>
      <p>Depending on applicable law, you may have the right to:</p>
      <ul>
        <li>Access the personal information we hold about you</li>
        <li>Request correction of inaccurate information</li>
        <li>Request deletion of your account and associated data</li>
        <li>Opt out of newsletter or marketing communications at any time</li>
      </ul>

      <h2>8. Contact Us</h2>
      <p>
        If you have questions about this Privacy Policy or wish to exercise any of your rights, contact us at{' '}
        <a href={`mailto:${email}`}>{email}</a> or{' '}
        <a href={telHref(phone)}>{phone}</a>. We're based in {site.location || 'Nairobi, Kenya'}.
      </p>

      <h2>9. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated
        "Last updated" date. Continued use of our website after changes take effect constitutes acceptance of
        the revised policy.
      </p>
    </LegalPageLayout>
  );
}

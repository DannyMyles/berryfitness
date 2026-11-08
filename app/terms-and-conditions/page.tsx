import type { Metadata } from 'next';
import { FileText } from 'lucide-react';
import LegalPageLayout from '@/components/ui/LegalPageLayout';
import { getSite, telHref } from '@/app/lib/site';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description:
    'The terms that govern your use of the Berry Fitness for Health website, training services, event bookings, and the Berry Fitness store.',
  alternates: { canonical: '/terms-and-conditions' },
  openGraph: {
    title: 'Terms & Conditions | Berry Fitness for Health',
    description:
      'The terms that govern your use of the Berry Fitness for Health website, training services, event bookings, and the Berry Fitness store.',
    url: '/terms-and-conditions',
  },
};

export default async function TermsAndConditionsPage() {
  const site = await getSite();
  const email = site.contactEmail || 'info@berryfitnessforhealth.com';
  const phone = site.contactPhone || '+254 727 625 970';
  return (
    <LegalPageLayout
      title="Terms & Conditions"
      subtitle="The rules of the road for using our website, booking sessions, and shopping with us."
      lastUpdated="26 July 2026"
      icon={FileText}
    >
      <p>
        These Terms & Conditions ("Terms") govern your access to and use of the Berry Fitness for Health website, training
        and coaching services, event bookings, and the Berry Fitness store (together, the "Services"). By
        using our Services, you agree to these Terms. If you do not agree, please do not use our Services.
      </p>

      <h2>1. Accounts</h2>
      <p>
        Some features — booking events, purchasing from the shop, and tracking orders — require an account. You
        are responsible for maintaining the confidentiality of your login credentials and for all activity under
        your account. Provide accurate, current information when registering, and let us know if you believe
        your account has been compromised.
      </p>

      <h2>2. Fitness & Health Disclaimer</h2>
      <p>
        Berry Fitness for Health provides personal training, group classes, and fitness content for general informational and
        motivational purposes. Physical exercise carries inherent risk of injury.
      </p>
      <ul>
        <li>Consult a physician before beginning any exercise program, especially if you have a pre-existing health condition.</li>
        <li>Participate in training sessions and events at your own risk. Inform your trainer of any injuries, conditions, or limitations before a session.</li>
        <li>Results from training vary by individual — we do not guarantee specific fitness outcomes.</li>
        <li>Berry Fitness for Health is not liable for injury, loss, or damage arising from participation in training sessions, classes, or events, except where caused by our gross negligence.</li>
      </ul>

      <h2>3. Event & Session Bookings</h2>
      <ul>
        <li>Registering for an event or session reserves your spot subject to availability and, where applicable, payment confirmation.</li>
        <li>Event bookings are confirmed by us on WhatsApp; for paid events we agree payment with you there.</li>
        <li>We may reschedule or cancel an event due to unforeseen circumstances; where this happens, we'll notify registered attendees and offer a refund or alternative session.</li>
        <li>Please arrive on time — late arrival may affect your ability to participate in that session.</li>
      </ul>

      <h2>4. Shop Purchases</h2>
      <ul>
        <li>Product descriptions, images, and prices on the Berry Fitness store are provided in good faith but may occasionally contain errors; we reserve the right to correct pricing or availability issues before an order is confirmed.</li>
        <li>All prices are listed in US Dollars (USD) and are inclusive of applicable taxes unless stated otherwise.</li>
        <li>Orders are placed online and confirmed with you on WhatsApp, where we agree delivery and payment. No payment is taken on this website.</li>
        <li>See our <a href="/refund-policy">Refund & Returns Policy</a> for details on exchanges, returns, and cancellations.</li>
      </ul>

      <h2>5. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use our Services for any unlawful purpose or in violation of these Terms</li>
        <li>Attempt to gain unauthorized access to our systems, accounts, or data</li>
        <li>Interfere with or disrupt the operation of our website</li>
        <li>Submit false information when creating an account, placing an order, or registering for an event</li>
      </ul>

      <h2>6. Intellectual Property</h2>
      <p>
        All content on this website — including text, graphics, logos, and images — is the property of
        Berry Fitness for Health or its licensors and is protected by applicable intellectual property laws. You may not
        reproduce, distribute, or create derivative works without our written permission.
      </p>

      <h2>7. Limitation of Liability</h2>
      <p>
        To the fullest extent permitted by law, Berry Fitness for Health shall not be liable for any indirect, incidental, or
        consequential damages arising from your use of our Services. Our total liability for any claim relating
        to the Services shall not exceed the amount you paid us for the specific service or product giving rise
        to the claim.
      </p>

      <h2>8. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. Changes take effect once posted on this page with an
        updated "Last updated" date. Continued use of our Services after changes take effect constitutes
        acceptance of the revised Terms.
      </p>

      <h2>9. Governing Law</h2>
      <p>
        These Terms are governed by the laws of Kenya. Any disputes arising from these Terms or your use of our
        Services shall be subject to the exclusive jurisdiction of the courts of Kenya.
      </p>

      <h2>10. Contact Us</h2>
      <p>
        Questions about these Terms? Reach us at{' '}
        <a href={`mailto:${email}`}>{email}</a> or{' '}
        <a href={telHref(phone)}>{phone}</a>.
      </p>
    </LegalPageLayout>
  );
}

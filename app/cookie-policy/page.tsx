import type { Metadata } from 'next';
import { Cookie } from 'lucide-react';
import LegalPageLayout from '@/components/ui/LegalPageLayout';
import { getSite, telHref } from '@/app/lib/site';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description:
    'How Berry Fitness for Health uses cookies and similar technologies like local storage to keep you signed in and remember your shopping cart.',
  alternates: { canonical: '/cookie-policy' },
  openGraph: {
    title: 'Cookie Policy | Berry Fitness for Health',
    description:
      'How Berry Fitness for Health uses cookies and similar technologies like local storage to keep you signed in and remember your shopping cart.',
    url: '/cookie-policy',
  },
};

export default async function CookiePolicyPage() {
  const site = await getSite();
  const email = site.contactEmail || 'info@berryfitnessforhealth.com';
  const phone = site.contactPhone || '+254 727 625 970';
  return (
    <LegalPageLayout
      title="Cookie Policy"
      subtitle="What cookies and similar technologies we use, and why."
      lastUpdated="26 July 2026"
      icon={Cookie}
    >
      <p>
        This Cookie Policy explains how Berry Fitness for Health uses cookies and similar technologies (such as browser local
        storage) when you visit our website. We keep this to the minimum needed to make the site work well —
        we don't use cookies for third-party advertising or tracking.
      </p>

      <h2>1. What Are Cookies?</h2>
      <p>
        Cookies are small text files placed on your device by a website. "Similar technologies" include browser
        local storage, which works like a cookie but is stored differently and isn't automatically sent with
        every request.
      </p>

      <h2>2. What We Use, and Why</h2>
      <ul>
        <li>
          <strong>Session cookie (essential):</strong> when you sign in, we set a secure, encrypted session
          cookie so you stay logged in as you browse. This cookie expires automatically after 24 hours or when
          you sign out. Without it, you'd need to log in again on every page.
        </li>
        <li>
          <strong>Shopping cart (local storage):</strong> the items in your Berry Fitness merchandise cart are saved
          in your browser's local storage under the key <code>berry-cart</code>, so your cart isn't lost if you
          close the tab or come back later. This data stays on your device and isn't sent to our servers until
          you check out.
        </li>
      </ul>

      <h2>3. Cookies We Don't Use</h2>
      <p>
        We do not use third-party advertising cookies, cross-site tracking cookies, or analytics cookies that
        build a profile of you across other websites.
      </p>

      <h2>4. Managing Cookies</h2>
      <p>
        Most browsers let you view, delete, and block cookies through their settings. Clearing your browser's
        cookies will sign you out; clearing local storage will empty your saved cart. Because the cookies we use
        are essential to signing in and checking out, blocking them will limit which parts of the site you can
        use.
      </p>

      <h2>5. Changes to This Policy</h2>
      <p>
        If the way we use cookies or local storage changes, we'll update this page with a new "Last updated"
        date.
      </p>

      <h2>6. Contact Us</h2>
      <p>
        Questions about this Cookie Policy? Reach us at{' '}
        <a href={`mailto:${email}`}>{email}</a>.
      </p>
    </LegalPageLayout>
  );
}

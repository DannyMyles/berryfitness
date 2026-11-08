import type { Metadata } from 'next';
import Link from 'next/link';
import { backendFetch } from '@/app/lib/backend';

export const metadata: Metadata = {
  title: 'Sitemap',
  description: 'Every page on Berry Fitness for Health in one place.',
  alternates: { canonical: '/site-map' },
};
export const revalidate = 300;

type LinkItem = { href: string; label: string; note?: string };

async function list<T>(path: string, key: string): Promise<T[]> {
  try {
    const res = await backendFetch(path, { next: { revalidate } });
    if (!res.ok) return [];
    const data = await res.json();
    return (Array.isArray(data) ? data : data[key] ?? []) as T[];
  } catch {
    return [];
  }
}

function Group({ title, items }: { title: string; items: LinkItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="min-w-0">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-fitness-primary">{title}</h2>
      <ul className="space-y-2">
        {items.map((i) => (
          <li key={`${i.href}-${i.label}`}>
            <Link href={i.href} className="font-medium text-gray-800 hover:text-fitness-primary hover:underline">{i.label}</Link>
            {i.note && <span className="ml-2 text-sm text-gray-500">{i.note}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Human-readable sitemap; the machine version is /sitemap.xml. */
export default async function SiteMapPage() {
  const [services, events, products, blogs] = await Promise.all([
    list<{ title: string; audience: string }>('/api/v1/trainings', 'trainings'),
    list<{ title: string; slug: string; date: string }>('/api/v1/events?upcoming=true', 'events'),
    list<{ name: string; slug: string }>('/api/products', 'products'),
    list<{ title: string; slug: string }>('/api/v1/blogs?limit=20', 'blogs'),
  ]);
  const date = (iso: string) => new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', timeZone: 'Africa/Nairobi' });

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <h1 className="mb-2 font-display text-3xl font-bold tracking-tight text-gray-900 md:text-5xl">Sitemap</h1>
      <p className="mb-10 text-gray-600">Every page on the site, plus what’s on offer right now.</p>
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        <Group
          title="Train with us"
          items={[
            { href: '/services', label: 'Services' },
            { href: '/corporate', label: 'Corporate fitness & team building' },
            { href: '/events', label: 'Events' },
          ]}
        />
        <Group
          title="About"
          items={[
            { href: '/', label: 'Home' },
            { href: '/about', label: 'About' },
            { href: '/gallery', label: 'Gallery' },
            ...(blogs.length ? [{ href: '/blog', label: 'Blog' }] : []),
            { href: '/contact', label: 'Contact & FAQs' },
          ]}
        />
        <Group
          title="Shop & account"
          items={[
            { href: '/shop', label: 'Berry Fitness store' },
            { href: '/cart', label: 'Cart' },
            { href: '/account', label: 'My account' },
          ]}
        />
        <Group title="Services" items={services.filter((s) => s.audience !== 'corporate').map((s) => ({ href: '/services', label: s.title }))} />
        <Group title="Corporate packages" items={services.filter((s) => s.audience !== 'individual').map((s) => ({ href: '/corporate', label: s.title }))} />
        <Group title="Upcoming events" items={events.map((e) => ({ href: `/events/${e.slug}`, label: e.title, note: date(e.date) }))} />
        <Group title="Shop" items={products.map((p) => ({ href: `/shop/${p.slug}`, label: p.name }))} />
        <Group title="Latest from the blog" items={blogs.map((b) => ({ href: `/blog/${b.slug}`, label: b.title }))} />
        <Group
          title="Policies"
          items={[
            { href: '/privacy-policy', label: 'Privacy policy' },
            { href: '/terms-and-conditions', label: 'Terms & conditions' },
            { href: '/cookie-policy', label: 'Cookie policy' },
            { href: '/refund-policy', label: 'Refund policy' },
          ]}
        />
      </div>
    </div>
  );
}

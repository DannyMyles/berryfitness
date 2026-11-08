import { MetadataRoute } from 'next';
import { backendFetch } from '@/app/lib/backend';

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');

// Rebuilt at most hourly, so new products, posts and events appear without a deploy.
export const revalidate = 3600;

/** Fetches a list from the Berry API; an unreachable API just leaves that part out. */
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

type Dated = { slug: string; updatedAt?: string };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const page = (path: string, changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'], priority: number) => ({
    url: `${APP_URL}${path}`,
    changeFrequency,
    priority,
  });
  const staticRoutes: MetadataRoute.Sitemap = [
    page('/', 'weekly', 1),
    page('/services', 'weekly', 0.9),
    page('/corporate', 'weekly', 0.9),
    page('/shop', 'daily', 0.9),
    page('/events', 'weekly', 0.8),
    page('/about', 'monthly', 0.7),
    page('/gallery', 'monthly', 0.6),
    page('/blog', 'weekly', 0.7),
    page('/contact', 'monthly', 0.7),
    page('/site-map', 'monthly', 0.2),
    page('/privacy-policy', 'yearly', 0.3),
    page('/terms-and-conditions', 'yearly', 0.3),
    page('/cookie-policy', 'yearly', 0.3),
    page('/refund-policy', 'yearly', 0.3),
  ];

  const [products, blogs, events] = await Promise.all([
    list<Dated>('/api/products', 'products'),
    list<Dated>('/api/v1/blogs?limit=100', 'blogs'),
    list<Dated & { date: string }>('/api/v1/events?upcoming=true', 'events'),
  ]);
  const dated = (base: string, items: Dated[], changeFrequency: 'weekly' | 'monthly', priority: number) =>
    items
      .filter((i) => i.slug)
      .map((i) => ({
        url: `${APP_URL}${base}/${i.slug}`,
        lastModified: i.updatedAt ? new Date(i.updatedAt) : undefined,
        changeFrequency,
        priority,
      }));

  return [
    ...staticRoutes.filter((r) => blogs.length > 0 || !r.url.endsWith('/blog')),
    ...dated('/shop', products, 'weekly', 0.6),
    ...dated('/events', events, 'weekly', 0.6),
    ...dated('/blog', blogs, 'monthly', 0.5),
  ];
}

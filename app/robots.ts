import { MetadataRoute } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/admin/', '/api/', '/cart', '/account', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email'],
    },
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}

import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";
import SiteChrome from "@/components/ui/SiteChrome";
import AuthProvider from "./providers/AuthProvider";
import RevealObserver from "@/components/ui/RevealObserver";
import { SiteProvider } from "@/components/site/SiteProvider";
import { getSite } from "@/app/lib/site";

// Berry Fitness for Health's brand typeface.
const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const SITE_NAME = "Berry Fitness for Health";
const DEFAULT_DESCRIPTION =
  "Berry Fitness for Health — personal training, weight management, kick boxing, aerobics, kids fitness, nutrition plans and outdoor team building in Nairobi, Kenya. Your ultimate best personal trainer is a phone call away.";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  const name = site.name || SITE_NAME;
  const title = `${name} | ${site.tagline || 'Body Goals and Health'}`;
  const description = site.settings.seo?.description || DEFAULT_DESCRIPTION;
  return {
    metadataBase: new URL(APP_URL),
    title: { default: title, template: `%s | ${name}` },
    description,
    keywords: "fitness trainer, personal trainer, gym, workout, weight loss, muscle building, fitness classes, corporate wellness, team building, Kenya",
    icons: { icon: [{ url: '/favicon.ico' }, { url: '/icon-192.png', type: 'image/png', sizes: '192x192' }], apple: '/apple-touch-icon.png' },
    manifest: '/site.webmanifest',
    robots: { index: true, follow: true },
    openGraph: { type: 'website', siteName: name, title, description, url: APP_URL, locale: 'en_KE' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const site = await getSite();
  const localBusinessJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: site.name,
    description: site.settings.seo?.description || DEFAULT_DESCRIPTION,
    url: APP_URL,
    image: `${APP_URL}/icon-512.png`,
    telephone: site.contactPhone ?? undefined,
    email: site.contactEmail ?? undefined,
    address: {
      '@type': 'PostalAddress',
      addressLocality: site.location?.split(',')[0] || 'Nairobi',
      addressCountry: 'KE',
    },
    sameAs: Object.values(site.settings.social ?? {}).filter(Boolean),
  };
  return (
    <html lang="en" className={openSans.variable} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {/* Lets CSS hide .reveal content only when JS is running to reveal it. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="min-h-screen bg-fitness-light font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
        <AuthProvider>
          <SiteProvider site={site}>
            <SiteChrome>{children}</SiteChrome>
          </SiteProvider>
          <RevealObserver />
        </AuthProvider>
      </body>
    </html>
  );
}


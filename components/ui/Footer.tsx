'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowUpRight, CheckCircle, Clock, Facebook, Instagram, Linkedin, Loader2, Mail, MapPin, MessageCircle, Phone, Twitter, Youtube } from 'lucide-react';
import { FaTiktok } from 'react-icons/fa6';
import { newsletterService } from '@/app/api_services/newsletterService';
import { useSite, useWhatsApp } from '@/components/site/SiteProvider';
import { telHref, pageHeader } from '@/app/lib/site';

const explore = [
  { name: 'About', href: '/about' },
  { name: 'Services', href: '/services' },
  { name: 'Events', href: '/events' },
  { name: 'Gallery', href: '/gallery' },
  { name: 'Blog', href: '/blog' },
  { name: 'Contact', href: '/contact' },
];


const legal = [
  { name: 'Privacy', href: '/privacy-policy' },
  { name: 'Terms', href: '/terms-and-conditions' },
  { name: 'Cookies', href: '/cookie-policy' },
  { name: 'Refunds', href: '/refund-policy' },
  { name: 'Sitemap', href: '/site-map' },
];

const SOCIAL_ICONS = {
  instagram: { icon: Instagram, label: 'Instagram' },
  tiktok: { icon: FaTiktok, label: 'TikTok' },
  facebook: { icon: Facebook, label: 'Facebook' },
  youtube: { icon: Youtube, label: 'YouTube' },
  x: { icon: Twitter, label: 'X' },
  linkedin: { icon: Linkedin, label: 'LinkedIn' },
} as const;

export default function Footer() {
  const site = useSite();
  const whatsappLink = useWhatsApp();
  // First few published services from Admin → Services, then the shop.
  const individual = (site.services ?? []).filter((s) => s.audience !== 'corporate').slice(0, 3);
  const train = [
    ...individual.map((s) => ({ name: s.title, href: '/services' })),
    ...((site.services ?? []).some((s) => s.audience !== 'individual') ? [{ name: 'Corporate & Teams', href: '/corporate' }] : []),
    { name: 'Store', href: '/shop' },
  ];
  const footerCta = pageHeader(site, 'footer-cta', { eyebrow: '', title: '', highlight: '' });
  const social = (Object.keys(SOCIAL_ICONS) as (keyof typeof SOCIAL_ICONS)[])
    .filter((k) => site.settings.social?.[k])
    .map((k) => ({ ...SOCIAL_ICONS[k], href: site.settings.social![k] as string }));
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState('');

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || state === 'sending') return;
    setState('sending');
    setError('');
    try {
      await newsletterService.subscribe(email.trim());
      setState('done');
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not subscribe right now.');
      setState('idle');
    }
  };

  return (
    <footer className="relative overflow-hidden bg-ink text-white">
      {/* soft brand glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-fitness-primary/20 blur-3xl" aria-hidden />

      <div className="container relative mx-auto px-4">
        {/* CTA band */}
        <div className="flex flex-col items-start justify-between gap-6 border-b border-white/10 py-14 md:flex-row md:items-end md:py-20">
          <div className="reveal max-w-xl">
            <p className="eyebrow text-fitness-primary-light">{footerCta.eyebrow}</p>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight md:text-5xl">
              {footerCta.title} <span className="text-fitness-primary-light">{footerCta.highlight}</span>
            </h2>
          </div>
          <div className="reveal flex flex-wrap gap-3">
            <a
              href={whatsappLink(`Hi ${site.name}! I'd like to start training.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary rounded-full! inline-flex items-center gap-2"
            >
              <MessageCircle size={18} /> Chat on WhatsApp
            </a>
            <Link href="/services" className="btn-ghost-light inline-flex items-center gap-2">
              Explore services <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        {/* Columns */}
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link href="/" className="inline-block">
              <Image src="/images/logo-white.svg" alt={site.name} width={389} height={167} className="h-16 w-auto" />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
              {site.settings.about?.mission || site.settings.about?.body}
            </p>
            <div className="mt-6 flex gap-2">
              {social.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-fitness-primary hover:bg-fitness-primary hover:text-white"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <nav aria-label="Explore" className="lg:col-span-2">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/70">Explore</h3>
            <ul className="space-y-2.5">
              {explore.filter((l) => l.href !== '/blog' || site.hasBlog).map((l) => (
                <li key={l.name}>
                  <Link href={l.href} className="text-white/75 transition-colors hover:text-white">{l.name}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Train" className="lg:col-span-2">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/70">Train</h3>
            <ul className="space-y-2.5">
              {train.map((l) => (
                <li key={l.name}>
                  <Link href={l.href} className="text-white/75 transition-colors hover:text-white">{l.name}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="sm:col-span-2 lg:col-span-4">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/70">Newsletter</h3>
            {state === 'done' ? (
              <p className="flex items-center gap-2 rounded-2xl bg-white/5 p-4 text-green-400">
                <CheckCircle size={18} /> You’re in — check your inbox soon.
              </p>
            ) : (
              <form onSubmit={subscribe} className="flex rounded-full bg-white/[0.06] p-1.5 ring-1 ring-white/10 focus-within:ring-fitness-primary">
                <label htmlFor="footer-email" className="sr-only">Email address</label>
                <input
                  id="footer-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  autoComplete="email"
                  className="min-w-0 flex-1 bg-transparent px-4 text-sm text-white placeholder:text-white/70 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={state === 'sending'}
                  className="inline-flex items-center gap-1.5 rounded-full bg-fitness-primary px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-fitness-primary-dark disabled:opacity-60"
                >
                  {state === 'sending' ? <Loader2 size={16} className="animate-spin" /> : <ArrowUpRight size={16} />}
                  Subscribe
                </button>
              </form>
            )}
            {error && <p role="alert" className="mt-2 text-sm text-red-400">{error}</p>}

            <ul className="mt-6 space-y-2.5 text-sm text-white/70">
              {site.contactPhone && <li><a href={telHref(site.contactPhone)} className="inline-flex items-center gap-2.5 hover:text-white"><Phone size={16} className="text-fitness-primary-light" /> {site.contactPhone}</a></li>}
              {site.contactEmail && <li><a href={`mailto:${site.contactEmail}`} className="inline-flex items-center gap-2.5 break-all hover:text-white"><Mail size={16} className="shrink-0 text-fitness-primary-light" /> {site.contactEmail}</a></li>}
              {site.location && <li className="flex items-center gap-2.5"><MapPin size={16} className="text-fitness-primary-light" /> {site.location}</li>}
              {site.settings.hours && <li className="flex items-center gap-2.5"><Clock size={16} className="text-fitness-primary-light" /> {site.settings.hours}</li>}
            </ul>
          </div>
        </div>

        <div className="flex flex-col-reverse items-start justify-between gap-4 border-t border-white/10 py-6 text-sm text-white/75 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-2">
            {legal.map((l) => (
              <Link key={l.name} href={l.href} className="hover:text-white">{l.name}</Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}

'use client';

import { ArrowUpRight, Phone, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSite } from '@/components/site/SiteProvider';
import { useAverageRating } from '@/app/hooks/useAverageRating';
import { telHref } from '@/app/lib/site';

const BENTO_BG = ['bg-fitness-primary/10', 'bg-gray-100', 'bg-fitness-accent/10'];


const Hero = () => {
  const site = useSite();
  const hero = site.settings.hero ?? {};
  const stats = site.settings.stats ?? [];
  const floatingBadges = (hero.perks ?? []).slice(0, 3);
  const clientsStat = stats[0];
  const experienceStat = stats[1];
  const rating = useAverageRating();
  // Photos come from the database: services, About and Admin → Page headers.
  const serviceImages = (site.services ?? []).flatMap((s) => (s.image ? [s.image] : [])).slice(0, 3);
  const aboutImage = site.settings.about?.imageUrl;
  const wideImage = site.settings.pages?.['home-hero']?.imageUrl;
  // Three services from Admin → Services (individual ones first).
  const bentoCards = [...(site.services ?? [])]
    .sort((a, b) => Number(a.audience === 'corporate') - Number(b.audience === 'corporate'))
    .slice(0, 3)
    .map((s, i) => ({ label: s.title, href: s.audience === 'corporate' ? '/corporate' : '/services', bg: BENTO_BG[i], image: s.image }));

  return (
    <section className="relative bg-gray-50 pt-8 pb-16 md:pt-12 md:pb-24 overflow-hidden">
      <div className="container mx-auto px-4">
        <div
          className="grid grid-cols-1 lg:grid-cols-12 gap-5 enter-up"
        >
          {/* Left column */}
          <div className="lg:col-span-7 lg:order-2 flex flex-col gap-5">
            <div>
              <div className="inline-flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-full text-sm font-semibold text-gray-700 mb-6 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-fitness-accent animate-pulse" />
                {hero.eyebrow}
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-fitness-dark leading-[1.05]">
                <span className="block">
                  {hero.title}{' '}
                  <span className="inline-flex -space-x-3 align-middle mx-1">
                    {serviceImages.map((src, i) => (
                      <span
                        key={src}
                        className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-gray-50 overflow-hidden shadow-md"
                        style={{ zIndex: 3 - i }}
                      >
                        <Image src={src} alt="" fill sizes="48px" className="object-cover" />
                      </span>
                    ))}
                  </span>
                </span>
                <span className="block text-fitness-primary">
                  {hero.highlight}{' '}
                  {aboutImage && (
                  <span className="relative inline-block w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-gray-50 overflow-hidden shadow-md align-middle mx-1">
                    <Image src={aboutImage} alt="" fill sizes="48px" className="object-cover" />
                  </span>
                  )}
                </span>
              </h1>

              <p className="mt-6 text-lg text-gray-600 max-w-xl leading-relaxed">
                {hero.subtitle}
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link href={hero.primaryCtaUrl || '/contact'} className="btn-primary rounded-full! flex items-center gap-2">
                  {hero.primaryCtaLabel || 'Start Training'}
                  <ArrowUpRight size={20} />
                </Link>
                <Link
                  href={hero.secondaryCtaUrl || '/services'}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold text-fitness-dark border-2 border-gray-200 hover:border-fitness-primary hover:text-fitness-primary transition-colors"
                >
                  {hero.secondaryCtaLabel || 'View Services'}
                </Link>
                {site.contactPhone && (
                  <a
                    href={telHref(site.contactPhone)}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold text-fitness-primary-dark bg-fitness-primary/10 hover:bg-fitness-primary hover:text-white transition-colors"
                  >
                    <Phone size={18} /> Call {site.contactPhone}
                  </a>
                )}
              </div>
            </div>

            {/* Bento service cards */}
            {bentoCards.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {bentoCards.map((card) => (
                <Link
                  key={card.label}
                  href={card.href}
                  className={`group relative ${card.bg} overflow-hidden rounded-3xl p-3 sm:p-5 flex flex-col justify-between min-h-[140px] hover:-translate-y-1 transition-transform duration-300`}
                >
                  {card.image && (
                    <>
                      <Image src={card.image} alt="" fill sizes="(max-width: 1024px) 33vw, 20vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                      <span className="absolute inset-0 bg-gradient-to-t from-fitness-dark/85 via-fitness-dark/20 to-transparent" aria-hidden />
                    </>
                  )}
                  <span className="relative w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white text-fitness-dark flex items-center justify-center shadow-sm self-end group-hover:bg-fitness-primary group-hover:text-white transition-colors">
                    <ArrowUpRight size={16} />
                  </span>
                  <span className={`relative min-w-0 text-xs sm:text-base hyphens-auto break-words font-bold leading-snug ${card.image ? 'text-white' : 'text-fitness-dark'}`}>
                    {card.label}
                  </span>
                </Link>
              ))}
            </div>
            )}

            {/* Wide stat card */}
            <div className="relative bg-fitness-primary/5 rounded-3xl overflow-hidden flex-1 min-h-[280px] flex">
              <div className="w-full relative bg-fitness-dark">
                {wideImage && <Image
                  src={wideImage}
                  alt={`${site.name} group training`}
                  priority
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  fill
                  className="object-cover"
                  style={{ objectPosition: '50% 35%' }}
                />}
                <div className="absolute inset-0 bg-gradient-to-t from-fitness-dark/40 via-transparent to-transparent pointer-events-none" />
                {rating && (
                  <div className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 bg-white px-3 py-2 rounded-full shadow-sm" title={`${rating.count} reviews`}>
                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-bold text-fitness-dark">{rating.avg.toFixed(1)} / 5 · {rating.count} reviews</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column — big feature panel */}
          <div className="lg:col-span-5 lg:order-1 relative">
            <div className="relative rounded-3xl overflow-hidden h-full min-h-[560px] bg-gradient-to-br from-fitness-primary via-fitness-primary-dark to-fitness-dark">
              <Image
                src={hero.imageUrl || aboutImage || '/images/certifications.jpg'}
                alt={`${site.name} training`}
                unoptimized={/^https?:/.test(hero.imageUrl ?? '')}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-fitness-dark/70 via-transparent to-transparent pointer-events-none" />

              {/* Annotation callout */}
              {experienceStat && (
              <div className="absolute top-[38%] left-6 hidden sm:flex items-center gap-2">
                <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold text-fitness-dark shadow-lg border border-white/50">
                  {experienceStat.value} {experienceStat.label}
                </div>
                <div className="w-16 h-px bg-white/60" />
                <div className="w-2 h-2 rounded-full bg-white shadow" />
              </div>
              )}

              {/* Floating pill badges */}
              <div className="absolute bottom-40 right-5 flex flex-col items-end gap-2.5">
                {floatingBadges.map((label) => (
                  <span key={label} className="bg-white px-4 py-2 rounded-full text-sm font-semibold text-fitness-dark shadow-lg">
                    {label}
                  </span>
                ))}
              </div>

              {/* Bottom stat card */}
              {clientsStat && (
              <div className="absolute bottom-5 left-5 right-5 bg-white rounded-2xl p-5 shadow-xl">
                <p className="text-2xl font-bold text-fitness-dark">{clientsStat.value}</p>
                <p className="text-sm text-gray-500 mb-3">{clientsStat.label}</p>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-gray-500">{site.tagline}</span>
                </div>
              </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

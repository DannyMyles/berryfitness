'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { optimizedSrc } from '@/app/lib/imageSrc';

interface Slide {
  id: number;
  title: string;
  subtitle: string | null;
  badge: string | null;
  image: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
}

const INTERVAL_MS = 6000;

/**
 * Photo slideshow. Slides are banners with placement "slider", managed in
 * Admin → Content → Banners. Nothing renders until at least one exists.
 * Auto-advance pauses on hover, on keyboard focus, in a background tab and
 * for visitors who ask for reduced motion.
 */
export default function PhotoSlides() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    fetch('/api/v1/banners?placement=slider')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setSlides((d.banners ?? []).filter((b: Slide) => b.image)))
      .catch(() => {});
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const count = slides.length;
  const go = useCallback((delta: number) => setActive((i) => (i + delta + count) % count), [count]);

  // Restarts whenever the slide changes, so a manual change gets a full interval.
  useEffect(() => {
    if (count < 2 || paused || reducedMotion) return;
    const timer = setTimeout(() => {
      if (!document.hidden) go(1);
    }, INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [active, count, paused, reducedMotion, go]);

  if (count === 0) return null;

  return (
    <section className="container mx-auto px-4 pb-16" aria-roledescription="carousel" aria-label="Berry Fitness highlights">
      <div
        className="relative h-[520px] overflow-hidden rounded-3xl bg-fitness-dark shadow-fitness-lg md:h-[600px]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') go(-1);
          if (e.key === 'ArrowRight') go(1);
        }}
        onTouchStart={(e) => {
          touchStart.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchStart.current === null) return;
          const moved = e.changedTouches[0].clientX - touchStart.current;
          touchStart.current = null;
          if (Math.abs(moved) > 40) go(moved < 0 ? 1 : -1);
        }}
      >
        {slides.map((slide, i) => {
          const isActive = i === active;
          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={!isActive}
              inert={!isActive}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${isActive ? 'z-10 opacity-100' : 'z-0 opacity-0'}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={optimizedSrc(slide.image, 1920)}
                alt=""
                loading={i === 0 ? 'eager' : 'lazy'}
                className={`h-full w-full object-cover object-[50%_30%] ${isActive && !reducedMotion ? 'slide-zoom' : ''}`}
              />
              {/* Phones: dark from the bottom. Larger screens: dark from the left, under the text. */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/5 md:hidden" aria-hidden />
              <div className="absolute inset-0 hidden bg-gradient-to-r from-black/80 via-black/35 to-transparent md:block" aria-hidden />

              <div className={`absolute inset-x-0 bottom-0 max-w-xl p-6 pb-16 md:p-12 md:pb-20 ${isActive ? 'slide-text' : ''}`}>
                {slide.badge && (
                  <span className="mb-4 inline-block rounded-full bg-fitness-primary px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
                    {slide.badge}
                  </span>
                )}
                <h2 className="text-3xl font-bold leading-tight tracking-tight text-white drop-shadow-lg md:text-5xl">{slide.title}</h2>
                {slide.subtitle && <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/90 md:text-lg">{slide.subtitle}</p>}
                {slide.ctaLabel && slide.ctaUrl && (
                  <Link href={slide.ctaUrl} className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-fitness-dark transition-colors hover:bg-fitness-primary hover:text-white">
                    {slide.ctaLabel} <ArrowRight size={18} />
                  </Link>
                )}
              </div>
            </div>
          );
        })}

        {count > 1 && (
          <>
            <div className="absolute inset-x-6 bottom-6 z-20 flex items-center gap-2 md:inset-x-12 md:bottom-8">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === active}
                  className="group flex h-6 w-10 items-center md:w-14"
                >
                  <span className={`h-1 w-full rounded-full transition-colors ${i === active ? 'bg-white' : 'bg-white/40 group-hover:bg-white/70'}`} />
                </button>
              ))}
            </div>
            <div className="absolute right-4 top-4 z-20 flex gap-2 md:right-6 md:top-6">
              <button type="button" onClick={() => go(-1)} aria-label="Previous slide" className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-white hover:text-fitness-dark">
                <ChevronLeft size={22} />
              </button>
              <button type="button" onClick={() => go(1)} aria-label="Next slide" className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-white hover:text-fitness-dark">
                <ChevronRight size={22} />
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

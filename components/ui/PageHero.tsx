import { LucideIcon } from 'lucide-react';

interface PageHeroProps {
  badge?: string;
  badgeIcon?: LucideIcon;
  title: string;
  subtitle: string;
}

/**
 * Shared page banner (About, Services, Events, Gallery, Blog, Contact):
 * a dark ink panel with a warm brand glow and a large display title.
 * Same look as the footer, so every page opens and closes consistently.
 */
export default function PageHero({ badge, badgeIcon: Icon, title, subtitle }: PageHeroProps) {
  // Highlight the last word of the title in the brand colour.
  const words = title.trim().split(' ');
  const last = words.pop();

  return (
    <section className="px-3 pt-3 sm:px-4">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-4xl bg-ink px-6 py-14 text-white md:px-16 md:py-24">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-fitness-primary/35 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-fitness-primary/15 blur-3xl" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07] bg-[linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)] bg-size-[48px_48px] mask-[radial-gradient(ellipse_at_center,black,transparent_75%)]"
          aria-hidden
        />
        {Icon && (
          <Icon size={280} strokeWidth={0.8} className="pointer-events-none absolute -bottom-12 -right-6 hidden rotate-12 text-white/6 md:block" aria-hidden />
        )}

        <div className="enter-up relative max-w-3xl">
          {badge && (
            <p className="eyebrow mb-5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-fitness-primary-light backdrop-blur">
              {Icon && <Icon size={14} />}
              {badge}
            </p>
          )}
          <h1 className="font-display text-4xl font-bold leading-[1.02] tracking-tight sm:text-5xl md:text-7xl">
            {words.length > 0 && `${words.join(' ')} `}
            <span className="text-fitness-primary">{last}</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/70 md:text-lg">{subtitle}</p>
        </div>
      </div>
    </section>
  );
}

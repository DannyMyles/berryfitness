import Link from 'next/link';
import { ArrowRight, LucideIcon } from 'lucide-react';

interface CtaButton {
  label: string;
  href: string;
}

interface CtaSectionProps {
  badge?: string;
  badgeIcon?: LucideIcon;
  title: string;
  subtitle: string;
  primary: CtaButton;
  secondary?: CtaButton;
}

// Shared closing CTA — used at the end of Home/About/Services/Events instead
// of each page rolling its own near-identical "Ready to Transform?" block.
export default function CtaSection({ badge, badgeIcon: Icon, title, subtitle, primary, secondary }: CtaSectionProps) {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-fitness-primary via-fitness-primary to-fitness-primary-dark px-6 py-16 md:px-16 md:py-20 text-center shadow-fitness-lg ring-1 ring-white/10">
          {/* Spotlight + texture layers */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.18),transparent_45%)]" />
          <div className="absolute inset-0 opacity-[0.15] bg-pattern-dots" />

          {/* Decorative blurred orbs */}
          <div className="absolute -top-20 left-1/4 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-10 w-72 h-72 bg-fitness-primary-dark/40 rounded-full blur-3xl" />

          <div className="relative z-10 max-w-2xl mx-auto">
            {badge && (
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full text-sm font-semibold text-white mb-6 shadow-sm">
                {Icon && (
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                    <Icon size={12} />
                  </span>
                )}
                {badge}
              </div>
            )}
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4 drop-shadow-sm">
              {title}
            </h2>
            <div className="w-14 h-1 bg-white/40 rounded-full mx-auto mb-5" />
            <p className="text-lg text-white/85 leading-relaxed mb-8">{subtitle}</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={primary.href}
                className="inline-flex items-center justify-center gap-2 bg-white text-fitness-primary px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all duration-300 hover:scale-105 hover:shadow-2xl shadow-fitness-lg"
              >
                {primary.label}
                <ArrowRight size={20} />
              </Link>
              {secondary && (
                <Link
                  href={secondary.href}
                  className="inline-flex items-center justify-center gap-2 border-2 border-white/70 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 hover:border-white transition-all duration-300"
                >
                  {secondary.label}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

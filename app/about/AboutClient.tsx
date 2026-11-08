'use client';

import { useState, useEffect } from 'react';
import { Target, Users, Award, Clock, CheckCircle, Dumbbell, Heart, Zap, ArrowRight, Medal } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import PageHero from '@/components/ui/PageHero';
import CtaSection from '@/components/ui/CtaSection';
import { useSite, usePageHeader } from '@/components/site/SiteProvider';

const STAT_ICONS = [Users, Clock, Award, Target];
const VALUE_ICONS = [Medal, Heart, Award, Zap];

/** "100+" → { n: 100, prefix: '', suffix: '+' } so the number can count up. */
function parseStat(value: string) {
  // Only plain figures like "100+" or "98%" count up; "1st" or "5am–9pm" stay as written.
  const m = value.match(/^(\D*)(\d+(?:\.\d+)?)([^a-zA-Z]*)$/);
  return m ? { prefix: m[1], n: Number(m[2]), suffix: m[3] } : null;
}

export default function AboutClient() {
  const header = usePageHeader('about', { eyebrow: 'About Us', title: 'About Berry Fitness for Health', subtitle: 'Body goals and health — your ultimate best personal trainer is a phone call away.' });
  const site = useSite();
  // Count-up progress 0 → 1 for the stats (edited in Admin → Settings).
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate stats on scroll
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateStats();
          }
        });
      },
      { threshold: 0.5 }
    );

    const statsSection = document.getElementById('stats-section');
    if (statsSection) {
      observer.observe(statsSection);
    }

    return () => observer.disconnect();
  }, []);

  const animateStats = () => {
    const steps = 60;
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      setProgress(Math.min(1, step / steps));
      if (step >= steps) clearInterval(interval);
    }, 2000 / steps);
  };

  const stats = (site.settings.stats ?? []).map((stat, i) => ({ ...stat, icon: STAT_ICONS[i % STAT_ICONS.length], parsed: parseStat(stat.value) }));

  const values = (site.settings.values ?? []).map((v, i) => ({ title: v.title, description: v.text, icon: VALUE_ICONS[i % VALUE_ICONS.length] }));
  const trainer = site.settings.team?.[0];

  return (
    <div className="pt-0">
      {/* Hero Section */}
      <PageHero
        badge={header.eyebrow}
        badgeIcon={Award}
        title={header.title}
        subtitle={header.subtitle}
      />

      {/* Stats Section */}
      {stats.length > 0 && (
      <section id="stats-section" className="py-16 bg-gradient-to-br from-fitness-light via-white to-fitness-primary/5">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-6">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className="w-full sm:w-64 text-center p-6 bg-white rounded-2xl shadow-soft hover:shadow-fitness transition-all duration-500 hover:-translate-y-2"
              >
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-fitness-primary/20 to-fitness-primary-dark/20 flex items-center justify-center`}>
                  <stat.icon size={28} className="text-fitness-primary" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  {stat.parsed
                    ? `${stat.parsed.prefix}${Math.round(stat.parsed.n * progress)}${stat.parsed.suffix}`
                    : stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* About Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="relative enter-left">
              <div className="relative rounded-3xl overflow-hidden shadow-fitness-lg">
                <Image
                  src={site.settings.about?.imageUrl || '/images/about.jpg'}
                  alt={`${site.name} trainer`}
                  width={600}
                  height={750}
                  className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/20 to-transparent"></div>
              </div>
              
              {/* Achievement badge (first certification in Admin → Settings → Values) */}
              {values[0] && (
              <div className="absolute -bottom-6 -right-6 hidden sm:block max-w-[16rem] bg-gradient-to-br from-fitness-primary to-fitness-primary-dark text-white rounded-2xl p-6 shadow-fitness-lg transform hover:scale-105 transition-all duration-500 animate-bounce-slow">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Award size={28} />
                  </div>
                  <div>
                    <div className="text-lg font-bold leading-tight">{values[0].title}</div>
                    <div className="text-sm text-white/90">{values[0].description}</div>
                  </div>
                </div>
              </div>
              )}

              {/* Decorative elements */}
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-gradient-to-br from-fitness-primary/20 to-fitness-primary-dark/20 rounded-full blur-2xl"></div>
            </div>

            <div className="space-y-6 enter-right">
              <div className="inline-flex items-center gap-2 badge">
                <Zap size={16} />
                <span>Who We Are</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                {site.settings.about?.headline || 'Fitness for health, for every level'}
              </h2>
              
              <div className="space-y-4 text-gray-800 leading-relaxed">
                {(site.settings.about?.story || site.settings.about?.body || '')
                  .split(/\n{2,}/)
                  .filter(Boolean)
                  .map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
              </div>

              <div className="pt-4">
                <Link href="/services" className="btn-primary inline-flex items-center gap-2">
                  Explore Our Services
                  <ArrowRight size={20} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Qualifications & certifications (Admin → Settings → Values) */}
      {values.length > 0 && (
      <section className="py-20 bg-gradient-to-br from-fitness-light via-white to-fitness-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 badge mb-4">
              <Award size={16} />
              <span>Certifications</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Qualifications &amp; <span className="text-gradient-mixed">Certifications</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {values.map((value, index) => (
              <div key={index} className="feature-card group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-fitness-primary to-fitness-primary-light flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110">
                  <value.icon size={28} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-800">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Trainer profile (Admin → Settings → Team) */}
      {trainer && (
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div className="relative rounded-3xl overflow-hidden shadow-fitness-lg bg-gray-100">
              <Image
                src={trainer.imageUrl || '/images/certifications.jpg'}
                alt={trainer.name}
                width={640}
                height={960}
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="w-full h-auto max-h-[640px] object-cover object-top"
              />
            </div>
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 badge">
                <Dumbbell size={16} />
                <span>{trainer.role}</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{trainer.name}</h2>
              <div className="space-y-4 text-gray-800 leading-relaxed">
                {trainer.bio.split(/\n{2,}/).filter(Boolean).map((para, i) => <p key={i}>{para}</p>)}
              </div>
              {trainer.expertise && trainer.expertise.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">Training areas</h3>
                  <ul className="flex flex-wrap gap-2">
                    {trainer.expertise.map((area) => (
                      <li key={area} className="inline-flex items-center gap-1.5 rounded-full bg-fitness-primary/10 px-4 py-2 text-sm font-semibold text-fitness-primary-dark">
                        <CheckCircle size={14} /> {area}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      )}

      <CtaSection
        title="Your best personal trainer is a phone call away"
        subtitle="Whether you are a beginner or a seasoned athlete, we will help you reach your body goals and health."
        primary={{ label: 'Get Started Today', href: '/contact' }}
        secondary={{ label: 'View Services', href: '/services' }}
      />
    </div>
  );
}


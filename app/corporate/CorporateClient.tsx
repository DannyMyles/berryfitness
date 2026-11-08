'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle, ArrowRight, Briefcase, Building2, CheckCircle, ChevronDown, Clock, ClipboardList, Handshake, Loader2,
  MapPin, MessageCircle, PartyPopper, RefreshCw, Users,
} from 'lucide-react';
import PageHero from '@/components/ui/PageHero';
import EmptyState from '@/components/ui/EmptyState';
import ServiceBookingModal from '@/components/booking/ServiceBookingModal';
import { Training, trainingService } from '@/app/api_services/trainingService';
import { EnquiryResult, newRequestId, priceLabelFor, submitEnquiry } from '@/app/lib/enquiries';
import { PHONE_REGEX, cancelWhatsAppTab, reserveWhatsAppTab, sendToWhatsApp } from '@/app/lib/whatsappHandoff';
import { useSite } from '@/components/site/SiteProvider';
import { optimizedSrc } from '@/app/lib/imageSrc';

interface Faq { id: number; question: string; answer: string; category: string | null }
interface Banner { id: number; title: string; subtitle: string | null; badge: string | null; image: string | null; ctaLabel: string | null; ctaUrl: string | null }

const STEPS = [
  { icon: ClipboardList, title: 'Tell us about your team', text: 'Pick a package or describe what you have in mind — group size, dates, venue and goals.' },
  { icon: Handshake, title: 'Get a tailored proposal', text: 'We reply on WhatsApp and email with a program and quote that fits your team and budget.' },
  { icon: PartyPopper, title: 'Confirm & enjoy', text: 'Once you approve, we lock in the date and handle the planning, coaching and safety.' },
];

/**
 * Corporate fitness & team-building. Every offering here is a service with
 * audience "corporate" or "both" in Admin → Services, so new activities and
 * packages appear without code changes.
 */
export default function CorporateClient() {
  const site = useSite();
  const corporate = site.settings.corporate ?? {};
  const [services, setServices] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('All');
  const [booking, setBooking] = useState<{ service: Training; packageId?: number } | null>(null);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/v1/trainings?audience=corporate')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Could not load corporate packages.'))))
      .then((d) => !cancelled && (setServices(trainingService.sortForDisplay(d.trainings ?? [])), setError('')))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  useEffect(() => {
    fetch('/api/v1/faqs?category=Corporate').then((r) => (r.ok ? r.json() : null)).then((d) => d && setFaqs(d.faqs)).catch(() => {});
    fetch('/api/v1/banners?placement=corporate').then((r) => (r.ok ? r.json() : null)).then((d) => d && setBanners(d.banners)).catch(() => {});
  }, []);

  const categories = useMemo(() => ['All', ...Array.from(new Set(services.map((s) => s.category).filter(Boolean) as string[]))], [services]);
  const visible = category === 'All' ? services : services.filter((s) => s.category === category);

  return (
    <div>
      <PageHero
        badge="Corporate fitness & team building"
        badgeIcon={Briefcase}
        title={corporate.headline || 'Healthier teams, stronger companies'}
        subtitle={
          corporate.subtitle ||
          'Corporate fitness, wellness days, team-building and outdoor adventures for organisations of every size.'
        }
      />

      <section className="container mx-auto px-4 pt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <p className="text-gray-700">
            <span className="font-semibold text-gray-900">Planning for a group?</span> Choose a package below or ask for a fully custom program.
          </p>
          <a href="#quote" className="btn-primary inline-flex shrink-0 items-center justify-center gap-2">
            Request a quote <ArrowRight size={18} />
          </a>
        </div>
      </section>

      {banners.length > 0 && (
        <section className="container mx-auto grid gap-4 px-4 pt-6 md:grid-cols-2">
          {banners.slice(0, 2).map((b) => (
            <div key={b.id} className="relative overflow-hidden rounded-3xl bg-ink p-7 text-white">
              {b.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={optimizedSrc(b.image, 1200)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
              )}
              <div className="relative">
                {b.badge && <span className="mb-2 inline-block rounded-full bg-fitness-primary px-3 py-1 text-xs font-bold uppercase">{b.badge}</span>}
                <h2 className="text-2xl font-bold">{b.title}</h2>
                {b.subtitle && <p className="mt-1 text-white/80">{b.subtitle}</p>}
                {b.ctaLabel && b.ctaUrl && (
                  <Link href={b.ctaUrl} className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-semibold text-ink">
                    {b.ctaLabel} <ArrowRight size={16} />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center">
            <p className="eyebrow mb-3 justify-center text-fitness-primary">Packages</p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-gray-900 md:text-5xl">What we offer teams</h2>
          </div>

          {categories.length > 2 && (
            <div className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:justify-center md:overflow-visible md:px-0" role="tablist" aria-label="Filter by category">
              {categories.map((c) => (
                <button
                  key={c}
                  role="tab"
                  aria-selected={category === c}
                  onClick={() => setCategory(c)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${category === c ? 'bg-fitness-primary text-white' : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:ring-fitness-primary'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-busy="true">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="overflow-hidden rounded-3xl bg-white ring-1 ring-gray-100">
                  <div className="h-48 animate-pulse bg-gray-200" />
                  <div className="space-y-3 p-6">
                    <div className="h-5 w-2/3 animate-pulse rounded bg-gray-200" />
                    <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                    <div className="h-10 animate-pulse rounded-xl bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <EmptyState icon={AlertCircle} title="Couldn't load packages" description={error} action={{ label: 'Try again', icon: RefreshCw, onClick: () => { setLoading(true); setNonce((n) => n + 1); } }} />
          ) : visible.length === 0 ? (
            <EmptyState icon={Briefcase} title="Corporate packages are coming soon" description="Tell us what your team needs and we'll put together a program." action={{ label: 'Request a quote', href: '#quote' }} />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {visible.map((s) => (
                <CorporateCard key={s.id} service={s} onBook={(packageId) => setBooking({ service: s, packageId })} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center font-display text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">How corporate bookings work</h2>
          <ol className="grid gap-6 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="reveal rounded-3xl bg-fitness-light p-7">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fitness-primary text-white"><Icon size={22} /></span>
                  <span className="text-sm font-bold text-fitness-primary">Step {i + 1}</span>
                </div>
                <h3 className="mb-1 text-lg font-bold text-gray-900">{title}</h3>
                <p className="text-gray-600">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <QuoteForm services={services} />

      {faqs.length > 0 && (
        <section className="bg-white py-16 md:py-20">
          <div className="container mx-auto max-w-3xl px-4">
            <h2 className="mb-8 text-center font-display text-3xl font-bold tracking-tight text-gray-900">Corporate FAQs</h2>
            <div className="divide-y divide-gray-100 overflow-hidden rounded-3xl ring-1 ring-gray-100">
              {faqs.map((f) => (
                <details key={f.id} className="group bg-white p-5 open:bg-fitness-primary/5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
                    {f.question}
                    <ChevronDown size={18} className="shrink-0 text-fitness-primary transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 whitespace-pre-line text-gray-600">{f.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {booking && <ServiceBookingModal service={booking.service} initialPackageId={booking.packageId} mode="corporate" onClose={() => setBooking(null)} />}
    </div>
  );
}

function CorporateCard({ service: s, onBook }: { service: Training; onBook: (packageId?: number) => void }) {
  const meta = [
    s.duration && { icon: Clock, text: s.duration },
    s.groupSize && { icon: Users, text: s.groupSize },
    s.location && { icon: MapPin, text: s.location },
  ].filter(Boolean) as { icon: typeof Clock; text: string }[];
  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100 transition-shadow hover:shadow-fitness-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-200">
        {s.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={optimizedSrc(s.image, 828)} alt={s.title} loading="lazy" className="h-full w-full object-cover object-[50%_25%] transition-transform duration-500 group-hover:scale-105" />
        )}
        {s.category && <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-gray-800">{s.category}</span>}
        {s.popular && <span className="absolute right-4 top-4 rounded-full bg-fitness-primary px-3 py-1 text-xs font-bold text-white">Popular</span>}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="mb-2 text-xl font-bold text-gray-900">{s.title}</h3>
        <p className="mb-4 text-gray-600">{s.description}</p>
        {meta.length > 0 && (
          <ul className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
            {meta.map(({ icon: Icon, text }) => (
              <li key={text} className="inline-flex items-center gap-1.5"><Icon size={14} className="text-fitness-primary" /> {text}</li>
            ))}
          </ul>
        )}
        <ul className="mb-5 space-y-1.5 text-sm text-gray-700">
          {s.features.slice(0, 4).map((f) => (
            <li key={f} className="flex items-start gap-2"><CheckCircle size={16} className="mt-0.5 shrink-0 text-fitness-accent" /> {f}</li>
          ))}
        </ul>
        {s.packages.length > 0 && (
          <div className="mb-5 space-y-2">
            {s.packages.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onBook(p.id)}
                disabled={!s.available}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm ring-1 transition-colors disabled:cursor-not-allowed ${p.popular ? 'bg-fitness-primary/5 ring-fitness-primary/40' : 'ring-gray-200 hover:ring-fitness-primary/50'}`}
              >
                <span>
                  <span className="block font-semibold text-gray-900">{p.name}</span>
                  {p.description && <span className="block text-xs text-gray-500">{p.description}</span>}
                </span>
                <span className="shrink-0 text-xs font-bold text-fitness-primary">{priceLabelFor(p)}</span>
              </button>
            ))}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
          <span className="text-sm font-bold text-gray-900">{priceLabelFor(s)}</span>
          {s.available ? (
            <button type="button" onClick={() => onBook()} className="inline-flex items-center gap-1.5 rounded-full bg-fitness-primary px-4 py-2 text-sm font-semibold text-white hover:bg-fitness-primary-dark">
              <Building2 size={16} /> Get a quote
            </button>
          ) : (
            <span className="rounded-full bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-500">Currently unavailable</span>
          )}
        </div>
      </div>
    </article>
  );
}

/** Open-ended corporate quote for anything not covered by a single package. */
function QuoteForm({ services }: { services: Training[] }) {
  const site = useSite();
  const [form, setForm] = useState({ company: '', name: '', phone: '', email: '', participants: '', preferredDate: '', serviceId: '', location: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<EnquiryResult | null>(null);
  const requestId = useRef(newRequestId());
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const today = new Date().toISOString().slice(0, 10);
  const input = 'block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-fitness-primary focus:outline-none focus:ring-2 focus:ring-fitness-primary/20';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (form.company.trim().length < 2) next.company = 'Please enter your company or organisation';
    if (form.name.trim().length < 2) next.name = 'Please enter a contact name';
    if (!PHONE_REGEX.test(form.phone.trim())) next.phone = 'Enter a valid phone number';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email for your quote';
    if (form.participants && (!Number.isInteger(Number(form.participants)) || Number(form.participants) < 1)) next.participants = 'Enter a number of people';
    if (form.preferredDate && form.preferredDate < today) next.preferredDate = 'Choose a future date';
    if (!form.serviceId && !form.message.trim()) next.message = 'Tell us briefly what you have in mind';
    setErrors(next);
    if (Object.keys(next).length) return;
    setError('');
    setSending(true);
    const tab = reserveWhatsAppTab();
    try {
      const result = await submitEnquiry({
        type: form.serviceId ? 'corporate' : 'quote',
        serviceId: form.serviceId ? Number(form.serviceId) : undefined,
        company: form.company.trim(),
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        participants: form.participants ? Number(form.participants) : undefined,
        preferredDate: form.preferredDate || undefined,
        location: form.location.trim() || undefined,
        message: form.message.trim() || undefined,
        service: form.serviceId ? undefined : 'Custom corporate program',
        requestId: requestId.current,
      });
      if (result.whatsapp) sendToWhatsApp(tab, result.whatsapp.url);
      else cancelWhatsAppTab(tab);
      setDone(result);
    } catch (err) {
      cancelWhatsAppTab(tab);
      setError(err instanceof Error ? err.message : 'Could not send your request.');
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="quote" className="scroll-mt-24 py-16 md:py-20">
      <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <p className="eyebrow mb-3 text-fitness-primary">Tailored quote</p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">Let’s plan something great for your team</h2>
          <p className="mt-4 text-gray-600">
            Large group, several sites or a mix of activities? Share the basics and we’ll come back with a proposal — usually within one working day.
          </p>
          <ul className="mt-6 space-y-3 text-gray-700">
            {['Programs for any fitness level', 'Outdoors or at a venue we agree with you', 'Clear quote before anything is booked'].map((t) => (
              <li key={t} className="flex items-center gap-2"><CheckCircle size={18} className="text-fitness-accent" /> {t}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8 lg:col-span-3">
          {done ? (
            <div className="py-6 text-center" role="status">
              <CheckCircle size={52} className="mx-auto mb-4 text-green-500" />
              <h3 className="text-2xl font-bold text-gray-900">Quote request received</h3>
              <p className="mt-2 text-gray-600">
                Reference <span className="font-mono font-semibold text-gray-900">{done.enquiry.reference}</span>. We’ve emailed you a copy and will be in touch shortly.
              </p>
              {done.whatsapp && (
                <a href={done.whatsapp.url} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#0F7A6E] px-6 py-3 font-semibold text-white hover:bg-[#0B5F55]">
                  <MessageCircle size={18} /> Continue on WhatsApp
                </a>
              )}
              <p className="mt-3 text-xs text-gray-500">{site.settings.booking?.whatsappNotice}</p>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
              <Q label="Company / organisation" error={errors.company} className="sm:col-span-2">
                <input value={form.company} onChange={set('company')} maxLength={160} autoComplete="organization" className={input} aria-invalid={!!errors.company} />
              </Q>
              <Q label="Contact person" error={errors.name}>
                <input value={form.name} onChange={set('name')} maxLength={100} autoComplete="name" className={input} aria-invalid={!!errors.name} />
              </Q>
              <Q label="Phone (WhatsApp)" error={errors.phone}>
                <input type="tel" inputMode="tel" value={form.phone} onChange={set('phone')} maxLength={20} autoComplete="tel" placeholder="0712 345 678" className={input} aria-invalid={!!errors.phone} />
              </Q>
              <Q label="Work email" error={errors.email}>
                <input type="email" value={form.email} onChange={set('email')} maxLength={255} autoComplete="email" className={input} aria-invalid={!!errors.email} />
              </Q>
              <Q label="Number of people" hint="approx." error={errors.participants}>
                <input type="number" min={1} value={form.participants} onChange={set('participants')} className={input} aria-invalid={!!errors.participants} />
              </Q>
              <Q label="Interested in">
                <select value={form.serviceId} onChange={set('serviceId')} className={input}>
                  <option value="">Not sure / custom program</option>
                  {services.filter((s) => s.available).map((s) => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
              </Q>
              <Q label="Preferred date" hint="optional" error={errors.preferredDate}>
                <input type="date" min={today} value={form.preferredDate} onChange={set('preferredDate')} className={input} aria-invalid={!!errors.preferredDate} />
              </Q>
              <Q label="Venue / location" hint="optional" className="sm:col-span-2">
                <input value={form.location} onChange={set('location')} maxLength={200} className={input} placeholder="Our office, a park, out of town…" />
              </Q>
              <Q label="Goals & special requirements" error={errors.message} className="sm:col-span-2">
                <textarea rows={4} value={form.message} onChange={set('message')} maxLength={2000} className={input} placeholder="What would success look like? Any fitness, accessibility or dietary needs?" aria-invalid={!!errors.message} />
              </Q>
              {error && (
                <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
                </p>
              )}
              <button type="submit" disabled={sending} className="btn-primary inline-flex items-center justify-center gap-2 sm:col-span-2 disabled:opacity-60">
                {sending ? <Loader2 size={18} className="animate-spin" /> : <Briefcase size={18} />}
                {sending ? 'Sending…' : 'Request my quote'}
              </button>
              <p className="text-center text-xs text-gray-500 sm:col-span-2">
                We’ll open WhatsApp so you can reach us straight away. {site.settings.booking?.whatsappNotice}
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function Q({ label, hint, error, className, children }: { label: string; hint?: string; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className ?? ''}`}>
      <span className="mb-1.5 block text-sm font-medium text-gray-700">
        {label} {hint && <span className="font-normal text-gray-500">({hint})</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}
    </label>
  );
}

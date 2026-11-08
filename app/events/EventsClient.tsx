'use client';

import { optimizedSrc } from '@/app/lib/imageSrc';
import { money, CURRENCY } from '@/app/lib/money'
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar, Clock, MapPin, Users,
  Zap, ArrowRight, Heart, Loader2, AlertCircle, RefreshCw
} from 'lucide-react';
import PageHero from '@/components/ui/PageHero';
import { usePageHeader, useSite } from '@/components/site/SiteProvider';
import CtaSection from '@/components/ui/CtaSection';
import EmptyState from '@/components/ui/EmptyState';
import EventRegistrationModal from '@/components/events/EventRegistrationModal';
import { eventService, EventItem } from '@/app/api_services/eventService';

const processSteps = [
  { step: '01', title: 'Choose Event', description: 'Browse our upcoming events and select one that fits your goals.' },
  { step: '02', title: 'Book', description: 'Tap Book, add your name, phone and how many people — no account needed.' },
  { step: '03', title: 'Confirm on WhatsApp', description: 'Send the ready-made WhatsApp message and we confirm your spot there.' },
  { step: '04', title: 'Attend', description: 'Show up ready to sweat!' }
];

export default function EventsClient({ initialEvents }: { initialEvents?: EventItem[] }) {
  const site = useSite();
  const header = usePageHeader('events', { eyebrow: 'Events', title: 'Fitness Events', subtitle: 'Hikes, road trips, bootcamps and outdoor fitness with the Berry Fitness community.' });

  const [events, setEvents] = useState<EventItem[]>(initialEvents ?? []);
  const [isLoading, setIsLoading] = useState(!initialEvents);
  const [error, setError] = useState('');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const [registeringEvent, setRegisteringEvent] = useState<EventItem | null>(null);

  const fetchEvents = () => {
    setIsLoading(true);
    setError('');
    eventService
      .getAllEvents()
      .then((res) => setEvents(res.events))
      .catch(() => setError('Could not load events. Please try again shortly.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (!initialEvents) fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Upcoming events can be booked; past ones stay listed as a record of what we've done.
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const upcoming = events
    .filter((e) => new Date(e.date) >= startOfToday)
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const past = events
    .filter((e) => new Date(e.date) < startOfToday)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));

  const handleRegisterClick = (event: EventItem) => {
    setRegisteringEvent(event);
  };

  const eventsJsonLd = upcoming.map((event) => ({
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    startDate: event.date,
    location: {
      '@type': 'Place',
      name: event.location,
      address: site.location || 'Nairobi, Kenya',
    },
    description: event.description,
    offers: {
      '@type': 'Offer',
      price: event.price,
      priceCurrency: CURRENCY,
      availability: event.spotsRemaining > 0 ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
    },
    performer: event.trainers.map((name) => ({
      '@type': 'Person',
      name,
    })),
  }));

  return (
    <div className="pt-0">
      {eventsJsonLd.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(eventsJsonLd) }}
        />
      )}

      {registeringEvent && (
        <EventRegistrationModal
          event={registeringEvent}
          onClose={() => setRegisteringEvent(null)}
          onRegistered={fetchEvents}
        />
      )}

      {/* Hero Section */}
      <PageHero
        badge={header.eyebrow}
        badgeIcon={Calendar}
        title={header.title}
        subtitle={header.subtitle}
      />
      {/* Events List */}
      {(isLoading || error || upcoming.length > 0) && (
      <section className="pt-6 pb-16 md:py-20 bg-gradient-to-br from-fitness-light via-white to-fitness-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 badge mb-4">
              <Calendar size={16} />
              <span>Reserve Your Spot</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Upcoming <span className="text-gradient-mixed">Events</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              New hikes, bootcamps and outdoor events are listed here when they open.
            </p>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <Loader2 size={32} className="animate-spin mb-4 text-fitness-primary" />
              <p>Loading events...</p>
            </div>
          ) : error ? (
            <EmptyState
              icon={AlertCircle}
              title="Couldn't load events"
              description={error}
              action={{ label: 'Try Again', icon: RefreshCw, onClick: fetchEvents }}
            />
          ) : upcoming.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No upcoming events right now"
              description="Check back soon — or get in touch to plan a hike, bootcamp or team-building day for your group."
              action={{ label: 'Get in Touch', href: '/contact' }}
            />
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {upcoming.map((event, index) => (
              <div
                key={event.id}
                className={`service-card group ${hoveredCard === event.id ? 'ring-2 ring-fitness-primary' : ''}`}
                onMouseEnter={() => setHoveredCard(event.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {event.popular && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="bg-gradient-to-r from-fitness-primary to-fitness-primary-dark text-white text-xs font-bold px-3 py-1 rounded-full">
                      Popular
                    </span>
                  </div>
                )}

                <Link href={`/events/${event.slug}`} className="relative h-52 overflow-hidden service-card-image block">
                  <img
                    src={optimizedSrc(event.image, 640)}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent"></div>
                  <div className="absolute top-4 left-4">
                    <div className="bg-gradient-to-br from-fitness-primary to-fitness-primary-dark text-white px-4 py-2 rounded-xl font-bold shadow-fitness">
                      {event.price > 0 ? `${money(event.price)}` : 'Price on request'}
                    </div>
                  </div>
                </Link>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    <Link href={`/events/${event.slug}`} className="hover:text-fitness-primary transition-colors">
                      {event.title}
                    </Link>
                  </h3>
                  <p className="text-gray-700 mb-4 line-clamp-2">{event.description}</p>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-800">
                      <div className="w-6 h-6 bg-fitness-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Calendar size={12} className="text-fitness-primary" />
                      </div>
                      {eventService.formatDate(event.date)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-800">
                      <div className="w-6 h-6 bg-fitness-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Clock size={12} className="text-fitness-primary" />
                      </div>
                      {event.time}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-800">
                      <div className="w-6 h-6 bg-fitness-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <MapPin size={12} className="text-fitness-primary" />
                      </div>
                      {event.location}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-800">
                      <div className="w-6 h-6 bg-fitness-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users size={12} className="text-fitness-primary" />
                      </div>
                      {event.spotsRemaining > 0 ? `${event.spotsRemaining}/${event.maxSpots} spots left` : 'Fully booked'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-fitness-primary to-fitness-primary-dark rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {event.trainers[0]?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                        {event.trainers.length > 1 && (
                          <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-white border border-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold text-fitness-primary">
                            +{event.trainers.length - 1}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">{event.trainers.length > 1 ? 'Trainers' : 'Trainer'}</p>
                        <p className="text-sm font-medium text-gray-700 truncate">{event.trainers.join(', ')}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRegisterClick(event)}
                      disabled={event.spotsRemaining <= 0}
                      className="flex items-center gap-1 text-fitness-primary font-medium hover:text-fitness-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {event.spotsRemaining <= 0 ? 'Full' : 'Book now'}
                      {event.spotsRemaining > 0 && (
                        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </section>
      )}

      {/* Past events */}
      {!isLoading && !error && past.length > 0 && (
        <section className="py-16 md:py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 badge mb-4">
                <Calendar size={16} />
                <span>Past Events</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Where we&apos;ve <span className="text-gradient-mixed">been</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {past.map((event, index) => (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition-all hover:-translate-y-1 hover:shadow-fitness"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                    <img src={optimizedSrc(event.image, 640)} alt={event.title} loading={index < 4 ? 'eager' : 'lazy'} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <span className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">Registration closed</span>
                  </div>
                  <div className="p-5">
                    <p className="text-sm font-medium text-fitness-primary">{eventService.formatDate(event.date)}</p>
                    <h3 className="mt-1 text-lg font-bold text-gray-900 group-hover:text-fitness-primary transition-colors">{event.title}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
                      <MapPin size={14} className="shrink-0" /> {event.location}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How to Book Section */}
      {upcoming.length > 0 && (
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 badge mb-4">
              <Zap size={16} />
              <span>Simple Process</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How to <span className="text-gradient-mixed">Book</span> an Event
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Booking your spot is easy. Follow these simple steps to secure your place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {processSteps.map((item, index) => (
              <div key={index} className="relative text-center group">
                <div className="relative bg-gray-50 rounded-3xl p-8 transition-all duration-500 group-hover:bg-white group-hover:shadow-fitness-lg group-hover:-translate-y-2">
                  <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6 group-hover:scale-110 transition-transform duration-500">
                    <div className="absolute inset-0 rounded-full border-3 border-dashed border-fitness-primary/30 animate-rotate"></div>
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-fitness-primary to-fitness-primary-dark flex items-center justify-center shadow-fitness">
                      <span className="text-2xl font-bold text-white drop-shadow-lg">{item.step}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">{item.description}</p>
                </div>
                {index < processSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -translate-y-1/2 left-[calc(100%+1rem)] text-fitness-primary">
                    <ArrowRight size={24} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
      )}


      <CtaSection
        badge="Custom Events"
        badgeIcon={Heart}
        title="Host Your Own Event"
        subtitle="Planning a hike, bootcamp, team-building day or private session for your group? We can put together an experience for you."
        primary={{ label: 'Contact for Custom Events', href: '/contact' }}
      />
    </div>
  );
}

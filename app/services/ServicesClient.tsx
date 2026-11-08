'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Dumbbell, Heart, Zap, Clock, Users, Award, CheckCircle, Star, ArrowRight, Loader2, RefreshCw, AlertCircle, type LucideIcon, MessageCircle } from 'lucide-react';
import PageHero from '@/components/ui/PageHero';
import CtaSection from '@/components/ui/CtaSection';
import EmptyState from '@/components/ui/EmptyState';
import { Training, trainingService } from '@/app/api_services/trainingService';
import ServiceBookingModal from '@/components/booking/ServiceBookingModal';
import { useSite, usePageHeader } from '@/components/site/SiteProvider';
import { useAverageRating } from '@/app/hooks/useAverageRating';
import { priceLabelFor } from '@/app/lib/enquiries';
import { optimizedSrc } from '@/app/lib/imageSrc';

const iconMap: Record<string, LucideIcon> = { Dumbbell, Heart, Zap, Clock, Users, Award, Star, CheckCircle };
const colorPalette = [
  'from-[#007AA9] to-[#31A8F0]',
  'from-fitness-primary-dark to-fitness-primary',
  'from-green-500 to-emerald-500',
  'from-purple-500 to-pink-500',
  'from-blue-500 to-indigo-500',
  'from-[#1F3541] to-[#007AA9]',
];


// Corporate-only offerings live on /corporate.
const forThisPage = (list: Training[]) => trainingService.sortForDisplay(list).filter((t) => t.audience !== 'corporate');

export default function ServicesClient({ initialTrainings }: { initialTrainings: Training[] | null }) {
  const header = usePageHeader('services', { eyebrow: 'Professional Services', title: 'Our Services', subtitle: 'Professional fitness services tailored to help you achieve your health and wellness goals.' });
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [trainings, setTrainings] = useState<Training[]>(() => (initialTrainings ? forThisPage(initialTrainings) : []));
  const [isLoadingTrainings, setIsLoadingTrainings] = useState(!initialTrainings);
  const [trainingsError, setTrainingsError] = useState('');
  const [booking, setBooking] = useState<Training | null>(null);
  const site = useSite();
  const rating = useAverageRating();
  // Benefits and steps are edited in Admin → Settings.
  const benefits = (site.settings.highlights ?? []).map((v) => v.title);
  const processSteps = (site.settings.steps ?? []).map((st, i) => ({ step: String(i + 1).padStart(2, '0'), title: st.title, description: st.text }));


  const fetchTrainings = () => {
    setIsLoadingTrainings(true);
    setTrainingsError('');
    trainingService
      .getAllTrainings()
      .then((response) => setTrainings(forThisPage(response.trainings)))
      .catch(() => setTrainingsError('Could not load services. Please check back shortly.'))
      .finally(() => setIsLoadingTrainings(false));
  };

  useEffect(() => {
    if (!initialTrainings) fetchTrainings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="pt-0">
      {/* Hero Section */}
      <PageHero
        badge={header.eyebrow}
        badgeIcon={Zap}
        title={header.title}
        subtitle={header.subtitle}
      />
        
      {/* Services Grid */}
      <section className="py-20 bg-gradient-to-br from-fitness-light via-white to-fitness-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 badge mb-4">
              <Zap size={16} />
              <span>Training Programs</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Choose Your <span className="text-gradient-mixed">Fitness Path</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Select from a variety of training options designed to fit your lifestyle and goals.
            </p>
          </div>

          {isLoadingTrainings ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <Loader2 size={32} className="animate-spin mb-4 text-fitness-primary" />
              <p>Loading services...</p>
            </div>
          ) : trainingsError ? (
            <EmptyState
              icon={AlertCircle}
              title="Couldn't load services"
              description={trainingsError}
              action={{ label: 'Try Again', icon: RefreshCw, onClick: fetchTrainings }}
            />
          ) : trainings.length === 0 ? (
            <EmptyState
              icon={Dumbbell}
              title="No services available right now"
              description="Please check back soon, or get in touch to ask about training options directly."
              action={{ label: 'Contact Us', href: '/contact' }}
            />
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {trainings.map((training, index) => {
              const Icon = (training.icon && iconMap[training.icon]) || Dumbbell;
              const color = training.color || colorPalette[index % colorPalette.length];
              return (
              <div
                key={training.id}
                className={`service-card group flex flex-col sm:flex-row ${hoveredCard === index ? 'ring-2 ring-fitness-primary' : ''}`}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Popular Badge */}
                {training.popular && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="bg-gradient-to-r from-fitness-primary to-fitness-primary-dark text-white text-xs font-bold px-3 py-1 rounded-full">
                      Popular
                    </span>
                  </div>
                )}

                <div className="relative aspect-[4/3] sm:aspect-auto sm:w-2/5 shrink-0 overflow-hidden service-card-image">
                  <img
                    src={optimizedSrc(training.image, 828)}
                    alt={training.title}
                    className="w-full h-full object-cover object-[50%_25%]"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-gray-900/80 via-gray-900/20 to-transparent`}></div>
                  <div className={`absolute bottom-4 left-4 w-14 h-14 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-6`}>
                    <Icon size={28} className="text-white" />
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{training.title}</h3>
                  <p className="text-gray-700 mb-4">{training.description}</p>

                  <div className="space-y-2 mb-6">
                    {training.features.map((feature, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-sm text-gray-700 transition-all duration-300"
                        style={{
                          transform: hoveredCard === index ? 'translateX(5px)' : 'translateX(0)',
                          opacity: hoveredCard === index ? 1 : 0.8
                        }}
                      >
                        <div className="w-5 h-5 bg-gradient-to-br from-fitness-primary/20 to-fitness-primary-dark/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle size={12} className="text-fitness-primary" />
                        </div>
                        {feature}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-auto border-t border-gray-100">
                    <span className="text-gradient-primary font-bold">{priceLabelFor(training)}</span>
                    {training.available ? (
                      <button
                        type="button"
                        onClick={() => setBooking(training)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#0F7A6E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0B5F55] transition-colors"
                      >
                        <MessageCircle size={16} />
                        Book now
                      </button>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-500">Currently unavailable</span>
                    )}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
          )}
        </div>
      </section>

      {/* Why train with us */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="relative enter-left">
              <div className="relative rounded-3xl overflow-hidden shadow-fitness-lg">
                <img
                  src={optimizedSrc(site.settings.pages?.services?.imageUrl || '/images/feature.jpg', 1080)}
                  alt="Berry Fitness class"
                  className="w-full h-auto"
                />
              </div>
              
              {/* Floating Card */}
              <div className="absolute -bottom-6 right-2 sm:-right-6 bg-gradient-to-br from-fitness-primary to-fitness-primary-dark text-white rounded-2xl p-6 shadow-fitness-lg animate-bounce-slow">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-3 rounded-xl">
                    <Star size={28} className="text-white" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{rating ? `${rating.avg.toFixed(1)}/5` : site.settings.stats?.[0]?.value ?? '★'}</div>
                    <div className="text-sm text-white/90">{rating ? `from ${rating.count} reviews` : site.settings.stats?.[0]?.label ?? 'Client focused'}</div>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-gradient-to-br from-fitness-primary/20 to-fitness-primary-dark/20 rounded-full blur-2xl"></div>
            </div>

            <div className="enter-right">
              <div className="inline-flex items-center gap-2 badge mb-4">
                <Zap size={16} />
                <span>Why Train With Us</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Fitness for <span className="text-gradient-mixed">Health</span>
              </h2>
              
              <p className="text-gray-700 mb-8 leading-relaxed">
                {(site.settings.about?.body ?? '').match(/[^.]+\./g)?.slice(0, 2).join('').trim()}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gradient-to-r hover:from-fitness-primary/5 hover:to-fitness-primary-dark/5 transition-all duration-300"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-fitness-primary to-fitness-primary-dark rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle size={16} className="text-white" />
                    </div>
                    <span className="font-medium text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Link href="/contact" className="btn-primary inline-flex items-center gap-2">
                  Start Your Journey
                  <ArrowRight size={20} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section - Enhanced */}
      <section className="py-24 bg-gradient-to-br from-fitness-light via-white to-fitness-primary/5 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-1/4 w-72 h-72 bg-fitness-primary/5 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-fitness-accent/5 rounded-full blur-3xl animate-float-delayed"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-fitness-primary/3 to-fitness-primary-dark/3 rounded-full blur-3xl animate-pulse-glow"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 badge mb-4">
              <Zap size={16} />
              <span>How It Works</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Simple Steps to <span className="text-gradient-mixed">Success</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              How to book a session in four easy steps.
            </p>
          </div>

          {/* Process Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {processSteps.map((item, index) => (
              <div 
                key={index}
                className="relative text-center group"
              >
                {/* Step Card Container - Enhanced with 3D effect */}
                <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-lg border border-white/50 hover:shadow-fitness-lg transition-all duration-500 group-hover:-translate-y-2">
                  {/* Gradient Border Effect on Hover */}
                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${
                    index % 2 === 0 ? 'from-fitness-primary via-fitness-primary-dark to-fitness-primary' : 
                    'from-fitness-primary-dark via-fitness-primary to-fitness-primary-dark'
                  } opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500`}></div>
                  
                  {/* Inner Glow */}
                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${
                    index % 2 === 0 ? 'from-fitness-primary/5 to-fitness-primary-dark/5' : 
                    'from-fitness-primary-dark/5 to-fitness-primary/5'
                  } opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                  
                  {/* Step Circle - Redesigned with cleaner layers */}
                  <div className="relative inline-flex items-center justify-center w-32 h-32 mb-6 group-hover:scale-110 transition-transform duration-500">
                    {/* Outer Ring - Rotating Dashed */}
                    <div className="absolute inset-0 rounded-full border-3 border-dashed border-fitness-primary opacity-30 animate-rotate"></div>
                    
                    {/* Middle Ring - Gradient Glow */}
                    <div className={`absolute inset-2 rounded-full bg-gradient-to-br ${
                      index % 2 === 0 ? 'from-fitness-primary/20 to-fitness-primary-dark/20' : 
                      'from-fitness-primary-dark/20 to-fitness-primary/20'
                    } border-2 border-white/30`}></div>
                    
                    {/* Inner Circle - Glassmorphism with Number */}
                    <div className="relative w-24 h-24 rounded-full flex items-center justify-center overflow-hidden shadow-fitness">
                      {/* Gradient Background */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${
                        index % 2 === 0 ? 'from-fitness-primary to-fitness-primary-dark' : 
                        'from-fitness-primary-dark to-fitness-primary'
                      }`}></div>
                      
                      {/* Glass Overlay */}
                      <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>
                      
                      {/* Number */}
                      <span className="relative z-10 text-3xl font-bold text-white drop-shadow-lg">{item.step}</span>
                    </div>
                    
                    {/* Floating Particles on Hover */}
                    <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-fitness-primary opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-300 shadow-lg"></div>
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 rounded-full bg-white opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-300 delay-150 shadow-md"></div>
                  </div>
                  
                  {/* Title with Gradient Hover */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-gradient-mixed transition-all duration-300">{item.title}</h3>
                  
                  {/* Description */}
                  <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">{item.description}</p>
                </div>
                
                {/* Enhanced Arrow Connector - Desktop Only */}
                {index < processSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -translate-y-1/2 left-[calc(100%+1rem)] z-20">
                    {/* Animated Path Connector */}
                    <div className="flex items-center">
                      {/* Line with Gradient Flow */}
                      <div className="relative h-1 w-20 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-fitness-primary to-fitness-primary-dark rounded-full"></div>
                        {/* Animated shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                      </div>
                      
                      {/* Arrow Icon with Glow */}
                      <div className="relative text-fitness-primary">
                        <div className="absolute inset-0 blur-sm bg-fitness-primary opacity-50"></div>
                        <ArrowRight size={24} className="relative" />
                      </div>
                      
                      {/* Second Line */}
                      <div className="relative h-1 w-16 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-fitness-primary-dark to-fitness-primary rounded-full opacity-70"></div>
                      </div>
                      
                      {/* Pulsing Dot at End */}
                      <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-fitness-primary opacity-50 animate-pulse"></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {booking && <ServiceBookingModal service={booking} onClose={() => setBooking(null)} />}

      <CtaSection
        title="Ready to reach your body goals?"
        subtitle="Your ultimate best personal trainer is a phone call away."
        primary={{ label: 'Get Started', href: '/contact' }}
      />
    </div>
  );
}


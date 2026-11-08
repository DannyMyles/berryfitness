'use client';

import { useState, useEffect, useRef } from 'react';
import Hero from "@/components/ui/Hero";
import PhotoSlides from "@/components/ui/PhotoSlides";
import CtaSection from "@/components/ui/CtaSection";
import Image from "next/image";
import Link from "next/link";
import {
  Dumbbell, Heart, Zap, Clock, Users, Award,
  ChevronRight, ArrowRight, Star, Play, Quote,
  ArrowLeft, ArrowRight as ArrowRightIcon, Loader2,
  AlertCircle, CheckCircle, Upload
} from 'lucide-react';
import { testimonialService, Testimonial } from '@/app/api_services/testimonialService';
import { useSite } from '@/components/site/SiteProvider';
import { galleryService } from '@/app/api_services/galleryService';
import { optimizedSrc } from '@/app/lib/imageSrc';
import { pageHeader } from '@/app/lib/site';

interface Banner { id: number; title: string; subtitle: string | null; badge: string | null; image: string | null; ctaLabel: string | null; ctaUrl: string | null }

// Gallery images
// Shown only until photos are uploaded in Admin → Gallery.
const FALLBACK_GALLERY = [
  { src: "/images/hero.jpg", alt: "Group training" },
  { src: "/images/services/body-building.jpg", alt: "Body building" },
  { src: "/images/events/team-building-bootcamp.jpg", alt: "Team building bootcamp" },
  { src: "/images/events/elephant-hill-hike.jpg", alt: "Elephant Hill hike" },
];

// Icons/colours for the highlights edited in Admin → Settings → Homepage.
const FEATURE_STYLES = [
  { icon: Dumbbell, color: "from-[#007AA9] to-[#31A8F0]" },
  { icon: Heart, color: "from-green-500 to-emerald-500" },
  { icon: Zap, color: "from-[#1F3541] to-[#007AA9]" },
  { icon: Clock, color: "from-fitness-primary-dark to-fitness-primary" },
];

export default function HomeClient() {
  const site = useSite();
  const features = (site.settings.highlights ?? []).map((h, i) => ({
    title: h.title,
    description: h.text,
    ...FEATURE_STYLES[i % FEATURE_STYLES.length],
  }));
  // A short version here; the full text is on the About page.
  const aboutIntro = (site.settings.about?.body ?? '').match(/[^.]+\./g)?.slice(0, 2).join('').trim() ?? '';
  const pricing = (site.services ?? []).filter((p) => p.price && p.price !== 'Price on request');
  const pricingHead = pageHeader(site, 'home-pricing', { eyebrow: '', title: '', highlight: '', subtitle: '' });
  // Section headings: Admin → Settings → Page headers (database).
  const featuresHead = pageHeader(site, 'home-features', { eyebrow: '', title: '', highlight: '', subtitle: '' });
  const servicesHead = pageHeader(site, 'home-services', { eyebrow: '', title: '', highlight: '' });
  const testimonialsHead = pageHeader(site, 'home-testimonials', { eyebrow: '', title: '', highlight: '', subtitle: '' });
  const ctaHead = pageHeader(site, 'home-cta', { title: '', subtitle: '' });
  const [banners, setBanners] = useState<Banner[]>([]);
  const [galleryImages, setGalleryImages] = useState(FALLBACK_GALLERY);
  useEffect(() => {
    galleryService
      .getImages()
      .then((images) => {
        if (images.length) setGalleryImages(images.map((i) => ({ src: galleryService.getImageUrl(i), alt: i.title || 'Training moment' })));
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    fetch('/api/v1/banners?placement=home')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setBanners(d.banners ?? []))
      .catch(() => {});
  }, []);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [featuredStory, setFeaturedStory] = useState<Testimonial | null>(null);
  const [showStoryForm, setShowStoryForm] = useState(false);
  const [isLoadingTestimonials, setIsLoadingTestimonials] = useState(true);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const [tName, setTName] = useState('');
  const [tRole, setTRole] = useState('');
  const [tCompany, setTCompany] = useState('');
  const [tContent, setTContent] = useState('');
  const [tRating, setTRating] = useState(5);
  const [tPhoto, setTPhoto] = useState<File | null>(null);
  const [tPhotoPreview, setTPhotoPreview] = useState('');
  const [isSubmittingTestimonial, setIsSubmittingTestimonial] = useState(false);
  const [testimonialSubmitted, setTestimonialSubmitted] = useState(false);
  const [testimonialError, setTestimonialError] = useState('');

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setTestimonialError('Please choose an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setTestimonialError('Photo must be under 5MB.');
      return;
    }
    setTestimonialError('');
    setTPhoto(file);
    setTPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmitTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestimonialError('');
    if (!tName.trim() || !tRole.trim() || tContent.trim().length < 20) {
      setTestimonialError('Please fill in your name, role, and at least 20 characters about your experience.');
      return;
    }
    setIsSubmittingTestimonial(true);
    try {
      await testimonialService.submitTestimonial({
        name: tName,
        role: tRole,
        company: tCompany || undefined,
        content: tContent,
        rating: tRating,
        photoFile: tPhoto,
      });
      setTestimonialSubmitted(true);
    } catch (err: any) {
      setTestimonialError(err?.message || 'Could not submit your testimonial. Please try again.');
    } finally {
      setIsSubmittingTestimonial(false);
    }
  };

  useEffect(() => {
    testimonialService
      .getAllTestimonials()
      .then((res) => {
        const all = testimonialService.getFeaturedForDisplay(res.testimonials);
        const story = all.find((t) => t.achievement) ?? null;
        setFeaturedStory(story);
        setTestimonials(all.filter((t) => t !== story));
      })
      .catch(() => setTestimonials([]))
      .finally(() => setIsLoadingTestimonials(false));
  }, []);

  useEffect(() => {
    if (!isAutoPlaying || testimonials.length === 0) return;

    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials.length]);

  const nextTestimonial = () => {
    if (testimonials.length === 0) return;
    setIsAutoPlaying(false);
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    if (testimonials.length === 0) return;
    setIsAutoPlaying(false);
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <>
      <Hero />

      <PhotoSlides />

      {banners.length > 0 && (
        <section className="container mx-auto px-4 pb-12">
          <div className={`grid gap-4 ${banners.length > 1 ? 'md:grid-cols-2' : ''}`}>
            {banners.slice(0, 2).map((b) => (
              <div key={b.id} className="relative overflow-hidden rounded-3xl bg-ink text-white">
                {b.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={optimizedSrc(b.image, 1920)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
                )}
                <div className="relative flex flex-col gap-3 p-7 md:flex-row md:items-end md:justify-between md:p-10">
                  <div className="max-w-2xl">
                    {b.badge && <span className="mb-3 inline-block rounded-full bg-fitness-primary px-3 py-1 text-xs font-bold uppercase tracking-wider">{b.badge}</span>}
                    <h2 className="font-display text-2xl font-bold md:text-3xl">{b.title}</h2>
                    {b.subtitle && <p className="mt-2 text-white/80">{b.subtitle}</p>}
                  </div>
                  {b.ctaLabel && b.ctaUrl && (
                    <Link href={b.ctaUrl} className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-white px-6 py-3 font-semibold text-ink transition-colors hover:bg-fitness-primary hover:text-white md:self-auto">
                      {b.ctaLabel} <ArrowRight size={18} />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 badge mb-4">
              <Zap size={16} />
              <span>{featuresHead.eyebrow}</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              {featuresHead.title} <span className="text-gradient-mixed">{featuresHead.highlight}</span>
            </h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              {featuresHead.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="feature-card group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}>
                  <feature.icon size={28} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-700">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Preview Section */}
      <section className="py-20 bg-gradient-to-br from-fitness-light via-white to-fitness-primary/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative lg:order-2">
              <div className="relative rounded-3xl overflow-hidden shadow-fitness-lg">
                <Image
                  src={site.settings.about?.imageUrl || '/images/about.jpg'}
                  alt={`${site.name} trainer`}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  width={600}
                  height={750}
                  className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/30 to-transparent"></div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 badge">
                <Award size={16} />
                <span>About Us</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                About <span className="text-gradient-primary">{site.name}</span>
              </h2>
              
              <p className="text-lg text-gray-700 leading-relaxed">{aboutIntro}</p>

              <div className="pt-2">
                <Link 
                  href="/about"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  Learn More About Us
                  <ArrowRight size={20} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Preview Section — compact teaser, full detail lives on /services */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 badge mb-4">
                <Zap size={16} />
                <span>{servicesHead.eyebrow}</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                {servicesHead.title} <span className="text-gradient-accent">{servicesHead.highlight}</span>
              </h2>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {(site.services ?? [])
                .filter((svc) => svc.audience !== 'corporate')
                .slice(0, 4)
                .map((svc, index) => ({ icon: [Dumbbell, Heart, Users, Zap][index % 4], title: svc.title }))
                .map((service, index) => (
                <Link
                  key={index}
                  href="/services"
                  className="flex items-center gap-2 bg-white px-4 py-3 rounded-full shadow-sm hover:shadow-fitness hover:-translate-y-0.5 transition-all duration-300"
                >
                  <service.icon size={18} className="text-fitness-primary" />
                  <span className="font-medium text-gray-800 text-sm">{service.title}</span>
                </Link>
              ))}
            </div>

            <Link
              href="/services"
              className="btn-secondary inline-flex items-center gap-2 whitespace-nowrap"
            >
              View All Services
              <ChevronRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing: every service with a published price (Admin → Services) */}
      {pricing.length > 0 && (
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 badge mb-4">
              <Award size={16} />
              <span>{pricingHead.eyebrow}</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              {pricingHead.title} <span className="text-gradient-mixed">{pricingHead.highlight}</span>
            </h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">{pricingHead.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {pricing.map((p) => (
              <Link key={p.id} href="/services" className="feature-card group flex flex-col justify-between gap-5">
                <h3 className="text-lg font-bold text-gray-900">{p.title}</h3>
                <div className="flex items-end justify-between gap-3">
                  <span className="text-xl font-bold text-fitness-primary">{p.price}</span>
                  <ArrowRight size={18} className="shrink-0 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-fitness-primary" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Testimonials Section */}
      {(isLoadingTestimonials || testimonials.length > 0) && (
      <section className="py-20 bg-gray-50 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 badge mb-4">
              <Star size={16} className="fill-yellow-400 text-yellow-400" />
              <span>Client Testimonials</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              What <span className="text-gradient-primary">Clients Say</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {testimonialsHead.subtitle}
            </p>
          </div>

          {featuredStory && (
            <article className="max-w-4xl mx-auto mb-8 rounded-3xl bg-gradient-to-br from-fitness-primary to-fitness-primary-dark p-8 md:p-10 text-white shadow-fitness-lg">
              <div className="flex flex-col gap-6 md:flex-row md:items-start">
                {featuredStory.photoInfo?.hasPhoto && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={testimonialService.getPhotoUrl(featuredStory)} alt={featuredStory.name} className="h-24 w-24 shrink-0 rounded-full border-4 border-white/40 object-cover" />
                )}
                <div>
                  <p className="text-2xl font-bold md:text-3xl">{featuredStory.achievement}</p>
                  <p className="mt-3 leading-relaxed text-white/90">&ldquo;{featuredStory.content}&rdquo;</p>
                  <p className="mt-4 font-bold">{featuredStory.name}</p>
                  <p className="text-sm text-white/80">{[featuredStory.role, featuredStory.company].filter(Boolean).join(', ')}</p>
                </div>
              </div>
            </article>
          )}

          <div className="max-w-4xl mx-auto">
            {isLoadingTestimonials ? (
              <div className="flex items-center justify-center py-16 text-gray-400">
                <Loader2 className="animate-spin" size={32} />
              </div>
            ) : (
            <div className="relative bg-white rounded-3xl p-8 md:p-12 shadow-card border border-gray-100">
              {/* Navigation Buttons */}
              {testimonials.length > 1 && (
                <>
                  <button
                    onClick={prevTestimonial}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-all duration-300 hover:scale-110"
                    aria-label="Previous testimonial"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <button
                    onClick={nextTestimonial}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-all duration-300 hover:scale-110"
                    aria-label="Next testimonial"
                  >
                    <ArrowRightIcon size={20} />
                  </button>
                </>
              )}

              {/* Testimonial Content */}
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <Quote size={48} className="text-fitness-primary/40" />
                </div>

                <p className="text-xl md:text-2xl leading-relaxed mb-8 text-gray-800">
                  "{testimonials[currentTestimonial].content}"
                </p>

                <div className="flex items-center justify-center gap-6">
                  {testimonials[currentTestimonial].photoInfo?.hasPhoto ? (
                    <img
                      src={testimonialService.getPhotoUrl(testimonials[currentTestimonial])}
                      alt={testimonials[currentTestimonial].name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-fitness-primary flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-fitness-primary text-white font-bold text-lg flex-shrink-0"
                      style={{ backgroundColor: testimonials[currentTestimonial].avatarColor }}
                    >
                      {testimonials[currentTestimonial].image || testimonialService.getInitials(testimonials[currentTestimonial].name)}
                    </div>
                  )}
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                      {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                        <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <div className="font-bold text-lg text-gray-900">{testimonials[currentTestimonial].name}</div>
                    <div className="text-gray-500 text-sm">{testimonials[currentTestimonial].role}</div>
                  </div>
                  {testimonials[currentTestimonial].achievement && (
                    <div className="ml-4 bg-gradient-to-br from-fitness-primary to-fitness-primary-dark text-white px-4 py-2 rounded-xl font-bold text-sm">
                      {testimonials[currentTestimonial].achievement}
                    </div>
                  )}
                </div>
              </div>

              {/* Dots Navigation */}
              {testimonials.length > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setIsAutoPlaying(false);
                        setCurrentTestimonial(index);
                      }}
                      className="p-2 flex items-center justify-center"
                      aria-label={`Go to testimonial ${index + 1}`}
                    >
                      <span
                        className={`h-3 rounded-full transition-all duration-300 ${
                          index === currentTestimonial
                            ? 'bg-gradient-to-r from-fitness-primary to-fitness-primary-dark w-8'
                            : 'w-3 bg-gray-200 hover:bg-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
            )}
          </div>
        </div>
      </section>
      )}

      {/* Share Your Experience — public testimonial submission, pending admin approval */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 badge mb-4">
                <Quote size={16} className="text-fitness-primary" />
                <span>Share Your Story</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Trained With <span className="text-gradient-primary">Berry Fitness for Health?</span>
              </h2>
              <p className="text-lg text-gray-600">
                Tell us about your experience — approved stories get featured above.
              </p>
            </div>

            <div className="bg-gray-50 rounded-3xl p-8 md:p-10 border border-gray-100">
              {testimonialSubmitted ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-fitness-primary to-fitness-primary-dark rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={32} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h3>
                  <p className="text-gray-600">Your testimonial has been submitted and is pending review.</p>
                </div>
              ) : !showStoryForm ? (
                <div className="text-center">
                  <button type="button" onClick={() => setShowStoryForm(true)} className="btn-primary">
                    Share your story
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitTestimonial} className="space-y-5">
                  {testimonialError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                      <AlertCircle size={20} className="text-red-500 shrink-0" />
                      <p className="text-sm text-red-600">{testimonialError}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        maxLength={100}
                        value={tName}
                        onChange={(e) => setTName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-fitness-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role / Occupation</label>
                      <input
                        type="text"
                        required
                        maxLength={100}
                        value={tRole}
                        onChange={(e) => setTRole(e.target.value)}
                        placeholder="e.g. Client, Software Engineer"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-fitness-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company (optional)</label>
                    <input
                      type="text"
                      maxLength={100}
                      value={tCompany}
                      onChange={(e) => setTCompany(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-fitness-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setTRating(i + 1)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star className={`h-7 w-7 ${i < tRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Experience</label>
                    <textarea
                      required
                      minLength={20}
                      maxLength={500}
                      rows={4}
                      value={tContent}
                      onChange={(e) => setTContent(e.target.value)}
                      placeholder="Tell us how training with Berry Fitness for Health has helped you..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-fitness-primary"
                    />
                    <p className="text-xs text-gray-400 mt-1">{tContent.length}/500 (min 20 characters)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Photo (optional)</label>
                    <div className="flex items-center gap-4">
                      {tPhotoPreview && (
                        <img src={tPhotoPreview} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-fitness-primary" />
                      )}
                      <label className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:border-fitness-primary hover:text-fitness-primary transition-colors cursor-pointer">
                        <Upload size={16} />
                        {tPhoto ? 'Change Photo' : 'Upload Photo'}
                        <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                      </label>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmittingTestimonial}
                    className="w-full btn-fitness py-4 flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isSubmittingTestimonial ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Testimonial'
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Preview Section — compact teaser, full grid lives on /gallery */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex gap-3 shrink-0">
              {galleryImages.slice(0, 3).map((image, index) => (
                <div key={index} className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden">
                  <img src={optimizedSrc(image.src, 384)} alt={image.alt} className="w-full h-full object-cover object-center" />
                </div>
              ))}
            </div>

            <div className="text-center lg:text-left flex-1">
              <div className="inline-flex items-center gap-2 badge mb-3">
                <Zap size={16} />
                <span>Gallery</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Training <span className="text-gradient-primary">Moments</span>
              </h2>
              <p className="text-gray-600">Glimpses of hikes, bootcamps, classes and training sessions.</p>
            </div>

            <Link
              href="/gallery"
              className="btn-primary inline-flex items-center gap-2 whitespace-nowrap"
            >
              View Full Gallery
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      <CtaSection
        title={ctaHead.title}
        subtitle={ctaHead.subtitle}
        primary={{ label: 'Get Started Today', href: '/contact' }}
        secondary={{ label: 'Explore Services', href: '/services' }}
      />
    </>
  );
}


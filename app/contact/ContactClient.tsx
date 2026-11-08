'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Phone, Mail, MapPin, Clock, Send,
  Facebook, Instagram,
  MessageCircle, Calendar,
  CheckCircle, ArrowRight, AlertCircle
} from 'lucide-react';
import { FaWhatsapp, FaTiktok, FaYoutube } from "react-icons/fa6";
import PageHero from '@/components/ui/PageHero';
import { useSite, useWhatsApp, usePageHeader } from '@/components/site/SiteProvider';
import { telHref } from '@/app/lib/site';
import { newRequestId } from '@/app/lib/enquiries';

interface Faq { id: number; question: string; answer: string; category: string | null }

const PHONE_REGEX = /^\+?[0-9\s-]{7,20}$/;

export default function ContactClient() {
  const header = usePageHeader('contact', { eyebrow: "Get In Touch", title: "Contact Us", subtitle: "Your ultimate best personal trainer is a phone call away." });
  const site = useSite();
  const whatsappLink = useWhatsApp();
  const [reference, setReference] = useState('');
  const [serviceNames, setServiceNames] = useState<string[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const requestId = useRef(newRequestId());

  useEffect(() => {
    fetch('/api/v1/trainings')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setServiceNames((d.trainings ?? []).map((t: { title: string }) => t.title)))
      .catch(() => {});
    fetch('/api/v1/faqs')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setFaqs(d.faqs ?? []))
      .catch(() => {});
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!PHONE_REGEX.test(formData.phone.trim())) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/v1/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, requestId: requestId.current }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || 'Failed to send message');
      }

      const data = await res.json().catch(() => ({}));
      setReference(data.reference ?? '');
      requestId.current = newRequestId();
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', service: '', message: '' });
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again or reach out via WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    site.contactPhone && {
      icon: Phone,
      title: 'Phone',
      details: [site.contactPhone],
      link: telHref(site.contactPhone) ?? '#',
      color: 'from-[#007AA9] to-[#31A8F0]'
    },
    site.contactEmail && {
      icon: Mail,
      title: 'Email',
      details: [site.contactEmail, site.settings.secondaryEmail].filter(Boolean) as string[],
      link: `mailto:${site.contactEmail}`,
      color: 'from-green-500 to-emerald-500'
    },
    site.location && {
      icon: MapPin,
      title: 'Location',
      details: [site.location, site.settings.postalAddress].filter(Boolean) as string[],
      link: site.settings.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.location)}`,
      color: 'from-blue-500 to-indigo-500'
    },
    site.settings.hours && {
      icon: Clock,
      title: 'Working Hours',
      details: [site.settings.hours],
      link: '#',
      color: 'from-[#1F3541] to-[#007AA9]'
    }
  ].filter(Boolean) as { icon: typeof Phone; title: string; details: string[]; link: string; color: string }[];

  const services = [...serviceNames, 'Other'];

  return (
    <div className="pt-0">
      {/* Hero Section */}
      <PageHero
        badge={header.eyebrow}
        badgeIcon={MessageCircle}
        title={header.title}
        subtitle={header.subtitle}
      />

      {/* Contact Info Cards */}
      <section className="py-12 -mt-16 relative z-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => (
              <a 
                key={index}
                href={info.link}
                className="bg-white rounded-2xl p-6 shadow-fitness hover:shadow-fitness-lg transition-all duration-500 hover:-translate-y-2 group"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${info.color} rounded-xl flex items-center justify-center mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}>
                  <info.icon size={28} className="text-white" />
                </div>
                <h2 className="font-semibold text-gray-900 mb-2">{info.title}</h2>
                {info.details.map((detail, i) => (
                  <p key={i} className="text-gray-600 text-sm">{detail}</p>
                ))}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-20 bg-gradient-to-br from-fitness-light via-white to-fitness-primary/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white rounded-3xl p-8 shadow-card hover:shadow-fitness transition-all duration-500">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 badge mb-3">
                  <Send size={16} />
                  <span>Send a Message</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Let's Start Your <span className="text-gradient-primary">Journey</span>
                </h2>
                <p className="text-gray-700 mt-2">Fill out the form below and we'll get back to you.</p>
              </div>
              
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-fitness-primary to-fitness-primary-dark rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
                    <CheckCircle size={40} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                  <p className="text-gray-600 mb-6">
                    Thank you for reaching out. We'll get back to you as soon as possible.
                  </p>
                  {reference && (
                    <p className="-mt-3 mb-6 text-sm text-gray-500">
                      Your reference: <span className="font-mono font-semibold text-gray-800">{reference}</span>
                    </p>
                  )}
                  <button
                    onClick={() => setSubmitted(false)}
                    className="btn-primary"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                      <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                      <input
                        type="text"
                        required
                        maxLength={100}
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="form-input"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        maxLength={20}
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="form-input"
                        placeholder="0712 345 678"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                    <input
                      type="email"
                      required
                      maxLength={255}
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="form-input"
                      placeholder="john@example.com"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="contact-service" className="block text-sm font-medium text-gray-700 mb-2">Service Interested In</label>
                    <select
                      id="contact-service"
                      value={formData.service}
                      onChange={(e) => setFormData({...formData, service: e.target.value})}
                      className="form-input"
                    >
                      <option value="">Select a service</option>
                      {services.map((service) => (
                        <option key={service} value={service}>{service}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Message *</label>
                    <textarea
                      required
                      maxLength={5000}
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="form-input resize-none"
                      rows={4}
                      placeholder="Tell me about your fitness goals..."
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full btn-primary py-4 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={20} />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Additional Info */}
            <div className="space-y-8">
              {/* Quick Contact Options */}
              <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-fitness-primary via-fitness-primary to-fitness-primary-dark p-8 shadow-fitness-lg ring-1 ring-white/10 text-white">
                {/* Spotlight + texture layers */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.18),transparent_45%)]" />
                <div className="absolute inset-0 opacity-[0.15] bg-pattern-dots" />

                {/* Decorative blurred orbs */}
                <div className="absolute -top-16 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-10 w-56 h-56 bg-fitness-primary-dark/40 rounded-full blur-3xl" />

                <div className="relative z-10">
                  <h3 className="text-xl font-bold mb-1">Quick Contact Options</h3>
                  <div className="w-10 h-1 bg-white/40 rounded-full mb-6" />
                  <div className="space-y-4">
                    <a
                      href={whatsappLink(`Hi ${site.name}! I have a question.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/20 hover:border-white/20 transition-all duration-300 hover:translate-x-2"
                    >
                      <div className="w-12 h-12 bg-[#0F7A6E] text-white rounded-xl flex items-center justify-center shadow-fitness">
                        <FaWhatsapp size={24} />
                      </div>
                      <div>
                        <p className="font-semibold">WhatsApp</p>
                        <p className="text-sm text-white/80">Get instant response</p>
                      </div>
                      <ArrowRight size={20} className="ml-auto" />
                    </a>
                    <Link
                      href="/services"
                      className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/20 hover:border-white/20 transition-all duration-300 hover:translate-x-2"
                    >
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shadow-fitness">
                        <Calendar size={24} />
                      </div>
                      <div>
                        <p className="font-semibold">Book a Session</p>
                        <p className="text-sm text-white/80">Schedule your first training</p>
                      </div>
                      <ArrowRight size={20} className="ml-auto" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              {Object.values(site.settings.social ?? {}).some(Boolean) && (
              <div className="bg-white rounded-3xl p-8 shadow-card hover:shadow-fitness transition-all duration-500">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Follow Us</h3>
                <p className="text-gray-600 mb-6">
                  Workout videos, events and updates from Berry Fitness.
                </p>
                <div className="flex gap-4">
                  {[
                    { label: 'TikTok', icon: FaTiktok, color: 'from-gray-800 to-black', href: site.settings.social?.tiktok },
                    { label: 'Instagram', icon: Instagram, color: 'from-pink-500 to-purple-600', href: site.settings.social?.instagram },
                    { label: 'Facebook', icon: Facebook, color: 'from-blue-600 to-blue-700', href: site.settings.social?.facebook },
                    { label: 'YouTube', icon: FaYoutube, color: 'from-red-600 to-red-700', href: site.settings.social?.youtube },
                  ].filter((x) => x.href).map((social, index) => (
                    <a
                      key={index}
                      aria-label={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-12 h-12 bg-gradient-to-br ${social.color} rounded-xl flex items-center justify-center text-white hover:shadow-fitness-lg transition-all duration-300 hover:-translate-y-1`}
                    >
                      <social.icon size={22} />
                    </a>
                  ))}
                </div>
              </div>
              )}

            </div>
          </div>
        </div>
      </section>

      {faqs.length > 0 && (
        <section className="py-20">
          <div className="container mx-auto max-w-3xl px-4">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 badge mb-4">
                <MessageCircle size={16} />
                <span>FAQ</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Questions, <span className="text-gradient-mixed">answered</span>
              </h2>
            </div>
            <div className="divide-y divide-gray-100 overflow-hidden rounded-3xl bg-white shadow-fitness">
              {faqs.map((f) => (
                <details key={f.id} className="group p-5 sm:p-6 open:bg-fitness-primary/5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
                    {f.question}
                    <ArrowRight size={18} className="shrink-0 text-fitness-primary transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="mt-3 whitespace-pre-line text-gray-600">{f.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}


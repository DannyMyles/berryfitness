'use client'

import { money } from '@/app/lib/money'
import { adminFetch } from './transport'

/** Typed admin calls to the Berry API (scoped to this app by the transport). */

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await adminFetch(path, init)
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || data.message || `Request failed (${res.status})`)
  return data as T
}

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) })

const qs = (params: Record<string, string | number | undefined | null>) => {
  const s = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => [k, String(v)])
  ).toString()
  return s ? `?${s}` : ''
}

export interface Page<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface EmailOutcome {
  status: string
  message: string
}

// --- Dashboard ---------------------------------------------------------------

export interface Stats {
  bookings: { total: number; byStatus: Record<string, number>; last30Days: number; confirmedParticipants: number; confirmedValue: number }
  enquiries: { total: number; byStatus: Record<string, number>; byType: Record<string, number>; open: number; corporate: number; last30Days: number }
  services: { total: number; byAudience: Record<string, number>; upcomingEvents: number }
  orders: { total: number; byStatus: Record<string, number>; paidRevenue: number }
  emails: { configured: boolean; last30Days: Record<string, number>; failed: number }
  audience: { users: number; subscribers: number; testimonials: number }
  recentBookings: { id: number; ticketNumber: string; attendeeName: string; participants: number; total: number; status: BookingStatus; createdAt: string; event: { id: number; title: string; date: string } }[]
  recentEnquiries: { id: number; reference: string; type: EnquiryType; status: EnquiryStatus; name: string; company: string | null; serviceName: string | null; participants: number | null; createdAt: string }[]
  nextEvents: { id: number; title: string; slug: string; date: string; time: string; maxSpots: number; spotsTaken: number }[]
}

// --- Bookings ----------------------------------------------------------------

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export interface Booking {
  id: number
  ticketNumber: string
  attendeeName: string
  attendeePhone: string
  attendeeEmail: string | null
  participants: number
  total: number
  notes: string | null
  status: BookingStatus
  checkedInAt: string | null
  createdAt: string
  event: { id: number; title: string; slug: string; date: string; time: string; location: string; price: number }
}

export interface EventOption {
  id: number
  title: string
  date: string
}

// --- Enquiries ---------------------------------------------------------------

export type EnquiryType = 'contact' | 'booking' | 'corporate' | 'quote'
export type EnquiryStatus = 'new' | 'contacted' | 'quoted' | 'confirmed' | 'completed' | 'cancelled'

export interface Enquiry {
  id: number
  reference: string
  type: EnquiryType
  status: EnquiryStatus
  name: string
  phone: string
  email: string | null
  company: string | null
  participants: number | null
  preferredDate: string | null
  location: string | null
  serviceName: string | null
  packageName: string | null
  estimate: number | null
  quotedAmount: number | null
  message: string | null
  adminNotes: string | null
  createdAt: string
  updatedAt: string
}

export interface EmailLogRow {
  id: number
  kind: string
  to: string
  subject: string
  status: 'queued' | 'sent' | 'failed' | 'skipped'
  error: string | null
  entityType?: string | null
  entityId?: number | null
  createdAt: string
  sentAt: string | null
}

// --- Services ----------------------------------------------------------------

export type PricingType = 'fixed' | 'per_person' | 'quote'
export type Audience = 'individual' | 'corporate' | 'both'

export interface ServicePackage {
  id?: number
  name: string
  description: string | null
  priceAmount: number | null
  pricingType: PricingType
  priceLabel: string | null
  minParticipants: number | null
  maxParticipants: number | null
  features: string[]
  popular: boolean
  order: number
  active: boolean
}

export interface Service {
  id: string
  title: string
  slug?: string
  description: string
  features: string[]
  price: string
  priceAmount: number | null
  pricingType: PricingType
  category: string | null
  audience: Audience
  duration: string | null
  groupSize: string | null
  schedule: string | null
  level: string | null
  location: string | null
  minParticipants: number | null
  maxParticipants: number | null
  bookingRequirements: string | null
  image: string
  icon?: string
  color?: string
  popular: boolean
  available: boolean
  order: number
  published: boolean
  packages: ServicePackage[]
}

// --- Content -----------------------------------------------------------------

export interface Faq {
  id: number
  question: string
  answer: string
  category: string | null
  order: number
  published: boolean
}

export interface Banner {
  id: number
  placement: string
  title: string
  subtitle: string | null
  badge: string | null
  image: string | null
  ctaLabel: string | null
  ctaUrl: string | null
  startsAt: string | null
  endsAt: string | null
  order: number
  active: boolean
}

export interface Testimonial {
  id: string
  name: string
  role: string
  company?: string
  content: string
  rating: number
  image?: string
  avatarColor?: string
  achievement?: string
  photoUrl?: string
  featured: boolean
  isActive: boolean
  createdAt: string
}

export interface GalleryCategory {
  id: string
  name: string
  slug: string
  imageCount: number
}

export interface GalleryImage {
  id: string
  title?: string
  categoryId: string
  url: string
  createdAt: string
}

// --- Settings ----------------------------------------------------------------

export interface TitledText {
  title: string
  text: string
}

export interface SiteSettings {
  brand?: { primaryColor?: string; secondaryColor?: string; logoUrl?: string }
  hero?: { eyebrow?: string; title?: string; highlight?: string; subtitle?: string; imageUrl?: string; primaryCtaLabel?: string; primaryCtaUrl?: string; secondaryCtaLabel?: string; secondaryCtaUrl?: string; perks?: string[] }
  social?: Partial<Record<'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'x' | 'linkedin', string>>
  hours?: string
  secondaryEmail?: string
  postalAddress?: string
  mapUrl?: string
  about?: { headline?: string; body?: string; mission?: string; vision?: string; story?: string; imageUrl?: string }
  pages?: Record<string, { eyebrow?: string; title?: string; highlight?: string; subtitle?: string; imageUrl?: string }>
  team?: { name: string; role: string; bio: string; imageUrl?: string; expertise?: string[] }[]
  stats?: { value: string; label: string }[]
  steps?: TitledText[]
  highlights?: TitledText[]
  values?: TitledText[]
  corporate?: { headline?: string; subtitle?: string; imageUrl?: string; minGroupForQuote?: number }
  booking?: { whatsappNotice?: string; successMessage?: string }
  email?: { footerNote?: string; signature?: string }
  seo?: { description?: string }
}

export interface AppSettings {
  key: string
  name: string
  tagline: string | null
  whatsappNumber: string | null
  contactEmail: string | null
  contactPhone: string | null
  location: string | null
  notificationEmail: string | null
  frontendUrl: string | null
  emailConfigured: boolean
  settings: SiteSettings
}

export const adminKit = {
  stats: () => call<Stats>('admin/stats'),

  bookings: (params: { status?: string; q?: string; eventId?: number; page?: number; pageSize?: number; sort?: string }) =>
    call<{ registrations: Booking[]; total: number; page: number; pageSize: number; statusCounts: Record<string, number> }>(
      `events/registrations/all${qs(params)}`
    ),
  setBookingStatus: (id: number, status: BookingStatus, notify = true) =>
    call<{ registration: Booking; email?: EmailOutcome }>(`events/registrations/${id}/status`, json('PATCH', { status, notify })),
  notifyBooking: (id: number, type: 'received' | 'status' | 'reminder') =>
    call<EmailOutcome>(`events/registrations/${id}/notify`, json('POST', { type })),
  events: () => call<{ events: EventOption[] }>('events?all=true').then((r) => r.events),

  enquiries: (params: { status?: string; type?: string; q?: string; page?: number; pageSize?: number; sort?: string }) =>
    call<{ enquiries: Enquiry[]; total: number; page: number; pageSize: number; statusCounts: Record<string, number>; typeCounts: Record<string, number> }>(
      `enquiries${qs(params)}`
    ),
  enquiry: (id: number) => call<{ enquiry: Enquiry; emails: EmailLogRow[] }>(`enquiries/${id}`),
  updateEnquiry: (id: number, body: { status?: EnquiryStatus; adminNotes?: string | null; quotedAmount?: number | null; notify?: boolean; note?: string }) =>
    call<{ enquiry: Enquiry; email?: EmailOutcome }>(`enquiries/${id}`, json('PATCH', body)),
  deleteEnquiry: (id: number) => call<void>(`enquiries/${id}`, { method: 'DELETE' }),

  services: () => call<{ trainings: Service[] }>('trainings?all=true').then((r) => r.trainings),
  saveService: (id: string | null, form: FormData) =>
    call<{ training: Service }>(id ? `trainings/${id}` : 'trainings', { method: id ? 'PUT' : 'POST', body: form }).then((r) => r.training),
  deleteService: (id: string) => call<void>(`trainings/${id}`, { method: 'DELETE' }),

  faqs: () => call<{ faqs: Faq[] }>('faqs?all=true').then((r) => r.faqs),
  saveFaq: (id: number | null, body: Partial<Faq>) =>
    call<{ faq: Faq }>(id ? `faqs/${id}` : 'faqs', json(id ? 'PUT' : 'POST', body)).then((r) => r.faq),
  deleteFaq: (id: number) => call<void>(`faqs/${id}`, { method: 'DELETE' }),

  banners: () => call<{ banners: Banner[] }>('banners?all=true').then((r) => r.banners),
  saveBanner: (id: number | null, form: FormData) =>
    call<{ banner: Banner }>(id ? `banners/${id}` : 'banners', { method: id ? 'PUT' : 'POST', body: form }).then((r) => r.banner),
  deleteBanner: (id: number) => call<void>(`banners/${id}`, { method: 'DELETE' }),

  testimonials: () => call<{ testimonials: Testimonial[] }>('testimonials').then((r) => r.testimonials),
  saveTestimonial: (id: string | null, form: FormData) =>
    call<{ testimonial: Testimonial }>(id ? `testimonials/${id}` : 'testimonials', { method: id ? 'PUT' : 'POST', body: form }),
  setTestimonialActive: (id: string, isActive: boolean) => call(`testimonials/${id}/status`, json('PATCH', { isActive })),
  deleteTestimonial: (id: string) => call<void>(`testimonials/${id}`, { method: 'DELETE' }),

  galleryCategories: () => call<{ categories: GalleryCategory[] }>('gallery/categories').then((r) => r.categories),
  createGalleryCategory: (name: string) => call<{ category: GalleryCategory }>('gallery/categories', json('POST', { name })).then((r) => r.category),
  galleryImages: () => call<{ images: GalleryImage[] }>('gallery/images').then((r) => r.images),
  uploadGalleryImages: (form: FormData) => call('gallery/images/bulk', { method: 'POST', body: form }),
  deleteGalleryImage: (id: string) => call<void>(`gallery/images/${id}`, { method: 'DELETE' }),

  settings: () => call<AppSettings>('app/admin'),
  saveSettings: (body: Partial<Omit<AppSettings, 'key' | 'emailConfigured' | 'settings'>> & { settings?: SiteSettings }) =>
    call<AppSettings & { message: string }>('app', json('PUT', body)),
  testEmail: (to: string) => call<EmailOutcome>('app/test-email', json('POST', { to })),

  emails: (params: { status?: string; q?: string; page?: number; pageSize?: number }) =>
    call<{ emails: EmailLogRow[]; total: number; page: number; pageSize: number; configured: boolean }>(`admin/emails${qs(params)}`),
}

export const formatMoney = (n: number) => money(n)

export const formatDate = (iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  iso ? new Date(iso).toLocaleDateString('en-KE', { timeZone: 'Africa/Nairobi', ...opts }) : '—'

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/** Customer phone as a wa.me number (Kenyan 07…/01… → 2547…/2541…). */
export function waNumber(phone: string) {
  const d = phone.replace(/\D/g, '')
  return d.startsWith('0') && d.length === 10 ? `254${d.slice(1)}` : d
}

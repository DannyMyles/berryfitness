'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, Building2, CheckCircle, Info, Loader2, MessageCircle, User, X } from 'lucide-react'
import type { Training } from '@/app/api_services/trainingService'
import { EnquiryResult, formatMoney, newRequestId, priceLabelFor, submitEnquiry } from '@/app/lib/enquiries'
import { PHONE_REGEX, cancelWhatsAppTab, loadContactDetails, reserveWhatsAppTab, saveContactDetails, sendToWhatsApp } from '@/app/lib/whatsappHandoff'
import { useSite } from '@/components/site/SiteProvider'
import { optimizedSrc } from '@/app/lib/imageSrc';

type Mode = 'individual' | 'corporate'

interface Props {
  service: Training
  initialPackageId?: number
  /** Corporate collects company details and is priced by quotation. */
  mode?: Mode
  onClose: () => void
}

const today = () => new Date().toISOString().slice(0, 10)

/**
 * Book a service or request a corporate quote. The request is saved first
 * (so the team sees it in the admin even if WhatsApp never opens), then
 * WhatsApp opens with every detail prefilled. Nothing is confirmed until
 * the team replies.
 */
export default function ServiceBookingModal({ service, initialPackageId, mode: initialMode, onClose }: Props) {
  const site = useSite()
  const canChooseMode = service.audience === 'both'
  const [mode, setMode] = useState<Mode>(initialMode ?? (service.audience === 'corporate' ? 'corporate' : 'individual'))
  const packages = service.packages ?? []
  const [packageId, setPackageId] = useState<number | ''>(initialPackageId ?? (packages.length === 1 ? packages[0].id : ''))
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    participants: String(service.minParticipants ?? 1),
    preferredDate: '',
    location: '',
    message: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<EnquiryResult | null>(null)
  const [opened, setOpened] = useState(false)
  const requestId = useRef(newRequestId())
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    const saved = loadContactDetails()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm((f) => ({ ...f, name: saved.name ?? '', phone: saved.phone ?? '', email: saved.email ?? '' }))
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current()
    window.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [])

  const pkg = packages.find((p) => p.id === packageId)
  const pricing = pkg ?? service
  const min = pkg?.minParticipants ?? service.minParticipants
  const max = pkg?.maxParticipants ?? service.maxParticipants
  const people = Number(form.participants) || 0
  const quoteThreshold = site.settings.corporate?.minGroupForQuote
  const estimate = useMemo(() => {
    if (mode === 'corporate' && quoteThreshold && people >= quoteThreshold) return null
    if (!pricing.priceAmount || pricing.pricingType === 'quote') return null
    return pricing.pricingType === 'per_person' ? pricing.priceAmount * Math.max(1, people) : pricing.priceAmount
  }, [pricing, people, mode, quoteThreshold])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const next: Record<string, string> = {}
    if (form.name.trim().length < 2) next.name = 'Please enter your name'
    if (!PHONE_REGEX.test(form.phone.trim())) next.phone = 'Enter a valid phone number, e.g. 0712 345 678'
    if (mode === 'corporate' && !form.email.trim()) next.email = 'We need an email to send your quote'
    else if (form.email && !/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email'
    if (mode === 'corporate' && form.company.trim().length < 2) next.company = 'Please enter your company or organisation'
    if (!Number.isInteger(people) || people < 1) next.participants = 'At least 1 person'
    else if (min && people < min) next.participants = `This needs at least ${min} participants`
    else if (max && people > max && mode === 'individual') next.participants = `Up to ${max} people — choose corporate/group for more`
    if (form.preferredDate && form.preferredDate < today()) next.preferredDate = 'Choose a future date'
    if (packages.length > 1 && packageId === '') next.packageId = 'Choose a package'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setError('')
    setSubmitting(true)
    const tab = reserveWhatsAppTab()
    try {
      const result = await submitEnquiry({
        type: mode === 'corporate' ? 'corporate' : 'booking',
        serviceId: Number(service.id),
        packageId: packageId === '' ? undefined : packageId,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        company: mode === 'corporate' ? form.company.trim() : undefined,
        participants: people,
        preferredDate: form.preferredDate || undefined,
        location: form.location.trim() || undefined,
        message: form.message.trim() || undefined,
        requestId: requestId.current,
      })
      saveContactDetails({ name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim() || undefined })
      if (result.whatsapp) setOpened(sendToWhatsApp(tab, result.whatsapp.url))
      else cancelWhatsAppTab(tab)
      setDone(result)
    } catch (err) {
      cancelWhatsAppTab(tab)
      setError(err instanceof Error ? err.message : 'Could not send your request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const notice = site.settings.booking?.whatsappNotice || 'Opening WhatsApp does not confirm your booking — we will reply to confirm.'
  const input = 'block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-fitness-primary focus:outline-none focus:ring-2 focus:ring-fitness-primary/20'

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={onClose} role="dialog" aria-modal="true" aria-labelledby="sb-title">
      <div className="flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="relative h-28 shrink-0 bg-fitness-dark">
          {service.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={optimizedSrc(service.image, 640)} alt="" className="h-full w-full object-cover object-[50%_25%] opacity-70" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/10" />
          <button onClick={onClose} className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-gray-700 hover:bg-white" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
          <div className="absolute bottom-3 left-5 right-12 text-white">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/75">{done ? 'Request sent' : mode === 'corporate' ? 'Corporate booking / quote' : 'Book a service'}</p>
            <h2 id="sb-title" className="text-xl font-bold leading-tight">{service.title}</h2>
          </div>
        </div>

        <div className="overflow-y-auto p-5 sm:p-6">
          {done ? (
            <div className="py-2 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{site.settings.booking?.successMessage || 'Request received!'}</h3>
              <p className="mt-1 text-gray-600">
                Reference <span className="font-mono font-semibold text-gray-900">{done.enquiry.reference}</span>
              </p>
              <p className="mb-5 mt-1 text-sm text-gray-500">
                {opened ? 'WhatsApp has opened with your details — tap Send to reach us.' : 'Send your request on WhatsApp so we can confirm quickly.'}
                {form.email && ' A copy is on its way to your inbox.'}
              </p>
              {done.whatsapp && (
                <a href={done.whatsapp.url} target="_blank" rel="noopener noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F7A6E] py-3.5 font-semibold text-white hover:bg-[#0B5F55]">
                  <MessageCircle className="h-5 w-5" /> {opened ? 'Open WhatsApp again' : 'Send on WhatsApp'}
                </a>
              )}
              <p className="mt-3 text-xs text-gray-500">{notice}</p>
              <button onClick={onClose} className="mt-3 w-full py-2 font-medium text-gray-600 hover:text-fitness-primary">
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="space-y-4">
              {canChooseMode && (
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1" role="radiogroup" aria-label="Booking for">
                  {(['individual', 'corporate'] as Mode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      role="radio"
                      aria-checked={mode === m}
                      onClick={() => setMode(m)}
                      className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition-colors ${mode === m ? 'bg-white text-fitness-primary shadow-sm' : 'text-gray-600'}`}
                    >
                      {m === 'individual' ? <User className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                      {m === 'individual' ? 'Just me / friends' : 'Company / group'}
                    </button>
                  ))}
                </div>
              )}

              {packages.length > 0 && (
                <fieldset>
                  <legend className="mb-1.5 text-sm font-medium text-gray-700">Package</legend>
                  <div className="grid gap-2">
                    {packages.map((p) => (
                      <label
                        key={p.id}
                        className={`flex cursor-pointer items-start justify-between gap-3 rounded-xl border p-3 text-sm transition-colors ${packageId === p.id ? 'border-fitness-primary bg-fitness-primary/5' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <span className="flex items-start gap-2">
                          <input type="radio" name="package" checked={packageId === p.id} onChange={() => setPackageId(p.id)} className="mt-0.5 accent-[#007AA9]" />
                          <span>
                            <span className="block font-semibold text-gray-900">
                              {p.name} {p.popular && <span className="ml-1 rounded-full bg-fitness-primary px-2 py-0.5 text-[10px] font-bold uppercase text-white">Popular</span>}
                            </span>
                            {p.description && <span className="block text-gray-500">{p.description}</span>}
                          </span>
                        </span>
                        <span className="shrink-0 font-semibold text-gray-900">{priceLabelFor(p)}</span>
                      </label>
                    ))}
                  </div>
                  {errors.packageId && <p className="mt-1 text-xs font-medium text-red-600">{errors.packageId}</p>}
                </fieldset>
              )}

              {mode === 'corporate' && (
                <F id="sb-company" label="Company / organisation" error={errors.company}>
                  <input id="sb-company" value={form.company} onChange={set('company')} maxLength={160} autoComplete="organization" className={input} aria-invalid={!!errors.company} />
                </F>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <F id="sb-name" label={mode === 'corporate' ? 'Contact person' : 'Full name'} error={errors.name}>
                  <input id="sb-name" value={form.name} onChange={set('name')} maxLength={100} autoComplete="name" className={input} aria-invalid={!!errors.name} />
                </F>
                <F id="sb-phone" label="Phone (WhatsApp)" error={errors.phone}>
                  <input id="sb-phone" type="tel" inputMode="tel" value={form.phone} onChange={set('phone')} maxLength={20} autoComplete="tel" placeholder="0712 345 678" className={input} aria-invalid={!!errors.phone} />
                </F>
              </div>
              <F id="sb-email" label="Email" hint={mode === 'corporate' ? 'for your quote' : 'optional — for a confirmation email'} error={errors.email}>
                <input id="sb-email" type="email" value={form.email} onChange={set('email')} maxLength={255} autoComplete="email" className={input} aria-invalid={!!errors.email} />
              </F>
              <div className="grid gap-4 sm:grid-cols-2">
                <F id="sb-people" label={mode === 'corporate' ? 'Number of participants' : 'People'} hint={min || max ? [min && `min ${min}`, max && `max ${max}`].filter(Boolean).join(', ') : undefined} error={errors.participants}>
                  <input id="sb-people" type="number" min={1} value={form.participants} onChange={set('participants')} className={input} aria-invalid={!!errors.participants} />
                </F>
                <F id="sb-date" label="Preferred date" hint="optional" error={errors.preferredDate}>
                  <input id="sb-date" type="date" min={today()} value={form.preferredDate} onChange={set('preferredDate')} className={input} aria-invalid={!!errors.preferredDate} />
                </F>
              </div>
              {mode === 'corporate' && (
                <F id="sb-location" label="Venue / location" hint="optional">
                  <input id="sb-location" value={form.location} onChange={set('location')} maxLength={200} placeholder="Our office in Westlands, your gym, Karura…" className={input} />
                </F>
              )}
              <F id="sb-message" label={mode === 'corporate' ? 'Goals & special requirements' : 'Anything we should know?'} hint="optional">
                <textarea id="sb-message" rows={3} value={form.message} onChange={set('message')} maxLength={2000} className={input} placeholder={mode === 'corporate' ? 'Fitness levels, dietary needs, timings, budget…' : 'Goals, experience, preferred times…'} />
              </F>

              {service.bookingRequirements && (
                <p className="flex items-start gap-2 rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" /> {service.bookingRequirements}
                </p>
              )}

              <div className="flex items-center justify-between rounded-xl bg-fitness-primary/5 px-4 py-3 text-sm">
                <span className="text-gray-600">{estimate ? 'Estimated total' : 'Price'}</span>
                <span className="font-bold text-gray-900">{estimate ? formatMoney(estimate) : mode === 'corporate' ? 'Tailored quote' : priceLabelFor(pricing)}</span>
              </div>

              {error && (
                <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
                </div>
              )}
              <button type="submit" disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F7A6E] py-3.5 font-semibold text-white transition-colors hover:bg-[#0B5F55] disabled:opacity-60">
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageCircle className="h-5 w-5" />}
                {submitting ? 'Sending…' : mode === 'corporate' ? 'Request quote on WhatsApp' : 'Continue on WhatsApp'}
              </button>
              <p className="text-center text-xs text-gray-500">{notice}</p>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

function F({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
        {label} {hint && <span className="font-normal text-gray-400">({hint})</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  )
}

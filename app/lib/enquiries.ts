'use client'

import { money } from '@/app/lib/money'
import { backendFetch } from './backend'

/** Public enquiry API (service bookings, corporate bookings, quotes, contact). */
export type EnquiryType = 'contact' | 'booking' | 'corporate' | 'quote'

export interface EnquiryInput {
  type: EnquiryType
  serviceId?: number
  packageId?: number
  name: string
  phone: string
  email?: string
  company?: string
  participants?: number
  preferredDate?: string
  location?: string
  message?: string
  service?: string
  requestId?: string
}

export interface EnquiryResult {
  enquiry: { reference: string; type: EnquiryType; status: string; serviceName: string | null; packageName: string | null; estimate: number | null }
  whatsapp: { number: string; message: string; url: string } | null
  message: string
}

export async function submitEnquiry(input: EnquiryInput): Promise<EnquiryResult> {
  let res: Response
  try {
    res = await backendFetch('/api/v1/enquiries', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    })
  } catch {
    throw new Error("We couldn't reach the server. Check your connection and try again.")
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(
      res.status === 429
        ? 'Too many requests — please wait a few minutes and try again.'
        : res.status >= 500
          ? 'Something went wrong on our side. Please try again, or reach us on WhatsApp.'
          : data.error || 'Could not send your request.'
    )
  }
  return data as EnquiryResult
}

/** Client-generated id that makes a submit safe to retry. */
export function newRequestId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().replace(/-/g, '')
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`
}

export const formatMoney = (n: number) => money(n)

export function priceLabelFor(p: { price?: string; priceAmount: number | null; pricingType: 'fixed' | 'per_person' | 'quote'; priceLabel?: string | null }) {
  if (p.priceLabel) return p.priceLabel
  if (p.pricingType === 'quote' || !p.priceAmount) return p.price || 'Price on quotation'
  return p.pricingType === 'per_person' ? `${formatMoney(p.priceAmount)} / person` : formatMoney(p.priceAmount)
}

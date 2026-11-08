'use client'

import { useEffect, useState } from 'react'
import { Building2, Calendar, Mail, MessageCircle, Phone, RefreshCw, Search, Trash2, Users } from 'lucide-react'
import { EmailLogRow, Enquiry, EnquiryStatus, EnquiryType, adminKit, formatDate, formatDateTime, formatMoney, waNumber } from './api'
import { Badge, Button, EmptyState, ErrorState, Field, FilterPills, Modal, PageTitle, Pagination, SkeletonRows, Toggle, inputClass, toast, toastEmail, useDebounced, useQuery } from './ui'

type StatusFilter = EnquiryStatus | 'open' | 'all'
const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]
const TYPE_OPTIONS: { value: EnquiryType | ''; label: string }[] = [
  { value: '', label: 'All types' },
  { value: 'corporate', label: 'Corporate bookings' },
  { value: 'quote', label: 'Quote requests' },
  { value: 'booking', label: 'Service bookings' },
  { value: 'contact', label: 'Contact messages' },
]
const STATUSES: EnquiryStatus[] = ['new', 'contacted', 'quoted', 'confirmed', 'completed', 'cancelled']
const PAGE_SIZE = 20

/** Contact messages, service & corporate bookings and quotation requests. */
export default function EnquiriesView({ initialQuery = '', initialType = '' }: { initialQuery?: string; initialType?: string }) {
  const [status, setStatus] = useState<StatusFilter>('all')
  const [type, setType] = useState(initialType)
  const [query, setQuery] = useState(initialQuery)
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState<Enquiry | null>(null)
  const q = useDebounced(query)
  const params = { status: status === 'all' ? undefined : status, type: type || undefined, q, page, pageSize: PAGE_SIZE }
  const { data, loading, error, reload: load } = useQuery(JSON.stringify(params), () => adminKit.enquiries(params))
  const rows = data?.enquiries ?? []
  const total = data?.total ?? 0
  const counts = data ? { ...data.statusCounts, all: Object.values(data.statusCounts).reduce((a, b) => a + b, 0) } : {}

  return (
    <div>
      <PageTitle
        title="Enquiries"
        subtitle="Contact messages, service bookings, corporate bookings and quote requests."
        actions={
          <Button variant="secondary" onClick={load} aria-label="Refresh">
            <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          </Button>
        }
      />
      <div className="mb-4">
        <FilterPills options={STATUS_FILTERS} value={status} onChange={(v) => { setStatus(v); setPage(1) }} counts={counts} />
      </div>
      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} placeholder="Search name, company, phone, email, reference…" className={`${inputClass} pl-9`} aria-label="Search enquiries" />
        </div>
        <select value={type} onChange={(e) => { setType(e.target.value); setPage(1) }} className={inputClass} aria-label="Filter by type">
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading && rows.length === 0 ? (
        <SkeletonRows />
      ) : rows.length === 0 ? (
        <EmptyState title={q || type ? 'No enquiries match your filters.' : 'No enquiries yet.'} text="Contact-form messages, service bookings and corporate quote requests show up here." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="hidden bg-gray-50 text-xs uppercase tracking-wider text-gray-500 md:table-header-group">
              <tr>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Request</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((e) => (
                <tr key={e.id} onClick={() => setOpen(e)} className="block cursor-pointer hover:bg-accent-50/40 md:table-row" tabIndex={0} onKeyDown={(ev) => ev.key === 'Enter' && setOpen(e)}>
                  <td className="block px-4 pt-4 md:table-cell md:py-3">
                    <p className="font-semibold text-gray-900">{e.company || e.name}</p>
                    <p className="text-gray-500">{e.company ? e.name : e.phone}</p>
                  </td>
                  <td className="block px-4 md:table-cell md:py-3">
                    <p className="text-gray-800">{e.serviceName || 'General enquiry'}</p>
                    <p className="text-gray-500">
                      {[e.packageName, e.participants && `${e.participants} ${e.participants === 1 ? 'person' : 'people'}`, e.preferredDate && formatDate(e.preferredDate)].filter(Boolean).join(' · ') || e.message?.slice(0, 60)}
                    </p>
                  </td>
                  <td className="block px-4 py-2 md:table-cell md:py-3">
                    <span className="flex flex-wrap gap-1">
                      <Badge value={e.type} />
                      <Badge value={e.status} />
                    </span>
                  </td>
                  <td className="block px-4 pb-4 text-gray-500 md:table-cell md:py-3">
                    <span className="font-mono text-xs text-gray-400">{e.reference}</span>
                    <br />
                    {formatDateTime(e.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />

      {open && (
        <EnquiryDetail
          enquiry={open}
          onClose={() => setOpen(null)}
          onChanged={() => {
            load()
          }}
        />
      )}
    </div>
  )
}

function EnquiryDetail({ enquiry, onClose, onChanged }: { enquiry: Enquiry; onClose: () => void; onChanged: () => void }) {
  const [e, setE] = useState(enquiry)
  const [emails, setEmails] = useState<EmailLogRow[]>([])
  const [status, setStatus] = useState<EnquiryStatus>(enquiry.status)
  const [quoted, setQuoted] = useState(enquiry.quotedAmount ? String(enquiry.quotedAmount) : '')
  const [notes, setNotes] = useState(enquiry.adminNotes ?? '')
  const [notify, setNotify] = useState(false)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    adminKit
      .enquiry(enquiry.id)
      .then((r) => {
        setE(r.enquiry)
        setEmails(r.emails)
      })
      .catch(() => {})
  }, [enquiry.id])

  const statusChanged = status !== e.status || (quoted || '') !== (e.quotedAmount ? String(e.quotedAmount) : '')

  const save = async () => {
    if (status === 'quoted' && !quoted) {
      toast('Enter the quoted amount first.', 'error')
      return
    }
    setSaving(true)
    try {
      const r = await adminKit.updateEnquiry(e.id, {
        status,
        adminNotes: notes.trim() || null,
        quotedAmount: quoted ? Number(quoted) : null,
        notify: notify && Boolean(e.email),
        note: note.trim() || undefined,
      })
      setE(r.enquiry)
      toast('Enquiry updated.')
      toastEmail(r.email)
      setNote('')
      setNotify(false)
      onChanged()
      adminKit.enquiry(e.id).then((d) => setEmails(d.emails)).catch(() => {})
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save', 'error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!window.confirm(`Delete enquiry ${e.reference}? This cannot be undone.`)) return
    try {
      await adminKit.deleteEnquiry(e.id)
      toast('Enquiry deleted.')
      onChanged()
      onClose()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not delete', 'error')
    }
  }

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={`${e.reference} · ${e.serviceName || 'General enquiry'}`}
      footer={
        <>
          <Button variant="danger" onClick={remove} className="mr-auto">
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={save} loading={saving}>
            Save{notify && e.email ? ' & email customer' : ''}
          </Button>
        </>
      }
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            <Badge value={e.type} />
            <Badge value={e.status} />
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-lg font-bold text-gray-900">{e.name}</p>
            {e.company && (
              <p className="flex items-center gap-2 text-gray-700">
                <Building2 className="h-4 w-4 text-gray-400" /> {e.company}
              </p>
            )}
            <p className="flex items-center gap-2 text-gray-700">
              <Phone className="h-4 w-4 text-gray-400" /> <a href={`tel:${e.phone}`}>{e.phone}</a>
            </p>
            {e.email && (
              <p className="flex items-center gap-2 text-gray-700">
                <Mail className="h-4 w-4 text-gray-400" /> <a href={`mailto:${e.email}`} className="break-all hover:text-accent-600">{e.email}</a>
              </p>
            )}
            {e.participants && (
              <p className="flex items-center gap-2 text-gray-700">
                <Users className="h-4 w-4 text-gray-400" /> {e.participants} participants
              </p>
            )}
            {e.preferredDate && (
              <p className="flex items-center gap-2 text-gray-700">
                <Calendar className="h-4 w-4 text-gray-400" /> {formatDate(e.preferredDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
          <dl className="grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-4 text-sm">
            {[
              ['Package', e.packageName],
              ['Location', e.location],
              ['Estimate', e.estimate ? formatMoney(e.estimate) : 'On request'],
              ['Received', formatDateTime(e.createdAt)],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-gray-500">{k}</dt>
                <dd className="font-medium text-gray-900">{v || '—'}</dd>
              </div>
            ))}
          </dl>
          {e.message && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Message / requirements</p>
              <p className="whitespace-pre-wrap rounded-xl border-l-4 border-accent-400 bg-accent-50/50 p-3 text-sm text-gray-800">{e.message}</p>
            </div>
          )}
          <a
            href={`https://wa.me/${waNumber(e.phone)}?text=${encodeURIComponent(`Hi ${e.name.split(' ')[0]}, about your request ${e.reference}: `)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F7A6E] py-2.5 text-sm font-semibold text-white hover:bg-[#0B5F55]"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp {e.name.split(' ')[0]}
          </a>
        </div>

        <div className="space-y-4">
          <Field label="Status">
            <select value={status} onChange={(ev) => setStatus(ev.target.value as EnquiryStatus)} className={inputClass}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s[0].toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Quoted amount (USD)" hint={status === 'quoted' ? 'required' : 'optional'}>
            <input type="number" min={0} value={quoted} onChange={(ev) => setQuoted(ev.target.value)} className={inputClass} placeholder="e.g. 45000" />
          </Field>
          <Field label="Internal notes" hint="only visible to admins">
            <textarea rows={3} value={notes} onChange={(ev) => setNotes(ev.target.value)} className={inputClass} />
          </Field>
          <div className="rounded-xl border border-gray-100 p-4">
            {e.email ? (
              <>
                <Toggle checked={notify} onChange={setNotify} label="Email the customer about this update" hint={statusChanged ? 'Sends the new status / quote' : 'Sends the current status'} />
                {notify && (
                  <textarea rows={3} value={note} onChange={(ev) => setNote(ev.target.value)} className={`${inputClass} mt-3`} placeholder="Optional note included in the email…" />
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500">No email address — follow up by phone or WhatsApp.</p>
            )}
          </div>
          {emails.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Emails</p>
              <ul className="space-y-1.5 text-sm">
                {emails.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2">
                    <span className="truncate text-gray-700" title={m.error ?? m.subject}>
                      {m.kind.replace(/_/g, ' ')} → {m.to}
                    </span>
                    <Badge value={m.status} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

'use client'

import { useState } from 'react'
import { Bell, Calendar, Check, CheckCheck, Mail, MapPin, MessageCircle, RefreshCw, RotateCcw, Search, Users, X } from 'lucide-react'
import { Booking, BookingStatus, adminKit, formatDate, formatDateTime, formatMoney, waNumber } from './api'
import { Badge, Button, EmptyState, ErrorState, FilterPills, PageTitle, Pagination, SkeletonRows, inputClass, toast, toastEmail, useDebounced, useQuery } from './ui'

type Filter = BookingStatus | 'all'
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'pending', label: 'To confirm' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'all', label: 'All' },
]
const PAGE_SIZE = 20

/** Every booking of this app across all events/adventures, with follow-up actions. */
export default function BookingsView({ initialQuery = '', initialStatus }: { initialQuery?: string; initialStatus?: string }) {
  const [filter, setFilter] = useState<Filter>(
    FILTERS.some((f) => f.value === initialStatus) ? (initialStatus as Filter) : initialQuery ? 'all' : 'pending'
  )
  const [query, setQuery] = useState(initialQuery)
  const [eventId, setEventId] = useState('')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [busy, setBusy] = useState<string | null>(null)
  const q = useDebounced(query)
  const params = { status: filter === 'all' ? undefined : filter, q, eventId: eventId ? Number(eventId) : undefined, page, pageSize: PAGE_SIZE, sort }
  const { data, loading, error, reload: load } = useQuery(JSON.stringify(params), () => adminKit.bookings(params))
  const events = useQuery('events', adminKit.events).data ?? []
  const rows = data?.registrations ?? []
  const total = data?.total ?? 0
  const counts = data ? { ...data.statusCounts, all: Object.values(data.statusCounts).reduce((a, b) => a + b, 0) } : {}
  const resetPage = <T,>(set: (v: T) => void) => (v: T) => {
    set(v)
    setPage(1)
  }

  const setStatus = async (b: Booking, status: BookingStatus, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return
    setBusy(`${b.id}:${status}`)
    try {
      const r = await adminKit.setBookingStatus(b.id, status)
      toast(`${b.attendeeName}: marked ${status}.`)
      toastEmail(r.email)
      load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not update the booking', 'error')
    } finally {
      setBusy(null)
    }
  }

  const notify = async (b: Booking, type: 'received' | 'status' | 'reminder') => {
    setBusy(`${b.id}:${type}`)
    try {
      const r = await adminKit.notifyBooking(b.id, type)
      toastEmail(r)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not send the email', 'error')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      <PageTitle
        title="Bookings"
        subtitle="Confirm bookings once you’ve agreed details on WhatsApp — the customer is emailed automatically."
        actions={
          <Button variant="secondary" onClick={load} aria-label="Refresh">
            <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          </Button>
        }
      />

      <div className="mb-4">
        <FilterPills options={FILTERS} value={filter} onChange={resetPage(setFilter)} counts={counts} />
      </div>
      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={query} onChange={(e) => resetPage(setQuery)(e.target.value)} placeholder="Search name, phone, email, reference or event…" className={`${inputClass} pl-9`} aria-label="Search bookings" />
        </div>
        <select value={eventId} onChange={(e) => resetPage(setEventId)(e.target.value)} className={inputClass} aria-label="Filter by event">
          <option value="">All events</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title} · {formatDate(e.date, { day: 'numeric', month: 'short' })}
            </option>
          ))}
        </select>
        <select value={sort} onChange={(e) => resetPage(setSort)(e.target.value)} className={inputClass} aria-label="Sort">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="eventDate">By event date</option>
        </select>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading && rows.length === 0 ? (
        <SkeletonRows />
      ) : rows.length === 0 ? (
        <EmptyState title={q || eventId ? 'No bookings match your search.' : 'Nothing here yet.'} text="New bookings appear here as soon as someone books." />
      ) : (
        <ul className="space-y-3">
          {rows.map((b) => (
            <li key={b.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-bold text-gray-900">{b.attendeeName}</p>
                    <Badge value={b.status} label={b.status === 'pending' ? 'to confirm' : undefined} />
                    <span className="font-mono text-xs text-gray-400">{b.ticketNumber}</span>
                    {b.checkedInAt && <Badge value="confirmed" label="checked in" />}
                  </div>
                  <p className="font-medium text-gray-800">{b.event.title}</p>
                  <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(b.event.date, { weekday: 'short', day: 'numeric', month: 'short' })}, {b.event.time}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {b.event.location}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {b.participants} {b.participants === 1 ? 'person' : 'people'}
                      {b.total > 0 && ` · ${formatMoney(b.total)}`}
                    </span>
                    {b.attendeeEmail && (
                      <a href={`mailto:${b.attendeeEmail}`} className="inline-flex items-center gap-1 hover:text-accent-600">
                        <Mail className="h-3.5 w-3.5" />
                        {b.attendeeEmail}
                      </a>
                    )}
                  </p>
                  {b.notes && <p className="text-sm italic text-gray-500">“{b.notes}”</p>}
                  <p className="text-xs text-gray-400">Booked {formatDateTime(b.createdAt)}</p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2 lg:max-w-sm lg:justify-end">
                  <a
                    href={`https://wa.me/${waNumber(b.attendeePhone)}?text=${encodeURIComponent(`Hi ${b.attendeeName}, about your booking ${b.ticketNumber} for ${b.event.title}: `)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F7A6E] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#0B5F55]"
                  >
                    <MessageCircle className="h-4 w-4" /> {b.attendeePhone}
                  </a>
                  {(b.status === 'pending' || b.status === 'cancelled') && (
                    <Button size="sm" variant="dark" loading={busy === `${b.id}:confirmed`} onClick={() => setStatus(b, 'confirmed')}>
                      <Check className="h-4 w-4" /> Confirm
                    </Button>
                  )}
                  {b.status === 'confirmed' && (
                    <Button size="sm" variant="secondary" loading={busy === `${b.id}:completed`} onClick={() => setStatus(b, 'completed')}>
                      <CheckCheck className="h-4 w-4" /> Completed
                    </Button>
                  )}
                  {b.status === 'confirmed' && b.attendeeEmail && (
                    <Button size="sm" variant="secondary" loading={busy === `${b.id}:reminder`} onClick={() => notify(b, 'reminder')}>
                      <Bell className="h-4 w-4" /> Remind
                    </Button>
                  )}
                  {b.attendeeEmail && (
                    <Button size="sm" variant="ghost" loading={busy === `${b.id}:status`} onClick={() => notify(b, 'status')} title="Re-send the email for the current status">
                      <Mail className="h-4 w-4" /> Resend
                    </Button>
                  )}
                  {b.status === 'completed' && (
                    <Button size="sm" variant="ghost" loading={busy === `${b.id}:pending`} onClick={() => setStatus(b, 'confirmed')}>
                      <RotateCcw className="h-4 w-4" /> Reopen
                    </Button>
                  )}
                  {b.status !== 'cancelled' && b.status !== 'completed' && (
                    <Button
                      size="sm"
                      variant="danger"
                      loading={busy === `${b.id}:cancelled`}
                      onClick={() => setStatus(b, 'cancelled', `Cancel ${b.attendeeName}'s booking? The spots are released and the customer is emailed.`)}
                    >
                      <X className="h-4 w-4" /> Cancel
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
    </div>
  )
}

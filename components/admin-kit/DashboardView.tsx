'use client'

import Link from 'next/link'
import { AlertTriangle, ArrowRight, Briefcase, CalendarCheck, Inbox, Mail, RefreshCw, ShoppingBag, Users } from 'lucide-react'
import { Stats, adminKit, formatDate, formatDateTime, formatMoney } from './api'
import { ADMIN_BASE_PATH } from './transport'
import { Badge, Button, Card, ErrorState, PageTitle, SkeletonRows, StatCard, useQuery } from './ui'

/** Overview of one app: bookings, enquiries, capacity and email health. */
export default function DashboardView({ appName, showOrders = false }: { appName: string; showOrders?: boolean }) {
  const { data: stats, error, loading, reload: load } = useQuery<Stats>('stats', adminKit.stats)

  const base = ADMIN_BASE_PATH
  return (
    <div>
      <PageTitle
        title="Dashboard"
        subtitle={`What’s happening at ${appName}`}
        actions={
          <Button variant="secondary" onClick={load} aria-label="Refresh">
            <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} /> Refresh
          </Button>
        }
      />
      {error && <ErrorState message={error} onRetry={load} />}
      {!stats && !error && <SkeletonRows rows={3} />}
      {stats && (
        <div className="space-y-6">
          {!stats.emails.configured && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <p>
                Email isn’t configured on the server yet, so confirmation emails are being skipped (bookings and enquiries are still saved).
                Set the SMTP settings on the API server, then send a test from <Link href={`${base}/settings`} className="font-semibold underline">Settings</Link>.
              </p>
            </div>
          )}
          {stats.emails.failed > 0 && (
            <Link href={`${base}/emails?status=failed`} className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 hover:bg-red-100">
              <Mail className="h-5 w-5" /> {stats.emails.failed} email{stats.emails.failed === 1 ? '' : 's'} failed in the last 30 days — review the email log.
            </Link>
          )}

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Bookings to confirm" value={stats.bookings.byStatus.pending ?? 0} tone="text-amber-600" icon={CalendarCheck} hint={`${stats.bookings.total} bookings in total`} />
            <StatCard label="Open enquiries" value={stats.enquiries.open} tone="text-accent-600" icon={Inbox} hint={`${stats.enquiries.last30Days} in the last 30 days`} />
            <StatCard label="Corporate & quotes" value={stats.enquiries.corporate} tone="text-indigo-600" icon={Briefcase} hint="All time" />
            <StatCard
              label="Confirmed participants"
              value={stats.bookings.confirmedParticipants}
              tone="text-emerald-600"
              icon={Users}
              hint={stats.bookings.confirmedValue ? formatMoney(stats.bookings.confirmedValue) : undefined}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {(['pending', 'confirmed', 'completed', 'cancelled'] as const).map((s) => (
              <Link key={s} href={`${base}/bookings?status=${s}`} className="rounded-2xl border border-gray-100 bg-white p-4 hover:border-accent-200">
                <Badge value={s} />
                <p className="mt-2 text-xl font-bold text-gray-900">{stats.bookings.byStatus[s] ?? 0}</p>
                <p className="text-xs text-gray-500">bookings</p>
              </Link>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <h2 className="font-bold text-gray-900">Recent bookings</h2>
                <Link href={`${base}/bookings`} className="inline-flex items-center gap-1 text-sm font-semibold text-accent-600 hover:text-accent-700">
                  All <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              {stats.recentBookings.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-gray-500">No bookings yet.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {stats.recentBookings.map((b) => (
                    <li key={b.id}>
                      <Link href={`${base}/bookings?q=${b.ticketNumber}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-gray-50">
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-gray-900">{b.attendeeName}</span>
                          <span className="block truncate text-sm text-gray-500">
                            {b.event.title} · {b.participants} {b.participants === 1 ? 'person' : 'people'}
                          </span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-1">
                          <Badge value={b.status} />
                          <span className="text-xs text-gray-400">{formatDateTime(b.createdAt)}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <h2 className="font-bold text-gray-900">Recent enquiries</h2>
                <Link href={`${base}/enquiries`} className="inline-flex items-center gap-1 text-sm font-semibold text-accent-600 hover:text-accent-700">
                  All <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              {stats.recentEnquiries.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-gray-500">No enquiries yet.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {stats.recentEnquiries.map((e) => (
                    <li key={e.id}>
                      <Link href={`${base}/enquiries?q=${e.reference}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-gray-50">
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-gray-900">{e.company || e.name}</span>
                          <span className="block truncate text-sm text-gray-500">{e.serviceName || 'General enquiry'}</span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-1">
                          <span className="flex gap-1">
                            <Badge value={e.type} />
                            <Badge value={e.status} />
                          </span>
                          <span className="text-xs text-gray-400">{formatDateTime(e.createdAt)}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <div className="border-b border-gray-100 px-5 py-4">
                <h2 className="font-bold text-gray-900">Upcoming dates & capacity</h2>
              </div>
              {stats.nextEvents.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-gray-500">No upcoming dates scheduled.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {stats.nextEvents.map((e) => {
                    const pct = e.maxSpots ? Math.min(100, Math.round((e.spotsTaken / e.maxSpots) * 100)) : 0
                    return (
                      <li key={e.id} className="px-5 py-3">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="truncate font-semibold text-gray-900">{e.title}</span>
                          <span className="shrink-0 text-gray-500">
                            {formatDate(e.date, { weekday: 'short', day: 'numeric', month: 'short' })} · {e.spotsTaken}/{e.maxSpots}
                          </span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                          <div className={pct >= 90 ? 'h-full bg-red-500' : pct >= 60 ? 'h-full bg-amber-500' : 'h-full bg-emerald-500'} style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Card>

            <Card className="p-5">
              <h2 className="mb-4 font-bold text-gray-900">At a glance</h2>
              <dl className="space-y-3 text-sm">
                {[
                  ['Published services', stats.services.total],
                  ['Corporate services', (stats.services.byAudience.corporate ?? 0) + (stats.services.byAudience.both ?? 0)],
                  ['Upcoming dates', stats.services.upcomingEvents],
                  ['Emails sent (30 days)', stats.emails.last30Days.sent ?? 0],
                  ['Newsletter subscribers', stats.audience.subscribers],
                  ['Approved testimonials', stats.audience.testimonials],
                  ...(showOrders ? ([['Shop orders', stats.orders.total], ['Paid revenue', formatMoney(stats.orders.paidRevenue)]] as [string, string | number][]) : []),
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex justify-between gap-3">
                    <dt className="text-gray-500">{label}</dt>
                    <dd className="font-semibold text-gray-900">{value}</dd>
                  </div>
                ))}
              </dl>
              {showOrders && (
                <Link href={`${base}/orders`} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent-600">
                  <ShoppingBag className="h-4 w-4" /> Orders
                </Link>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

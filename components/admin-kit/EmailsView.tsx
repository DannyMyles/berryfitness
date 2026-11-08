'use client'

import { useState } from 'react'
import { AlertTriangle, RefreshCw, Search } from 'lucide-react'
import { adminKit, formatDateTime } from './api'
import { Badge, Button, EmptyState, ErrorState, FilterPills, PageTitle, Pagination, SkeletonRows, inputClass, useDebounced, useQuery } from './ui'

type Filter = 'all' | 'sent' | 'failed' | 'skipped'
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'sent', label: 'Sent' },
  { value: 'failed', label: 'Failed' },
  { value: 'skipped', label: 'Not sent' },
]
const PAGE_SIZE = 25

/** Delivery log of every email this app sent (or tried to send). */
export default function EmailsView({ initialStatus }: { initialStatus?: string }) {
  const [filter, setFilter] = useState<Filter>(FILTERS.some((f) => f.value === initialStatus) ? (initialStatus as Filter) : 'all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const q = useDebounced(query)
  const params = { status: filter === 'all' ? undefined : filter, q, page, pageSize: PAGE_SIZE }
  const { data, loading, error, reload: load } = useQuery(JSON.stringify(params), () => adminKit.emails(params))
  const rows = data?.emails ?? []
  const total = data?.total ?? 0
  const configured = data?.configured ?? true

  return (
    <div>
      <PageTitle
        title="Email log"
        subtitle="Confirmations, updates and team alerts. Resend from the booking or enquiry."
        actions={
          <Button variant="secondary" onClick={load} aria-label="Refresh">
            <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          </Button>
        }
      />
      {!configured && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          Email isn’t configured on the server, so emails are logged as “not sent”. Once SMTP is set up, resend any important ones from Bookings or Enquiries.
        </div>
      )}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterPills options={FILTERS} value={filter} onChange={(v) => { setFilter(v); setPage(1) }} />
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} placeholder="Recipient or subject…" className={`${inputClass} pl-9`} aria-label="Search emails" />
        </div>
      </div>
      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading && rows.length === 0 ? (
        <SkeletonRows />
      ) : rows.length === 0 ? (
        <EmptyState title="No emails here." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">To</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{m.subject}</p>
                    <p className="text-xs capitalize text-gray-500">{m.kind.replace(/_/g, ' ')}</p>
                    {m.error && <p className="mt-1 text-xs text-red-600">{m.error}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{m.to}</td>
                  <td className="px-4 py-3">
                    <Badge value={m.status} label={m.status === 'skipped' ? 'not sent' : undefined} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDateTime(m.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
    </div>
  )
}

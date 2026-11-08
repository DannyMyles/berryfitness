import type { Metadata } from 'next'
import BookingsView from '@/components/admin-kit/BookingsView'

export const metadata: Metadata = { title: 'Bookings' }
type Props = { searchParams: Promise<{ q?: string; status?: string }> }

export default async function BookingsPage({ searchParams }: Props) {
  const { q, status } = await searchParams
  return <BookingsView initialQuery={q ?? ''} initialStatus={status} />
}

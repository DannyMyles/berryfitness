import type { Metadata } from 'next'
import EnquiriesView from '@/components/admin-kit/EnquiriesView'

export const metadata: Metadata = { title: 'Enquiries & quotes' }
type Props = { searchParams: Promise<{ q?: string; type?: string }> }

export default async function EnquiriesPage({ searchParams }: Props) {
  const { q, type } = await searchParams
  return <EnquiriesView initialQuery={q ?? ''} initialType={type ?? ''} />
}

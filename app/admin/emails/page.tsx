import type { Metadata } from 'next'
import EmailsView from '@/components/admin-kit/EmailsView'

export const metadata: Metadata = { title: 'Email log' }
type Props = { searchParams: Promise<{ status?: string }> }

export default async function EmailsPage({ searchParams }: Props) {
  const { status } = await searchParams
  return <EmailsView initialStatus={status} />
}

import type { Metadata } from 'next'
import ServicesView from '@/components/admin-kit/ServicesView'

export const metadata: Metadata = { title: 'Services & packages' }

const CATEGORY_HINTS = [
  'Personal Training',
  'Group Fitness',
  'Nutrition',
  'Programmes',
  'Corporate Fitness',
  'Corporate Hiking',
  'Team Building',
  'Wellness Days',
  'Fitness Challenges',
  'Office Fitness',
  'Gym Memberships',
  'Leadership Retreats',
  'Family Days',
]

export default function ServicesPage() {
  return <ServicesView showStyleFields categoryHints={CATEGORY_HINTS} />
}

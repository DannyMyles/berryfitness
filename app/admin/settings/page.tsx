import type { Metadata } from 'next'
import SettingsView from '@/components/admin-kit/SettingsView'

export const metadata: Metadata = { title: 'Settings' }

const PAGES = [
  { key: 'about', label: 'About' },
  { key: 'services', label: 'Services' },
  { key: 'events', label: 'Events' },
  { key: 'gallery', label: 'Gallery' },
  { key: 'blog', label: 'Blog' },
  { key: 'contact', label: 'Contact' },
  { key: 'shop', label: 'Shop' },
  { key: 'home-hero', label: 'Home: hero photo' },
  { key: 'home-features', label: 'Home: why choose us' },
  { key: 'home-services', label: 'Home: services' },
  { key: 'home-testimonials', label: 'Home: testimonials' },
  { key: 'home-cta', label: 'Home: closing banner' },
  { key: 'footer-cta', label: 'Footer banner' },
]

export default function SettingsPage() {
  return <SettingsView showCorporate pages={PAGES} />
}

import type { Metadata } from 'next'
import ContentView from '@/components/admin-kit/ContentView'

export const metadata: Metadata = { title: 'FAQs & banners' }

// Testimonials keep their own, richer screen under Blog → Testimonials.
export default function ContentPage() {
  return <ContentView showTestimonials={false} />
}

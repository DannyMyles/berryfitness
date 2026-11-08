'use client'

import { useEffect, useState } from 'react'

/** Average rating of approved testimonials, or null when there are none. */
export function useAverageRating() {
  const [rating, setRating] = useState<{ avg: number; count: number } | null>(null)
  useEffect(() => {
    let cancelled = false
    fetch('/api/v1/testimonials')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const list: { rating: number }[] = d?.testimonials ?? []
        if (!cancelled && list.length) setRating({ avg: list.reduce((a, t) => a + t.rating, 0) / list.length, count: list.length })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])
  return rating
}

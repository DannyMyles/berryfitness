import { useEffect } from 'react'

/**
 * Sets the browser tab title for admin pages, which are client components
 * and can't export Next.js `Metadata` directly. Admin routes are excluded
 * from indexing via robots.txt, so this only needs to cover the tab title,
 * not full SEO metadata.
 */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previous = document.title
    document.title = `${title} | Berry Fitness Admin`
    return () => {
      document.title = previous
    }
  }, [title])
}

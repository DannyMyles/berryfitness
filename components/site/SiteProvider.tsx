'use client'

import { createContext, useContext } from 'react'
import { FALLBACK_SITE, PageHeaderContent, SiteInfo, pageHeader, waLink } from '@/app/lib/site'

const SiteContext = createContext<SiteInfo>(FALLBACK_SITE)

/** Makes the business details loaded by the root layout available to client components. */
export function SiteProvider({ site, children }: { site: SiteInfo; children: React.ReactNode }) {
  return <SiteContext.Provider value={site}>{children}</SiteContext.Provider>
}

export const useSite = () => useContext(SiteContext)

/** WhatsApp chat link builder using the number from Admin → Settings. */
export function useWhatsApp() {
  const site = useSite()
  return (message?: string) => waLink(site, message)
}

/** Banner copy for an inner page (Admin → Settings → Page headers), else `defaults`. */
export function usePageHeader<T extends PageHeaderContent>(key: string, defaults: T): T {
  return pageHeader(useSite(), key, defaults)
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ChevronRight, X } from 'lucide-react'
import { useSite, useWhatsApp } from './SiteProvider'

export interface QuickOption {
  label: string
  message: string
}

interface Props {
  /** Prefilled conversation starters for this business. */
  options: QuickOption[]
  greeting: string
  /** Path prefixes where the widget would get in the way. */
  hiddenOn?: string[]
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.04 21.5h-.01a9.43 9.43 0 0 1-4.8-1.32l-.35-.2-3.57.94.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.24-9.44 9.45-9.44a9.38 9.38 0 0 1 6.68 2.77 9.38 9.38 0 0 1 2.76 6.68c0 5.2-4.24 9.43-9.45 9.43zm8.04-17.47A11.3 11.3 0 0 0 12.04.7C5.77.7.67 5.8.67 12.06c0 2 .52 3.96 1.52 5.68L.57 23.6l6-1.57a11.33 11.33 0 0 0 5.46 1.39h.01c6.27 0 11.37-5.1 11.37-11.37 0-3.04-1.18-5.89-3.33-8.03z" />
    </svg>
  )
}

/**
 * The site's single WhatsApp entry point: a floating button that opens a
 * small card with prefilled conversation starters. The number and hours
 * come from Admin → Settings. It steps aside while a dialog or the mobile
 * menu is open (they lock body scroll), so it never covers a form.
 */
export default function WhatsAppWidget({ options, greeting, hiddenOn = ['/admin'] }: Props) {
  const site = useSite()
  const wa = useWhatsApp()
  const pathname = usePathname() || '/'
  const [open, setOpen] = useState(false)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [pageTitle, setPageTitle] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on navigation and remember what page the visitor is on.
  useEffect(() => {
    const t = setTimeout(() => {
      setOpen(false)
      setPageTitle(pathname === '/' ? '' : document.title.split('|')[0].trim())
    }, 250)
    return () => clearTimeout(t)
  }, [pathname])

  // Dialogs and the mobile menu set body overflow:hidden — hide while they're up.
  useEffect(() => {
    const check = () => setOverlayOpen(document.body.style.overflow === 'hidden')
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  if (hiddenOn.some((p) => pathname.startsWith(p)) || overlayOpen) return null

  const starters: QuickOption[] = [
    ...(pageTitle ? [{ label: `Ask about “${pageTitle}”`, message: `Hi ${site.name}! I have a question about ${pageTitle}.` }] : []),
    ...options,
  ]

  return (
    <div ref={panelRef} className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 z-50 flex flex-col items-end gap-3 sm:right-6">
      {open && (
        <div role="dialog" aria-label={`Chat with ${site.name} on WhatsApp`} className="w-[calc(100vw-2rem)] max-w-[22rem] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
          <div className="flex items-center justify-between gap-3 bg-[#075E54] px-4 py-3.5 text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#25D366]">
                <WhatsAppIcon className="h-6 w-6" />
              </span>
              <span>
                <span className="block font-semibold leading-tight">{site.name}</span>
                <span className="block text-xs text-white/75">{site.settings.hours ? `Replies ${site.settings.hours}` : 'We reply as soon as we can'}</span>
              </span>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-full p-1.5 hover:bg-white/15" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-3 bg-[#ECE5DD] p-4">
            <p className="max-w-[85%] rounded-xl rounded-tl-none bg-white px-3.5 py-2.5 text-sm text-gray-800 shadow-sm">{greeting}</p>
            <ul className="space-y-2">
              {starters.map((o) => (
                <li key={o.label}>
                  <a
                    href={wa(o.message)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between gap-2 rounded-xl bg-white px-3.5 py-2.5 text-sm font-medium text-gray-800 shadow-sm transition-colors hover:bg-[#dcf8c6]"
                  >
                    {o.label}
                    <ChevronRight className="h-4 w-4 shrink-0 text-[#128C7E]" />
                  </a>
                </li>
              ))}
            </ul>
            <p className="text-center text-[11px] text-gray-500">Opens WhatsApp with your message ready to send.</p>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close WhatsApp chat' : `Chat with ${site.name} on WhatsApp`}
        aria-expanded={open}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0F7A6E] text-white shadow-lg shadow-green-900/25 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-green-300 active:scale-95"
      >
        {open ? <X className="h-6 w-6" /> : <WhatsAppIcon className="h-7 w-7" />}
      </button>
    </div>
  )
}

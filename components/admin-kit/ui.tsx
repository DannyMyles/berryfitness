'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Info, Loader2, X } from 'lucide-react'

/** Small, dependency-free UI kit shared by every admin screen (themed via `accent-*`). */

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

// --- Toasts --------------------------------------------------------------------

type ToastTone = 'success' | 'error' | 'info'
interface ToastItem {
  id: number
  tone: ToastTone
  text: string
}
let toasts: ToastItem[] = []
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function toast(text: string, tone: ToastTone = 'success') {
  const id = Date.now() + Math.random()
  toasts = [...toasts, { id, tone, text }]
  emit()
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    emit()
  }, tone === 'error' ? 7000 : 4500)
}

/** Shows an email delivery outcome returned by the API as a toast. */
export function toastEmail(email?: { status: string; message: string }) {
  if (!email) return
  toast(email.message, email.status === 'sent' ? 'success' : email.status === 'failed' ? 'error' : 'info')
}

export function Toaster() {
  const items = useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => toasts,
    () => toasts
  )
  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[100] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-5 sm:top-5 sm:bottom-auto" aria-live="polite">
      {items.map((t) => {
        const Icon = t.tone === 'success' ? CheckCircle2 : t.tone === 'error' ? AlertCircle : Info
        return (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className={cx(
              'pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border bg-white px-4 py-3 text-sm shadow-lg',
              t.tone === 'success' && 'border-emerald-200',
              t.tone === 'error' && 'border-red-200',
              t.tone === 'info' && 'border-sky-200'
            )}
          >
            <Icon className={cx('mt-0.5 h-4 w-4 shrink-0', t.tone === 'success' ? 'text-emerald-600' : t.tone === 'error' ? 'text-red-600' : 'text-sky-600')} />
            <span className="text-gray-800">{t.text}</span>
          </div>
        )
      })}
    </div>
  )
}

// --- Layout pieces -------------------------------------------------------------

export function PageTitle({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-gray-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cx('rounded-2xl border border-gray-100 bg-white shadow-sm', className)}>{children}</div>
}

export function StatCard({ label, value, hint, tone = 'text-gray-900', icon: Icon }: { label: string; value: React.ReactNode; hint?: string; tone?: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <Card className="p-4 md:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-gray-400" />}
      </div>
      <p className={cx('mt-2 text-2xl font-bold md:text-3xl', tone)}>{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </Card>
  )
}

const BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  new: 'bg-amber-100 text-amber-800',
  contacted: 'bg-sky-100 text-sky-800',
  quoted: 'bg-violet-100 text-violet-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-gray-900 text-white',
  cancelled: 'bg-gray-200 text-gray-600',
  sent: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-red-100 text-red-700',
  skipped: 'bg-gray-200 text-gray-600',
  queued: 'bg-sky-100 text-sky-800',
  corporate: 'bg-indigo-100 text-indigo-800',
  quote: 'bg-violet-100 text-violet-800',
  booking: 'bg-accent-100 text-accent-800',
  contact: 'bg-gray-100 text-gray-700',
}

export function Badge({ value, label }: { value: string; label?: string }) {
  return (
    <span className={cx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize', BADGE[value] ?? 'bg-gray-100 text-gray-700')}>
      {label ?? value.replace(/_/g, ' ')}
    </span>
  )
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'dark'
  size?: 'sm' | 'md'
  loading?: boolean
}

export function Button({ variant = 'primary', size = 'md', loading, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2.5 text-sm',
        variant === 'primary' && 'bg-accent-500 text-white hover:bg-accent-600',
        variant === 'dark' && 'bg-gray-900 text-white hover:bg-gray-800',
        variant === 'secondary' && 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
        variant === 'danger' && 'border border-red-200 bg-white text-red-600 hover:bg-red-50',
        variant === 'ghost' && 'text-gray-600 hover:bg-gray-100',
        className
      )}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}

// --- Forms ---------------------------------------------------------------------

export const inputClass =
  'block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-100 disabled:bg-gray-50'

export function Field({ label, hint, error, children, className }: { label: string; hint?: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1.5 block text-sm font-medium text-gray-700">
        {label} {hint && <span className="font-normal text-gray-400">({hint})</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}
    </label>
  )
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx('relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-accent-500' : 'bg-gray-300')}
      >
        <span className={cx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-5' : 'translate-x-0.5')} />
      </button>
      <span>
        <span className="block text-sm font-medium text-gray-800">{label}</span>
        {hint && <span className="block text-xs text-gray-500">{hint}</span>}
      </span>
    </label>
  )
}

/** Editable list of short strings (features, perks, expertise). */
export function ListInput({ value, onChange, placeholder, max = 20 }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string; max?: number }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const v = draft.trim()
    if (!v || value.includes(v) || value.length >= max) return
    onChange([...value, v])
    setDraft('')
  }
  return (
    <div>
      {value.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-2">
          {value.map((item) => (
            <li key={item} className="inline-flex items-center gap-1 rounded-full bg-accent-50 py-1 pl-3 pr-1.5 text-sm text-accent-800">
              {item}
              <button type="button" onClick={() => onChange(value.filter((v) => v !== item))} className="rounded-full p-0.5 hover:bg-accent-100" aria-label={`Remove ${item}`}>
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          placeholder={placeholder}
          className={inputClass}
        />
        <Button type="button" variant="secondary" onClick={add}>
          Add
        </Button>
      </div>
    </div>
  )
}

// --- Overlays ------------------------------------------------------------------

export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current()
    window.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    ref.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [open])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div
        ref={ref}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
        className={cx('flex max-h-[94vh] w-full flex-col rounded-t-3xl bg-white shadow-2xl outline-none sm:rounded-3xl', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 px-5 py-4 sm:px-6">{footer}</div>}
      </div>
    </div>
  )
}

// --- Lists ---------------------------------------------------------------------

export function Pagination({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (total <= pageSize) return null
  return (
    <div className="mt-5 flex items-center justify-between gap-3 text-sm text-gray-600">
      <span>
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
      </span>
      <div className="flex gap-1">
        <Button variant="secondary" size="sm" onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="px-3 py-1.5">
          {page} / {pages}
        </span>
        <Button variant="secondary" size="sm" onClick={() => onPage(page + 1)} disabled={page >= pages} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function FilterPills<T extends string>({ options, value, onChange, counts }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; counts?: Record<string, number> }) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cx(
            'whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors',
            value === o.value ? 'bg-accent-500 text-white' : 'border border-gray-200 bg-white text-gray-700 hover:border-accent-300'
          )}
        >
          {o.label}
          {counts && counts[o.value] !== undefined && <span className="ml-1.5 opacity-75">{counts[o.value]}</span>}
        </button>
      ))}
    </div>
  )
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
      <p className="font-semibold text-gray-800">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">{text}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 sm:flex-row sm:items-center sm:justify-between">
      <span className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 shrink-0" /> {message}
      </span>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5">
          <div className="mb-3 h-4 w-1/3 rounded bg-gray-200" />
          <div className="mb-2 h-3 w-2/3 rounded bg-gray-100" />
          <div className="h-3 w-1/2 rounded bg-gray-100" />
        </div>
      ))}
    </div>
  )
}

/** Debounced value — keeps search boxes from firing a request per keystroke. */
export function useDebounced<T>(value: T, ms = 350): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

/**
 * Loads data for `key` (refetching whenever the key changes) and keeps the
 * previous data on screen while the next request is in flight.
 */
export function useQuery<T>(key: string, fetcher: () => Promise<T>) {
  const [nonce, setNonce] = useState(0)
  const [state, setState] = useState<{ key: string; data?: T; error?: string }>({ key: '' })
  const fullKey = `${key}#${nonce}`
  const fetcherRef = useRef(fetcher)
  useEffect(() => {
    fetcherRef.current = fetcher
  })
  useEffect(() => {
    let cancelled = false
    fetcherRef.current().then(
      (data) => !cancelled && setState({ key: fullKey, data }),
      (err: unknown) => !cancelled && setState((s) => ({ key: fullKey, data: s.data, error: err instanceof Error ? err.message : 'Something went wrong' }))
    )
    return () => {
      cancelled = true
    }
  }, [fullKey])
  return {
    data: state.data,
    error: state.key === fullKey ? state.error ?? '' : '',
    loading: state.key !== fullKey,
    reload: () => setNonce((n) => n + 1),
  }
}

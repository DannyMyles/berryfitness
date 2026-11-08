/**
 * Prices on this site are stored as whole units of one currency (USD for
 * Berry Fitness for Health). Change NEXT_PUBLIC_CURRENCY and the backend
 * app setting `currency` together if that ever changes.
 */
export const CURRENCY = (process.env.NEXT_PUBLIC_CURRENCY || 'USD').toUpperCase()

const formatter = (() => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: CURRENCY, maximumFractionDigits: 0 })
  } catch {
    return null
  }
})()

export function money(amount: number | null | undefined): string {
  const n = Number(amount ?? 0)
  return formatter ? formatter.format(n) : `${CURRENCY} ${n.toLocaleString('en-US')}`
}

/** Short symbol for inputs and compact labels, e.g. "$". */
export const CURRENCY_SYMBOL = formatter?.formatToParts(0).find((p) => p.type === 'currency')?.value ?? CURRENCY

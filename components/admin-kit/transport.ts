'use client'

/**
 * The only app-specific file of the admin kit: how admin calls reach the
 * Berry API. This site sends them to its same-origin /api/commerce/admin
 * route handler, which checks the NextAuth admin session and attaches that
 * admin's backend token server-side. `path` is relative to /api/v1.
 */
export const ADMIN_APP_KEY = 'berry'
export const ADMIN_BASE_PATH = '/admin'

export class AdminAuthError extends Error {}

export async function adminFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers)
  if (init.body && !(init.body instanceof FormData)) headers.set('content-type', 'application/json')
  const res = await fetch(`/api/commerce/admin/v1/${path}`, { cache: 'no-store', ...init, headers })
  if (res.status === 401) {
    window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}&expired=1`
    throw new AdminAuthError('Please sign in again')
  }
  return res
}

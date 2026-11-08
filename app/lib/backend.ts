/**
 * Connection to the Berry API.
 *
 * That backend serves several apps (Fitness, SOS, …) and keeps their data
 * apart by the `X-App-Key` header on every request. This site is `fitness`.
 *
 * - Browser code calls same-origin paths (`/api/...`, `/uploads/...`);
 *   `proxy.ts` forwards them to the backend and sets the header, so even
 *   plain `<img src="/api/v1/...">` requests are scoped to this app.
 * - Server code (route handlers, metadata, sitemap) calls the backend
 *   directly via `backendFetch`, which sets the header itself.
 */
export const APP_KEY = process.env.NEXT_PUBLIC_APP_KEY || 'berry';
export const BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:4001').replace(/\/+$/, '');

export function backendFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const isServer = typeof window === 'undefined';
  const headers = new Headers(init.headers);
  headers.set('x-app-key', APP_KEY);
  return fetch(isServer ? `${BACKEND_URL}${path}` : path, { ...init, headers });
}

/** WhatsApp number used for direct "chat with us" links (digits only). */
export const WHATSAPP_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP || '254727625970').replace(/\D/g, '');

export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

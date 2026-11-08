import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/app/lib/auth';
import { backendFetch } from '@/app/lib/backend';

// Proxies admin requests (shop, bookings, enquiries, services, content,
// settings) to the Berry API as the `berry` app.
// It is gated by the NextAuth admin session and forwards that admin's own
// backend token, so every change is made — and can be audited — as a real
// admin account. COMMERCE_ADMIN_KEY (optional, server-only) is still sent for
// backwards compatibility; neither credential ever reaches browser JS.
const COMMERCE_ADMIN_KEY = process.env.COMMERCE_ADMIN_KEY || '';

/** State-changing requests must come from this site's own pages. */
function sameOrigin(req: NextRequest) {
  const origin = req.headers.get('origin');
  return !origin || origin === req.nextUrl.origin || origin === `${req.headers.get('x-forwarded-proto') ?? 'http'}://${req.headers.get('host')}`;
}

async function proxy(req: NextRequest, path: string[]) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (req.method !== 'GET' && !sameOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const targetPath = `/api/${path.map(encodeURIComponent).join('/')}${req.nextUrl.search}`;
  const hasBody = !['GET', 'HEAD', 'DELETE'].includes(req.method);
  // Multipart bodies (product image uploads) must be forwarded as FormData
  // with no explicit Content-Type — fetch sets the correct multipart
  // boundary itself. Everything else keeps going through as JSON, unchanged.
  const isMultipart = (req.headers.get('content-type') || '').startsWith('multipart/form-data');

  const response = await backendFetch(targetPath, {
    cache: 'no-store',
    method: req.method,
    headers: {
      authorization: `Bearer ${admin.accessToken}`,
      ...(COMMERCE_ADMIN_KEY ? { 'x-admin-key': COMMERCE_ADMIN_KEY } : {}),
      ...(isMultipart ? {} : { 'Content-Type': 'application/json' }),
    },
    body: !hasBody ? undefined : isMultipart ? await req.formData() : await req.text(),
  });

  if (response.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  // CSV export (and any other non-JSON admin response) — stream it through
  // as-is with its original headers (Content-Type, Content-Disposition)
  // rather than forcing it through response.json(), which would throw.
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const body = await response.arrayBuffer();
    const headers = new Headers();
    headers.set('Content-Type', contentType || 'application/octet-stream');
    const disposition = response.headers.get('content-disposition');
    if (disposition) headers.set('Content-Disposition', disposition);
    return new NextResponse(body, { status: response.status, headers });
  }

  const data = await response.json().catch(() => ({}));
  return NextResponse.json(data, { status: response.status });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path);
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path);
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path);
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path);
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await params).path);
}

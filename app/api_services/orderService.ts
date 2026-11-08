// orderService.ts — talks to the Berry API.
// Checkout is guest-friendly: createOrder goes through api.ts, which attaches
// the session token when the customer happens to be logged in (so the order
// shows up on their account) and works without one. The response carries a
// WhatsApp link with the server-priced order summary. Listing/updating
// orders (admin) goes through the admin-key proxy — see
// app/api/commerce/admin/[...path]/route.ts.

import { CreateOrderInput, CreateOrderResponse, Order, OrderStatus, PaymentStatus } from '@/types/commerce';
import { api } from '../lib/api';

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const orderService = {
  createOrder: async (input: CreateOrderInput): Promise<CreateOrderResponse> => {
    return api.public.orders.create(input) as Promise<CreateOrderResponse>;
  },

  getMine: async (): Promise<Order[]> => {
    return api.protected.orders.mine() as Promise<Order[]>;
  },

  admin: {
    getOrders: async (): Promise<Order[]> => {
      const res = await fetch('/api/commerce/admin/orders', { cache: 'no-store' });
      return handle<Order[]>(res);
    },

    getOrder: async (id: number): Promise<Order> => {
      const res = await fetch(`/api/commerce/admin/orders/${id}`, { cache: 'no-store' });
      return handle<Order>(res);
    },

    updateStatus: async (
      id: number,
      data: { status?: OrderStatus; paymentStatus?: PaymentStatus }
    ): Promise<Order> => {
      const res = await fetch(`/api/commerce/admin/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return handle<Order>(res);
    },

    exportCsv: async (): Promise<Blob> => {
      const res = await fetch('/api/commerce/admin/orders/export', { cache: 'no-store' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed with status ${res.status}`);
      }
      return res.blob();
    },
  },
};

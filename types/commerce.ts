// Types for the Berry API (products/categories/orders).
// Mirrors the serialized shapes returned by that service — see
// commerce API src/routes/{products,categories,orders}.ts

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  productCount: number;
}

export interface ProductImageItem {
  url: string;
  color: string | null;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number; // whole units of the site currency (USD)
  images: string[];
  imageDetails: ProductImageItem[]; // parallel to images, carries an optional per-image color tag
  sizes: string[];
  colors: string[];
  inStock: boolean;
  featured: boolean;
  isNew: boolean;
  category?: { id: number; name: string; slug: string };
  createdAt: string;
}

export interface ProductDetail extends Product {
  related: Product[];
}

export interface OrderItemInput {
  productId: number;
  quantity: number;
  size?: string;
  color?: string;
}

export interface CreateOrderInput {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  notes?: string;
  items: OrderItemInput[];
}

export interface OrderItem {
  id: number;
  productId: number | null;
  name: string;
  price: number;
  quantity: number;
  size: string | null;
  color: string | null;
}

// Orders are confirmed with the customer on WhatsApp — there's no online
// payment. An admin moves the status along and records payment received.
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid';

export interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  shippingAddress: string;
  notes: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  shipping: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

/** Pre-filled WhatsApp hand-off returned by the API after an order/booking is saved. */
export interface WhatsAppHandoff {
  number: string;
  message: string;
  url: string;
}

export interface CreateOrderResponse {
  order: Order;
  whatsapp: WhatsAppHandoff | null;
}

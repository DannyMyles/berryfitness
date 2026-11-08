// productService.ts — talks to the Berry API.
// Public reads go through backendFetch (same-origin in the browser, direct
// with this app's X-App-Key on the server). Admin mutations go through the
// same-origin /api/commerce/admin proxy so the admin key never reaches the
// browser — see app/api/commerce/admin/[...path]/route.ts.

import { Category, Product, ProductDetail } from '@/types/commerce';

import { backendFetch } from '../lib/backend';

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface ProductImageInput {
  type: 'upload' | 'existing' | 'url';
  file?: File; // present when type === 'upload'
  url?: string; // present when type === 'existing' | 'url'
  color: string | null;
}

export interface ProductInput {
  name: string;
  description: string;
  price: number;
  categoryId: number;
  images: ProductImageInput[];
  sizes?: string[];
  colors?: string[];
  inStock?: boolean;
  featured?: boolean;
  isNew?: boolean;
}

function buildProductFormData(data: Partial<ProductInput>): FormData {
  const fd = new FormData();
  if (data.name !== undefined) fd.append('name', data.name);
  if (data.description !== undefined) fd.append('description', data.description);
  if (data.price !== undefined) fd.append('price', String(data.price));
  if (data.categoryId !== undefined) fd.append('categoryId', String(data.categoryId));
  if (data.sizes !== undefined) fd.append('sizes', JSON.stringify(data.sizes));
  if (data.colors !== undefined) fd.append('colors', JSON.stringify(data.colors));
  if (data.inStock !== undefined) fd.append('inStock', String(data.inStock));
  if (data.featured !== undefined) fd.append('featured', String(data.featured));
  if (data.isNew !== undefined) fd.append('isNew', String(data.isNew));

  if (data.images !== undefined) {
    const imageMeta = data.images.map((img) => {
      if (img.type === 'upload' && img.file) {
        fd.append('images', img.file);
        return { type: 'upload', color: img.color };
      }
      return { type: img.type, url: img.url, color: img.color };
    });
    fd.append('imageMeta', JSON.stringify(imageMeta));
  }

  return fd;
}

export interface ProductFilters {
  category?: string;
  search?: string;
  featured?: boolean;
}

export const productService = {
  getCategories: async (): Promise<Category[]> => {
    const res = await backendFetch(`/api/categories`, { cache: 'no-store' });
    return handle<Category[]>(res);
  },

  getProducts: async (filters: ProductFilters = {}): Promise<Product[]> => {
    const params = new URLSearchParams();
    if (filters.category && filters.category !== 'All') params.set('category', filters.category);
    if (filters.search) params.set('search', filters.search);
    if (filters.featured) params.set('featured', 'true');
    const query = params.toString();
    const res = await backendFetch(`/api/products${query ? `?${query}` : ''}`, {
      cache: 'no-store',
    });
    return handle<Product[]>(res);
  },

  getProduct: async (slug: string): Promise<ProductDetail> => {
    const res = await backendFetch(`/api/products/${encodeURIComponent(slug)}`, { cache: 'no-store' });
    return handle<ProductDetail>(res);
  },

  // Admin (routed through the Next.js server proxy, session-gated)
  admin: {
    createProduct: async (data: ProductInput): Promise<Product> => {
      const res = await fetch('/api/commerce/admin/products', {
        method: 'POST',
        body: buildProductFormData(data),
      });
      return handle<Product>(res);
    },

    updateProduct: async (id: number, data: Partial<ProductInput>): Promise<Product> => {
      const res = await fetch(`/api/commerce/admin/products/${id}`, {
        method: 'PUT',
        body: buildProductFormData(data),
      });
      return handle<Product>(res);
    },

    deleteProduct: async (id: number): Promise<void> => {
      const res = await fetch(`/api/commerce/admin/products/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed with status ${res.status}`);
      }
    },

    createCategory: async (data: { name: string; description?: string }): Promise<Category> => {
      const res = await fetch('/api/commerce/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return handle<Category>(res);
    },

    updateCategory: async (id: number, data: { name?: string; description?: string }): Promise<Category> => {
      const res = await fetch(`/api/commerce/admin/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return handle<Category>(res);
    },

    deleteCategory: async (id: number): Promise<void> => {
      const res = await fetch(`/api/commerce/admin/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed with status ${res.status}`);
      }
    },
  },
};

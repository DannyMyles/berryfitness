'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getSession, signOut, useSession } from "next-auth/react"

// Use relative paths to leverage Next.js rewrites/proxy in next.config.ts
// This avoids CORS issues by making requests go through the same origin
const API_BASE_URL = ''

interface ApiOptions extends RequestInit {
  requiresAuth?: boolean
}

interface ApiError {
  error: string;
  message?: string;
  statusCode?: number;
}

// Extended session user type
interface SessionUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
  accessToken?: string;
}

// Hook to get authentication status with loading state
export function useAuth() {
  const { data: session, status, update } = useSession()
  
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    // First try to get from current session
    const token = (session?.user as SessionUser)?.accessToken
    if (token) {
      return token
    }
    
    // If not in current session, try to fetch fresh session
    const freshSession = await getSession()
    const freshToken = (freshSession?.user as SessionUser)?.accessToken
    if (freshToken) {
      return freshToken
    }
    
    return null
  }, [session])

  return {
    session,
    status,
    getAccessToken,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    updateSession: update,
  }
}

// Utility to extract token from any session format
async function getAuthToken(): Promise<string | null> {
  try {
    const session = await getSession()
    
    if (!session?.user) {
      return null
    }

    // Try different ways to access the token
    const user = session.user as SessionUser
    
    // Check for direct accessToken property
    if (user.accessToken) {
      return user.accessToken
    }
    
    // Check if it's in the session directly (not nested in user)
    const sessionAny = session as any
    if (sessionAny.accessToken) {
      return sessionAny.accessToken
    }
    
    // Check in jwt token
    if (sessionAny.token) {
      return sessionAny.token
    }
    
    return null
  } catch (error) {
    console.error('Error getting auth token:', error)
    return null
  }
}

/**
 * Ends the session and goes to /login, returning to the current page after
 * signing in. `expired` shows a "session expired" note on the login page.
 */
function redirectToLogin(expired = false) {
  if (typeof window === 'undefined') return
  const here = window.location.pathname + window.location.search
  const params = new URLSearchParams({ callbackUrl: here })
  if (expired) params.set('expired', '1')
  signOut({ callbackUrl: `/login?${params.toString()}` })
}

// API client for client-side components
class ApiClient {
  private async getAuthHeaders(options?: ApiOptions): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    }

    // Don't set Content-Type for FormData - browser sets it automatically with boundary
    // Setting it manually breaks multipart/form-data requests
    if (!(options?.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json'
    }

    try {
      const token = await getAuthToken()
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    } catch (error) {
      console.error('Error getting auth headers:', error)
    }

    return headers
  }

  private async request<T = any>(
    endpoint: string,
    options: ApiOptions = {}
  ): Promise<T> {
    const { requiresAuth = true, ...fetchOptions } = options

    const headers = await this.getAuthHeaders(options)

    // Add additional headers from options
    const allHeaders: Record<string, string> = {
      ...headers,
      ...(fetchOptions.headers as Record<string, string> || {}),
    }

    // A protected call with no session: send the visitor to sign in and
    // bring them back to the page they were on.
    if (requiresAuth && !allHeaders['Authorization']) {
      const token = await getAuthToken()
      if (!token) {
        redirectToLogin()
        throw new Error('Please sign in to continue.')
      }
      allHeaders['Authorization'] = `Bearer ${token}`
    }

    let response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers: allHeaders,
      credentials: 'include',
    })

    if (response.status === 401) {
      // Public endpoints never need a session — a stale token there is just
      // ignored by the API, so a 401 is a real error, not a reason to log out.
      if (!requiresAuth) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || 'Request was not authorised.')
      }
      // Re-read the session: NextAuth renews the backend token server-side
      // (see app/api/auth/[...nextauth]/route.ts). Retry once if it changed.
      const sentToken = allHeaders['Authorization']?.slice('Bearer '.length)
      const freshToken = await getAuthToken()
      if (freshToken && freshToken !== sentToken) {
        allHeaders['Authorization'] = `Bearer ${freshToken}`
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...fetchOptions,
          headers: allHeaders,
          credentials: 'include',
        })
      }
      if (response.status === 401) {
        redirectToLogin(true)
        throw new Error('Your session has expired. Please sign in again.')
      }
    }

    // 204 No Content — every DELETE route in this app returns this with no
    // body at all, so response.json() would always throw below even though
    // the request actually succeeded.
    if (response.status === 204) {
      return undefined as T;
    }

    let data: T | ApiError;
    try {
      data = await response.json();
    } catch (error) {
      throw new Error('Invalid JSON response from server');
    }

    if (!response.ok) {
      const errorData = data as ApiError;

      // Attach the HTTP status so callers can branch on it (e.g. treat a 404
      // on a delete as "already gone" instead of a hard failure) without
      // having to parse the message string.
      const makeError = (message: string) => {
        const err = new Error(message) as Error & { status?: number }
        err.status = response.status
        return err
      }

      // Handle specific HTTP errors
      if (response.status === 403) {
        throw makeError('You do not have permission to perform this action.')
      }

      if (response.status === 429) {
        throw makeError('Too many requests. Please try again later.')
      }

      if (response.status === 404) {
        throw makeError('The requested resource was not found.')
      }

      if (response.status >= 500) {
        throw makeError('Server error. Please try again later.')
      }

      throw makeError(errorData.error || errorData.message || `Request failed with status ${response.status}`)
    }

    return data as T;
  }

  // Public endpoints (no auth required)
  public = {
    auth: {
      login: (email: string, password: string) => 
        this.request('/api/v1/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
          requiresAuth: false,
        }),
      
      register: (data: {
        name: string;
        username: string;
        email: string;
        password: string;
        roleName?: string;
      }) =>
        this.request('/api/v1/auth/register', {
          method: 'POST',
          body: JSON.stringify(data),
          requiresAuth: false,
        }),

      forgotPassword: (email: string) =>
        this.request('/api/v1/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email }),
          requiresAuth: false,
        }),

      resetPassword: (data: {
        token: string;
        newPassword: string;
        confirmPassword: string;
      }) =>
        this.request('/api/v1/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify(data),
          requiresAuth: false,
        }),

      verifyResetToken: (token: string) =>
        this.request(`/api/v1/auth/verify-reset-token/${token}`, {
          requiresAuth: false,
        }),

      verifyEmail: (token: string) =>
        this.request('/api/v1/auth/verify-email', {
          method: 'POST',
          body: JSON.stringify({ token }),
          requiresAuth: false,
        }),

      resendVerification: (email: string) =>
        this.request('/api/v1/auth/resend-verification', {
          method: 'POST',
          body: JSON.stringify({ email }),
          requiresAuth: false,
        }),
    },
    
    blog: {
      getAll: (params?: {
        page?: number;
        limit?: number;
        category?: string;
        featured?: boolean;
        search?: string;
        sort?: string;
      }) => {
        const queryParams = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              queryParams.append(key, String(value));
            }
          });
        }
        const queryString = queryParams.toString();
        const url = `/api/v1/blogs${queryString ? `?${queryString}` : ''}`;
        return this.request(url, { requiresAuth: false });
      },
      
      getBySlug: (slug: string) => 
        this.request(`/api/v1/blogs/slug/${slug}`, { requiresAuth: false }),
      
      getById: (id: string) => 
        this.request(`/api/v1/blogs/${id}`, { requiresAuth: false }),
      
      getFeatured: () => 
        this.request('/api/v1/blogs/featured', { requiresAuth: false }),
      
      getCategories: () => 
        this.request('/api/v1/blogs/categories', { requiresAuth: false }),
      
      getStats: () => 
        this.request('/api/v1/blogs/stats', { requiresAuth: false }),
      
      like: (id: string) => 
        this.request(`/api/v1/blogs/${id}/like`, {
          method: 'POST',
          requiresAuth: false,
        }),
      
      getImage: (id: string) => 
        this.request(`/api/v1/blogs/${id}/image`, { requiresAuth: false }),
      
      getImageInfo: (id: string) => 
        this.request(`/api/v1/blogs/${id}/image-info`, { requiresAuth: false }),
    },
    
    trainings: {
      getAll: () => 
        this.request('/api/v1/trainings', { requiresAuth: false }),
      
      getOne: (id: string) => 
        this.request(`/api/v1/trainings/${id}`, { requiresAuth: false }),
    },

    testimonials: {
      getAll: () =>
        this.request('/api/v1/testimonials', { requiresAuth: false }),

      getOne: (id: string) =>
        this.request(`/api/v1/testimonials/${id}`, { requiresAuth: false }),

      submit: (data: FormData) =>
        this.request('/api/v1/testimonials/submit', {
          method: 'POST',
          body: data,
          requiresAuth: false,
        }),
    },

    events: {
      getAll: (params?: { upcoming?: boolean }) => {
        const query = params?.upcoming ? '?upcoming=true' : '';
        return this.request(`/api/v1/events${query}`, { requiresAuth: false });
      },

      getBySlug: (slug: string) =>
        this.request(`/api/v1/events/${slug}`, { requiresAuth: false }),

      // Guest-friendly: links the booking to the account when logged in.
      register: (slug: string, data: unknown) =>
        this.request(`/api/v1/events/${encodeURIComponent(slug)}/register`, {
          method: 'POST',
          body: JSON.stringify(data),
          requiresAuth: false,
        }),
    },

    orders: {
      // Guest-friendly: links the order to the account when logged in.
      create: (data: unknown) =>
        this.request('/api/orders', {
          method: 'POST',
          body: JSON.stringify(data),
          requiresAuth: false,
        }),
    },

    gallery: {
      getCategories: () =>
        this.request('/api/v1/gallery/categories', { requiresAuth: false }),

      getImages: (categoryId?: string) => {
        const query = categoryId ? `?categoryId=${categoryId}` : '';
        return this.request(`/api/v1/gallery/images${query}`, { requiresAuth: false });
      },
    },

    youtube: {
      getVideos: () =>
        this.request('/api/v1/youtube/videos', { requiresAuth: false }),
    },

    newsletter: {
      subscribe: (email: string) =>
        this.request('/api/v1/newsletter/subscribe', {
          method: 'POST',
          body: JSON.stringify({ email }),
          requiresAuth: false,
        }),

      unsubscribe: (email: string, token: string) =>
        this.request(
          `/api/v1/newsletter/unsubscribe?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`,
          { requiresAuth: false }
        ),
    },
  }

  // Protected endpoints (requires auth)
  protected = {
    events: {
      registrationsMine: () =>
        this.request('/api/v1/events/registrations/mine'),
    },

    orders: {
      mine: () =>
        this.request('/api/orders/mine'),
    },
  }

  // Admin endpoints (requires admin role)
  admin = {
    users: {
      getAll: () => 
        this.request('/api/v1/users'),
      
      getById: (id: string) => 
        this.request(`/api/v1/users/${id}`),
      
      create: (data: {
        name: string;
        username: string;
        email: string;
        password: string;
        roleId: string;
      }) =>
        this.request('/api/v1/users', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      
      update: (id: string, data: {
        name?: string;
        username?: string;
        email?: string;
        password?: string;
        roleId?: string;
        isActive?: boolean;
      }) =>
        this.request(`/api/v1/users/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      
      delete: (id: string) =>
        this.request(`/api/v1/users/${id}`, {
          method: 'DELETE',
        }),
    },
    
    blog: {
      create: (data: FormData) => 
        this.request('/api/v1/blogs', {
          method: 'POST',
          body: data,
          headers: {},
        }),
      
      update: (id: string, data: FormData) =>
        this.request(`/api/v1/blogs/${id}`, {
          method: 'PUT',
          body: data,
          headers: {},
        }),
      
      delete: (id: string) =>
        this.request(`/api/v1/blogs/${id}`, {
          method: 'DELETE',
        }),
    },
    
    training: {
      create: (data: FormData) =>
        this.request('/api/v1/trainings', {
          method: 'POST',
          body: data,
          headers: {},
        }),

      update: (id: string, data: FormData) =>
        this.request(`/api/v1/trainings/${id}`, {
          method: 'PUT',
          body: data,
          headers: {},
        }),

      delete: (id: string) =>
        this.request(`/api/v1/trainings/${id}`, {
          method: 'DELETE',
        }),
    },

    events: {
      getById: (id: string) =>
        this.request(`/api/v1/events/${id}/edit`),

      create: (data: FormData) =>
        this.request('/api/v1/events', {
          method: 'POST',
          body: data,
          headers: {},
        }),

      update: (id: string, data: FormData) =>
        this.request(`/api/v1/events/${id}`, {
          method: 'PUT',
          body: data,
          headers: {},
        }),

      delete: (id: string) =>
        this.request(`/api/v1/events/${id}`, {
          method: 'DELETE',
        }),

      getRegistrations: (id: string) =>
        this.request(`/api/v1/events/${id}/registrations`),

      updateRegistrationStatus: (id: string, status: string) =>
        this.request(`/api/v1/events/registrations/${id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        }),

      checkin: (eventId: string, ticketNumber: string) =>
        this.request(`/api/v1/events/${eventId}/registrations/checkin`, {
          method: 'POST',
          body: JSON.stringify({ ticketNumber }),
        }),
    },

    testimonial: {
      create: (data: FormData) =>
        this.request('/api/v1/testimonials', {
          method: 'POST',
          body: data,
          headers: {},
        }),

      update: (id: string, data: FormData) =>
        this.request(`/api/v1/testimonials/${id}`, {
          method: 'PUT',
          body: data,
          headers: {},
        }),
      
      delete: (id: string) =>
        this.request(`/api/v1/testimonials/${id}`, {
          method: 'DELETE',
        }),
      
      updateStatus: (id: string, data: { isActive: boolean }) =>
        this.request(`/api/v1/testimonials/${id}/status`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        }),
    },

    gallery: {
      createCategory: (data: { name: string; description?: string }) =>
        this.request('/api/v1/gallery/categories', {
          method: 'POST',
          body: JSON.stringify(data),
        }),

      updateCategory: (id: string, data: { name?: string; description?: string }) =>
        this.request(`/api/v1/gallery/categories/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),

      deleteCategory: (id: string) =>
        this.request(`/api/v1/gallery/categories/${id}`, {
          method: 'DELETE',
        }),

      uploadSingle: (data: FormData) =>
        this.request('/api/v1/gallery/images/single', {
          method: 'POST',
          body: data,
          headers: {},
        }),

      uploadBulk: (data: FormData) =>
        this.request('/api/v1/gallery/images/bulk', {
          method: 'POST',
          body: data,
          headers: {},
        }),

      deleteImage: (id: string) =>
        this.request(`/api/v1/gallery/images/${id}`, {
          method: 'DELETE',
        }),
    },

    newsletter: {
      getAll: () =>
        this.request('/api/v1/newsletter'),

      delete: (id: string) =>
        this.request(`/api/v1/newsletter/${id}`, {
          method: 'DELETE',
        }),

      send: (data: { subject: string; message: string }) =>
        this.request('/api/v1/newsletter/send', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
    },
  }
}

export const api = new ApiClient();


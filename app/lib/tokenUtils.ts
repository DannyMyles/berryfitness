/**
 * Token utilities for secure token management
 */

import { getSession } from 'next-auth/react'

const TOKEN_KEY = 'auth_token'
const TOKEN_EXPIRY_KEY = 'auth_token_expiry'

/**
 * Get the stored token expiry time
 */
export function getTokenExpiry(): Date | null {
  if (typeof window === 'undefined') return null
  
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
  if (!expiry) return null
  
  return new Date(expiry)
}

/**
 * Set the token expiry time
 */
export function setTokenExpiry(expiryDate: Date): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryDate.toISOString())
}

/**
 * Check if the token is expired
 */
export function isTokenExpired(): boolean {
  const expiry = getTokenExpiry()
  if (!expiry) return true
  return new Date() >= expiry
}

/**
 * Calculate token expiry time from now (in hours)
 */
export function calculateTokenExpiry(hours: number): Date {
  const expiry = new Date()
  expiry.setHours(expiry.getHours() + hours)
  return expiry
}

/**
 * Get remaining token time in minutes
 */
export function getRemainingTokenTime(): number {
  const expiry = getTokenExpiry()
  if (!expiry) return 0
  
  const remaining = expiry.getTime() - new Date().getTime()
  return Math.max(0, Math.floor(remaining / 1000 / 60)) // minutes
}

/**
 * Store token securely
 * Note: NextAuth handles token storage, this is for additional caching
 */
export function storeToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, token)
}

/**
 * Get stored token
 */
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * Clear stored token
 */
export function clearStoredToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_EXPIRY_KEY)
}

/**
 * Get auth token from session with multiple fallback methods
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const session = await getSession()
    
    if (!session?.user) {
      return null
    }

    // Try different ways to access the token
    const user = session.user as any
    
    // Check for direct accessToken property
    if (user.accessToken) {
      return user.accessToken
    }
    
    // Check if it's in the session directly
    if ((session as any).accessToken) {
      return (session as any).accessToken
    }
    
    // Check in jwt token
    if ((session as any).token) {
      return (session as any).token
    }
    
    return null
  } catch (error) {
    console.error('Error getting auth token:', error)
    return null
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken()
  return !!token
}

/**
 * Get authorization header
 */
export async function getAuthHeader(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }

  const token = await getAuthToken()
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return headers
}

/**
 * Decode JWT token (basic decoding without verification)
 */
export function decodeJwt(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const payload = parts[1]
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    
    return JSON.parse(decoded)
  } catch (error) {
    console.error('Error decoding JWT:', error)
    return null
  }
}

/**
 * Get token expiration from JWT
 */
export function getJwtExpiration(token: string): Date | null {
  const payload = decodeJwt(token)
  if (!payload || !payload.exp) return null
  
  return new Date(payload.exp * 1000)
}

/**
 * Check if token is about to expire (within 5 minutes)
 */
export function isTokenAboutToExpire(token: string): boolean {
  const expiration = getJwtExpiration(token)
  if (!expiration) return false
  
  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000)
  return expiration <= fiveMinutesFromNow
}

/**
 * Format token for display (show first and last 4 characters)
 */
export function formatToken(token: string): string {
  if (token.length <= 8) return '••••••••'
  return `${token.slice(0, 4)}••••••••${token.slice(-4)}`
}

/**
 * Token refresh validation
 */
export function canRefreshToken(): boolean {
  const remainingTime = getRemainingTokenTime()
  // Allow refresh if less than 30 minutes remaining
  return remainingTime > 0 && remainingTime < 30
}

/**
 * Session activity tracker
 */
let activityTimeout: NodeJS.Timeout | null = null
let lastActivityTime = Date.now()

/**
 * Reset activity timeout
 */
export function resetActivityTimeout(callback: () => void, timeoutMs: number = 15 * 60 * 1000): void {
  lastActivityTime = Date.now()
  
  if (activityTimeout) {
    clearTimeout(activityTimeout)
  }
  
  activityTimeout = setTimeout(() => {
    const elapsed = Date.now() - lastActivityTime
    if (elapsed >= timeoutMs) {
      callback()
    }
  }, timeoutMs)
}

/**
 * Clear activity timeout
 */
export function clearActivityTimeout(): void {
  if (activityTimeout) {
    clearTimeout(activityTimeout)
    activityTimeout = null
  }
}

/**
 * Initialize activity listeners for session timeout
 */
export function initActivityListeners(onTimeout: () => void, timeoutMs: number = 15 * 60 * 1000): void {
  if (typeof window === 'undefined') return
  
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
  
  const resetTimeout = () => {
    resetActivityTimeout(onTimeout, timeoutMs)
  }
  
  events.forEach(event => {
    window.addEventListener(event, resetTimeout)
  })
  
  // Initialize timeout
  resetActivityTimeout(onTimeout, timeoutMs)
}

/**
 * Clean up activity listeners
 */
export function cleanupActivityListeners(): void {
  if (typeof window === 'undefined') return
  
  const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
  
  events.forEach(event => {
    window.removeEventListener(event, resetActivityTimeout as any)
  })
  
  clearActivityTimeout()
}


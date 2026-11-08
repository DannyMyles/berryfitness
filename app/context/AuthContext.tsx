'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { signIn, signOut, getSession } from 'next-auth/react'

// Types
interface User {
  id: string
  name: string | null
  email: string | null
  image: string | null
  role: string
  accessToken?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  getAccessToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Hook to use auth context
export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

// Get session user type
interface SessionUser {
  id?: string
  name?: string | null
  email?: string | null
  image?: string | null
  role?: string
  accessToken?: string
}

// Fetch session data
async function fetchSession() {
  try {
    const session = await getSession()
    return session
  } catch (error) {
    console.error('Error fetching session:', error)
    return null
  }
}

// Auth Provider Component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch session data
  const updateSession = useCallback(async () => {
    try {
      const session = await fetchSession()
      
      if (session?.user) {
        const sessionUser = session.user as SessionUser
        setUser({
          id: sessionUser.id || '',
          name: sessionUser.name ?? null,
          email: sessionUser.email ?? null,
          image: sessionUser.image ?? null,
          role: sessionUser.role || 'user',
          accessToken: sessionUser.accessToken,
        })
      } else {
        setUser(null)
      }
      
      setIsLoading(false)
      setIsInitialized(true)
    } catch (error) {
      console.error('Error updating session:', error)
      setIsLoading(false)
      setIsInitialized(true)
    }
  }, [])

  // Initial fetch and setup polling
  useEffect(() => {
    // Initial fetch
    updateSession()

    // Listen for auth changes via custom event
    const handleAuthChange = () => {
      updateSession()
    }

    window.addEventListener('nextauth:signin', handleAuthChange)
    window.addEventListener('nextauth:signout', handleAuthChange)
    window.addEventListener('nextauth:sessionUpdated', handleAuthChange)

    // Polling as fallback (every 5 seconds)
    pollingRef.current = setInterval(() => {
      if (!document.hidden) {
        updateSession()
      }
    }, 5000)

    return () => {
      window.removeEventListener('nextauth:signin', handleAuthChange)
      window.removeEventListener('nextauth:signout', handleAuthChange)
      window.removeEventListener('nextauth:sessionUpdated', handleAuthChange)
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [updateSession])

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        return { success: false, error: result.error }
      }

      // Trigger auth change event
      window.dispatchEvent(new Event('nextauth:signin'))
      
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }, [])

  // Logout function
  const logout = useCallback(async () => {
    await signOut({ callbackUrl: window.location.origin })
  }, [])

  // Refresh user data
  const refreshUser = useCallback(async () => {
    await updateSession()
    // Dispatch custom event
    window.dispatchEvent(new Event('nextauth:sessionUpdated'))
  }, [updateSession])

  // Get access token
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (user?.accessToken) {
      return user.accessToken
    }
    
    // Try to get from session
    const session = await fetchSession()
    const sessionUser = session?.user as SessionUser | undefined
    return sessionUser?.accessToken || null
  }, [user])

  const value: AuthContextType = {
    user,
    isLoading: isLoading || !isInitialized,
    isAuthenticated: !!user && !isLoading,
    login,
    logout,
    refreshUser,
    getAccessToken,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Higher-order component to wrap with AuthProvider
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: { requiredRole?: string }
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <AuthProvider>
        <Component {...props} />
      </AuthProvider>
    )
  }
}

// Hook to require authentication
export function useRequireAuth(redirectUrl: string = '/login') {
  const { isAuthenticated, isLoading } = useAuthContext()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = redirectUrl
    }
  }, [isAuthenticated, isLoading, redirectUrl])

  return { isAuthenticated, isLoading }
}

// Hook to require specific role
export function useRequireRole(requiredRole: string) {
  const { user, isAuthenticated, isLoading } = useAuthContext()

  const hasPermission = user?.role === requiredRole

  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasPermission) {
      window.location.href = '/unauthorized'
    }
  }, [isAuthenticated, isLoading, hasPermission])

  return { hasPermission, isLoading }
}

export default AuthContext


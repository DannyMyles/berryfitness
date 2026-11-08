'use client'

import { useCallback } from 'react'
import { signOut as nextAuthSignOut } from 'next-auth/react'
import { clearStoredToken } from '@/app/lib/tokenUtils'

interface UseSignOutOptions {
  callbackUrl?: string
  redirect?: boolean
}

/**
 * Custom hook for signing out users
 * Clears local tokens and signs out from NextAuth
 */
export function useSignOut(options: UseSignOutOptions = {}) {
  const { callbackUrl = '/', redirect = true } = options

  const signOut = useCallback(async (forceRedirect: boolean = redirect) => {
    // Clear stored tokens
    clearStoredToken()
    
    // Sign out from NextAuth
    await nextAuthSignOut({
      callbackUrl: forceRedirect ? callbackUrl : undefined,
      redirect: forceRedirect,
    })
  }, [callbackUrl, redirect])

  const signOutAndRedirect = useCallback(async () => {
    signOut(true)
  }, [signOut])

  return {
    signOut,
    signOutAndRedirect,
  }
}

export default useSignOut


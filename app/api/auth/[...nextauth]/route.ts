import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { backendFetch } from "@/app/lib/backend"

/** Renew the backend token this long before it expires. */
const REFRESH_WHEN_LEFT_MS = 2 * 60 * 60 * 1000

/**
 * Reads (without verifying — the backend does that) the backend JWT's
 * expiry and app claim. Tokens issued before the shared-backend change have
 * no `app` claim and are rejected by the API.
 */
function readBackendToken(accessToken: unknown): { valid: boolean; expiresInMs: number } {
  if (typeof accessToken !== 'string') return { valid: false, expiresInMs: 0 }
  try {
    const payload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64url').toString('utf8'))
    const expiresInMs = typeof payload.exp === 'number' ? payload.exp * 1000 - Date.now() : 0
    return { valid: typeof payload.app === 'number' && expiresInMs > 0, expiresInMs }
  } catch {
    return { valid: false, expiresInMs: 0 }
  }
}

async function refreshBackendToken(accessToken: string): Promise<string | null> {
  try {
    const res = await backendFetch('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: accessToken }),
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    return typeof data.accessToken === 'string' ? data.accessToken : null
  } catch {
    return null
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }

        // Logs in against the Berry API as the `berry` app — accounts are
        // per app, so an account on another app can't sign in here.
        // Pass the visitor's address on so the API rate-limits logins per
        // person rather than treating every visitor as this one server.
        const forwardedFor = req?.headers?.['x-forwarded-for']
        const clientIp = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)?.split(',')[0]?.trim()
        const response = await backendFetch('/api/v1/auth/login', {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(clientIp ? { "x-forwarded-for": clientIp } : {}) },
          body: JSON.stringify({ email: credentials.email, password: credentials.password }),
          cache: 'no-store',
        })
        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(data.error || data.message || "Authentication failed")
        }

        // Backend shape: { message, user: { id, name, username, email, role, token } }
        const user = data.user
        if (!user?.token) {
          throw new Error("No token received from server")
        }

        return {
          id: String(user.id),
          email: user.email || credentials.email,
          name: user.name || user.username || "User",
          role: user.role || "user",
          accessToken: user.token,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = user.role
        token.accessToken = user.accessToken
      }
      
      // Handle session update (e.g., after token refresh)
      if (trigger === 'update' && session) {
        if (session.accessToken) {
          token.accessToken = session.accessToken
        }
        if (session.name) {
          token.name = session.name
        }
      }

      // Keep the backend token in step with this session. A token from
      // before apps existed, or one that has expired, can't be used any
      // more: throwing here makes NextAuth clear the cookie, so the visitor
      // is simply signed out instead of being bounced to /login by a 401
      // on whatever page they open next.
      const backend = readBackendToken(token.accessToken)
      if (!backend.valid) {
        throw new Error('Backend session is no longer valid')
      }
      // Sliding session: renew the backend token when it gets close to
      // expiry, so an active visitor never hits an expired token.
      if (backend.expiresInMs < REFRESH_WHEN_LEFT_MS) {
        const refreshed = await refreshBackendToken(token.accessToken)
        if (!refreshed) throw new Error('Backend session could not be renewed')
        token.accessToken = refreshed
      }

      return token
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.role = token.role as string
        session.user.accessToken = token.accessToken as string
      }
      return session
    },
  },

  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // Update session every hour
  },

  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }


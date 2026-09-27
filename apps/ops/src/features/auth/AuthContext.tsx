import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { User, AuthState } from '@shared/types'
import { normalizeBackendRole } from '@shared/types'
import { authService } from '@/api/services/auth.service'

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateProfile: (data: Partial<User>) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)
const OPS_USER_STORAGE_KEY = 'stm_ops_user'

function computeInitials(name?: string, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }
  return (email?.slice(0, 2) || 'OP').toUpperCase()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    try {
      const stored = localStorage.getItem(OPS_USER_STORAGE_KEY)
      const token = localStorage.getItem('stm_access_token')
      if (stored && token) {
        const parsed = JSON.parse(stored) as User
        return {
          user: parsed,
          isLoading: false,
          isAuthenticated: true,
        }
      }
    } catch {
      // ignore
    }
    return {
      user: null,
      isLoading: false,
      isAuthenticated: false,
    }
  })

  const logout = useCallback(() => {
    authService.logout()
    setState({ user: null, isLoading: false, isAuthenticated: false })
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, isLoading: true }))
    try {
      const res = await authService.login({
        email: email.trim(),
        password,
      })

      const primaryRole = normalizeBackendRole(res.user.roles)

      // Strict RBAC check for Operations Portal: Only ADMIN and STAFF are authorized
      if (primaryRole !== 'admin' && primaryRole !== 'staff') {
        throw new Error(`FORBIDDEN_COMMUNITY_ROLE:${primaryRole}`)
      }

      const authenticatedUser: User = {
        id: res.user.id,
        name: res.user.fullName || res.user.email.split('@')[0],
        email: res.user.email,
        role: primaryRole,
        avatar: (res.user as any).avatarUrl || undefined,
        initials: computeInitials(res.user.fullName, res.user.email),
      }

      localStorage.setItem('stm_access_token', res.accessToken)
      if ((res as any).refreshToken) {
        localStorage.setItem('stm_refresh_token', (res as any).refreshToken)
      }
      localStorage.setItem(OPS_USER_STORAGE_KEY, JSON.stringify(authenticatedUser))

      setState({ user: authenticatedUser, isLoading: false, isAuthenticated: true })
    } catch (err: any) {
      setState((s) => ({ ...s, isLoading: false }))
      if (
        err instanceof Error &&
        (err.message === 'FORBIDDEN_ACCESS' || err.message.startsWith('FORBIDDEN_COMMUNITY_ROLE:'))
      ) {
        throw err
      }
      if (
        err?.statusCode === 401 ||
        err?.message === 'Unauthorized' ||
        err?.message?.toLowerCase().includes('credential') ||
        err?.message?.toLowerCase().includes('password')
      ) {
        throw new Error('INVALID_CREDENTIALS')
      }
      throw err
    }
  }, [])

  const updateProfile = useCallback((data: Partial<User>) => {
    setState((s) => {
      if (!s.user) return s
      const updated: User = { ...s.user, ...data }
      localStorage.setItem(OPS_USER_STORAGE_KEY, JSON.stringify(updated))
      return { ...s, user: updated }
    })
  }, [])

  // Session verification on mount against real backend
  useEffect(() => {
    async function restoreSession() {
      const token = localStorage.getItem('stm_access_token')
      const stored = localStorage.getItem(OPS_USER_STORAGE_KEY)
      if (!token || !stored) {
        return
      }

      try {
        const profile = await authService.getMe()
        const primaryRole = normalizeBackendRole(profile.roles)

        if (primaryRole !== 'admin' && primaryRole !== 'staff') {
          logout()
          return
        }

        const syncedUser: User = {
          id: profile.id,
          name: profile.fullName || profile.email.split('@')[0],
          email: profile.email,
          role: primaryRole,
          avatar: profile.avatarUrl || undefined,
          initials: computeInitials(profile.fullName, profile.email),
        }

        localStorage.setItem(OPS_USER_STORAGE_KEY, JSON.stringify(syncedUser))
        setState({ user: syncedUser, isLoading: false, isAuthenticated: true })
      } catch (err: any) {
        // If 401 Unauthorized, token has expired, logout
        if (err?.statusCode === 401 || err?.status === 401) {
          logout()
        }
      }
    }

    restoreSession()
  }, [logout])

  // Listen for global unauthorized events from Axios to logout gracefully without hard reload
  useEffect(() => {
    const handleUnauthorized = () => {
      logout()
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [logout])

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

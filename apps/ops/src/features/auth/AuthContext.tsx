import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { User, AuthState } from '@/types/auth'
import { mockOpsDemoAccounts } from '@/data/mockAccounts'

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateProfile: (data: Partial<User>) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)
const OPS_USER_STORAGE_KEY = 'stm_ops_user'

// ─── Mock login — replace with real API call ─────────────────────
async function mockLogin(email: string, _password: string): Promise<User> {
  await new Promise((r) => setTimeout(r, 600)) // simulate network

  const cleanEmail = email.trim().toLowerCase()

  // Find if matching any demo account
  const matchedDemo = mockOpsDemoAccounts.find(
    (acc) =>
      acc.email.toLowerCase() === cleanEmail ||
      (cleanEmail.includes(acc.role) && !cleanEmail.includes('admin') && !cleanEmail.includes('staff'))
  )

  // Check community roles (Driver, Surveyor, Reviewer) -> explicitly DENY permission
  if (
    cleanEmail.includes('driver') ||
    cleanEmail.includes('surveyor') ||
    cleanEmail.includes('reviewer') ||
    (matchedDemo && !matchedDemo.isOpsAuthorized)
  ) {
    throw new Error('FORBIDDEN_ACCESS')
  }

  // Admin account
  if (cleanEmail.includes('admin') || (matchedDemo && matchedDemo.role === 'admin')) {
    const adminDemo = mockOpsDemoAccounts.find((a) => a.role === 'admin')!
    return {
      id: adminDemo.id,
      name: adminDemo.name,
      email: email.trim(),
      role: 'admin',
      avatar: adminDemo.avatar,
      initials: adminDemo.initials,
    }
  }

  // Staff account (Default for operations portal)
  const staffDemo = mockOpsDemoAccounts.find((a) => a.role === 'staff')!
  return {
    id: staffDemo.id,
    name: staffDemo.name,
    email: email.trim(),
    role: 'staff',
    avatar: staffDemo.avatar,
    initials: staffDemo.initials,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    try {
      const stored = localStorage.getItem(OPS_USER_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as User
        // Sync with current mock data (in case old generic 'Admin User' was stored)
        const matched = mockOpsDemoAccounts.find((a) => a.role === parsed.role)
        if (matched) {
          const syncedUser: User = {
            ...parsed,
            name: matched.name,
            avatar: matched.avatar,
            initials: matched.initials,
          }
          localStorage.setItem(OPS_USER_STORAGE_KEY, JSON.stringify(syncedUser))
          return {
            user: syncedUser,
            isLoading: false,
            isAuthenticated: true,
          }
        }
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

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, isLoading: true }))
    try {
      const user = await mockLogin(email, password)
      setState({ user, isLoading: false, isAuthenticated: true })
      localStorage.setItem(OPS_USER_STORAGE_KEY, JSON.stringify(user))
      localStorage.setItem('stm_access_token', 'mock_ops_token_' + user.role)
    } catch (err) {
      setState((s) => ({ ...s, isLoading: false }))
      if (
        err instanceof Error &&
        (err.message === 'FORBIDDEN_ACCESS' || err.message.startsWith('FORBIDDEN_COMMUNITY_ROLE:'))
      ) {
        throw err
      }
      throw new Error('INVALID_CREDENTIALS')
    }
  }, [])

  const logout = useCallback(() => {
    setState({ user: null, isLoading: false, isAuthenticated: false })
    localStorage.removeItem(OPS_USER_STORAGE_KEY)
    localStorage.removeItem('stm_access_token')
    localStorage.removeItem('stm_refresh_token')
  }, [])

  const updateProfile = useCallback((data: Partial<User>) => {
    setState((s) => {
      if (!s.user) return s
      const updated: User = { ...s.user, ...data }
      localStorage.setItem(OPS_USER_STORAGE_KEY, JSON.stringify(updated))
      return { ...s, user: updated }
    })
  }, [])

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


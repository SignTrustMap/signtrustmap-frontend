import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { mockDemoAccounts, type DemoUserAccount } from '@/data'

interface AuthContextValue {
  user: DemoUserAccount | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password?: string) => Promise<DemoUserAccount>
  logout: (redirectTo?: string) => void
  updateProfile: (updatedData: Partial<DemoUserAccount>) => void
  claimDailyBonus: (amount?: number) => number
}

const AuthContext = createContext<AuthContextValue | null>(null)

const USER_STORAGE_KEY = 'stm_web_user'

function sanitizeName(name: string): string {
  return name ? name.replace(/\s*\([^)]*\)/g, '').trim() : name
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUserAccount | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed && parsed.name) {
          parsed.name = sanitizeName(parsed.name)
        }
        // Sync with updated mock accounts (e.g. member names and dog avatars)
        const matched = mockDemoAccounts.find(
          (acc) =>
            acc.id === parsed.id ||
            acc.email.toLowerCase() === parsed.email?.toLowerCase() ||
            acc.role.toLowerCase() === parsed.role?.toLowerCase()
        )
        if (matched) {
          const syncedUser = {
            ...parsed,
            name: matched.name,
            avatar: matched.avatar,
            role: matched.role,
            label: matched.label,
          }
          setUser(syncedUser)
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(syncedUser))
        } else {
          setUser(parsed)
        }
      }
    } catch (e) {
      console.error('Failed to load user from localStorage', e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Listen for global unauthorized events from Axios to logout gracefully without hard reload
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null)
      localStorage.removeItem(USER_STORAGE_KEY)
      localStorage.removeItem('stm_access_token')
      localStorage.removeItem('stm_refresh_token')
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [])

  const login = useCallback(async (email: string, _password?: string): Promise<DemoUserAccount> => {
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 400)) // simulate quick network

    // Match known demo account by email, otherwise synthesize community user
    const matched = mockDemoAccounts.find(
      (acc) => acc.email.toLowerCase() === email.trim().toLowerCase()
    )

    const authenticatedUser: DemoUserAccount = matched || {
      id: `usr-${Date.now()}`,
      role: 'driver',
      label: 'Driver',
      icon: '🚗',
      email,
      password: 'password123',
      name: email.split('@')[0],
      credits: 50,
      trustScore: 80,
      totalSubmissions: 0,
      validatedCount: 0,
      joinDate: new Date().toLocaleDateString('vi-VN'),
    }

    setUser(authenticatedUser)
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authenticatedUser))
    localStorage.setItem('stm_access_token', `demo-jwt-${authenticatedUser.role}-${Date.now()}`)
    setIsLoading(false)
    return authenticatedUser
  }, [])

  const logout = useCallback((redirectTo: string = '/') => {
    setUser(null)
    localStorage.removeItem(USER_STORAGE_KEY)
    localStorage.removeItem('stm_access_token')
    localStorage.removeItem('stm_refresh_token')
    if (redirectTo) {
      window.location.replace(redirectTo)
    }
  }, [])

  const updateProfile = useCallback((updatedData: Partial<DemoUserAccount>) => {
    setUser((prev) => {
      if (!prev) return null
      const updated = { ...prev, ...updatedData }
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const claimDailyBonus = useCallback((amount: number = 25): number => {
    let newCredits = 0
    setUser((prev) => {
      if (!prev) return null
      newCredits = (prev.credits || 0) + amount
      const updated = { ...prev, credits: newCredits }
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
    return newCredits
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateProfile,
        claimDailyBonus,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

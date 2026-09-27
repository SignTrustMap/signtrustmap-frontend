import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { DemoUserAccount } from '@/data'
import { authService, type AuthRegisterPayload } from '@/api/services/auth.service'
import { normalizeBackendRole } from '@shared/types'

interface AuthContextValue {
  user: DemoUserAccount | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password?: string, rememberMe?: boolean) => Promise<DemoUserAccount>
  register: (payload: AuthRegisterPayload, rememberMe?: boolean) => Promise<DemoUserAccount>
  loginWithGoogleToken: (idToken: string, rememberMe?: boolean) => Promise<DemoUserAccount>
  logout: (redirectTo?: string) => void
  updateProfile: (updatedData: Partial<DemoUserAccount>) => Promise<void> | void
  claimDailyBonus: (amount?: number) => number
}

const AuthContext = createContext<AuthContextValue | null>(null)

const USER_STORAGE_KEY = 'stm_web_user'
const TOKEN_STORAGE_KEY = 'stm_access_token'

function sanitizeName(name: string): string {
  return name ? name.replace(/\s*\([^)]*\)/g, '').trim() : name
}

/**
 * Authentication context provider for the Community Portal.
 * Hydrates active sessions across tabs, listens for soft 401 unauthorized events,
 * and exposes authentication methods (login, register, OAuth, profile updates).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUserAccount | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function restoreSession() {
      try {
        const storedUser = localStorage.getItem(USER_STORAGE_KEY) || sessionStorage.getItem(USER_STORAGE_KEY)
        const token = localStorage.getItem(TOKEN_STORAGE_KEY) || sessionStorage.getItem(TOKEN_STORAGE_KEY)

        if (storedUser) {
          const parsed = JSON.parse(storedUser)
          if (parsed && parsed.name) {
            parsed.name = sanitizeName(parsed.name)
          }
          setUser(parsed)
        }

        if (token) {
          try {
            const profile = await authService.getMe()
            const primaryRole = normalizeBackendRole(profile.roles)
            const refreshedUser: DemoUserAccount = {
              id: profile.id,
              email: profile.email,
              name: profile.fullName || profile.email.split('@')[0],
              phone: profile.phone || undefined,
              role: primaryRole,
              label: primaryRole.charAt(0).toUpperCase() + primaryRole.slice(1),
              icon: primaryRole === 'surveyor' ? '📹' : primaryRole === 'reviewer' ? '⚖️' : '🚗',
              avatar: profile.avatarUrl || undefined,
              credits: profile.walletBalance ?? 0,
              trustScore: 90,
              joinDate: new Date().toLocaleDateString('vi-VN'),
            }

            setUser(refreshedUser)
            const isLocal = !!localStorage.getItem(TOKEN_STORAGE_KEY)
            const storage = isLocal ? localStorage : sessionStorage
            storage.setItem(USER_STORAGE_KEY, JSON.stringify(refreshedUser))
          } catch {
            // Suppressed: expired tokens handled by 401 interceptor
          }
        }
      } catch (e) {
        console.error('Failed to load user from storage', e)
      } finally {
        setIsLoading(false)
      }
    }

    restoreSession()
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null)
      localStorage.removeItem(USER_STORAGE_KEY)
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      sessionStorage.removeItem(USER_STORAGE_KEY)
      sessionStorage.removeItem(TOKEN_STORAGE_KEY)
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [])

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === USER_STORAGE_KEY || e.key === TOKEN_STORAGE_KEY) {
        const stored = localStorage.getItem(USER_STORAGE_KEY)
        const token = localStorage.getItem(TOKEN_STORAGE_KEY)
        if (!stored || !token) {
          setUser(null)
        } else {
          try {
            setUser(JSON.parse(stored))
          } catch {
            // Suppressed invalid storage payload
          }
        }
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const saveSession = useCallback((userAccount: DemoUserAccount, accessToken: string, rememberMe: boolean = true) => {
    if (rememberMe) {
      sessionStorage.removeItem(USER_STORAGE_KEY)
      sessionStorage.removeItem(TOKEN_STORAGE_KEY)
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userAccount))
      localStorage.setItem(TOKEN_STORAGE_KEY, accessToken)
    } else {
      localStorage.removeItem(USER_STORAGE_KEY)
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userAccount))
      sessionStorage.setItem(TOKEN_STORAGE_KEY, accessToken)
    }
    setUser(userAccount)
  }, [])

  const login = useCallback(
    async (email: string, password?: string, rememberMe: boolean = true): Promise<DemoUserAccount> => {
      const cleanEmail = email.trim()
      const cleanPw = password || 'password123'

      const res = await authService.login({
        email: cleanEmail,
        password: cleanPw,
      })

      const primaryRole = normalizeBackendRole(res.user.roles)
      const authenticatedUser: DemoUserAccount = {
        id: res.user.id,
        role: primaryRole,
        label: primaryRole.charAt(0).toUpperCase() + primaryRole.slice(1),
        icon: primaryRole === 'surveyor' ? '📹' : primaryRole === 'reviewer' ? '⚖️' : '🚗',
        email: res.user.email,
        name: res.user.fullName || res.user.email.split('@')[0],
        avatar: (res.user as any).avatarUrl || undefined,
        credits: 0,
        trustScore: 90,
        joinDate: new Date().toLocaleDateString('vi-VN'),
      }

      saveSession(authenticatedUser, res.accessToken, rememberMe)
      return authenticatedUser
    },
    [saveSession]
  )

  const register = useCallback(
    async (payload: AuthRegisterPayload, rememberMe: boolean = true): Promise<DemoUserAccount> => {
      const res = await authService.register(payload)
      const primaryRole = 'surveyor'
      const registeredUser: DemoUserAccount = {
        id: res.user.id,
        role: primaryRole,
        label: 'Surveyor',
        icon: '📹',
        email: res.user.email,
        name: res.user.fullName,
        avatar: (res.user as any).avatarUrl || undefined,
        credits: 50,
        trustScore: 80,
        joinDate: new Date().toLocaleDateString('vi-VN'),
      }

      saveSession(registeredUser, res.accessToken, rememberMe)
      return registeredUser
    },
    [saveSession]
  )

  const loginWithGoogleToken = useCallback(
    async (idToken: string, rememberMe: boolean = true): Promise<DemoUserAccount> => {
      const res = await authService.googleTokenLogin(idToken)
      const primaryRole = normalizeBackendRole(res.user.roles)
      const googleUser: DemoUserAccount = {
        id: res.user.id,
        role: primaryRole,
        label: primaryRole.charAt(0).toUpperCase() + primaryRole.slice(1),
        icon: primaryRole === 'surveyor' ? '📹' : primaryRole === 'reviewer' ? '⚖️' : '🚗',
        email: res.user.email,
        name: res.user.fullName || res.user.email.split('@')[0],
        avatar: (res.user as any).avatarUrl || undefined,
        credits: 0,
        trustScore: 90,
        joinDate: new Date().toLocaleDateString('vi-VN'),
      }

      saveSession(googleUser, res.accessToken, rememberMe)
      return googleUser
    },
    [saveSession]
  )

  const logout = useCallback((redirectTo: string = '/') => {
    authService.logout()
    setUser(null)
    if (redirectTo) {
      window.location.replace(redirectTo)
    }
  }, [])

  const updateProfile = useCallback(async (updatedData: Partial<DemoUserAccount>): Promise<void> => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY) || sessionStorage.getItem(TOKEN_STORAGE_KEY)
    if (token && (updatedData.name !== undefined || updatedData.phone !== undefined || updatedData.avatar !== undefined)) {
      await authService.updateMe({
        fullName: updatedData.name,
        phone: updatedData.phone,
        avatarUrl: updatedData.avatar,
      })
    }

    setUser((prev) => {
      if (!prev) return null
      const updated = { ...prev, ...updatedData }
      const isLocal = !!localStorage.getItem(TOKEN_STORAGE_KEY)
      const storage = isLocal ? localStorage : sessionStorage
      storage.setItem(USER_STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const claimDailyBonus = useCallback((amount: number = 25): number => {
    let newCredits = 0
    setUser((prev) => {
      if (!prev) return null
      newCredits = (prev.credits || 0) + amount
      const updated = { ...prev, credits: newCredits }
      const isLocal = !!localStorage.getItem(TOKEN_STORAGE_KEY)
      const storage = isLocal ? localStorage : sessionStorage
      storage.setItem(USER_STORAGE_KEY, JSON.stringify(updated))
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
        register,
        loginWithGoogleToken,
        logout,
        updateProfile,
        claimDailyBonus,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to access current authentication state and actions in Community Portal.
 * @throws Error if invoked outside of AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

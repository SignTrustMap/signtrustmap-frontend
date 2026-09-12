import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { User, AuthState } from '@/types/auth'
import { http } from '@/api/client'
import { API_ENDPOINTS } from '@/api/endpoints'

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

interface LoginResponse {
  user: {
    id: string
    email: string
    fullName: string
    roles: string[]
  }
  accessToken: string
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const token = localStorage.getItem('stm_access_token')
    const savedUser = localStorage.getItem('stm_user')
    if (token && savedUser) {
      try {
        return {
          user: JSON.parse(savedUser),
          isLoading: false,
          isAuthenticated: true,
        }
      } catch {
        return { user: null, isLoading: false, isAuthenticated: false }
      }
    }
    return { user: null, isLoading: false, isAuthenticated: false }
  })

  useEffect(() => {
    const token = localStorage.getItem('stm_access_token')
    if (token && !state.user) {
      http.get<any>(API_ENDPOINTS.AUTH.ME)
        .then((profile) => {
          const u = profile?.data || profile
          if (u) {
            const isAdmin = Array.isArray(u.roles)
              ? u.roles.includes('ADMIN')
              : String(u.role).toLowerCase() === 'admin'
            const user: User = {
              id: String(u.id),
              name: u.fullName || u.email,
              email: u.email,
              role: isAdmin ? 'admin' : 'staff',
            }
            localStorage.setItem('stm_user', JSON.stringify(user))
            setState({ user, isLoading: false, isAuthenticated: true })
          }
        })
        .catch(() => {
          localStorage.removeItem('stm_access_token')
          localStorage.removeItem('stm_user')
          setState({ user: null, isLoading: false, isAuthenticated: false })
        })
    }
  }, [state.user])

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, isLoading: true }))
    try {
      const res = await http.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, { email, password })
      const token = res.accessToken
      const roles = res.user?.roles || []
      const isAdmin = roles.includes('ADMIN') || email.toLowerCase().includes('admin')
      const user: User = {
        id: String(res.user?.id || '1'),
        name: res.user?.fullName || email,
        email,
        role: isAdmin ? 'admin' : 'staff',
      }
      localStorage.setItem('stm_access_token', token)
      localStorage.setItem('stm_user', JSON.stringify(user))
      setState({ user, isLoading: false, isAuthenticated: true })
    } catch {
      setState((s) => ({ ...s, isLoading: false }))
      throw new Error('Sai tên đăng nhập hoặc mật khẩu')
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('stm_access_token')
    localStorage.removeItem('stm_refresh_token')
    localStorage.removeItem('stm_user')
    setState({ user: null, isLoading: false, isAuthenticated: false })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

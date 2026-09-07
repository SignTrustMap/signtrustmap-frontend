import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { User, AuthState } from '@/types/auth'

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Mock login — replace with real API call ─────────────────────
async function mockLogin(email: string, _password: string): Promise<User> {
  await new Promise((r) => setTimeout(r, 800)) // simulate network

  // Mock: admin@... → admin role, anything else → staff
  const isAdmin = email.toLowerCase().includes('admin')
  return {
    id: '1',
    name: isAdmin ? 'Admin User' : 'Staff User',
    email,
    role: isAdmin ? 'admin' : 'staff',
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: false,
    isAuthenticated: false,
  })

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, isLoading: true }))
    try {
      const user = await mockLogin(email, password)
      setState({ user, isLoading: false, isAuthenticated: true })
      // In production: server sets httpOnly cookie, client reads role from /auth/me
    } catch {
      setState((s) => ({ ...s, isLoading: false }))
      throw new Error('Sai tên đăng nhập hoặc mật khẩu')
    }
  }, [])

  const logout = useCallback(() => {
    setState({ user: null, isLoading: false, isAuthenticated: false })
    // In production: call POST /auth/logout to clear httpOnly cookie
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

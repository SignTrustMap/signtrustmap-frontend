import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import type { ReactNode } from 'react'

// ─── AuthGuard: requires login ────────────────────────────────────
export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <div className="min-h-screen bg-[#F8F7F7]" />

  if (!isAuthenticated) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />
  }

  return <>{children}</>
}

// ─── AdminGuard: strictly requires admin role ─────────────────────
export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <div className="min-h-screen bg-[#F8F7F7]" />

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // If logged in as staff, redirect away from Admin module
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

// ─── StaffGuard: strictly requires staff role ─────────────────────
export function StaffGuard({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <div className="min-h-screen bg-[#F8F7F7]" />

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // If logged in as admin, redirect away from Staff operations
  if (user?.role !== 'staff') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import type { ReactNode } from 'react'
import NotAllowedPage from './NotAllowedPage'

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

  // If logged in as staff or non-admin, render in-place 403 screen (no toast, URL preserved)
  if (user?.role !== 'admin') {
    return <NotAllowedPage />
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

  // If logged in as admin or non-staff, render in-place 403 screen (no toast, URL preserved)
  if (user?.role !== 'staff') {
    return <NotAllowedPage />
  }

  return <>{children}</>
}


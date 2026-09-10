import { useEffect, useRef } from 'react'
import { Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'

export function AccessDeniedRedirect({
  to = '/',
  reason,
}: {
  to?: string
  reason: 'sod_admin_on_staff' | 'staff_on_admin'
}) {
  const { warning } = useToast()
  const { t } = useTranslation('ops')
  const navigate = useNavigate()
  const hasFired = useRef(false)

  useEffect(() => {
    if (hasFired.current) return
    hasFired.current = true

    if (reason === 'sod_admin_on_staff') {
      warning(
        t('not_allowed.toast_sod_desc'),
        t('not_allowed.toast_sod_title'),
        5500,
        {
          label: t('not_allowed.toast_go_escalations'),
          onClick: () => navigate('/escalations'),
        }
      )
    } else {
      warning(
        t('not_allowed.toast_admin_desc'),
        t('not_allowed.toast_admin_title'),
        5500,
        {
          label: t('not_allowed.toast_go_candidates'),
          onClick: () => navigate('/candidates'),
        }
      )
    }
  }, [warning, t, navigate, reason])

  return <Navigate to={to} replace />
}

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

  // If logged in as staff or non-admin, redirect to / with warning toast
  if (user?.role !== 'admin') {
    return <AccessDeniedRedirect reason="staff_on_admin" />
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

  // If logged in as admin or non-staff, redirect to / with SoD warning toast
  if (user?.role !== 'staff') {
    return <AccessDeniedRedirect reason="sod_admin_on_staff" />
  }

  return <>{children}</>
}


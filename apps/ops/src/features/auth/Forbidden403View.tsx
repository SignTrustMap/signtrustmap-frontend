import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { useTranslation } from 'react-i18next'
import {
  LockKey,
  Scales,
  ArrowRight,
  House,
  ShieldCheck,
  CheckSquareOffset,
  Coins,
} from '@phosphor-icons/react'

interface Forbidden403ViewProps {
  requiredRole?: 'admin' | 'staff'
  reason?: 'sod_admin_on_staff' | 'staff_on_admin'
}

export default function Forbidden403View({ requiredRole, reason }: Forbidden403ViewProps) {
  const { user } = useAuth()
  const { t } = useTranslation('ops')

  const isAdminAccessingStaff = reason === 'sod_admin_on_staff' || (user?.role === 'admin' && requiredRole === 'staff')
  const isStaffAccessingAdmin = reason === 'staff_on_admin' || (user?.role === 'staff' && requiredRole === 'admin')

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-[#071317] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Top accent badge */}
        <div className="flex items-center justify-between gap-2 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            {isAdminAccessingStaff ? (
              <>
                <Scales size={14} weight="bold" />
                <span>{t('not_allowed.badge_sod')}</span>
              </>
            ) : (
              <>
                <LockKey size={14} weight="bold" />
                <span>{t('not_allowed.badge_forbidden')}</span>
              </>
            )}
          </div>
          <span className="font-mono text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            HTTP 403
          </span>
        </div>

        {/* Icon & Title */}
        <div className="mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {isAdminAccessingStaff
              ? t('not_allowed.admin_on_staff_title')
              : isStaffAccessingAdmin
              ? t('not_allowed.staff_on_admin_title')
              : t('not_allowed.title')}
          </h1>
        </div>

        {/* Descriptive message */}
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
          {isAdminAccessingStaff
            ? t('not_allowed.admin_on_staff_desc')
            : isStaffAccessingAdmin
            ? t('not_allowed.staff_on_admin_desc')
            : t('not_allowed.desc')}
        </p>

        {/* Account context pill */}
        {user && (
          <div className="flex items-center justify-between text-xs bg-[#F8F7F7] dark:bg-[#030708] border border-[#E8E4E3] dark:border-white/10 rounded-xl px-3.5 py-2.5 mb-6">
            <span className="text-gray-500 dark:text-gray-400">{t('not_allowed.account')}:</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-800 dark:text-gray-200">{user.email}</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#007b8b]/10 dark:bg-[#00c4de]/10 text-[#007b8b] dark:text-[#00c4de] uppercase border border-[#007b8b]/20 dark:border-[#00c4de]/20">
                {user.role}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons based on context */}
        <div className="space-y-2.5">
          {isAdminAccessingStaff ? (
            <>
              <Link
                to="/escalations"
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold rounded-xl text-white bg-[#007b8b] hover:bg-[#006272] transition-colors shadow-sm"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck size={16} weight="bold" />
                  {t('not_allowed.btn_go_escalations')}
                </span>
                <ArrowRight size={14} weight="bold" />
              </Link>
              <Link
                to="/credits/rules"
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-xl text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-[#E8E4E3] dark:border-white/10 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Coins size={16} />
                  {t('not_allowed.btn_go_rules')}
                </span>
                <ArrowRight size={14} />
              </Link>
            </>
          ) : isStaffAccessingAdmin ? (
            <>
              <Link
                to="/candidates"
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold rounded-xl text-white bg-[#007b8b] hover:bg-[#006272] transition-colors shadow-sm"
              >
                <span className="flex items-center gap-2">
                  <CheckSquareOffset size={16} weight="bold" />
                  {t('not_allowed.btn_go_candidates')}
                </span>
                <ArrowRight size={14} weight="bold" />
              </Link>
              <Link
                to="/credits"
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-xl text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-[#E8E4E3] dark:border-white/10 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Coins size={16} />
                  {t('not_allowed.btn_go_credits')}
                </span>
                <ArrowRight size={14} />
              </Link>
            </>
          ) : null}

          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors pt-2"
          >
            <House size={14} />
            {t('not_allowed.btn_go_dashboard')}
          </Link>
        </div>
      </div>
    </div>
  )
}

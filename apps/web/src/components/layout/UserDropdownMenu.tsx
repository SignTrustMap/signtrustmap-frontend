import { Link } from 'react-router-dom'
import {
  BookOpen,
  VideoCamera,
  Clock,
  Coins,
  ShieldCheck,
  UserCircle,
  SignOut,
  FileText,
  CheckCircle,
  ArrowSquareOut,
} from '@phosphor-icons/react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useTranslation } from 'react-i18next'
import { opsPortalUrl } from '@/config/env'

interface UserDropdownMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function UserDropdownMenu({ isOpen, onClose }: UserDropdownMenuProps) {
  const { user, logout } = useAuth()
  const { isDark } = useTheme()
  const { t } = useTranslation('common')

  if (!isOpen || !user) return null

  // High-contrast role badge styles matching ProfilePage
  const getRoleBadgeStyle = (role?: string) => {
    const r = (role || '').trim().toLowerCase()
    switch (r) {
      case 'admin':
        return {
          label: t('profile.roles.admin'),
          bg: isDark
            ? 'bg-purple-900/40 text-purple-200 border-purple-500/50'
            : 'bg-purple-100 text-purple-900 border-purple-300',
        }
      case 'staff':
        return {
          label: t('profile.roles.staff'),
          bg: isDark
            ? 'bg-blue-900/40 text-blue-200 border-blue-500/50'
            : 'bg-blue-100 text-blue-900 border-blue-300',
        }
      case 'reviewer':
        return {
          label: t('profile.roles.reviewer'),
          bg: isDark
            ? 'bg-emerald-900/40 text-emerald-200 border-emerald-500/50'
            : 'bg-emerald-100 text-emerald-900 border-emerald-300',
        }
      case 'surveyor':
        return {
          label: t('profile.roles.surveyor'),
          bg: isDark
            ? 'bg-amber-900/40 text-amber-200 border-amber-500/50'
            : 'bg-amber-100 text-amber-950 border-amber-300',
        }
      default:
        return {
          label: t('profile.roles.driver'),
          bg: isDark
            ? 'bg-cyan-900/40 text-cyan-200 border-cyan-500/50'
            : 'bg-cyan-100 text-cyan-950 border-cyan-300',
        }
    }
  }

  const roleInfo = getRoleBadgeStyle(user.role)

  const getRoleNavLinks = () => {
    const r = (user.role || '').trim().toLowerCase()
    switch (r) {
      case 'surveyor':
        return [
          {
            label: t('nav.survey_studio'),
            href: '/survey',
            icon: <VideoCamera size={18} weight="duotone" className="text-amber-500 dark:text-amber-400" />,
          },
          {
            label: t('nav.survey_history'),
            href: '/survey/history',
            icon: <Clock size={18} weight="duotone" className="text-[#007b8b] dark:text-[#00c4de]" />,
          },
          {
            label: t('nav.catalog'),
            href: '/catalog',
            icon: <BookOpen size={18} weight="duotone" className="text-purple-600 dark:text-purple-400" />,
          },
          {
            label: t('nav.wallet'),
            href: '/wallet',
            icon: <Coins size={18} weight="duotone" className="text-amber-500 dark:text-amber-400" />,
          },
        ]

      case 'reviewer':
        return [
          {
            label: t('nav.review_queue'),
            href: '/review',
            icon: <CheckCircle size={18} weight="duotone" className="text-emerald-600 dark:text-emerald-400" />,
          },
          {
            label: t('nav.catalog'),
            href: '/catalog',
            icon: <BookOpen size={18} weight="duotone" className="text-purple-600 dark:text-purple-400" />,
          },
          {
            label: t('nav.wallet'),
            href: '/wallet',
            icon: <Coins size={18} weight="duotone" className="text-amber-500 dark:text-amber-400" />,
          },
        ]

      case 'staff':
      case 'admin':
        return [
          {
            label: t('profile.workspace_ops_title'),
            href: `${opsPortalUrl}/overview`,
            isExternal: true,
            icon: <ShieldCheck size={18} weight="duotone" className="text-blue-500 dark:text-blue-400" />,
          },
          {
            label: t('nav.catalog'),
            href: '/catalog',
            icon: <BookOpen size={18} weight="duotone" className="text-purple-600 dark:text-purple-400" />,
          },
          {
            label: t('nav.docs'),
            href: '/docs',
            icon: <FileText size={18} weight="duotone" className="text-blue-600 dark:text-blue-400" />,
          },
        ]

      default: // Driver
        return [
          {
            label: t('nav.catalog'),
            href: '/catalog',
            icon: <BookOpen size={18} weight="duotone" className="text-purple-600 dark:text-purple-400" />,
          },
          {
            label: t('nav.wallet'),
            href: '/wallet',
            icon: <Coins size={18} weight="duotone" className="text-amber-500 dark:text-amber-400" />,
          },
        ]
    }
  }

  const roleLinks = getRoleNavLinks()

  return (
    <div
      className={`absolute right-0 top-full mt-2 w-80 sm:w-84 rounded-2xl border shadow-xl overflow-hidden z-50 animate-fadeIn transition-all select-none ${
        isDark
          ? 'bg-[#071317] border-white/10 text-white shadow-2xl shadow-black/80 ring-1 ring-white/10'
          : 'bg-white border-[#E8E4E3] text-gray-900 shadow-xl ring-1 ring-black/5'
      }`}
    >
      {/* ─── Header: User Profile Card ─── */}
      <div className={`p-4 border-b ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-100 bg-gray-50/70'}`}>
        <div className="flex items-center gap-3">
          {/* Avatar with Status Dot */}
          <div className="relative shrink-0">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-[#00c4de] shadow-xs"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#007b8b]/15 text-[#007b8b] dark:text-[#00c4de] flex items-center justify-center font-extrabold text-base border-2 border-[#00c4de]">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Name, Email & Role */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                {user.name}
              </h4>
              <span className={`shrink-0 py-0.5 px-2 rounded-full border text-[10px] font-bold leading-tight ${roleInfo.bg}`}>
                {roleInfo.label}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
              {user.email}
            </p>
          </div>
        </div>

        {/* Quick Stats Pill (Credits & Trust Score) */}
        {user.role !== 'staff' && user.role !== 'admin' && (
          <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-white/10 text-xs">
            <Link
              to="/wallet"
              onClick={onClose}
              className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            >
              <Coins size={15} weight="fill" className="text-amber-500 shrink-0" />
              <span className="font-extrabold text-amber-700 dark:text-amber-400">
                {user.credits || 0} Credits
              </span>
            </Link>

            <span className="text-gray-300 dark:text-white/20">•</span>

            <div className="flex items-center gap-1.5">
              <ShieldCheck size={15} weight="fill" className="text-emerald-500 shrink-0" />
              <span className="font-bold text-emerald-800 dark:text-emerald-300">
                {user.trustScore || 100}% {t('user_menu.trust_score')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ─── Body: Single-Column Navigation List ─── */}
      <div className="py-2 px-2 space-y-0.5">
        {/* Profile / Account link */}
        <Link
          to="/profile"
          onClick={onClose}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
            isDark
              ? 'hover:bg-white/5 text-gray-200 hover:text-white'
              : 'hover:bg-gray-100 text-gray-800 hover:text-gray-900'
          }`}
        >
          <UserCircle size={18} weight="duotone" className="text-[#007b8b] dark:text-[#00c4de] shrink-0" />
          <span className="truncate">{t('user_menu.profile_security')}</span>
        </Link>

        {/* Role links (no truncation, spacious row) */}
        {roleLinks.map((item) => {
          if (item.isExternal) {
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isDark
                    ? 'hover:bg-white/5 text-gray-200 hover:text-white'
                    : 'hover:bg-gray-100 text-gray-800 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <span className="shrink-0">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </div>
                <ArrowSquareOut size={15} className="text-gray-400 shrink-0 ml-2" />
              </a>
            )
          }

          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isDark
                  ? 'hover:bg-white/5 text-gray-200 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-800 hover:text-gray-900'
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </div>

      {/* ─── Footer: Sign Out Button ─── */}
      <div className={`p-2 border-t ${isDark ? 'border-white/10 bg-white/[0.01]' : 'border-gray-100 bg-gray-50/50'}`}>
        <button
          type="button"
          onClick={() => {
            onClose()
            logout('/')
          }}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer text-left ${
            isDark
              ? 'text-red-400 hover:bg-red-500/10'
              : 'text-red-600 hover:bg-red-50'
          }`}
        >
          <SignOut size={18} weight="bold" />
          <span>{t('user_menu.sign_out')}</span>
        </button>
      </div>
    </div>
  )
}

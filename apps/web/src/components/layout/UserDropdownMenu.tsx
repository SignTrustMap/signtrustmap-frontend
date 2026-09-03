import { Link, useNavigate } from 'react-router-dom'
import {
  MapPin,
  BookOpen,
  VideoCamera,
  Clock,
  Coins,
  ShieldCheck,
  UserCircle,
  SignOut,
  FileText,
  CheckCircle,
} from '@phosphor-icons/react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useTranslation } from 'react-i18next'

interface UserDropdownMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function UserDropdownMenu({ isOpen, onClose }: UserDropdownMenuProps) {
  const { user, logout } = useAuth()
  const { isDark } = useTheme()
  const { t } = useTranslation('common')
  const navigate = useNavigate()

  if (!isOpen || !user) return null

  const getRoleBadgeStyle = (role: string) => {
    const r = (role || '').trim().toLowerCase()
    switch (r) {
      case 'admin':
        return {
          label: 'Admin',
          bg: isDark
            ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
            : 'bg-purple-50 text-purple-700 border-purple-200',
        }
      case 'staff':
        return {
          label: 'Staff',
          bg: isDark
            ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
            : 'bg-blue-50 text-blue-700 border-blue-200',
        }
      case 'reviewer':
        return {
          label: 'Reviewer',
          bg: isDark
            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
            : 'bg-emerald-50 text-emerald-700 border-emerald-200',
        }
      case 'surveyor':
        return {
          label: 'Surveyor',
          bg: isDark
            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
            : 'bg-amber-50 text-amber-700 border-amber-200',
        }
      default:
        return {
          label: 'Driver',
          bg: isDark
            ? 'bg-[#00c4de]/15 text-[#00c4de] border-[#00c4de]/30'
            : 'bg-teal-50 text-[#007b8b] border-teal-200',
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
            label: t('nav.map'),
            href: '/product/map',
            icon: <MapPin size={18} weight="duotone" className="text-emerald-600 dark:text-emerald-400" />,
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
            label: t('nav.survey_studio'),
            href: '/survey',
            icon: <VideoCamera size={18} weight="duotone" className="text-amber-500 dark:text-amber-400" />,
          },
          {
            label: t('nav.map'),
            href: '/product/map',
            icon: <MapPin size={18} weight="duotone" className="text-[#007b8b] dark:text-[#00c4de]" />,
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
            label: t('nav.map'),
            href: '/product/map',
            icon: <MapPin size={18} weight="duotone" className="text-[#007b8b] dark:text-[#00c4de]" />,
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
            label: t('nav.map'),
            href: '/product/map',
            icon: <MapPin size={18} weight="duotone" className="text-emerald-600 dark:text-emerald-400" />,
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
    }
  }

  const roleLinks = getRoleNavLinks()

  return (
    <div
      className={`absolute right-0 top-full mt-2 w-84 sm:w-96 rounded-[18px] border shadow-2xl overflow-hidden z-50 animate-fadeIn transition-all select-none backdrop-blur-2xl ${
        isDark
          ? 'bg-[#061215]/98 border-white/10 text-white shadow-black/80 ring-1 ring-white/10'
          : 'bg-white/98 border-[#E8E4E3] text-gray-900 shadow-xl shadow-gray-400/20 ring-1 ring-black/5'
      }`}
    >
      {/* ─── Header: User Info & Controls ─── */}
      <div className={`p-4 border-b ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-[#E8E4E3] bg-[#F8F7F7]/80'}`}>
        <div className="flex items-center justify-between gap-3">
          {/* Left: Avatar + Full Name */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative shrink-0">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className={`w-11 h-11 rounded-full object-cover border-2 shadow-xs ${
                    isDark ? 'border-[#00c4de]' : 'border-[#007b8b]'
                  }`}
                />
              ) : (
                <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm ${
                  isDark ? 'bg-[#00c4de]/20 text-[#00c4de]' : 'bg-[#007b8b]/15 text-[#007b8b]'
                }`}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#061215]" />
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm sm:text-[15px] text-gray-900 dark:text-white leading-snug break-words">
                {user.name}
              </h4>
            </div>
          </div>

          {/* Right: Stacked Role Badge (Top) & Account Info (Bottom) */}
          <div className="flex flex-col items-stretch gap-1.5 shrink-0 w-28 sm:w-32">
            <div className={`py-1 px-2.5 rounded-full border text-[11px] font-semibold text-center leading-none ${roleInfo.bg}`}>
              {roleInfo.label}
            </div>

            <button
              type="button"
              onClick={() => {
                onClose()
                navigate('/profile')
              }}
              className={`w-full py-1.5 px-2.5 rounded-full border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300 hover:text-white'
                  : 'bg-white hover:bg-gray-100 border-[#E8E4E3] text-gray-700 shadow-xs'
              }`}
            >
              <UserCircle size={15} className={isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'} />
              <span className="truncate">{t('user_menu.profile_security')}</span>
            </button>
          </div>
        </div>

        {/* Stats Row (if community contributor) */}
        {user.role !== 'staff' && user.role !== 'admin' && (
          <div className="grid grid-cols-2 gap-2.5 mt-3 pt-3 border-t border-[#E8E4E3] dark:border-white/10 text-xs">
            {/* Wallet Box */}
            <div className={`p-2.5 rounded-[12px] border flex items-center gap-2.5 ${
              isDark
                ? 'bg-white/[0.03] border-white/10'
                : 'bg-white border-[#E8E4E3] shadow-xs'
            }`}>
              <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 ${
                isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-600'
              }`}>
                <Coins size={18} weight="duotone" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-wider block text-gray-500 dark:text-gray-400 leading-none mb-1">
                  {t('user_menu.wallet_balance')}
                </span>
                <span className="font-bold text-xs sm:text-[13px] text-amber-600 dark:text-amber-400 leading-none block truncate">
                  {user.credits || 0} Credits
                </span>
              </div>
            </div>

            {/* Trust Score Box */}
            <div className={`p-2.5 rounded-[12px] border flex items-center gap-2.5 ${
              isDark
                ? 'bg-white/[0.03] border-white/10'
                : 'bg-white border-[#E8E4E3] shadow-xs'
            }`}>
              <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 ${
                isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
              }`}>
                <ShieldCheck size={18} weight="duotone" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-wider block text-gray-500 dark:text-gray-400 leading-none mb-1">
                  {t('user_menu.trust_score')}
                </span>
                <span className="font-bold text-xs sm:text-[13px] text-emerald-600 dark:text-emerald-400 leading-none block truncate">
                  {user.trustScore || 100}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Body: 2-Column Grid of Navigation Links ─── */}
      <div className="p-3.5">
        <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 px-1">
          {t('user_menu.title_capabilities')}:
        </p>

        <div className="grid grid-cols-2 gap-2">
          {roleLinks.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={onClose}
              className={`flex items-center gap-2.5 p-2.5 rounded-[12px] border transition-all ${
                isDark
                  ? 'bg-white/[0.02] hover:bg-white/[0.06] border-white/5 hover:border-[#00c4de]/40 text-gray-200 hover:text-white'
                  : 'bg-white hover:bg-teal-50/60 border-[#E8E4E3] hover:border-[#007b8b]/40 text-gray-800 shadow-xs'
              }`}
            >
              <div className="shrink-0">{item.icon}</div>
              <span className="text-xs font-semibold truncate leading-tight">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ─── Footer: Sign Out Button ─── */}
      <div className={`p-2.5 border-t ${isDark ? 'border-white/10 bg-white/[0.01]' : 'border-[#E8E4E3] bg-[#F8F7F7]/60'}`}>
        <button
          type="button"
          onClick={() => {
            logout()
            onClose()
            navigate('/', { replace: true })
          }}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          <SignOut size={16} />
          <span>{t('user_menu.sign_out')}</span>
        </button>
      </div>
    </div>
  )
}

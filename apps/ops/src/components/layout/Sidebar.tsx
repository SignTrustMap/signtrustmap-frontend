import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { useTranslation } from 'react-i18next'
import {
  MapTrifold,
  SquaresFour,
  Users,
  ShieldCheck,
  ClipboardText,
  SignOut,
  Coins,
  CurrencyCircleDollar,
  CheckSquare,
  BookOpen,
  Question,
  Brain,
  DownloadSimple,
  ShieldWarning,
  SlidersHorizontal,
} from '@phosphor-icons/react'

interface NavSection {
  title: string
  items: {
    icon: React.ReactNode
    label: string
    href: string
    badge?: number
  }[]
}

export function Sidebar() {
  const { user, logout } = useAuth()
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : isAdmin
    ? 'AD'
    : 'MN'

  const displayName = user?.name || (isAdmin ? 'Governance Admin' : 'Minh Nhật')

  // Comprehensive Admin Sections matching registered scope
  const adminNavSections: NavSection[] = [
    {
      title: t('nav.overview'),
      items: [
        {
          icon: <SquaresFour size={18} weight="duotone" />,
          label: t('nav.dashboard'),
          href: '/',
        },
      ],
    },
    {
      title: t('nav.identity_access'),
      items: [
        {
          icon: <Users size={18} weight="duotone" />,
          label: t('nav.users'),
          href: '/users',
        },
        {
          icon: <ShieldCheck size={18} weight="duotone" />,
          label: t('nav.roles'),
          href: '/roles',
        },
      ],
    },
    {
      title: t('nav.governance'),
      items: [
        {
          icon: <BookOpen size={18} weight="duotone" />,
          label: t('nav.catalog'),
          href: '/catalog',
        },
        {
          icon: <Question size={18} weight="duotone" />,
          label: t('nav.missing_types'),
          href: '/catalog/missing-types',
          badge: 2,
        },
        {
          icon: <MapTrifold size={18} weight="duotone" />,
          label: t('nav.spatial_data'),
          href: '/spatial-data',
        },
        {
          icon: <ShieldWarning size={18} weight="duotone" />,
          label: t('nav.escalations'),
          href: '/escalations',
          badge: 2,
        },
      ],
    },
    {
      title: t('nav.economy'),
      items: [
        {
          icon: <Coins size={18} weight="duotone" />,
          label: t('nav.credit_rules'),
          href: '/credits/rules',
        },
        {
          icon: <CurrencyCircleDollar size={18} weight="duotone" />,
          label: t('nav.payments'),
          href: '/credits/payments',
        },
      ],
    },
    {
      title: t('nav.ai_mlops'),
      items: [
        {
          icon: <Brain size={18} weight="duotone" />,
          label: t('nav.mlops'),
          href: '/mlops',
        },
      ],
    },
    {
      title: t('nav.data'),
      items: [
        {
          icon: <DownloadSimple size={18} weight="duotone" />,
          label: t('nav.exports'),
          href: '/exports',
        },
      ],
    },
    {
      title: t('nav.system'),
      items: [
        {
          icon: <SlidersHorizontal size={18} weight="duotone" />,
          label: t('nav.settings'),
          href: '/settings',
        },
        {
          icon: <ClipboardText size={18} weight="duotone" />,
          label: t('nav.audit'),
          href: '/audit-logs',
        },
      ],
    },
  ]

  // Staff Sections
  const staffNavSections: NavSection[] = [
    {
      title: t('nav.overview'),
      items: [
        {
          icon: <SquaresFour size={18} weight="duotone" />,
          label: t('nav.dashboard_ops'),
          href: '/',
        },
        {
          icon: <ShieldWarning size={18} weight="duotone" />,
          label: t('nav.candidates'),
          href: '/candidates',
          badge: 4,
        },
        {
          icon: <MapTrifold size={18} weight="duotone" />,
          label: t('nav.map'),
          href: '/map',
        },
        {
          icon: <CheckSquare size={18} weight="duotone" />,
          label: t('nav.tasks'),
          href: '/tasks',
          badge: 3,
        },
        {
          icon: <BookOpen size={18} weight="duotone" />,
          label: t('nav.catalog'),
          href: '/catalog',
        },
        {
          icon: <CurrencyCircleDollar size={18} weight="duotone" />,
          label: t('nav.credits'),
          href: '/credits',
        },
      ],
    },
  ]

  const currentSections = isAdmin ? adminNavSections : staffNavSections

  const linkClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3 py-2 rounded-[10px] text-xs sm:text-[13px] font-medium transition-colors ${
      isActive
        ? 'bg-[#d3f7ff] text-[#007b8b] dark:bg-[#00c4de]/15 dark:text-[#00c4de] font-bold shadow-xs'
        : 'text-gray-600 dark:text-gray-400 hover:bg-[#F8F7F7] dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
    }`

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="flex flex-col w-64 shrink-0 border-r border-[#E8E4E3] dark:border-white/10 bg-white dark:bg-[#071317] h-full shadow-xs transition-colors">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-[#E8E4E3] dark:border-white/10">
        <img
          src="/brand/brand_logo_nobg.svg"
          alt="SignTrustMap Logo"
          className="w-8 h-8 object-contain shrink-0"
        />
        <div className="leading-tight min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-white truncate font-brand">
            Sign<span className="text-[#007b8b] dark:text-[#00c4de]">Trust</span>Map
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate font-mono">
            {isAdmin ? t('nav.admin_portal') : t('nav.ops_portal')}
          </p>
        </div>
      </div>

      {/* ─── Nav List ────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-4">
        {currentSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono">
              {section.title}
            </p>
            {section.items.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end
                className={({ isActive }) => linkClass(isActive)}
              >
                <span className="text-current shrink-0">{item.icon}</span>
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge ? (
                  <span className="shrink-0 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#007b8b] text-white text-[10px] font-bold px-1">
                    {item.badge}
                  </span>
                ) : null}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* ─── Bottom User Profile & Sign Out ─────────────────────── */}
      <div className="p-3 border-t border-[#E8E4E3] dark:border-white/10">
        <div className="p-3 rounded-2xl bg-[#F4F4F4] dark:bg-[#0C1D23] border border-transparent dark:border-white/10 transition-colors flex flex-col gap-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-xs ${
                isAdmin ? 'bg-[#7c3aed]' : 'bg-[#007b8b]'
              }`}
            >
              {userInitials}
            </div>
            <div className="min-w-0 flex-1 leading-snug">
              <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate" title={displayName}>
                {displayName}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                {isAdmin ? t('nav.admin_portal') : t('nav.ops_portal')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-1.5 px-3 rounded-xl bg-white dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-500/15 border border-gray-200/80 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <SignOut size={14} weight="bold" />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </div>
    </aside>
  )
}

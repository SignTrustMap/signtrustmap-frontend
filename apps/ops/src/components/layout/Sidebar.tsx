import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { useTranslation } from 'react-i18next'
import { useSidebar } from '@/context/SidebarContext'
import {
  MapTrifold,
  SquaresFour,
  Users,
  ShieldCheck,
  ClipboardText,
  Coins,
  CurrencyCircleDollar,
  CheckSquare,
  BookOpen,
  Question,
  Brain,
  DownloadSimple,
  ShieldWarning,
  SlidersHorizontal,
  CaretUp,
} from '@phosphor-icons/react'
import { UserDropdownMenu } from './UserDropdownMenu'
import { ProfileModal } from './ProfileModal'

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
  const { user } = useAuth()
  const { t } = useTranslation('common')
  const location = useLocation()
  const { isCollapsed } = useSidebar()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const isAdmin = user?.role === 'admin'

  const userInitials =
    user?.initials ||
    (user?.name
      ? user.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(-2)
          .toUpperCase()
      : isAdmin
      ? 'PĐ'
      : 'NV')

  const displayName = user?.name || (isAdmin ? 'Phan Tài Đức' : 'Nguyễn Long Vũ')

  // Streamlined Admin Sections: 3 clear workflow-oriented groups (matching Staff UI structure)
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
      title: t('nav.personnel_section'),
      items: [
        {
          icon: <ShieldWarning size={18} weight="duotone" />,
          label: t('nav.escalations'),
          href: '/escalations',
          badge: 5,
        },
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
      title: t('nav.governance_ai_section'),
      items: [
        {
          icon: <MapTrifold size={18} weight="duotone" />,
          label: t('nav.map'),
          href: '/map',
        },
        {
          icon: <ClipboardText size={18} weight="duotone" />,
          label: t('nav.catalog'),
          href: '/catalog',
        },
        {
          icon: <SlidersHorizontal size={18} weight="duotone" />,
          label: t('nav.spatial_data'),
          href: '/spatial-data',
        },
        {
          icon: <Brain size={18} weight="duotone" />,
          label: t('nav.mlops'),
          href: '/mlops',
        },
        {
          icon: <Coins size={18} weight="duotone" />,
          label: t('nav.credit_rules'),
          href: '/credits/rules',
        },
        {
          icon: <CheckSquare size={18} weight="duotone" />,
          label: t('nav.audit'),
          href: '/audit-logs',
        },
        {
          icon: <DownloadSimple size={18} weight="duotone" />,
          label: t('nav.exports'),
          href: '/exports',
        },
      ],
    },
  ]

  // Streamlined Staff Sections: 3 clear workflow-oriented groups
  const staffNavSections: NavSection[] = [
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
      title: t('nav.operations_section'),
      items: [
        {
          icon: <ShieldCheck size={18} weight="duotone" />,
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
          icon: <ClipboardText size={18} weight="duotone" />,
          label: t('nav.incident_reports'),
          href: '/reports',
        },
      ],
    },
    {
      title: t('nav.data_catalog_section'),
      items: [
        {
          icon: <BookOpen size={18} weight="duotone" />,
          label: t('nav.catalog'),
          href: '/catalog',
        },
        {
          icon: <Question size={18} weight="duotone" />,
          label: t('nav.new_types'),
          href: '/catalog/new-types',
          badge: 4,
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

  function isItemActive(href: string): boolean {
    const currentPath = location.pathname
    if (href === '/') return currentPath === '/'
    if (currentPath === href) return true
    if (currentPath.startsWith(href + '/')) {
      const allHrefs = currentSections.flatMap((s) => s.items.map((i) => i.href))
      const hasMoreSpecific = allHrefs.some(
        (other) => other !== href && other.startsWith(href) && currentPath.startsWith(other)
      )
      return !hasMoreSpecific
    }
    return false
  }

  const linkClass = (isActive: boolean) =>
    `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-[13px] transition-all duration-150 select-none ${
      isActive
        ? 'bg-[#007b8b]/10 text-[#007b8b] dark:bg-[#00c4de]/15 dark:text-[#00c4de] font-bold shadow-xs'
        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-white/5 font-medium'
    }`

  return (
    <aside
      className={`flex flex-col shrink-0 border-r border-[#E8E4E3] dark:border-white/10 bg-white dark:bg-[#071317] h-full shadow-xs transition-all duration-300 ease-in-out z-20 ${
        isCollapsed ? 'w-[68px]' : 'w-64'
      }`}
    >
      {/* ─── Brand Header ────────────────────────────────────────── */}
      <div
        className={`flex items-center h-16 border-b border-[#E8E4E3] dark:border-white/10 bg-white dark:bg-[#071317] shrink-0 transition-all ${
          isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
        }`}
      >
        {isCollapsed ? (
          <div
            title="SignTrustMap Operations Portal"
            className="w-10 h-10 rounded-xl flex items-center justify-center select-none"
          >
            <img
              src="/brand/brand_logo_nobg.svg"
              alt="SignTrustMap Logo"
              className="w-7 h-7 object-contain"
            />
          </div>
        ) : (
          <div className="flex items-center justify-between w-full min-w-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src="/brand/brand_logo_nobg.svg"
                alt="SignTrustMap Logo"
                className="w-8 h-8 object-contain shrink-0"
              />
              <div className="leading-tight min-w-0">
                <p className="text-sm font-extrabold text-gray-900 dark:text-white truncate font-sans tracking-tight">
                  Sign<span className="text-[#007b8b] dark:text-[#00c4de]">Trust</span>Map
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono truncate">
                  Operations Portal
                </p>
              </div>
            </div>

            <span
              className={`shrink-0 text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-md border uppercase tracking-wider ${
                isAdmin
                  ? 'bg-[#007b8b]/15 text-[#007b8b] dark:bg-[#00c4de]/20 dark:text-[#00c4de] border-[#007b8b]/30 dark:border-[#00c4de]/40'
                  : 'bg-[#007b8b]/10 text-[#007b8b] dark:bg-[#00c4de]/15 dark:text-[#00c4de] border-[#007b8b]/20 dark:border-[#00c4de]/30'
              }`}
            >
              {isAdmin ? t('nav.role_admin') : t('nav.role_staff')}
            </span>
          </div>
        )}
      </div>

      {/* ─── Nav List ────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-2 sm:px-3 py-3 flex flex-col gap-2 scrollbar-none">
        {currentSections.map((section, sIdx) => (
          <div key={section.title} className="space-y-0.5">
            {isCollapsed ? (
              sIdx > 0 && <div className="w-8 h-px bg-gray-200 dark:bg-white/10 mx-auto my-2" />
            ) : (
              <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 font-mono select-none">
                {section.title}
              </p>
            )}

            {section.items.map((item) => {
              const active = isItemActive(item.href)

              if (isCollapsed) {
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={`group relative w-10 h-10 mx-auto flex items-center justify-center rounded-xl transition-all select-none ${
                      active
                        ? 'bg-[#007b8b]/15 text-[#007b8b] dark:bg-[#00c4de]/20 dark:text-[#00c4de] font-bold shadow-xs'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="transition-transform group-hover:scale-110">
                      {item.icon}
                    </span>

                    {/* Badge Dot */}
                    {item.badge ? (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-[#071317]" />
                    ) : null}

                    {/* Floating Tooltip like ChatGPT */}
                    <div className="absolute left-full ml-3 px-2.5 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-semibold rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl">
                      {item.label}
                      {item.badge ? ` (${item.badge})` : ''}
                    </div>
                  </NavLink>
                )
              }

              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={linkClass(active)}
                >
                  {/* Left active accent bar indicator */}
                  {active && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#007b8b] dark:bg-[#00c4de]" />
                  )}
                  <span
                    className={`shrink-0 transition-transform duration-150 group-hover:scale-110 ${
                      active
                        ? 'text-[#007b8b] dark:text-[#00c4de]'
                        : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-200'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge ? (
                    <span
                      className={`shrink-0 min-w-[20px] h-[20px] flex items-center justify-center rounded-full text-[10px] font-mono font-extrabold px-1.5 transition-colors ${
                        active
                          ? 'bg-[#007b8b] text-white dark:bg-[#00c4de] dark:text-[#061115]'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>

      {/* ─── Bottom User Profile Trigger & Dropdown ───────────────── */}
      <div
        className={`p-2.5 border-t border-[#E8E4E3] dark:border-white/10 relative bg-white dark:bg-[#071317] shrink-0 ${
          isCollapsed ? 'flex justify-center' : ''
        }`}
      >
        {/* Dropdown Menu (pops up above the card) */}
        <UserDropdownMenu
          isOpen={isUserMenuOpen}
          onClose={() => setIsUserMenuOpen(false)}
          onOpenProfile={() => setIsProfileOpen(true)}
          className={isCollapsed ? 'absolute left-16 bottom-2 w-56' : 'absolute left-3 right-3 bottom-full mb-2'}
        />

        {/* User Card Trigger Button */}
        {isCollapsed ? (
          <button
            type="button"
            data-user-menu-trigger="true"
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            aria-expanded={isUserMenuOpen}
            aria-haspopup="menu"
            className="w-10 h-10 rounded-full flex items-center justify-center relative cursor-pointer group select-none hover:ring-2 hover:ring-[#007b8b]/30 dark:hover:ring-[#00c4de]/30 transition-all"
            title={`${displayName} (${isAdmin ? 'Admin' : 'Staff'})`}
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={displayName}
                className="w-9 h-9 rounded-full object-cover ring-1 ring-black/10 dark:ring-white/20 shadow-xs"
              />
            ) : (
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-xs ${
                  isAdmin ? 'bg-gradient-to-br from-[#007b8b] to-[#005a66]' : 'bg-[#007b8b]'
                }`}
              >
                {userInitials}
              </div>
            )}

            {/* Floating Tooltip */}
            <div className="absolute left-full ml-3 px-2.5 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-semibold rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl">
              {displayName} • {isAdmin ? 'Admin' : 'Staff'}
            </div>
          </button>
        ) : (
          <button
            type="button"
            data-user-menu-trigger="true"
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            aria-expanded={isUserMenuOpen}
            aria-haspopup="menu"
            className={`w-full p-2 rounded-xl border transition-all flex items-center gap-2.5 text-left cursor-pointer group select-none ${
              isUserMenuOpen
                ? 'bg-[#eef2f5] dark:bg-[#11232a] border-[#007b8b]/30 dark:border-[#00c4de]/40 ring-2 ring-[#007b8b]/10 dark:ring-[#00c4de]/20'
                : 'bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 border-gray-200/70 dark:border-white/10'
            }`}
          >
            <div className="relative shrink-0">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-black/10 dark:ring-white/20 shadow-xs group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-xs group-hover:scale-105 transition-transform ${
                    isAdmin ? 'bg-gradient-to-br from-[#007b8b] to-[#005a66]' : 'bg-[#007b8b]'
                  }`}
                >
                  {userInitials}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 leading-snug">
              <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate" title={displayName}>
                {displayName}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono mt-0.5 font-semibold">
                {isAdmin ? t('nav.role_admin') : t('nav.role_staff')}
              </p>
            </div>

            <CaretUp
              size={14}
              weight="bold"
              className={`text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 shrink-0 transition-transform duration-200 ${
                isUserMenuOpen ? 'rotate-180 text-[#007b8b] dark:text-[#00c4de]' : ''
              }`}
            />
          </button>
        )}
      </div>

      {/* ─── Profile Modal ────────────────────────────────────────── */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </aside>
  )
}

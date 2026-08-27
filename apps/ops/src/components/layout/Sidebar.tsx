import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import {
  MapTrifold,
  SquaresFour,
  Warning,
  Users,
  ShieldCheck,
  ClipboardText,
  GearSix,
  SignOut,
  Flag,
} from '@phosphor-icons/react'

interface NavItem {
  icon: React.ReactNode
  label: string
  href: string
  badge?: number
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { icon: <SquaresFour size={18} weight="duotone" />, label: 'Dashboard', href: '/' },
  { icon: <Users size={18} weight="duotone" />, label: 'Staff Directory', href: '/staff' },
  { icon: <ShieldCheck size={18} weight="duotone" />, label: 'Roles & Permissions', href: '/roles' },
  { icon: <Warning size={18} weight="duotone" />, label: 'Reported Candidates', href: '/candidates', badge: 4 },
  { icon: <Flag size={18} weight="duotone" />, label: 'Missing Signs Reports', href: '/reports', badge: 3 },
  { icon: <ClipboardText size={18} weight="duotone" />, label: 'Audit Logs', href: '/audit-logs' },
  { icon: <MapTrifold size={18} weight="duotone" />, label: 'Bản đồ GIS', href: '/map' },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const userInitials = user?.name ? user.name.slice(0, 2).toUpperCase() : 'SC'

  const linkClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-[8px] text-xs sm:text-sm font-medium transition-colors ${
      isActive
        ? 'bg-[#d3f7ff] text-[#007b8b] font-bold shadow-xs'
        : 'text-gray-600 hover:bg-[#F8F7F7] hover:text-gray-900'
    }`

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="flex flex-col w-60 shrink-0 border-r border-[#E8E4E3] bg-white h-full shadow-xs">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-[#E8E4E3]">
        <div className="w-9 h-9 rounded-xl bg-[#007b8b] text-white flex items-center justify-center font-extrabold text-sm shadow-xs shrink-0 font-sans">
          {userInitials}
        </div>
        <div className="leading-tight min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate font-sans">
            Staff Management
          </p>
          <p className="text-[11px] text-gray-400 truncate font-mono">
            Enterprise Admin
          </p>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === '/'}
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
      </nav>

      {/* Bottom Settings & Log out */}
      <div className="px-3 py-3 border-t border-[#E8E4E3] flex flex-col gap-1">
        <NavLink
          to="/settings"
          className={({ isActive }) => linkClass(isActive)}
        >
          <GearSix size={18} weight="duotone" />
          <span>Settings</span>
        </NavLink>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-[8px] text-xs sm:text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full text-left cursor-pointer"
        >
          <SignOut size={18} weight="duotone" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  )
}

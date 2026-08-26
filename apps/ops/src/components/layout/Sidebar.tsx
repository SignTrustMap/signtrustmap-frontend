import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import {
  MapTrifold,
  SquaresFour,
  CheckSquare,
  Flag,
  Warning,
  CurrencyDollar,
  Users,
  Book,
  GearSix,
  ClipboardText,
  ChartBar,
  SignOut,
} from '@phosphor-icons/react'

interface NavItem {
  icon: React.ReactNode
  label: string
  href: string
  badge?: number
  adminOnly?: boolean
  section?: string
}

const navItems: NavItem[] = [
  // Ops section
  { icon: <MapTrifold size={18} weight="duotone" />, label: 'Bản đồ', href: '/map', section: 'ops' },
  { icon: <SquaresFour size={18} weight="duotone" />, label: 'Dashboard', href: '/', section: 'ops' },
  { icon: <CheckSquare size={18} weight="duotone" />, label: 'Kiểm duyệt', href: '/moderation', badge: 12, section: 'ops' },
  { icon: <Flag size={18} weight="duotone" />, label: 'Vùng khảo sát', href: '/tasks', section: 'ops' },
  { icon: <Warning size={18} weight="duotone" />, label: 'Sự cố biển báo', href: '/reports', badge: 3, section: 'ops' },
  { icon: <CurrencyDollar size={18} weight="duotone" />, label: 'Duyệt thưởng', href: '/credits', badge: 5, section: 'ops' },
  // Admin section
  { icon: <ChartBar size={18} weight="duotone" />, label: 'KPIs & Analytics', href: '/admin', adminOnly: true, section: 'admin' },
  { icon: <Users size={18} weight="duotone" />, label: 'Quản lý User', href: '/admin/users', adminOnly: true, section: 'admin' },
  { icon: <Book size={18} weight="duotone" />, label: 'Danh mục QCVN 41', href: '/admin/catalog', adminOnly: true, section: 'admin' },
  { icon: <GearSix size={18} weight="duotone" />, label: 'Cài đặt hệ thống', href: '/admin/settings', adminOnly: true, section: 'admin' },
  { icon: <ClipboardText size={18} weight="duotone" />, label: 'Audit Logs', href: '/admin/audit-logs', adminOnly: true, section: 'admin' },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'

  const opsItems = navItems.filter((i) => i.section === 'ops')
  const adminItems = navItems.filter((i) => i.section === 'admin')

  const linkClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3 py-2 rounded-[6px] text-sm font-medium transition-colors ${
      isActive
        ? 'bg-[#d3f7ff] text-[#007b8b]'
        : 'text-gray-600 hover:bg-[#F8F7F7] hover:text-gray-900'
    }`

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="flex flex-col w-56 shrink-0 border-r border-[#E8E4E3] bg-white h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-[#E8E4E3]">
        <img
          src="/brand/brand_logo_nobg.svg"
          alt="SignTrustMap Logo"
          className="w-8 h-8 object-contain shrink-0"
        />
        <div className="leading-tight">
          <p className="text-sm font-bold text-gray-900 font-brand">
            Sign<span className="text-[#007b8b]">Trust</span>Map
          </p>
          <p className="text-[10px] text-gray-400 font-mono">
            {isAdmin ? 'Admin Portal' : 'Staff Portal'}
          </p>
        </div>
      </div>



      {/* User info */}
      <div className="px-4 py-3 border-b border-[#E8E4E3]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#007b8b]/15 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-[#007b8b]">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-900 truncate">{user?.name}</p>
            <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-0.5">
        {/* Ops section */}
        <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Vận hành
        </p>
        {opsItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === '/'}
            className={({ isActive }) => linkClass(isActive)}
          >
            {item.icon}
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge ? (
              <span className="shrink-0 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#007b8b] text-white text-[10px] font-bold px-1">
                {item.badge}
              </span>
            ) : null}
          </NavLink>
        ))}

        {/* Admin section — only for admin */}
        {isAdmin && (
          <>
            <p className="px-3 py-1.5 mt-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Admin
            </p>
            {adminItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/admin'}
                className={({ isActive }) => linkClass(isActive)}
              >
                {item.icon}
                <span className="flex-1 truncate">{item.label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-3 border-t border-[#E8E4E3] flex flex-col gap-0.5">
        <NavLink
          to="/settings"
          className={({ isActive }) => linkClass(isActive)}
        >
          <GearSix size={18} weight="duotone" />
          Cài đặt cá nhân
        </NavLink>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-[6px] text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full text-left"
        >
          <SignOut size={18} weight="duotone" />
          Đăng xuất
        </button>
      </div>
    </aside>
  )
}

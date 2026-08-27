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
  CurrencyCircleDollar,
  CheckSquare,
} from '@phosphor-icons/react'

interface NavItem {
  icon: React.ReactNode
  label: string
  href: string
  badge?: number
}

// ─── Staff Only Navigation Items ──────────────────────────────────
const staffNavItems: NavItem[] = [
  { icon: <SquaresFour size={18} weight="duotone" />, label: 'Tổng quan vận hành', href: '/' },
  { icon: <Warning size={18} weight="duotone" />, label: 'Hồ sơ kiểm duyệt', href: '/candidates', badge: 4 },
  { icon: <Flag size={18} weight="duotone" />, label: 'Sự cố biển báo', href: '/reports', badge: 3 },
  { icon: <CheckSquare size={18} weight="duotone" />, label: 'Vùng khảo sát & Tái xác thực', href: '/tasks', badge: 3 },
  { icon: <CurrencyCircleDollar size={18} weight="duotone" />, label: 'Duyệt điểm thưởng', href: '/credits' },
  { icon: <MapTrifold size={18} weight="duotone" />, label: 'Bản đồ biển báo GIS', href: '/map' },
]

// ─── Admin Only Navigation Items ──────────────────────────────────
const adminNavItems: NavItem[] = [
  { icon: <SquaresFour size={18} weight="duotone" />, label: 'Tổng quan hệ thống', href: '/' },
  { icon: <Users size={18} weight="duotone" />, label: 'Quản lý người dùng & nhân sự', href: '/staff' },
  { icon: <ShieldCheck size={18} weight="duotone" />, label: 'Phân quyền hệ thống', href: '/roles' },
  { icon: <GearSix size={18} weight="duotone" />, label: 'Cài đặt hệ thống', href: '/settings' },
  { icon: <ClipboardText size={18} weight="duotone" />, label: 'Nhật ký hoạt động (Audit)', href: '/audit-logs' },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'
  const currentNavItems = isAdmin ? adminNavItems : staffNavItems
  const userInitials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : (isAdmin ? 'AD' : 'MN')

  const displayName = user?.name || (isAdmin ? 'Admin Quản trị' : 'Minh Nhật')

  const linkClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-xs sm:text-sm font-medium transition-colors ${
      isActive
        ? 'bg-[#d3f7ff] text-[#007b8b] font-bold shadow-xs'
        : 'text-gray-600 hover:bg-[#F8F7F7] hover:text-gray-900'
    }`

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="flex flex-col w-64 shrink-0 border-r border-[#E8E4E3] bg-white h-full shadow-xs">
      {/* ─── Top Brand Header ────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-[#E8E4E3]">
        <img
          src="/brand/brand_logo_nobg.svg"
          alt="SignTrustMap Logo"
          className="w-8 h-8 object-contain shrink-0"
        />
        <div className="leading-tight min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate font-brand">
            Sign<span className="text-[#007b8b]">Trust</span>Map
          </p>
          <p className="text-[11px] text-gray-500 truncate font-mono">
            {isAdmin ? 'Cổng quản trị' : 'Cổng vận hành'}
          </p>
        </div>
      </div>

      {/* ─── Nav List ────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
        <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 font-mono">
          {isAdmin ? 'Quản trị Hệ thống' : 'Nghiệp vụ Vận hành'}
        </p>

        {currentNavItems.map((item) => (
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

      {/* ─── Bottom ChatGPT-style User Pill Card ─────────────────── */}
      <div className="p-3 border-t border-[#E8E4E3]">
        <div className="flex items-center justify-between gap-2.5 p-2.5 rounded-2xl bg-[#F4F4F4] hover:bg-[#EBEBEB] transition-colors group">
          {/* Left: Avatar + Name + Subtitle */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs ${
              isAdmin ? 'bg-[#7c3aed]' : 'bg-[#9333ea]'
            }`}>
              {userInitials}
            </div>
            <div className="min-w-0 leading-tight">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {displayName}
              </p>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {isAdmin ? 'Admin' : 'Staff'}
              </p>
            </div>
          </div>

          {/* Right: Pill Logout button matching ChatGPT "Nâng cấp" button */}
          <button
            type="button"
            onClick={handleLogout}
            className="shrink-0 px-3 py-1.5 rounded-full bg-white hover:bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-700 hover:text-red-600 transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center gap-1"
            title="Đăng xuất khỏi hệ thống"
          >
            <SignOut size={13} weight="bold" />
            <span>Thoát</span>
          </button>
        </div>
      </div>
    </aside>
  )
}

import { useLocation } from 'react-router-dom'
import { Bell } from '@phosphor-icons/react'
import { PortalSwitcher } from './PortalSwitcher'

// Map route → breadcrumb label
const ROUTE_LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/map': 'Bản đồ biển báo',
  '/moderation': 'Kiểm duyệt',
  '/tasks': 'Vùng khảo sát',
  '/reports': 'Sự cố biển báo',
  '/credits': 'Duyệt thưởng',
  '/admin': 'KPIs & Analytics',
  '/admin/users': 'Quản lý User',
  '/admin/catalog': 'Danh mục QCVN 41',
  '/admin/settings': 'Cài đặt hệ thống',
  '/admin/audit-logs': 'Audit Logs',
  '/settings': 'Cài đặt cá nhân',
}

export function Topbar() {
  const { pathname } = useLocation()
  const label = ROUTE_LABELS[pathname] ?? 'SignTrustMap Ops'

  return (
    <header className="flex items-center justify-between px-5 h-14 border-b border-[#E8E4E3] bg-white shrink-0">
      {/* Page title */}
      <h1
        className="text-sm font-semibold text-gray-900"
        style={{ fontFamily: 'Public Sans, sans-serif' }}
      >
        {label}
      </h1>

      {/* Right: portal switcher + notification */}
      <div className="flex items-center gap-3">
        <PortalSwitcher />

        <button
          className="relative w-8 h-8 flex items-center justify-center rounded-[6px] text-gray-500 hover:bg-[#F8F7F7] hover:text-gray-800 transition-colors"
          aria-label="Thông báo"
        >
          <Bell size={18} weight="duotone" />
          {/* Notification dot */}
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>
      </div>
    </header>
  )
}

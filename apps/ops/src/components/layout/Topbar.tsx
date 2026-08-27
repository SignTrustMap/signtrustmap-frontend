import { useLocation } from 'react-router-dom'
import { Bell, Question, User } from '@phosphor-icons/react'
import { PortalSwitcher } from './PortalSwitcher'

// Map route → breadcrumb label
const ROUTE_LABELS: Record<string, string> = {
  '/': 'Overview',
  '/staff': 'Staff Directory',
  '/roles': 'System Access Control',
  '/candidates': 'Reported Candidates',
  '/reports': 'Missing Signs Reports',
  '/audit-logs': 'Audit Logs',
  '/map': 'Bản đồ biển báo GIS',
  '/settings': 'System Settings',
}

export function Topbar() {
  const { pathname } = useLocation()
  const baseRoute = '/' + pathname.split('/')[1]
  const label = ROUTE_LABELS[pathname] ?? ROUTE_LABELS[baseRoute] ?? 'Staff Management'

  return (
    <header className="flex items-center justify-between px-6 h-16 border-b border-[#E8E4E3] bg-white shrink-0 shadow-xs">
      {/* Page title */}
      <h1 className="text-base font-bold text-gray-900 font-sans">
        {label}
      </h1>

      {/* Right: portal switcher + notification + help + profile */}
      <div className="flex items-center gap-3">
        <PortalSwitcher />

        {/* Bell */}
        <button
          className="relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-[#F8F7F7] hover:text-gray-900 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={18} weight="bold" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />
        </button>

        {/* Help */}
        <button
          className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-[#F8F7F7] hover:text-gray-900 transition-colors"
          aria-label="Help"
        >
          <Question size={18} weight="bold" />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center text-xs font-bold text-gray-600">
          <User size={16} weight="bold" />
        </div>
      </div>
    </header>
  )
}

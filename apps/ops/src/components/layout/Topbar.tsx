import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, Sun, Moon, Globe } from '@phosphor-icons/react'

// Map route → breadcrumb label in Vietnamese
const ROUTE_LABELS: Record<string, string> = {
  '/': 'Tổng quan hệ thống',
  '/staff': 'Quản lý nhân sự',
  '/roles': 'Phân quyền hệ thống',
  '/candidates': 'Hồ sơ kiểm duyệt',
  '/reports': 'Báo cáo sự cố biển báo',
  '/audit-logs': 'Nhật ký hoạt động',
  '/map': 'Bản đồ biển báo GIS',
  '/settings': 'Cài đặt hệ thống',
}

export function Topbar() {
  const { pathname } = useLocation()
  const baseRoute = '/' + pathname.split('/')[1]
  const label = ROUTE_LABELS[pathname] ?? ROUTE_LABELS[baseRoute] ?? 'Quản trị vận hành'

  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('stm_ops_theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  // Language state (default Vietnamese)
  const [lang, setLang] = useState<string>(() => {
    return localStorage.getItem('stm_ops_lang') || 'vi'
  })

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
      localStorage.setItem('stm_ops_theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('stm_ops_theme', 'light')
    }
  }, [isDark])

  function toggleTheme() {
    setIsDark((prev) => !prev)
  }

  function toggleLang() {
    setLang((prev) => {
      const next = prev === 'vi' ? 'en' : 'vi'
      localStorage.setItem('stm_ops_lang', next)
      return next
    })
  }

  return (
    <header className="flex items-center justify-between px-6 h-16 border-b border-[#E8E4E3] bg-white shrink-0 shadow-xs">
      {/* Page title */}
      <h1 className="text-base font-bold text-gray-900 font-sans tracking-tight">
        {label}
      </h1>

      {/* Right: Notifications, Theme Switcher, Language Switcher */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button
          className="relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-[#F8F7F7] hover:text-gray-900 transition-colors cursor-pointer"
          aria-label="Thông báo"
          title="Thông báo"
        >
          <Bell size={18} weight="bold" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />
        </button>

        {/* Divider */}
        <div className="w-[1px] h-4 bg-gray-200" />

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-[#F8F7F7] hover:text-[#007b8b] transition-all cursor-pointer"
          title={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
          aria-label="Đổi giao diện"
        >
          {isDark ? (
            <Moon size={18} weight="bold" className="text-[#00c4de]" />
          ) : (
            <Sun size={18} weight="bold" className="text-amber-500" />
          )}
        </button>

        {/* Language Toggle Pill */}
        <button
          type="button"
          onClick={toggleLang}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E8E4E3] bg-white hover:bg-gray-50 transition-all text-xs font-bold font-mono text-gray-800 cursor-pointer active:scale-95 shadow-xs"
          title={lang === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
          aria-label="Đổi ngôn ngữ"
        >
          <Globe size={14} weight="bold" className="text-[#007b8b]" />
          <span>{lang.toUpperCase()}</span>
        </button>
      </div>
    </header>
  )
}

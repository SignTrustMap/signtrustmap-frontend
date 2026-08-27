import { useLocation } from 'react-router-dom'
import { Bell, Sun, Moon, Globe } from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { useTranslation } from 'react-i18next'
import { LANG_STORAGE_KEY } from '@/i18n'

export function Topbar() {
  const { pathname } = useLocation()
  const { isDark, toggleTheme } = useTheme()
  const { t, i18n } = useTranslation('common')

  const ROUTE_LABELS: Record<string, string> = {
    '/': t('nav.dashboard_ops'),
    '/staff': t('nav.staff'),
    '/roles': t('nav.roles'),
    '/candidates': t('nav.candidates'),
    '/reports': t('nav.reports'),
    '/tasks': t('nav.tasks'),
    '/credits': t('nav.credits'),
    '/audit-logs': t('nav.audit'),
    '/map': t('nav.map'),
    '/settings': t('nav.settings'),
  }

  const baseRoute = '/' + pathname.split('/')[1]
  const label = ROUTE_LABELS[pathname] ?? ROUTE_LABELS[baseRoute] ?? t('nav.dashboard_ops')

  const currentLang = i18n.language.startsWith('en') ? 'en' : 'vi'

  function toggleLang() {
    const nextLang = currentLang === 'vi' ? 'en' : 'vi'
    i18n.changeLanguage(nextLang)
    localStorage.setItem(LANG_STORAGE_KEY, nextLang)
  }

  return (
    <header className="flex items-center justify-between px-6 h-16 border-b border-[#E8E4E3] bg-white shrink-0 shadow-xs transition-colors">
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
        <div className="w-[1px] h-4 bg-gray-200 dark:bg-white/10" />

        {/* Theme Toggle Button (Circular Ripple effect on click) */}
        <button
          type="button"
          onClick={(e) => toggleTheme(e)}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-[#F8F7F7] hover:text-[#007b8b] transition-all cursor-pointer active:scale-95"
          title={isDark ? t('common.switch_theme_light') : t('common.switch_theme_dark')}
          aria-label="Đổi giao diện"
        >
          {isDark ? (
            <Sun size={18} weight="bold" className="text-amber-400" />
          ) : (
            <Moon size={18} weight="bold" className="text-[#007b8b]" />
          )}
        </button>

        {/* Language Toggle Pill */}
        <button
          type="button"
          onClick={toggleLang}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E8E4E3] bg-white hover:bg-gray-50 transition-all text-xs font-bold font-mono text-gray-800 cursor-pointer active:scale-95 shadow-xs"
          title={t('common.switch_lang')}
          aria-label="Đổi ngôn ngữ"
        >
          <Globe size={14} weight="bold" className="text-[#007b8b]" />
          <span>{currentLang.toUpperCase()}</span>
        </button>
      </div>
    </header>
  )
}

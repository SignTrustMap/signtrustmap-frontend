import { Bell, Sun, Moon, Globe, ArrowSquareOut, SidebarSimple } from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { useSidebar } from '@/context/SidebarContext'
import { useTranslation } from 'react-i18next'
import { LANG_STORAGE_KEY } from '@/i18n'
import { communityPortalUrl } from '@/config/env'

export function Topbar() {
  const { isDark, toggleTheme } = useTheme()
  const { isCollapsed, toggleSidebar } = useSidebar()
  const { t, i18n } = useTranslation('common')

  const currentLang = i18n.language.startsWith('en') ? 'en' : 'vi'

  function toggleLang() {
    const nextLang = currentLang === 'vi' ? 'en' : 'vi'
    i18n.changeLanguage(nextLang)
    localStorage.setItem(LANG_STORAGE_KEY, nextLang)
  }

  return (
    <header className="flex items-center justify-between px-6 h-16 border-b border-[#E8E4E3] dark:border-white/10 bg-white dark:bg-[#071317] shrink-0 shadow-xs transition-colors">
      {/* Left: Sidebar Collapse/Expand Toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleSidebar}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
          title={isCollapsed ? t('common.expand_sidebar') : t('common.collapse_sidebar')}
          aria-label={isCollapsed ? t('common.expand_sidebar') : t('common.collapse_sidebar')}
        >
          <SidebarSimple size={20} weight="bold" />
        </button>
      </div>

      {/* Right: Community Portal Link, Notifications, Theme Switcher, Language Switcher */}
      <div className="flex items-center gap-3">
        {/* Cross-Portal Navigation: Link to Community Portal (Web) in a new tab */}
        <a
          href={communityPortalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#007b8b]/10 dark:bg-[#00c4de]/15 border border-[#007b8b]/20 dark:border-[#00c4de]/30 text-[#007b8b] dark:text-[#00c4de] text-xs font-bold transition-all hover:bg-[#007b8b] hover:text-white dark:hover:bg-[#00c4de] dark:hover:text-black cursor-pointer shadow-2xs"
          title={t('common.btn_community_portal')}
        >
          <span>{t('common.btn_community_portal')}</span>
          <ArrowSquareOut size={13} weight="bold" />
        </a>

        {/* Divider */}
        <div className="hidden sm:block w-[1px] h-4 bg-gray-200 dark:bg-white/10" />

        {/* Notification Bell */}
        <button
          className="relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-[#F8F7F7] dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
          aria-label={t('common.aria_notifications')}
          title={t('common.aria_notifications')}
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
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-700 dark:text-amber-400 transition-all cursor-pointer active:scale-95 border border-transparent dark:border-white/10 shadow-xs"
          title={isDark ? t('common.switch_theme_light') : t('common.switch_theme_dark')}
          aria-label={t('common.aria_theme')}
        >
          {isDark ? (
            <Sun size={18} weight="bold" />
          ) : (
            <Moon size={18} weight="bold" />
          )}
        </button>

        {/* Language Switcher Pill */}
        <button
          type="button"
          onClick={toggleLang}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-800 dark:text-white border border-transparent dark:border-white/10 transition-all text-xs font-bold font-mono cursor-pointer active:scale-95 shadow-xs"
          title={t('common.switch_lang')}
          aria-label={t('common.aria_lang')}
        >
          <Globe size={14} weight="bold" className="text-[#007b8b] dark:text-[#00c4de]" />
          <span>{currentLang.toUpperCase()}</span>
        </button>
      </div>
    </header>
  )
}

import { Bell, Sun, Moon, Globe } from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { useTranslation } from 'react-i18next'
import { LANG_STORAGE_KEY } from '@/i18n'

export function Topbar() {
  const { isDark, toggleTheme } = useTheme()
  const { t, i18n } = useTranslation('common')

  const currentLang = i18n.language.startsWith('en') ? 'en' : 'vi'

  function toggleLang() {
    const nextLang = currentLang === 'vi' ? 'en' : 'vi'
    i18n.changeLanguage(nextLang)
    localStorage.setItem(LANG_STORAGE_KEY, nextLang)
  }

  return (
    <header className="flex items-center justify-between px-6 h-16 border-b border-[#E8E4E3] dark:border-white/10 bg-white dark:bg-[#071317] shrink-0 shadow-xs transition-colors">
      {/* Left empty container to push controls to the right and avoid duplicate page titles */}
      <div />

      {/* Right: Notifications, Theme Switcher, Language Switcher */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button
          className="relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-[#F8F7F7] dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
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
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-700 dark:text-amber-400 transition-all cursor-pointer active:scale-95 border border-transparent dark:border-white/10 shadow-xs"
          title={isDark ? t('common.switch_theme_light') : t('common.switch_theme_dark')}
          aria-label="Đổi giao diện"
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
          aria-label="Đổi ngôn ngữ"
        >
          <Globe size={14} weight="bold" className="text-[#007b8b] dark:text-[#00c4de]" />
          <span>{currentLang.toUpperCase()}</span>
        </button>
      </div>
    </header>
  )
}

import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Sparkle,
  Moon,
  Sun,
  Globe,
  GithubLogo,
} from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { useI18n } from '@/context/I18nContext'
import { useTranslation } from 'react-i18next'

export function AnnouncementBar() {
  const { isDark, toggleTheme } = useTheme()
  const { lang, toggleLang } = useI18n()
  const { t } = useTranslation('common')

  return (
    <div
      className={`relative z-50 w-full text-xs px-4 sm:px-6 lg:px-8 py-1.5 transition-colors ${
        isDark
          ? 'bg-[#040e11] border-b border-white/10 text-gray-300'
          : 'bg-[#F0EEEE] border-b border-[#E8E4E3] text-gray-700'
      }`}
    >
      <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
        {/* Left: GitHub Project Link */}
        <div className="hidden lg:flex items-center shrink-0">
          <a
            href="https://github.com/SignTrustMap"
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all group shadow-sm ${
              isDark
                ? 'text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20'
                : 'text-gray-700 hover:text-black bg-white hover:bg-gray-100 border border-[#E8E4E3]'
            }`}
            title="Xem mã nguồn dự án trên GitHub"
          >
            <GithubLogo size={13} weight="bold" className={isDark ? 'text-gray-300 group-hover:text-white transition-colors' : 'text-gray-600 group-hover:text-black transition-colors'} />
            <span>GitHub</span>
          </a>
        </div>

        {/* Center: Announcement Message */}
        <div className="flex-1 flex items-center justify-center text-center truncate">
          <Link
            to="/product/map"
            className={`inline-flex items-center gap-2 font-medium transition-colors group truncate ${
              isDark ? 'text-gray-300 hover:text-[#00c4de]' : 'text-gray-800 hover:text-[#007b8b]'
            }`}
          >
            <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] tracking-wide uppercase border ${
              isDark
                ? 'bg-[#007b8b]/30 text-[#00c4de] border-[#00c4de]/25'
                : 'bg-[#007b8b]/15 text-[#007b8b] border-[#007b8b]/30'
            }`}>
              <Sparkle size={10} weight="fill" /> {t('announcement.badge')}
            </span>
            <span className={`truncate text-xs group-hover:underline ${isDark ? 'text-gray-200 group-hover:text-[#00c4de]' : 'text-gray-800 group-hover:text-[#007b8b]'}`}>
              {t('announcement.message')}
            </span>
            <ArrowRight
              size={12}
              weight="bold"
              className={`shrink-0 transition-transform group-hover:translate-x-1 ${isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'}`}
            />
          </Link>
        </div>

        {/* Right: Theme Switcher & Language Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`p-1.5 rounded-full border transition-all cursor-pointer ${
              isDark
                ? 'text-gray-300 hover:text-[#00c4de] hover:bg-white/5 border-transparent hover:border-white/10'
                : 'text-gray-600 hover:text-[#007b8b] hover:bg-black/5 border-transparent hover:border-gray-300'
            }`}
            title={isDark ? t('theme.to_light') : t('theme.to_dark')}
            aria-label={t('theme.toggle_label')}
          >
            {isDark ? (
              <Moon size={15} weight="bold" className="text-[#00c4de]" />
            ) : (
              <Sun size={15} weight="bold" className="text-amber-500" />
            )}
          </button>

          {/* Divider */}
          <div className={`w-[1px] h-3.5 ${isDark ? 'bg-white/15' : 'bg-black/15'}`} />

          {/* Language Toggle Pill */}
          <button
            type="button"
            onClick={toggleLang}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all text-[11px] font-semibold font-mono cursor-pointer active:scale-95 shadow-sm ${
              isDark
                ? 'bg-white/5 hover:bg-white/10 border-white/15 text-gray-200 hover:text-white'
                : 'bg-white hover:bg-gray-100 border-[#E8E4E3] text-gray-800 hover:text-black'
            }`}
            title={lang === 'vi' ? t('lang.toggle_to_en') : t('lang.toggle_to_vi')}
            aria-label={t('lang.toggle_label')}
          >
            <Globe size={13} weight="bold" className={isDark ? 'text-gray-300' : 'text-gray-600'} />
            <span>{lang.toUpperCase()}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

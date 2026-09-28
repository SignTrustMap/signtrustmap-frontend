import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { NavigationArrow, SignIn, X } from '@phosphor-icons/react'

interface GuestCtaBannerProps {
  isDark: boolean
}

export function GuestCtaBanner({ isDark }: GuestCtaBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const { t } = useTranslation('product')

  if (dismissed) return null

  return (
    <aside
      aria-label={t('map_page.guest_banner.aria_label')}
      className={`absolute bottom-6 left-6 z-[1000] max-w-sm rounded-3xl p-5 shadow-xl border backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-3 duration-300 ${
        isDark
          ? 'bg-[#071317]/95 border-white/10 text-white shadow-black/60'
          : 'bg-white/95 border-[#E8E4E3] text-gray-900 shadow-slate-300/40'
      }`}
    >
      {/* Top Header: Circular Icon + Title + Close Button */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#d3f7ff] dark:bg-[#00c4de]/15 text-[#007b8b] dark:text-[#00c4de] flex items-center justify-center shrink-0 shadow-xs">
            <NavigationArrow weight="fill" className="w-5 h-5 -rotate-45" />
          </div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-[#007b8b] dark:text-[#00c4de]">
            {t('map_page.guest_banner.title')}
          </h4>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          title={t('map_page.guest_banner.close_tooltip')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-700 dark:text-gray-300 mt-3.5 leading-relaxed font-medium">
        {t('map_page.guest_banner.desc')}
      </p>

      {/* Action Button: Solid pill button matching screenshot */}
      <div className="mt-4">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#007b8b] hover:bg-[#00606d] dark:bg-[#00c4de] dark:hover:bg-[#38dbf1] dark:text-[#030708] transition-all shadow-md shadow-[#007b8b]/20 dark:shadow-[#00c4de]/25 active:scale-95 cursor-pointer"
        >
          <SignIn weight="bold" className="w-4 h-4" />
          <span>{t('map_page.guest_banner.btn_login')}</span>
        </Link>
      </div>
    </aside>
  )
}


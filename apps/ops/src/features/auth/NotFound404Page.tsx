import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, House } from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'

export default function NotFound404Page() {
  const { t } = useTranslation('ops')
  const { isDark } = useTheme()
  const navigate = useNavigate()

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center text-center px-4 py-8 sm:py-12 relative z-10 my-auto select-none">
      <div className="mx-auto max-w-2xl px-4 flex flex-col items-center">
        {/* Large Typography 404 phong cách Hero Title SignTrustMap */}
        <div className="relative mb-4 select-none">
          <h1
            className={`text-8xl sm:text-9xl md:text-[11rem] font-extrabold tracking-tight leading-[1.05] text-transparent bg-clip-text ${
              isDark
                ? 'bg-gradient-to-r from-[#00c4de] via-[#d3f7ff] to-[#007b8b] glow-cyan'
                : 'bg-gradient-to-r from-[#007b8b] to-[#00c4de]'
            }`}
          >
            404
          </h1>
        </div>

        {/* Title */}
        <h2
          className={`text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}
        >
          {t('not_found_404.title')}
        </h2>

        {/* Subtitle */}
        <p
          className={`text-base sm:text-lg font-medium max-w-lg mx-auto leading-relaxed mb-10 ${
            isDark ? 'text-gray-200' : 'text-gray-700'
          }`}
        >
          {t('not_found_404.desc')}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/"
            className={`w-full sm:w-auto px-8 py-3.5 rounded-full font-bold text-base shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer ${
              isDark
                ? 'text-black bg-[#00c4de] hover:bg-[#38dbf1] shadow-[#00c4de]/25'
                : 'text-white bg-[#007b8b] hover:bg-[#00606d] shadow-[#007b8b]/20'
            }`}
          >
            <House size={18} weight="bold" />
            <span>{t('not_found_404.btn_home')}</span>
          </Link>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-full font-medium text-base backdrop-blur-md transition-all flex items-center justify-center gap-2 group cursor-pointer ${
              isDark
                ? 'text-white bg-white/5 hover:bg-white/10 border border-white/15'
                : 'text-gray-800 bg-white hover:bg-gray-100 border border-gray-300 shadow-sm'
            }`}
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>{t('not_found_404.btn_back')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

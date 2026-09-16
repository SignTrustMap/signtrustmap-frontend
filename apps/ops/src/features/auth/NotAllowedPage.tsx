import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, House } from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'

export default function NotAllowedPage() {
  const { t } = useTranslation('ops')
  const { isDark } = useTheme()
  const navigate = useNavigate()

  return (
    <div
      className={`flex-1 w-full min-h-[calc(100vh-140px)] flex flex-col items-center justify-center relative overflow-hidden transition-colors px-4 py-12 sm:py-16 ${
        isDark ? 'bg-[#030708] text-white' : 'bg-[#F8F7F7] text-gray-900'
      }`}
    >
      {/* ─── 3D Wireframe Terrain & Ambient Spotlight (Rõ nét theo Hero) ─── */}
      <div className="absolute inset-0 pointer-events-none z-0 select-none overflow-hidden">
        <img
          src="/images/hero-wireframe.jpg"
          alt="Terrain Wireframe"
          className={`w-full h-full object-cover object-bottom translate-y-8 sm:translate-y-12 transition-all ${
            isDark
              ? 'opacity-45 brightness-[0.8] contrast-[1.2] mix-blend-screen'
              : 'opacity-30 mix-blend-multiply filter invert hue-rotate-180 brightness-95 contrast-120'
          }`}
        />

        {/* Overhead spotlight beam with soft glow */}
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[450px] blur-[130px] ${
            isDark
              ? 'bg-gradient-to-b from-[#00c4de]/20 via-[#007b8b]/10 to-transparent'
              : 'bg-gradient-to-b from-[#007b8b]/20 via-[#d3f7ff]/35 to-transparent'
          }`}
        />

        {/* Soft radial scrim behind text */}
        <div
          className={`absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[480px] rounded-full blur-[110px] ${
            isDark ? 'bg-[#030708]/30' : 'bg-[#F8F7F7]/30'
          }`}
        />

        {/* Top and bottom gradient fades */}
        <div
          className={`absolute inset-0 bg-gradient-to-b ${
            isDark
              ? 'from-[#030708]/80 via-transparent to-[#030708]'
              : 'from-[#F8F7F7]/70 via-transparent to-[#F8F7F7]'
          }`}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-4 text-center flex flex-col items-center">
        {/* Large Typography 403 phong cách Hero Title SignTrustMap */}
        <div className="relative mb-4 select-none">
          <h1
            className={`text-8xl sm:text-9xl md:text-[11rem] font-extrabold tracking-tight leading-[1.05] text-transparent bg-clip-text ${
              isDark
                ? 'bg-gradient-to-r from-[#00c4de] via-[#d3f7ff] to-[#007b8b] glow-cyan'
                : 'bg-gradient-to-r from-[#007b8b] to-[#00c4de]'
            }`}
          >
            403
          </h1>
        </div>

        {/* Title */}
        <h2
          className={`text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}
        >
          {t('not_allowed.title')}
        </h2>

        {/* Subtitle */}
        <p
          className={`text-base sm:text-lg font-medium max-w-lg mx-auto leading-relaxed mb-10 ${
            isDark ? 'text-gray-200' : 'text-gray-700'
          }`}
        >
          {t('not_allowed.desc')}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-full font-bold text-base shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer ${
              isDark
                ? 'text-black bg-[#00c4de] hover:bg-[#38dbf1] shadow-[#00c4de]/25'
                : 'text-white bg-[#007b8b] hover:bg-[#00606d] shadow-[#007b8b]/20'
            }`}
          >
            <ArrowLeft size={18} weight="bold" className="group-hover:-translate-x-1 transition-transform" />
            <span>{t('not_allowed.btn_back')}</span>
          </button>

          <Link
            to="/"
            className={`w-full sm:w-auto px-8 py-3.5 rounded-full font-medium text-base backdrop-blur-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isDark
                ? 'text-white bg-white/5 hover:bg-white/10 border border-white/15'
                : 'text-gray-800 bg-white hover:bg-gray-100 border border-gray-300 shadow-sm'
            }`}
          >
            <House size={18} />
            <span>{t('not_allowed.btn_home')}</span>
          </Link>
        </div>
      </div>
    </div>
  )
}


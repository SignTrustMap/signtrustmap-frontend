import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useTranslation } from 'react-i18next'
import { LANG_STORAGE_KEY } from '@/i18n'
import {
  Eye,
  EyeSlash,
  CircleNotch,
  ShieldCheck,
  ArrowSquareOut,
  Sun,
  Moon,
  Globe,
} from '@phosphor-icons/react'

export default function LoginPage() {
  const { login, isLoading } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { t, i18n } = useTranslation('common')
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')

  const currentLang = i18n.language.startsWith('en') ? 'en' : 'vi'

  function toggleLang() {
    const nextLang = currentLang === 'vi' ? 'en' : 'vi'
    i18n.changeLanguage(nextLang)
    localStorage.setItem(LANG_STORAGE_KEY, nextLang)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      const next = params.get('next') ?? null
      const isAdmin = email.toLowerCase().includes('admin')
      if (next) {
        navigate(next, { replace: true })
      } else {
        navigate(isAdmin ? '/' : '/', { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại')
    }
  }

  return (
    <div
      className={`relative min-h-screen w-full flex flex-col justify-between overflow-hidden font-sans transition-colors duration-300 ${
        isDark ? 'bg-[#030708] text-white' : 'bg-[#F8F7F7] text-gray-900'
      }`}
    >
      {/* 3D Wireframe & Dynamic Glow Spotlight Mesh Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <img
          src="/images/hero-wireframe.jpg"
          alt="3D Wireframe Terrain Mesh"
          className={`w-full h-full object-cover object-bottom transition-opacity duration-500 ${
            isDark
              ? 'opacity-35 mix-blend-screen brightness-110 contrast-125'
              : 'opacity-10 mix-blend-multiply brightness-90 contrast-125'
          }`}
        />

        {/* Overhead teal/cyan spotlight beam */}
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] blur-[140px] pointer-events-none ${
            isDark
              ? 'bg-gradient-to-b from-[#00c4de]/25 via-[#007b8b]/15 to-transparent'
              : 'bg-gradient-to-b from-[#007b8b]/15 via-[#00c4de]/8 to-transparent'
          }`}
        />

        {/* Radial ambient glow behind main card */}
        <div
          className={`absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[550px] rounded-full blur-[130px] pointer-events-none ${
            isDark ? 'bg-[#007b8b]/12' : 'bg-white/80'
          }`}
        />

        {/* Subtle coordinate dot-grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'radial-gradient(circle, #00c4de 1px, transparent 1px), linear-gradient(to right, #00c4de 1px, transparent 1px), linear-gradient(to bottom, #00c4de 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* ─── Top Header with Logo & Controls ──────────────────────── */}
      <header
        className={`relative z-10 w-full px-6 sm:px-12 py-5 flex items-center justify-between border-b backdrop-blur-md transition-colors ${
          isDark
            ? 'bg-[#030708]/75 border-white/10'
            : 'bg-white/80 border-[#E8E4E3]'
        }`}
      >
        {/* Brand Logo */}
        <a
          href="/"
          className="flex items-center gap-3 font-brand font-bold text-xl group"
        >
          <img
            src="/brand/brand_logo_nobg.svg"
            alt="SignTrustMap Logo"
            className="w-8 h-8 object-contain group-hover:scale-105 transition-transform"
          />
          <div className="flex items-center gap-2">
            <span
              className={`tracking-tight text-xl font-bold font-sans ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              Sign<span className="text-[#00c4de]">Trust</span>Map
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                isDark
                  ? 'bg-[#00c4de]/15 text-[#00c4de] border border-[#00c4de]/30'
                  : 'bg-[#007b8b]/15 text-[#007b8b] border border-[#007b8b]/25'
              }`}
            >
              {t('nav.ops_portal')}
            </span>
          </div>
        </a>

        {/* Right Header Action Items: Theme Toggle, Language Toggle, Web Portal Link */}
        <div className="flex items-center gap-3">
          {/* Theme Switcher Button */}
          <button
            type="button"
            onClick={(e) => toggleTheme(e)}
            className={`w-9 h-9 flex items-center justify-center rounded-full transition-all cursor-pointer active:scale-95 border ${
              isDark
                ? 'bg-white/10 border-white/15 text-amber-400 hover:bg-white/15 shadow-xs'
                : 'bg-white border-[#E8E4E3] text-[#007b8b] hover:bg-gray-50 shadow-xs'
            }`}
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all text-xs font-bold font-mono cursor-pointer active:scale-95 shadow-xs ${
              isDark
                ? 'bg-white/10 border-white/15 text-white hover:bg-white/15'
                : 'bg-white border-[#E8E4E3] text-gray-800 hover:bg-gray-50'
            }`}
            title={t('common.switch_lang')}
            aria-label="Đổi ngôn ngữ"
          >
            <Globe size={14} weight="bold" className="text-[#00c4de]" />
            <span>{currentLang.toUpperCase()}</span>
          </button>

          {/* Divider */}
          <div className="w-[1px] h-4 bg-gray-500/30 hidden sm:block" />

          {/* Link to Community Portal */}
          <a
            href="http://localhost:5173"
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all shadow-xs ${
              isDark
                ? 'bg-[#00c4de]/10 border-[#00c4de]/30 text-[#00c4de] hover:bg-[#00c4de]/20'
                : 'bg-white border-gray-200 text-gray-700 hover:text-[#007b8b]'
            }`}
          >
            <span>{t('nav.community_portal')}</span>
            <ArrowSquareOut size={13} />
          </a>
        </div>
      </header>

      {/* ─── Main Glassmorphism Login Card ─────────────────────────── */}
      <main className="relative z-10 flex items-center justify-center px-4 py-10">
        <div
          className={`w-full max-w-[480px] rounded-[24px] p-8 sm:p-10 transition-all duration-300 animate-in fade-in zoom-in-95 ${
            isDark
              ? 'bg-[#0A171C]/90 backdrop-blur-2xl border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.15)] text-white'
              : 'bg-white rounded-[24px] shadow-xl border border-gray-200/80 text-gray-900'
          }`}
        >
          {/* Card Header */}
          <div className="text-left mb-6">
            <div
              className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold mb-2 uppercase tracking-wide ${
                isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'
              }`}
            >
              <ShieldCheck size={16} weight="fill" />
              <span>{t('login.internal_system')}</span>
            </div>
            <h1
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              {t('login.title')}
            </h1>
            <p
              className={`text-xs sm:text-sm mt-1.5 leading-relaxed ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              {t('login.subtitle')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {/* Email field */}
            <div className="flex flex-col gap-1.5 text-left">
              <label
                htmlFor="ops-email"
                className={`text-xs font-bold font-mono uppercase tracking-wide ${
                  isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'
                }`}
              >
                {t('login.email')}<span className="text-red-500">*</span>
              </label>

              <input
                id="ops-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@signtrustmap.site"
                className={`w-full px-4 py-3 text-sm rounded-xl border focus:outline-none focus:ring-2 transition-all ${
                  isDark
                    ? 'bg-[#061115] border-white/15 text-white placeholder:text-gray-500 focus:border-[#00c4de] focus:ring-[#00c4de]/25'
                    : 'bg-gray-50/50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#007b8b] focus:ring-[#007b8b]/20'
                }`}
              />
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-1.5 text-left">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="ops-password"
                  className={`text-xs font-bold font-mono uppercase tracking-wide ${
                    isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'
                  }`}
                >
                  {t('login.password')}<span className="text-red-500">*</span>
                </label>
                <a
                  href="#"
                  className={`text-[11px] hover:underline ${
                    isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'
                  }`}
                >
                  {t('login.forgot_password')}
                </a>
              </div>
              <div className="relative">
                <input
                  id="ops-password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 pr-10 text-sm rounded-xl border focus:outline-none focus:ring-2 transition-all ${
                    isDark
                      ? 'bg-[#061115] border-white/15 text-white placeholder:text-gray-500 focus:border-[#00c4de] focus:ring-[#00c4de]/25'
                      : 'bg-gray-50/50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#007b8b] focus:ring-[#007b8b]/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 p-1 cursor-pointer"
                  aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPw ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <p
                role="alert"
                className="text-xs text-red-400 bg-red-950/40 border border-red-500/30 rounded-xl p-3 text-left"
              >
                {error}
              </p>
            )}

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className={`mt-1 w-full py-3.5 text-white font-bold text-sm rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isDark
                  ? 'bg-gradient-to-r from-[#007b8b] to-[#00c4de] hover:from-[#008fa1] hover:to-[#00d6f2] shadow-[#00c4de]/25'
                  : 'bg-[#007b8b] hover:bg-[#00606d] shadow-[#007b8b]/25'
              }`}
            >
              {isLoading ? (
                <>
                  <CircleNotch size={18} className="animate-spin" />
                  <span>{t('login.submitting')}</span>
                </>
              ) : (
                <span>{t('login.submit')}</span>
              )}
            </button>

            {/* Centered Divider */}
            <div className="relative flex items-center justify-center my-1 w-full">
              <div className="absolute inset-0 flex items-center">
                <div
                  className={`w-full border-t ${
                    isDark ? 'border-white/10' : 'border-gray-200'
                  }`}
                />
              </div>
              <div className="relative flex justify-center text-xs">
                <span
                  className={`px-4 text-[11px] font-mono uppercase tracking-widest ${
                    isDark
                      ? 'bg-[#0A171C] text-gray-500'
                      : 'bg-white text-gray-400'
                  }`}
                >
                  {t('login.or')}
                </span>
              </div>
            </div>

            {/* Google Sign In button */}
            <button
              type="button"
              onClick={() => {
                setEmail('staff@signtrustmap.site')
                setPassword('google-oauth')
              }}
              className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-full border text-sm font-semibold transition-all shadow-xs active:scale-[0.98] cursor-pointer ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/15 text-white'
                  : 'bg-white hover:bg-gray-50 border-gray-300 text-gray-800'
              }`}
            >
              <img
                src="/brand/google-g.png"
                alt="Google"
                className="w-5 h-5 object-contain"
              />
              <span>{t('login.google_login')}</span>
            </button>
          </form>

          {/* Dev Quick Logins */}
          {import.meta.env.DEV && (
            <div
              className={`mt-6 pt-5 border-t text-left ${
                isDark ? 'border-white/10' : 'border-gray-100'
              }`}
            >
              <p className="text-[10px] font-mono uppercase text-gray-400 mb-2">
                {t('login.dev_quick')}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('staff@example.com')
                    setPassword('password')
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 border-white/15 text-gray-200'
                      : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'
                  }`}
                >
                  {t('login.staff_portal')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@example.com')
                    setPassword('password')
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-[#00c4de]/15 hover:bg-[#00c4de]/25 border-[#00c4de]/40 text-[#00c4de]'
                      : 'bg-[#007b8b]/10 hover:bg-[#007b8b]/20 border-[#007b8b]/30 text-[#007b8b]'
                  }`}
                >
                  {t('login.admin_portal')}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer
        className={`relative z-10 w-full px-6 py-5 text-center text-xs transition-colors ${
          isDark ? 'text-gray-500 border-t border-white/5' : 'text-gray-500'
        }`}
      >
        <p>
          {t('login.footer', { year: new Date().getFullYear() })}
        </p>
      </footer>
    </div>
  )
}

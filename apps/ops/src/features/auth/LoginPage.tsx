import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { useTranslation } from 'react-i18next'
import { LANG_STORAGE_KEY } from '@/i18n'
import { communityPortalUrl } from '@/config/env'
import { mockOpsDemoAccounts, type DemoAccount } from '@/data/mockAccounts'
import {
  Eye,
  EyeSlash,
  CircleNotch,
  ArrowSquareOut,
  Sun,
  Moon,
  Globe,
} from '@phosphor-icons/react'

export default function LoginPage() {
  const { login, isLoading } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { t, i18n } = useTranslation('common')
  const toast = useToast()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)
  const ctrlPressTimesRef = useRef<number[]>([])

  // Easter egg: Press Ctrl 5 times within 2.5 seconds to toggle visibility of secret demo account cells
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Control') {
        if (e.repeat) return
        const now = Date.now()
        // Keep presses within the last 2500ms
        const recentPresses = ctrlPressTimesRef.current.filter((t) => now - t < 2500)
        recentPresses.push(now)
        ctrlPressTimesRef.current = recentPresses

        if (recentPresses.length >= 5) {
          setIsRevealed((prev) => !prev)
          ctrlPressTimesRef.current = []
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const currentLang = i18n.language.startsWith('en') ? 'en' : 'vi'

  function toggleLang() {
    const nextLang = currentLang === 'vi' ? 'en' : 'vi'
    i18n.changeLanguage(nextLang)
    localStorage.setItem(LANG_STORAGE_KEY, nextLang)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
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
      if (
        err instanceof Error &&
        (err.message === 'FORBIDDEN_ACCESS' || err.message.startsWith('FORBIDDEN_COMMUNITY_ROLE:'))
      ) {
        toast.error(t('login.forbidden_desc'))
      } else if (err instanceof Error && err.message === 'INVALID_CREDENTIALS') {
        toast.error(t('login.err_invalid_credentials'))
      } else {
        toast.error(t('login.err_login_failed'))
      }
    }
  }

  const unauthorizedAccounts = mockOpsDemoAccounts.filter((a) => !a.isOpsAuthorized)
  const authorizedAccounts = mockOpsDemoAccounts.filter((a) => a.isOpsAuthorized)

  function handleSecretFill(acc: DemoAccount) {
    setEmail(acc.email)
    setPassword(acc.password)
  }

  return (
    <div
      className={`relative min-h-screen w-full flex flex-col justify-between font-sans transition-colors duration-300 ${
        isDark ? 'bg-[#030708] text-white' : 'bg-[#F8F7F7] text-gray-900'
      }`}
    >
      {/* 3D Wireframe & Dynamic Glow Spotlight Mesh Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Synchronized Terrain Mesh Wrapper (Ratio 1376:768 locked to bottom-center) */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            aspectRatio: '1376 / 768',
            width: 'max(100vw, calc(100vh * (1376 / 768)))',
            height: 'max(100vh, calc(100vw * (768 / 1376)))',
          }}
        >
          <img
            src="/images/hero-wireframe.jpg"
            alt="3D Wireframe Terrain Mesh"
            className={`w-full h-full object-cover object-bottom transition-all duration-500 ${
              isDark
                ? 'opacity-45 brightness-[0.75] contrast-[1.2] mix-blend-screen'
                : 'opacity-35 mix-blend-multiply filter invert hue-rotate-180 brightness-95 contrast-125'
            }`}
          />
        </div>

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

      {/* ─── Secret Grid Edge Trigger Cells (Aligned with 48px CSS Grid) ─── */}
      {/* Left Edge: Unauthorized Accounts (403 Test) */}
      <div
        className={`fixed left-0 top-1/2 -translate-y-1/2 z-30 hidden md:flex flex-col border-y border-r transition-all duration-300 ${
          isRevealed
            ? 'border-amber-500/50 bg-black/40 backdrop-blur-sm shadow-[0_0_20px_rgba(245,158,11,0.25)]'
            : 'border-transparent hover:border-amber-500/20'
        }`}
        title="403 Test Grid Cells (Ctrl x5 to toggle)"
      >
        {unauthorizedAccounts.map((acc) => (
          <button
            key={acc.id}
            type="button"
            onClick={() => handleSecretFill(acc)}
            className={`group relative w-12 h-12 border transition-all duration-200 flex items-center justify-center cursor-pointer select-none ${
              isRevealed
                ? 'border-amber-500/30 bg-amber-500/10 hover:border-amber-400 hover:bg-amber-500/25 hover:shadow-[inset_0_0_16px_rgba(245,158,11,0.35)]'
                : 'border-transparent hover:border-amber-400/60 dark:hover:border-amber-400/50 hover:bg-amber-400/10 hover:shadow-[inset_0_0_16px_rgba(245,158,11,0.25)]'
            }`}
            aria-label={`${acc.label} (403 Test)`}
          >
            {/* Role icon revealed when isRevealed or on hover */}
            <span
              className={`text-xl select-none transition-all duration-200 pointer-events-none ${
                isRevealed
                  ? 'opacity-100 scale-100 group-hover:scale-110'
                  : 'opacity-0 group-hover:opacity-100 group-hover:scale-110'
              }`}
            >
              {acc.icon}
            </span>

            {/* Inward-pointing floating tooltip */}
            <div className="absolute left-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-150 pointer-events-none z-40 whitespace-nowrap">
              <span className="text-[11px] font-mono font-bold tracking-wide text-amber-700 dark:text-amber-300 bg-white/95 dark:bg-[#1a0f02]/95 px-2.5 py-1 rounded-md shadow-lg border border-amber-500/30 dark:border-amber-400/40 backdrop-blur-md flex items-center gap-1.5">
                <span>{acc.icon}</span>
                <span>403 • {acc.label}</span>
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Right Edge: Authorized Accounts (Staff & Admin) */}
      <div
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-30 hidden md:flex flex-col border-y border-l transition-all duration-300 ${
          isRevealed
            ? 'border-[#00c4de]/50 bg-black/40 backdrop-blur-sm shadow-[0_0_20px_rgba(0,196,222,0.25)]'
            : 'border-transparent hover:border-[#00c4de]/20'
        }`}
        title="Ops Authorized Grid Cells (Ctrl x5 to toggle)"
      >
        {authorizedAccounts.map((acc) => (
          <button
            key={acc.id}
            type="button"
            onClick={() => handleSecretFill(acc)}
            className={`group relative w-12 h-12 border transition-all duration-200 flex items-center justify-center cursor-pointer select-none ${
              isRevealed
                ? 'border-[#00c4de]/30 bg-[#00c4de]/10 hover:border-[#00c4de] hover:bg-[#00c4de]/25 hover:shadow-[inset_0_0_16px_rgba(0,196,222,0.35)]'
                : 'border-transparent hover:border-[#007b8b]/60 dark:hover:border-[#00c4de]/60 hover:bg-[#00c4de]/10 hover:shadow-[inset_0_0_16px_rgba(0,196,222,0.25)]'
            }`}
            aria-label={`${acc.label} (${acc.role.toUpperCase()})`}
          >
            {/* Role icon revealed when isRevealed or on hover */}
            <span
              className={`text-xl select-none transition-all duration-200 pointer-events-none ${
                isRevealed
                  ? 'opacity-100 scale-100 group-hover:scale-110'
                  : 'opacity-0 group-hover:opacity-100 group-hover:scale-110'
              }`}
            >
              {acc.icon}
            </span>

            {/* Inward-pointing floating tooltip */}
            <div className="absolute right-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-150 pointer-events-none z-40 whitespace-nowrap">
              <span className="text-[11px] font-mono font-bold tracking-wide text-[#007b8b] dark:text-[#00c4de] bg-white/95 dark:bg-[#06161b]/95 px-2.5 py-1 rounded-md shadow-lg border border-[#007b8b]/30 dark:border-[#00c4de]/40 backdrop-blur-md flex items-center gap-1.5">
                <span>{acc.icon}</span>
                <span>{acc.label} • {acc.role.toUpperCase()}</span>
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* ─── Top Header with Logo & Controls (Fixed navigation) ─── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 w-full px-6 sm:px-12 py-4 sm:py-5 flex items-center justify-between border-b backdrop-blur-xl transition-all shadow-sm ${
          isDark
            ? 'bg-[#030708]/90 border-white/10'
            : 'bg-white/90 border-[#E8E4E3]'
        }`}
      >
        {/* Brand Logo */}
        <a
          href="/"
          className="flex items-center gap-3 font-sans font-bold text-xl group"
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all text-xs font-bold font-mono cursor-pointer active:scale-95 shadow-xs ${
              isDark
                ? 'bg-white/10 border-white/15 text-white hover:bg-white/15'
                : 'bg-white border-[#E8E4E3] text-gray-800 hover:bg-gray-50'
            }`}
            title={t('common.switch_lang')}
            aria-label={t('common.aria_lang')}
          >
            <Globe size={14} weight="bold" className="text-[#00c4de]" />
            <span>{currentLang.toUpperCase()}</span>
          </button>

          {/* Divider */}
          <div className="w-[1px] h-4 bg-gray-500/30 hidden sm:block" />

          {/* Link to Community Portal */}
          <a
            href={communityPortalUrl}
            target="_blank"
            rel="noopener noreferrer"
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

      {/* Spacer so page content does not hide behind fixed header */}
      <div className="h-16 sm:h-[72px] shrink-0 pointer-events-none" aria-hidden="true" />

      {/* ─── Main Glassmorphism Login Card ───────── */}
      <main className="relative z-20 flex-1 flex items-center justify-center px-4 py-8 w-full">
        <div className="relative w-full max-w-[1280px] flex flex-col items-center justify-center">

          {/* ─── Main Login Card ───────────────────────────────────────── */}
          <div
            className={`w-full max-w-[480px] rounded-[24px] p-8 sm:p-10 transition-all duration-300 animate-in fade-in zoom-in-95 ${
              isDark
                ? 'bg-[#0A171C]/90 backdrop-blur-2xl border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.15)] text-white'
                : 'bg-white rounded-[24px] shadow-xl border border-gray-200/80 text-gray-900'
            }`}
          >
          {/* Card Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <a href="/" className="inline-block mb-3 hover:scale-105 transition-transform">
              <img
                src="/brand/brand_logo_nobg.svg"
                alt="SignTrustMap Logo"
                className="w-12 h-12 object-contain"
              />
            </a>
            <h1
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight font-sans flex flex-col items-center gap-1 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              <span>{t('login.title')}</span>
              <span>
                Sign<span className={isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'}>Trust</span>Map
              </span>
            </h1>
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
                  aria-label={showPw ? t('login.aria_hide_pw') : t('login.aria_show_pw')}
                >
                  {showPw ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

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
                setEmail('staff@signtrustmap.com')
                setPassword('password123')
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
          </div>

          {/* ─── Mobile/Tablet subtle bottom corners fallback ─── */}
          <div className="md:hidden flex items-center justify-between w-full max-w-[480px] px-3 mt-3">
            <div className="flex gap-2">
              {unauthorizedAccounts.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => handleSecretFill(acc)}
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                    isRevealed
                      ? 'border-amber-500/40 bg-amber-500/15 opacity-100'
                      : 'border-transparent active:border-amber-500/40 active:bg-amber-500/10 opacity-10 hover:opacity-100'
                  }`}
                  title={`${acc.label} (403)`}
                >
                  <span className="text-xs">{acc.icon}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {authorizedAccounts.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => handleSecretFill(acc)}
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                    isRevealed
                      ? 'border-[#00c4de]/40 bg-[#00c4de]/15 opacity-100'
                      : 'border-transparent active:border-[#00c4de]/40 active:bg-[#00c4de]/10 opacity-10 hover:opacity-100'
                  }`}
                  title={`${acc.label} (Ops)`}
                >
                  <span className="text-xs">{acc.icon}</span>
                </button>
              ))}
            </div>
          </div>

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

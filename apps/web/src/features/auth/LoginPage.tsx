import { useState, useEffect, useRef, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeSlash, CircleNotch } from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/context/AuthContext'
import { mockDemoAccounts, type DemoUserAccount } from '@/data'

export default function Login() {
  const { isDark } = useTheme()
  const { t } = useTranslation('common')
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Sanitize redirect target: if coming from /login or /signup, always fallback to home '/'
  const rawFrom = (location.state as { from?: string })?.from || '/'
  const authPaths = ['/login', '/signup', '/register']
  const from = authPaths.includes(rawFrom) ? '/' : rawFrom

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isRevealed, setIsRevealed] = useState(false)
  const ctrlPressTimesRef = useRef<number[]>([])

  // Easter egg: Press Ctrl 5 times within 2.5 seconds to toggle visibility of secret demo account cells
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Control') {
        if (e.repeat) return
        const now = Date.now()
        // Keep presses within the last 2500ms
        const recentPresses = ctrlPressTimesRef.current.filter((time) => now - time < 2500)
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

  const leftAccounts = mockDemoAccounts.slice(0, 3) // Driver, Surveyor, Reviewer
  const rightAccounts = mockDemoAccounts.slice(3) // Staff, Admin

  function handleSecretFill(acc: DemoUserAccount) {
    setEmail(acc.email)
    setPassword(acc.password)
    setError('')
  }

  async function performLogin(targetEmail: string, targetPw: string) {
    setError('')
    setIsLoading(true)
    try {
      await login(targetEmail, targetPw)
      navigate(from, { replace: true })
    } catch {
      setError(t('auth.login.error_default'))
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      setError(t('auth.login.email_required'))
      return
    }
    await performLogin(email, password)
  }

  return (
    <div
      className={`w-full flex-1 flex flex-col items-center justify-center px-4 pt-6 sm:pt-8 pb-12 relative overflow-hidden transition-colors ${
        isDark ? 'bg-[#030708] text-white' : 'bg-[#F8F7F7] text-gray-900'
      }`}
    >
      {/* Background Decorator */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <img
          src="/images/hero-wireframe.jpg"
          alt="3D Wireframe Terrain Mesh"
          className={`w-full h-full object-cover object-bottom transition-all ${
            isDark
              ? 'opacity-45 brightness-[0.75] contrast-[1.2] mix-blend-screen'
              : 'opacity-30 mix-blend-multiply filter invert hue-rotate-180 brightness-95 contrast-125'
          }`}
        />
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-[750px] h-[350px] blur-[130px] ${
            isDark
              ? 'bg-gradient-to-b from-[#00c4de]/15 via-[#007b8b]/6 to-transparent'
              : 'bg-gradient-to-b from-[#007b8b]/15 via-[#d3f7ff]/30 to-transparent'
          }`}
        />
        <div
          className={`absolute inset-0 bg-gradient-to-b ${
            isDark
              ? 'from-[#030708]/90 via-[#030708]/60 to-[#030708]'
              : 'from-[#F8F7F7]/90 via-[#F8F7F7]/60 to-[#F8F7F7]'
          }`}
        />
        {/* Subtle coordinate dot-grid overlay (Aligned with 48px grid cells) */}
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
      {/* Left Edge: Community Accounts (Driver, Surveyor, Reviewer) */}
      <div
        className={`fixed left-0 top-1/2 -translate-y-1/2 z-30 hidden md:flex flex-col border-y border-r transition-all duration-300 ${
          isRevealed
            ? 'border-[#00c4de]/50 bg-black/40 backdrop-blur-sm shadow-[0_0_20px_rgba(0,196,222,0.25)]'
            : 'border-transparent hover:border-[#00c4de]/20'
        }`}
        title="Demo Account Grid Cells (Ctrl x5 to toggle)"
      >
        {leftAccounts.map((acc) => (
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
            <div className="absolute left-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-150 pointer-events-none z-40 whitespace-nowrap">
              <span className="text-[11px] font-mono font-bold tracking-wide text-[#007b8b] dark:text-[#00c4de] bg-white/95 dark:bg-[#06161b]/95 px-2.5 py-1 rounded-md shadow-lg border border-[#007b8b]/30 dark:border-[#00c4de]/40 backdrop-blur-md flex items-center gap-1.5">
                <span>{acc.icon}</span>
                <span>{acc.label} • {acc.role.toUpperCase()}</span>
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Right Edge: Platform Accounts (Staff, Admin) */}
      <div
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-30 hidden md:flex flex-col border-y border-l transition-all duration-300 ${
          isRevealed
            ? 'border-[#00c4de]/50 bg-black/40 backdrop-blur-sm shadow-[0_0_20px_rgba(0,196,222,0.25)]'
            : 'border-transparent hover:border-[#00c4de]/20'
        }`}
        title="Demo Account Grid Cells (Ctrl x5 to toggle)"
      >
        {rightAccounts.map((acc) => (
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

      {/* Main Container */}
      <div className="w-full max-w-[460px] relative z-10 mx-auto">
        <div
          className={`rounded-[24px] p-6 sm:p-8 border shadow-2xl text-left transition-all ${
            isDark
              ? 'glass-panel border-white/15 bg-[#061417]/95 backdrop-blur-2xl'
              : 'bg-white border-[#E8E4E3] shadow-gray-200/80'
          }`}
        >
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <Link to="/" className="inline-block mb-3 hover:scale-105 transition-transform">
              <img
                src="/brand/brand_logo_nobg.svg"
                alt="SignTrustMap Logo"
                className="w-12 h-12 object-contain"
              />
            </Link>
            <h1
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight font-sans flex flex-col items-center gap-1 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              <span>{t('auth.login.title_action')}</span>
              <span>
                Sign<span className={isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'}>Trust</span>Map
              </span>
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label
                htmlFor="login-email"
                className={`text-xs font-bold uppercase tracking-wide font-mono mb-1.5 block ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                {t('auth.login.email_label')}
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors outline-none ${
                  isDark
                    ? 'bg-white/5 border-white/10 text-white focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de]'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-[#007b8b] focus:ring-1 focus:ring-[#007b8b]'
                }`}
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className={`text-xs font-bold uppercase tracking-wide font-mono ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  {t('auth.login.password_label')}
                </label>
                <Link
                  to="#"
                  className={`text-xs font-bold hover:underline ${
                    isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'
                  }`}
                >
                  {t('auth.login.forgot_password')}
                </Link>
              </div>

              <div className="relative">
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 pr-12 rounded-xl border text-sm transition-colors outline-none ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-white focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de]'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-[#007b8b] focus:ring-1 focus:ring-[#007b8b]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  aria-label={showPw ? t('auth.login.hide_pw') : t('auth.login.show_pw')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showPw ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 px-4 rounded-full font-bold text-sm tracking-wide transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                isDark
                  ? 'bg-[#00c4de] hover:bg-[#38dbf1] text-black shadow-[#00c4de]/25'
                  : 'bg-[#007b8b] hover:bg-[#00606d] text-white shadow-[#007b8b]/20'
              }`}
            >
              {isLoading ? (
                <>
                  <CircleNotch size={18} className="animate-spin" />
                  <span>{t('auth.login.submitting')}</span>
                </>
              ) : (
                <span>{t('auth.login.submit')}</span>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`} />
              </div>
              <div className="relative flex justify-center text-xs">
                <span
                  className={`px-4 text-[11px] font-mono font-bold uppercase tracking-widest ${
                    isDark ? 'bg-[#061417] text-gray-300' : 'bg-white text-gray-600'
                  }`}
                >
                  {t('auth.login.or')}
                </span>
              </div>
            </div>

            {/* Google Sign In button */}
            <button
              type="button"
              onClick={() => performLogin('driver@signtrustmap.com', 'password123')}
              className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-full border text-sm font-semibold transition-all shadow-xs active:scale-[0.98] cursor-pointer ${
                isDark
                  ? 'border-white/15 bg-white/5 hover:bg-white/10 text-white'
                  : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-800 shadow-gray-200/50'
              }`}
            >
              <img src="/brand/google-g.png" alt="Google" className="w-5 h-5 object-contain" />
              <span>{t('auth.login.google')}</span>
            </button>
          </form>

          {/* Footer switch link */}
          <div
            className={`text-center text-xs mt-6 pt-5 border-t ${
              isDark ? 'text-gray-400 border-white/10' : 'text-gray-600 border-gray-100'
            }`}
          >
            <span>{t('auth.login.no_account')} </span>
            <Link
              to="/signup"
              className={`font-bold hover:underline ${
                isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'
              }`}
            >
              {t('auth.login.go_signup')}
            </Link>
          </div>
        </div>

        {/* ─── Mobile/Tablet subtle bottom corners fallback ─── */}
        <div className="md:hidden flex items-center justify-between w-full px-3 mt-3">
          <div className="flex gap-2">
            {leftAccounts.map((acc) => (
              <button
                key={acc.id}
                type="button"
                onClick={() => handleSecretFill(acc)}
                className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                  isRevealed
                    ? 'border-[#00c4de]/40 bg-[#00c4de]/15 opacity-100'
                    : 'border-transparent active:border-[#00c4de]/40 active:bg-[#00c4de]/10 opacity-10 hover:opacity-100'
                }`}
                title={acc.label}
              >
                <span className="text-xs">{acc.icon}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {rightAccounts.map((acc) => (
              <button
                key={acc.id}
                type="button"
                onClick={() => handleSecretFill(acc)}
                className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                  isRevealed
                    ? 'border-[#00c4de]/40 bg-[#00c4de]/15 opacity-100'
                    : 'border-transparent active:border-[#00c4de]/40 active:bg-[#00c4de]/10 opacity-10 hover:opacity-100'
                }`}
                title={acc.label}
              >
                <span className="text-xs">{acc.icon}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeSlash, CircleNotch } from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/context/AuthContext'
import { mockDemoAccounts } from '@/data'

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

  async function performLogin(targetEmail: string, targetPw: string) {
    setError('')
    setIsLoading(true)
    try {
      await login(targetEmail, targetPw)
      navigate(from, { replace: true })
    } catch {
      setError(t('auth.login.error_default') || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email hoặc mật khẩu.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      setError('Vui lòng nhập địa chỉ Email.')
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
            <h1 className="text-2xl font-bold font-sans tracking-tight">
              {t('auth.login.title_action')}
            </h1>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              {t('auth.login.subtitle')}
            </p>
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
                className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5"
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
                  className="block text-xs font-semibold uppercase tracking-wider text-gray-400"
                >
                  {t('auth.login.password_label')}
                </label>
                <Link
                  to="#"
                  className={`text-xs hover:underline ${
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
                  className={`px-4 text-[11px] font-mono uppercase tracking-widest ${
                    isDark ? 'bg-[#061417] text-gray-400' : 'bg-white text-gray-400'
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

            {/* Quick Demo Logins (Fills in credentials like in Ops) */}
            <div
              className={`mt-4 pt-4 border-t text-left ${
                isDark ? 'border-white/10' : 'border-gray-100'
              }`}
            >
              <p className="text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-2">
                {t('auth.login.dev_quick')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {mockDemoAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      setEmail(acc.email)
                      setPassword(acc.password)
                      setError('')
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer active:scale-95 ${
                      email === acc.email
                        ? isDark
                          ? 'bg-[#00c4de]/20 border-[#00c4de]/60 text-[#00c4de]'
                          : 'bg-[#007b8b]/15 border-[#007b8b]/50 text-[#007b8b]'
                        : isDark
                        ? 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-200'
                        : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'
                    }`}
                  >
                    <span>{acc.icon}</span>
                    <span>{acc.label}</span>
                  </button>
                ))}
              </div>
            </div>
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
      </div>
    </div>
  )
}

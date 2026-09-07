import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeSlash, CircleNotch } from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { useTranslation } from 'react-i18next'

export default function Login() {
  const { isDark } = useTheme()
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 600))
      navigate('/product/map', { replace: true })
    } catch {
      setError(t('auth.login.error_default'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className={`w-full flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-16 relative overflow-hidden transition-colors ${
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
            <p className={`text-xs sm:text-sm mt-1.5 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('auth.login.subtitle')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {/* Email field */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="login-email"
                className={`text-xs font-bold uppercase tracking-wide font-mono ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                {t('auth.login.email_label')}
              </label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className={`w-full px-4 py-3 text-sm rounded-xl border transition-all ${
                  isDark
                    ? 'border-white/15 bg-black/40 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de]'
                    : 'border-gray-300 bg-gray-50/70 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-[#007b8b] focus:ring-2 focus:ring-[#007b8b]/20'
                }`}
              />
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-pw"
                  className={`text-xs font-bold uppercase tracking-wide font-mono ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  {t('auth.login.password_label')}
                </label>
                <a
                  href="#"
                  className={`text-[11px] hover:underline ${
                    isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'
                  }`}
                >
                  {t('auth.login.forgot_password')}
                </a>
              </div>
              <div className="relative">
                <input
                  id="login-pw"
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 pr-10 text-sm rounded-xl border transition-all ${
                    isDark
                      ? 'border-white/15 bg-black/40 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de]'
                      : 'border-gray-300 bg-gray-50/70 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-[#007b8b] focus:ring-2 focus:ring-[#007b8b]/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 cursor-pointer transition-colors ${
                    isDark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-800'
                  }`}
                  aria-label={showPw ? t('auth.login.hide_pw') : t('auth.login.show_pw')}
                >
                  {showPw ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <p
                className={`text-xs rounded-xl p-3 border ${
                  isDark
                    ? 'text-red-400 bg-red-950/40 border-red-800/60'
                    : 'text-red-600 bg-red-50 border-red-200'
                }`}
              >
                {error}
              </p>
            )}

            {/* Primary Submit button */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className={`mt-1 w-full py-3.5 font-bold text-sm rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isDark
                  ? 'bg-[#00c4de] hover:bg-[#38dbf1] text-black shadow-[#00c4de]/25'
                  : 'bg-[#007b8b] hover:bg-[#00606d] text-white shadow-[#007b8b]/25'
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

            {/* Centered Divider */}
            <div className="relative flex items-center justify-center my-2 w-full">
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
              onClick={() => {
                setEmail('user@gmail.com')
                setPassword('oauth-password')
              }}
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
      </div>
    </div>
  )
}

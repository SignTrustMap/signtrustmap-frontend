import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeSlash, CircleNotch, CheckCircle } from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { useTranslation } from 'react-i18next'

export default function Signup() {
  const { isDark } = useTheme()
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(true)
  const [showPw, setShowPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError(t('auth.signup.password_too_short'))
      return
    }

    if (password !== confirmPassword) {
      setError(t('auth.signup.password_mismatch'))
      return
    }

    if (!agreeTerms) {
      setError(t('auth.signup.terms_error'))
      return
    }

    setIsLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 600))
      navigate('/product/app', { replace: true })
    } catch {
      setError(t('auth.signup.error_default'))
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
              <span>{t('auth.signup.title_action')}</span>
              <span>
                Sign<span className={isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'}>Trust</span>Map
              </span>
            </h1>
            <p className={`text-xs sm:text-sm mt-1.5 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('auth.signup.subtitle')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3.5">
            {/* Name field */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="signup-name"
                className={`text-xs font-bold uppercase tracking-wide font-mono ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                {t('auth.signup.name_label')}
              </label>
              <input
                id="signup-name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('auth.signup.name_placeholder')}
                className={`w-full px-4 py-2.5 text-sm rounded-xl border transition-all ${
                  isDark
                    ? 'border-white/15 bg-black/40 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de]'
                    : 'border-gray-300 bg-gray-50/70 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-[#007b8b] focus:ring-2 focus:ring-[#007b8b]/20'
                }`}
              />
            </div>

            {/* Email field */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="signup-email"
                className={`text-xs font-bold uppercase tracking-wide font-mono ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                {t('auth.signup.email_label')}
              </label>
              <input
                id="signup-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className={`w-full px-4 py-2.5 text-sm rounded-xl border transition-all ${
                  isDark
                    ? 'border-white/15 bg-black/40 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de]'
                    : 'border-gray-300 bg-gray-50/70 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-[#007b8b] focus:ring-2 focus:ring-[#007b8b]/20'
                }`}
              />
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="signup-pw"
                className={`text-xs font-bold uppercase tracking-wide font-mono ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                {t('auth.signup.password_label')}
              </label>
              <div className="relative">
                <input
                  id="signup-pw"
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.signup.password_placeholder')}
                  className={`w-full px-4 py-2.5 pr-10 text-sm rounded-xl border transition-all ${
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
                  aria-label={showPw ? t('auth.signup.hide_pw') : t('auth.signup.show_pw')}
                >
                  {showPw ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password field */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="signup-confirm-pw"
                className={`text-xs font-bold uppercase tracking-wide font-mono ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                {t('auth.signup.confirm_password_label')}
              </label>
              <div className="relative">
                <input
                  id="signup-confirm-pw"
                  type={showConfirmPw ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('auth.signup.confirm_password_placeholder')}
                  className={`w-full px-4 py-2.5 pr-10 text-sm rounded-xl border transition-all ${
                    isDark
                      ? 'border-white/15 bg-black/40 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de]'
                      : 'border-gray-300 bg-gray-50/70 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-[#007b8b] focus:ring-2 focus:ring-[#007b8b]/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 cursor-pointer transition-colors ${
                    isDark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-800'
                  }`}
                  aria-label={showConfirmPw ? t('auth.signup.hide_pw') : t('auth.signup.show_pw')}
                >
                  {showConfirmPw ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Credit Welcome Bonus Pill */}
            <div
              className={`flex items-center gap-2 text-xs rounded-xl p-2.5 border transition-colors ${
                isDark
                  ? 'text-gray-300 bg-white/5 border-white/10'
                  : 'text-teal-900 bg-teal-50 border-teal-200'
              }`}
            >
              <CheckCircle size={18} weight="fill" className={isDark ? 'text-[#00c4de] shrink-0' : 'text-[#007b8b] shrink-0'} />
              <span>
                {t('auth.signup.credits_bonus_prefix')}
                <strong>{t('auth.signup.credits_bonus_highlight')}</strong>
                {t('auth.signup.credits_bonus_suffix')}
              </span>
            </div>

            {/* Terms checkbox */}
            <div className="flex items-start gap-2.5 my-1">
              <input
                id="signup-terms"
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className={`w-4 h-4 mt-0.5 rounded cursor-pointer ${
                  isDark ? 'accent-[#00c4de]' : 'accent-[#007b8b]'
                }`}
              />
              <label
                htmlFor="signup-terms"
                className={`text-[11px] leading-relaxed cursor-pointer ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                {t('auth.signup.terms_agree_prefix')}
                <Link to="/terms" className={`hover:underline ${isDark ? 'text-[#00c4de]' : 'text-[#007b8b] font-medium'}`}>
                  {t('auth.signup.terms_service')}
                </Link>
                {t('auth.signup.and')}
                <Link to="/privacy" className={`hover:underline ${isDark ? 'text-[#00c4de]' : 'text-[#007b8b] font-medium'}`}>
                  {t('auth.signup.terms_privacy')}
                </Link>
                {t('auth.signup.terms_of')}
              </label>
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
              disabled={isLoading || !name || !email || !password || !confirmPassword}
              className={`w-full py-3.5 font-bold text-sm rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isDark
                  ? 'bg-[#00c4de] hover:bg-[#38dbf1] text-black shadow-[#00c4de]/25'
                  : 'bg-[#007b8b] hover:bg-[#00606d] text-white shadow-[#007b8b]/25'
              }`}
            >
              {isLoading ? (
                <>
                  <CircleNotch size={18} className="animate-spin" />
                  <span>{t('auth.signup.submitting')}</span>
                </>
              ) : (
                <span>{t('auth.signup.submit')}</span>
              )}
            </button>

            {/* Centered Divider */}
            <div className="relative flex items-center justify-center my-1.5 w-full">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`} />
              </div>
              <div className="relative flex justify-center text-xs">
                <span
                  className={`px-4 text-[11px] font-mono uppercase tracking-widest ${
                    isDark ? 'bg-[#061417] text-gray-400' : 'bg-white text-gray-400'
                  }`}
                >
                  {t('auth.signup.or')}
                </span>
              </div>
            </div>

            {/* Google Sign Up button */}
            <button
              type="button"
              onClick={() => {
                setName('Nguyễn Văn A')
                setEmail('user@gmail.com')
                setPassword('oauth-password')
                setConfirmPassword('oauth-password')
              }}
              className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-full border text-sm font-semibold transition-all shadow-xs active:scale-[0.98] cursor-pointer ${
                isDark
                  ? 'border-white/15 bg-white/5 hover:bg-white/10 text-white'
                  : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-800 shadow-gray-200/50'
              }`}
            >
              <img src="/brand/google-g.png" alt="Google" className="w-5 h-5 object-contain" />
              <span>{t('auth.signup.google')}</span>
            </button>
          </form>

          {/* Footer switch link */}
          <div
            className={`text-center text-xs mt-5 pt-4 border-t ${
              isDark ? 'text-gray-400 border-white/10' : 'text-gray-600 border-gray-100'
            }`}
          >
            <span>{t('auth.signup.has_account')} </span>
            <Link
              to="/login"
              className={`font-bold hover:underline ${
                isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'
              }`}
            >
              {t('auth.signup.go_login')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

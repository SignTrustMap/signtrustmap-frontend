import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeSlash, CircleNotch, WarningCircle } from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/context/AuthContext'
import { env } from '@/config/env'

/**
 * User registration view for the Community Portal.
 * Handles new account creation (defaults to surveyor role) and Google OAuth onboarding.
 */
export default function Signup() {
  const { isDark } = useTheme()
  const { t } = useTranslation('common')
  const { register } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const rawFrom = (location.state as { from?: string })?.from || '/'
  const authPaths = ['/login', '/signup', '/register']
  const from = authPaths.includes(rawFrom) ? '/' : rawFrom

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [nameError, setNameError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null)

  function handleGoogleSignup() {
    window.location.href = `${env.apiBaseUrl}/api/v1/auth/google`
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    let hasError = false

    const cleanName = name.trim()
    if (!cleanName) {
      setNameError(t('auth.signup.name_required'))
      hasError = true
    } else {
      setNameError(null)
    }

    const cleanEmail = email.trim()
    if (!cleanEmail) {
      setEmailError(t('auth.signup.email_required'))
      hasError = true
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(cleanEmail)) {
        setEmailError(t('auth.signup.email_invalid'))
        hasError = true
      } else {
        setEmailError(null)
      }
    }

    if (!password) {
      setPasswordError(t('auth.signup.password_required'))
      hasError = true
    } else if (password.length < 8) {
      setPasswordError(t('auth.signup.password_too_short'))
      hasError = true
    } else {
      setPasswordError(null)
    }

    if (!confirmPassword) {
      setConfirmPasswordError(t('auth.signup.password_required'))
      hasError = true
    } else if (password !== confirmPassword) {
      setConfirmPasswordError(t('auth.signup.password_mismatch'))
      hasError = true
    } else {
      setConfirmPasswordError(null)
    }

    if (!agreeTerms) {
      toast.error(t('auth.signup.terms_error'))
      return
    }

    if (hasError) return

    setIsLoading(true)
    try {
      await Promise.all([
        register({
          fullName: cleanName,
          email: cleanEmail,
          password,
          phone: phone.trim() || undefined,
        }),
        new Promise((resolve) => setTimeout(resolve, 450)),
      ])
      navigate(from, { replace: true })
    } catch (err: any) {
      toast.error(err?.message || t('auth.signup.error_default'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className={`w-full flex-1 flex flex-col items-center justify-center px-4 pt-6 sm:pt-8 pb-12 relative overflow-hidden transition-colors ${
        isDark ? 'bg-[#030708] text-white' : 'bg-[#F8F7F7] text-gray-900'
      }`}
    >
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
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'radial-gradient(circle, #00c4de 1px, transparent 1px), linear-gradient(to right, #00c4de 1px, transparent 1px), linear-gradient(to bottom, #00c4de 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="w-full max-w-md relative z-10 mx-auto">
        <div
          className={`rounded-3xl p-6 sm:p-8 border shadow-2xl text-left transition-all ${
            isDark
              ? 'glass-panel border-white/15 bg-[#061417]/95 backdrop-blur-2xl'
              : 'bg-white border-[#E8E4E3] shadow-gray-200/80'
          }`}
        >
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

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="signup-name"
                className={`text-xs font-bold uppercase tracking-wide font-mono ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                {t('auth.signup.name_label')} <span className="text-rose-500 font-bold ml-0.5" aria-hidden="true">*</span>
              </label>
              <input
                id="signup-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (nameError) setNameError(null)
                }}
                placeholder={t('auth.signup.name_placeholder')}
                aria-invalid={!!nameError}
                aria-describedby={nameError ? 'signup-name-error' : undefined}
                className={`w-full px-4 py-2.5 text-sm rounded-xl border transition-all outline-none ${
                  nameError
                    ? isDark
                      ? 'bg-white/5 border-rose-500 text-white placeholder:text-gray-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                      : 'bg-white border-rose-500 text-gray-900 placeholder:text-gray-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 shadow-xs'
                    : isDark
                      ? 'border-white/15 bg-black/40 text-white placeholder:text-gray-500 focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de]'
                      : 'border-gray-300 bg-gray-50/70 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#007b8b] focus:ring-2 focus:ring-[#007b8b]/20 shadow-xs'
                }`}
              />
              {nameError && (
                <p
                  id="signup-name-error"
                  className="mt-1 text-[12px] text-rose-500 dark:text-rose-400 font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-top-0.5 duration-150"
                >
                  <WarningCircle size={14} weight="fill" className="shrink-0" />
                  <span>{nameError}</span>
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="signup-email"
                className={`text-xs font-bold uppercase tracking-wide font-mono ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                {t('auth.signup.email_label')} <span className="text-rose-500 font-bold ml-0.5" aria-hidden="true">*</span>
              </label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (emailError) setEmailError(null)
                }}
                placeholder="name@example.com"
                aria-invalid={!!emailError}
                aria-describedby={emailError ? 'signup-email-error' : undefined}
                className={`w-full px-4 py-2.5 text-sm rounded-xl border transition-all outline-none ${
                  emailError
                    ? isDark
                      ? 'bg-white/5 border-rose-500 text-white placeholder:text-gray-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                      : 'bg-white border-rose-500 text-gray-900 placeholder:text-gray-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 shadow-xs'
                    : isDark
                      ? 'border-white/15 bg-black/40 text-white placeholder:text-gray-500 focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de]'
                      : 'border-gray-300 bg-gray-50/70 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#007b8b] focus:ring-2 focus:ring-[#007b8b]/20 shadow-xs'
                }`}
              />
              {emailError && (
                <p
                  id="signup-email-error"
                  className="mt-1 text-[12px] text-rose-500 dark:text-rose-400 font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-top-0.5 duration-150"
                >
                  <WarningCircle size={14} weight="fill" className="shrink-0" />
                  <span>{emailError}</span>
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="signup-phone"
                className={`text-xs font-bold uppercase tracking-wide font-mono ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                {t('auth.signup.phone_label')}
              </label>
              <input
                id="signup-phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('auth.signup.phone_placeholder')}
                className={`w-full px-4 py-2.5 text-sm rounded-xl border transition-all outline-none ${
                  isDark
                    ? 'border-white/15 bg-black/40 text-white placeholder:text-gray-500 focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de]'
                    : 'border-gray-300 bg-gray-50/70 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#007b8b] focus:ring-2 focus:ring-[#007b8b]/20 shadow-xs'
                }`}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="signup-pw"
                className={`text-xs font-bold uppercase tracking-wide font-mono ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                {t('auth.signup.password_label')} <span className="text-rose-500 font-bold ml-0.5" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <input
                  id="signup-pw"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (passwordError) setPasswordError(null)
                  }}
                  placeholder={t('auth.signup.password_placeholder')}
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? 'signup-pw-error' : undefined}
                  className={`w-full px-4 py-2.5 pr-10 text-sm rounded-xl border transition-all outline-none ${
                    passwordError
                      ? isDark
                        ? 'bg-white/5 border-rose-500 text-white placeholder:text-gray-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                        : 'bg-white border-rose-500 text-gray-900 placeholder:text-gray-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 shadow-xs'
                      : isDark
                        ? 'border-white/15 bg-black/40 text-white placeholder:text-gray-500 focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de]'
                        : 'border-gray-300 bg-gray-50/70 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#007b8b] focus:ring-2 focus:ring-[#007b8b]/20 shadow-xs'
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
              {passwordError && (
                <p
                  id="signup-pw-error"
                  className="mt-1 text-[12px] text-rose-500 dark:text-rose-400 font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-top-0.5 duration-150"
                >
                  <WarningCircle size={14} weight="fill" className="shrink-0" />
                  <span>{passwordError}</span>
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="signup-confirm-pw"
                className={`text-xs font-bold uppercase tracking-wide font-mono ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                {t('auth.signup.confirm_password_label')} <span className="text-rose-500 font-bold ml-0.5" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <input
                  id="signup-confirm-pw"
                  type={showConfirmPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (confirmPasswordError) setConfirmPasswordError(null)
                  }}
                  placeholder={t('auth.signup.confirm_password_placeholder')}
                  aria-invalid={!!confirmPasswordError}
                  aria-describedby={confirmPasswordError ? 'signup-confirm-pw-error' : undefined}
                  className={`w-full px-4 py-2.5 pr-10 text-sm rounded-xl border transition-all outline-none ${
                    confirmPasswordError
                      ? isDark
                        ? 'bg-white/5 border-rose-500 text-white placeholder:text-gray-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                        : 'bg-white border-rose-500 text-gray-900 placeholder:text-gray-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 shadow-xs'
                      : isDark
                        ? 'border-white/15 bg-black/40 text-white placeholder:text-gray-500 focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de]'
                        : 'border-gray-300 bg-gray-50/70 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-[#007b8b] focus:ring-2 focus:ring-[#007b8b]/20 shadow-xs'
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
              {confirmPasswordError && (
                <p
                  id="signup-confirm-pw-error"
                  className="mt-1 text-[12px] text-rose-500 dark:text-rose-400 font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-top-0.5 duration-150"
                >
                  <WarningCircle size={14} weight="fill" className="shrink-0" />
                  <span>{confirmPasswordError}</span>
                </p>
              )}
            </div>


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
                <Link
                  to="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`hover:underline ${isDark ? 'text-[#00c4de]' : 'text-[#007b8b] font-semibold'}`}
                >
                  {t('auth.signup.terms_service')}
                </Link>
                {t('auth.signup.and')}
                <Link
                  to="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`hover:underline ${isDark ? 'text-[#00c4de]' : 'text-[#007b8b] font-semibold'}`}
                >
                  {t('auth.signup.terms_privacy')}
                </Link>
                {t('auth.signup.terms_of')}
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
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

            <button
              type="button"
              onClick={handleGoogleSignup}
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

import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { Eye, EyeSlash, CircleNotch } from '@phosphor-icons/react'


export default function LoginPage() {
  const { login, isLoading } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)

      // Redirect based on role — AuthContext sets user.role
      // We re-read after login via the auth context update cycle
      // Role-based redirect happens in the effect below via the router guard
      const next = params.get('next') ?? null

      // Re-read role from context isn't instant — use email heuristic for immediate redirect
      // In production, server returns role in cookie payload or /auth/me response
      const isAdmin = email.toLowerCase().includes('admin')
      if (next) {
        navigate(next, { replace: true })
      } else {
        navigate(isAdmin ? '/admin' : '/map', { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại')
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#F8F7F7] flex items-center justify-center px-4">
      {/* Card */}
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <img
            src="/brand/brand_logo_nobg.svg"
            alt="SignTrustMap Logo"
            className="w-14 h-14 object-contain mb-3"
          />
          <h1 className="text-2xl font-bold text-gray-900 font-brand">
            Sign<span className="text-[#007b8b]">Trust</span>Map
          </h1>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-mono">
            Hệ thống vận hành Ops Portal
          </p>
        </div>


        {/* Form card */}
        <div className="bg-white rounded-[14px] border border-[#E8E4E3] p-6 shadow-sm">
          {/* Google Sign In button */}
          <button
            type="button"
            onClick={() => {
              setEmail('staff@signtrustmap.site')
              setPassword('google-oauth')
            }}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-[6px] border border-[#E8E4E3] hover:bg-[#F8F7F7] text-sm font-medium text-gray-700 transition-all shadow-sm active:scale-[0.98] mb-5"
          >
            <img src="/brand/google-g.png" alt="Google" className="w-5 h-5 object-contain" />
            <span>Tiếp tục với Google Workspace</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center mb-5">
            <div className="border-t border-[#E8E4E3] w-full" />
            <span className="bg-white px-3 text-[11px] text-gray-400 uppercase tracking-wider shrink-0 font-medium">
              Hoặc tài khoản nội bộ
            </span>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ops-email" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Email
              </label>

              <input
                id="ops-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@signtrustmap.site"
                className="w-full px-3 py-2.5 text-sm rounded-[4px] border border-[#E8E4E3] bg-white text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-[#007b8b] focus:ring-2 focus:ring-[#007b8b]/20 transition-all"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ops-password" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="ops-password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 pr-10 text-sm rounded-[4px] border border-[#E8E4E3] bg-white text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-[#007b8b] focus:ring-2 focus:ring-[#007b8b]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPw ? <EyeSlash size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p role="alert" className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-[4px] px-3 py-2">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#007b8b] text-white text-sm font-semibold rounded-[4px] hover:bg-[#006272] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-1"
            >
              {isLoading ? (
                <>
                  <CircleNotch size={16} className="animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>

          {/* Dev hint */}
          {import.meta.env.DEV && (
            <div className="mt-4 pt-4 border-t border-[#E8E4E3]">
              <p className="text-[11px] text-gray-400 text-center mb-2">Dev quick login:</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setEmail('staff@example.com'); setPassword('password') }}
                  className="flex-1 py-1.5 text-xs border border-[#E8E4E3] rounded-[4px] hover:bg-[#F8F7F7] text-gray-600 transition-colors"
                >
                  Staff
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('admin@example.com'); setPassword('password') }}
                  className="flex-1 py-1.5 text-xs border border-[#E8E4E3] rounded-[4px] hover:bg-[#F8F7F7] text-gray-600 transition-colors"
                >
                  Admin
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          Chỉ dành cho nhân viên SignTrustMap
        </p>
      </div>
    </div>
  )
}

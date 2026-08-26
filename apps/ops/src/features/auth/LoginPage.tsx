import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { Eye, EyeSlash, CircleNotch, ShieldCheck, ArrowSquareOut } from '@phosphor-icons/react'

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
      const next = params.get('next') ?? null
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
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-[#F4F7F9] text-gray-900 overflow-hidden font-sans">
      {/* 3D Wireframe Terrain Background Asset (Light Theme Adaption) */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <img
          src="/images/hero-wireframe.jpg"
          alt="3D Wireframe Terrain Mesh"
          className="w-full h-full object-cover object-bottom opacity-12 mix-blend-multiply brightness-90 contrast-125"
        />

        {/* Overhead soft teal/cyan spotlight beam */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#007b8b]/12 via-[#00c4de]/6 to-transparent blur-[120px]" />

        {/* Soft radial scrim behind card */}
        <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-white/70 rounded-full blur-[100px]" />

        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle, #007b8b 1px, transparent 1px), linear-gradient(to right, #007b8b 1px, transparent 1px), linear-gradient(to bottom, #007b8b 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Top Header */}
      <header className="relative z-10 w-full px-6 sm:px-12 py-5 flex items-center justify-between">
        {/* Logo */}
        <a
          href="/"
          className="flex items-center gap-3 font-brand font-bold text-xl text-gray-900 group"
        >
          <img
            src="/brand/brand_logo_nobg.svg"
            alt="SignTrustMap Logo"
            className="w-8 h-8 object-contain group-hover:scale-105 transition-transform"
          />
          <div className="flex items-center gap-2">
            <span className="tracking-tight text-xl font-bold font-sans">
              Sign<span className="text-[#007b8b]">Trust</span>Map
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#007b8b]/15 text-[#007b8b] border border-[#007b8b]/25 uppercase">
              Ops Portal
            </span>
          </div>
        </a>

        {/* Link back to public web */}
        <a
          href="http://localhost:5173"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-[#007b8b] transition-colors bg-white/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-gray-200 shadow-sm"
        >
          <span>Cổng cộng đồng</span>
          <ArrowSquareOut size={13} />
        </a>
      </header>

      {/* Main Card Container */}
      <main className="relative z-10 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[480px] bg-white rounded-[24px] shadow-xl border border-gray-200/80 p-8 sm:p-10 text-gray-900 animate-in fade-in zoom-in-95 duration-300">
          {/* Card Title */}
          <div className="text-left mb-6">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#007b8b] mb-2 uppercase tracking-wide">
              <ShieldCheck size={16} weight="fill" />
              <span>Hệ thống vận hành nội bộ</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Đăng nhập Ops Portal
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1.5 leading-relaxed">
              Dành riêng cho kiểm duyệt viên (Reviewer) và quản trị viên (Admin).
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {/* Email field */}
            <div className="flex flex-col gap-1.5 text-left">
              <label
                htmlFor="ops-email"
                className="text-xs font-bold text-[#007b8b] font-mono uppercase tracking-wide"
              >
                email<span className="text-red-500">*</span>
              </label>

              <input
                id="ops-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@signtrustmap.site"
                className="w-full px-4 py-3 text-sm rounded-xl border border-gray-300 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-[#007b8b] focus:ring-2 focus:ring-[#007b8b]/20 transition-all"
              />
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-1.5 text-left">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="ops-password"
                  className="text-xs font-bold text-[#007b8b] font-mono uppercase tracking-wide"
                >
                  mật khẩu<span className="text-red-500">*</span>
                </label>
                <a href="#" className="text-[11px] text-[#007b8b] hover:underline">
                  Quên mật khẩu?
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
                  className="w-full px-4 py-3 pr-10 text-sm rounded-xl border border-gray-300 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-[#007b8b] focus:ring-2 focus:ring-[#007b8b]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                  aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPw ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <p role="alert" className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 text-left">
                {error}
              </p>
            )}

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="mt-1 w-full py-3.5 bg-[#007b8b] hover:bg-[#006573] text-white font-bold text-sm rounded-full shadow-lg shadow-[#007b8b]/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <CircleNotch size={18} className="animate-spin" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <span>Đăng nhập hệ thống</span>
              )}
            </button>

            {/* Centered Divider */}
            <div className="relative flex items-center justify-center my-1 w-full">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-4 text-[11px] font-mono text-gray-400 uppercase tracking-widest">
                  HOẶC
                </span>
              </div>
            </div>

            {/* Google Sign In button (Placed below) */}
            <button
              type="button"
              onClick={() => {
                setEmail('staff@signtrustmap.site')
                setPassword('google-oauth')
              }}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-full border border-gray-300 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-700 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
            >
              <img src="/brand/google-g.png" alt="Google" className="w-5 h-5 object-contain" />
              <span>Tiếp tục với Google</span>
            </button>

          </form>

          {/* Dev Quick Logins */}
          {import.meta.env.DEV && (
            <div className="mt-6 pt-5 border-t border-gray-100 text-left">
              <p className="text-[10px] font-mono uppercase text-gray-400 mb-2">
                Đăng nhập nhanh môi trường Dev:
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('staff@example.com')
                    setPassword('password')
                  }}
                  className="flex-1 py-2 text-xs font-semibold bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-700 transition-colors"
                >
                  👤 Staff Portal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@example.com')
                    setPassword('password')
                  }}
                  className="flex-1 py-2 text-xs font-semibold bg-[#007b8b]/10 hover:bg-[#007b8b]/20 border border-[#007b8b]/30 rounded-xl text-[#007b8b] transition-colors"
                >
                  ⚡ Admin Portal
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full px-6 py-5 text-center text-xs text-gray-500">
        <p>© {new Date().getFullYear()} SignTrustMap Ops Portal • Hệ thống quản trị nội bộ bảo mật</p>
      </footer>
    </div>
  )
}

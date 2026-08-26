import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeSlash, CircleNotch, ArrowLeft } from '@phosphor-icons/react'

export default function Login() {
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
      // Simulate login for public community user
      await new Promise((r) => setTimeout(r, 600))
      navigate('/product/map', { replace: true })
    } catch {
      setError('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-[#030708] text-white flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#00c4de]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          <span>Quay lại trang chủ</span>
        </Link>

        {/* Card */}
        <div className="glass-panel rounded-[20px] p-8 border border-white/10 shadow-2xl bg-[#061417]/90 backdrop-blur-2xl">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <img
              src="/brand/brand_logo_nobg.svg"
              alt="SignTrustMap Logo"
              className="w-12 h-12 object-contain mb-3"
            />
            <h1 className="text-2xl font-bold text-white tracking-tight font-sans">
              Đăng nhập Sign<span className="text-[#00c4de]">Trust</span>Map
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Truy cập tài khoản cộng đồng để xem và đóng góp biển báo
            </p>
          </div>

          {/* Google Sign In button */}
          <button
            type="button"
            onClick={() => {
              setEmail('user@gmail.com')
              setPassword('oauth-password')
            }}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-sm font-medium text-white transition-all shadow-sm active:scale-[0.98] mb-5"
          >
            <img src="/brand/google-g.png" alt="Google" className="w-5 h-5 object-contain" />
            <span>Tiếp tục với Google</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center mb-5">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-[#081518] px-3 text-[11px] text-gray-400 uppercase tracking-wider shrink-0 font-medium">
              Hoặc với email
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-email" className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-white/15 bg-black/40 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de] transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="login-pw" className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
                  Mật khẩu
                </label>
                <a href="#" className="text-[11px] text-[#00c4de] hover:underline">
                  Quên mật khẩu?
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
                  className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-lg border border-white/15 bg-black/40 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPw ? <EyeSlash size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-950/40 border border-red-800/60 rounded-lg p-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="mt-2 w-full py-3 bg-[#00c4de] hover:bg-[#38dbf1] text-black font-bold text-sm rounded-full shadow-lg shadow-[#00c4de]/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <CircleNotch size={16} className="animate-spin" />
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <span>Đăng nhập</span>
              )}
            </button>
          </form>

          {/* Footer link */}
          <p className="text-center text-xs text-gray-400 mt-6 pt-5 border-t border-white/10">
            Chưa có tài khoản?{' '}
            <Link to="/signup" className="text-[#00c4de] font-semibold hover:underline">
              Đăng ký miễn phí
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

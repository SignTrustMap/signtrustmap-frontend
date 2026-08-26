import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeSlash, CircleNotch } from '@phosphor-icons/react'



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
      await new Promise((r) => setTimeout(r, 600))
      navigate('/product/map', { replace: true })
    } catch {
      setError('Đăng nhập thất bại. Vui lòng kiểm tra lại email hoặc mật khẩu.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center bg-[#030708] text-white px-4 py-12 sm:py-16 relative overflow-hidden">
      {/* 3D Wireframe Terrain Background Asset */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <img
          src="/images/hero-wireframe.jpg"
          alt="3D Wireframe Terrain Mesh"
          className="w-full h-full object-cover object-bottom opacity-45 brightness-[0.75] contrast-[1.2] mix-blend-screen"
        />
        {/* Overhead soft spotlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-[#00c4de]/15 via-[#007b8b]/6 to-transparent blur-[130px]" />
        {/* Dark Vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#030708]/90 via-[#030708]/60 to-[#030708]" />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-[460px] relative z-10 mx-auto">
        {/* Dark Glassmorphic Card */}
        <div className="glass-panel rounded-[24px] p-6 sm:p-8 border border-white/15 shadow-2xl bg-[#061417]/95 backdrop-blur-2xl text-left">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <Link to="/" className="inline-block mb-3 hover:scale-105 transition-transform">
              <img
                src="/brand/brand_logo_nobg.svg"
                alt="SignTrustMap Logo"
                className="w-12 h-12 object-contain"
              />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
              Đăng nhập Sign<span className="text-[#00c4de]">Trust</span>Map
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1.5 leading-relaxed">
              Truy cập tài khoản cộng đồng để xem và đóng góp biển báo
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {/* Email field */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="login-email"
                className="text-xs font-semibold text-gray-300 uppercase tracking-wide font-mono"
              >
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
                className="w-full px-4 py-3 text-sm rounded-xl border border-white/15 bg-black/40 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de] transition-all"
              />
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-pw"
                  className="text-xs font-semibold text-gray-300 uppercase tracking-wide font-mono"
                >
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
                  className="w-full px-4 py-3 pr-10 text-sm rounded-xl border border-white/15 bg-black/40 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 cursor-pointer"
                  aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPw ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-950/40 border border-red-800/60 rounded-xl p-3">
                {error}
              </p>
            )}

            {/* Primary Submit button */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="mt-1 w-full py-3.5 bg-[#00c4de] hover:bg-[#38dbf1] text-black font-bold text-sm rounded-full shadow-lg shadow-[#00c4de]/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <CircleNotch size={18} className="animate-spin" />
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <span>Đăng nhập</span>
              )}
            </button>

            {/* Centered Divider */}
            <div className="relative flex items-center justify-center my-2 w-full">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#061417] px-4 text-[11px] font-mono text-gray-400 uppercase tracking-widest">
                  HOẶC
                </span>
              </div>
            </div>

            {/* Google Sign In button (Placed below) */}
            <button
              type="button"
              onClick={() => {
                setEmail('user@gmail.com')
                setPassword('oauth-password')
              }}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-sm font-semibold text-white transition-all shadow-sm active:scale-[0.98] cursor-pointer"
            >
              <img src="/brand/google-g.png" alt="Google" className="w-5 h-5 object-contain" />
              <span>Đăng nhập với Google</span>
            </button>
          </form>


          {/* Footer switch link */}
          <div className="text-center text-xs text-gray-400 mt-6 pt-5 border-t border-white/10">
            <span>Chưa có tài khoản? </span>
            <Link to="/signup" className="text-[#00c4de] font-bold hover:underline">
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}


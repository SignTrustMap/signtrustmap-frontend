import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeSlash, CircleNotch, CheckCircle } from '@phosphor-icons/react'


export default function Signup() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(true)
  const [showPw, setShowPw] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!agreeTerms) {
      setError('Vui lòng đồng ý với Điều khoản dịch vụ và Chính sách bảo mật để tiếp tục.')
      return
    }
    setError('')
    setIsLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 600))
      navigate('/product/app', { replace: true })
    } catch {
      setError('Đăng ký không thành công. Vui lòng thử lại.')
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
              Tạo tài khoản Sign<span className="text-[#00c4de]">Trust</span>Map
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1.5 leading-relaxed">
              Bắt đầu tham gia đóng góp và trải nghiệm bản đồ biển báo tin cậy
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3.5">
            {/* Name field */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="signup-name"
                className="text-xs font-semibold text-gray-300 uppercase tracking-wide font-mono"
              >
                Họ và tên
              </label>
              <input
                id="signup-name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-white/15 bg-black/40 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de] transition-all"
              />
            </div>

            {/* Email field */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="signup-email"
                className="text-xs font-semibold text-gray-300 uppercase tracking-wide font-mono"
              >
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-white/15 bg-black/40 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de] transition-all"
              />
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="signup-pw"
                className="text-xs font-semibold text-gray-300 uppercase tracking-wide font-mono"
              >
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="signup-pw"
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 8 ký tự"
                  className="w-full px-4 py-2.5 pr-10 text-sm rounded-xl border border-white/15 bg-black/40 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de] transition-all"
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

            {/* Credit Welcome Bonus Pill */}
            <div className="flex items-center gap-2 text-xs text-gray-300 bg-white/5 border border-white/10 rounded-xl p-2.5">
              <CheckCircle size={18} weight="fill" className="text-[#00c4de] shrink-0" />
              <span>Tặng ngay <strong>50 Credits</strong> khi kích hoạt tài khoản</span>
            </div>

            {/* Terms checkbox placed BEFORE Sign up button per user request */}
            <div className="flex items-start gap-2.5 my-1">
              <input
                id="agree-terms"
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#00c4de] border-white/20 bg-black/40 focus:ring-[#00c4de] cursor-pointer"
              />
              <label htmlFor="agree-terms" className="text-xs text-gray-300 leading-relaxed cursor-pointer">
                Bằng việc đăng ký bên dưới, tôi đồng ý với{' '}
                <Link to="/terms" className="text-[#00c4de] underline font-medium hover:text-[#38dbf1]">
                  Điều khoản dịch vụ
                </Link>{' '}
                và{' '}
                <Link to="/privacy" className="text-[#00c4de] underline font-medium hover:text-[#38dbf1]">
                  Chính sách bảo mật
                </Link>{' '}
                của SignTrustMap.
              </label>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-950/40 border border-red-800/60 rounded-xl p-3">
                {error}
              </p>
            )}

            {/* Submit button: Sign up with Email */}
            <button
              type="submit"
              disabled={isLoading || !name || !email || !password || !agreeTerms}
              className="mt-1 w-full py-3.5 bg-[#00c4de] hover:bg-[#38dbf1] text-black font-bold text-sm rounded-full shadow-lg shadow-[#00c4de]/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <CircleNotch size={18} className="animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <span>Đăng ký với Email</span>
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

            {/* Google Sign Up button (Placed below per user request) */}
            <button
              type="button"
              onClick={() => {
                setName('Người dùng mới')
                setEmail('user@gmail.com')
                setPassword('oauth-password')
              }}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-sm font-semibold text-white transition-all shadow-sm active:scale-[0.98] cursor-pointer"
            >
              <img src="/brand/google-g.png" alt="Google" className="w-5 h-5 object-contain" />
              <span>Đăng ký với Google</span>
            </button>
          </form>


          {/* Footer switch link */}
          <div className="text-center text-xs text-gray-400 mt-6 pt-5 border-t border-white/10">
            <span>Đã có tài khoản? </span>
            <Link to="/login" className="text-[#00c4de] font-bold hover:underline">
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

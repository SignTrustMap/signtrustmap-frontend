import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeSlash, CircleNotch, ArrowLeft, CheckCircle } from '@phosphor-icons/react'

export default function Signup() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
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
      // Simulate registration
      await new Promise((r) => setTimeout(r, 600))
      navigate('/product/app', { replace: true })
    } catch {
      setError('Đăng ký không thành công. Vui lòng thử lại.')
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
              Tạo tài khoản Sign<span className="text-[#00c4de]">Trust</span>Map
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Bắt đầu tham gia mạng lưới khảo sát và cảnh báo biển báo thông minh
            </p>
          </div>

          {/* Google Sign Up button */}
          <button
            type="button"
            onClick={() => {
              setName('Người dùng mới')
              setEmail('user@gmail.com')
              setPassword('oauth-password')
            }}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-sm font-medium text-white transition-all shadow-sm active:scale-[0.98] mb-5"
          >
            <img src="/brand/google-g.png" alt="Google" className="w-5 h-5 object-contain" />
            <span>Đăng ký nhanh với Google</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center mb-5">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-[#081518] px-3 text-[11px] text-gray-400 uppercase tracking-wider shrink-0 font-medium">
              Hoặc với email
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="signup-name" className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
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
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-white/15 bg-black/40 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de] transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="signup-email" className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
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
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-white/15 bg-black/40 text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de] transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="signup-pw" className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
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

            {/* Checklist */}
            <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-1">
              <CheckCircle size={14} weight="fill" className="text-[#00c4de]" />
              <span>Được tặng ngay 50 Credits khi kích hoạt tài khoản</span>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-950/40 border border-red-800/60 rounded-lg p-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading || !name || !email || !password}
              className="mt-2 w-full py-3 bg-[#00c4de] hover:bg-[#38dbf1] text-black font-bold text-sm rounded-full shadow-lg shadow-[#00c4de]/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <CircleNotch size={16} className="animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <span>Tạo tài khoản</span>
              )}
            </button>
          </form>

          {/* Footer link */}
          <p className="text-center text-xs text-gray-400 mt-6 pt-5 border-t border-white/10">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-[#00c4de] font-semibold hover:underline">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

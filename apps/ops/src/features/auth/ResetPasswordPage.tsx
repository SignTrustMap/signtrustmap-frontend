import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import {
  LockKey,
  Eye,
  EyeSlash,
  CheckCircle,
  ShieldCheck,
} from '@phosphor-icons/react'

export default function ResetPasswordPage() {
  const { isDark } = useTheme()
  const { success } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const emailParam = searchParams.get('email') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const hasMinLength = password.length >= 8
  const hasNumber = /\d/.test(password)
  const passwordsMatch = password.length > 0 && password === confirmPassword
  const isFormValid = hasMinLength && hasNumber && passwordsMatch

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return

    setIsSubmitting(true)
    await new Promise((r) => setTimeout(r, 600))
    setIsSubmitting(false)
    setIsSuccess(true)
    success('Mật khẩu tài khoản nhân sự đã được cập nhật thành công!')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8F7F7] dark:bg-[#030708] transition-colors">
      <div
        className={`w-full max-w-md rounded-2xl border p-6 sm:p-8 shadow-xl text-left transition-colors ${
          isDark ? 'bg-[#071317] border-white/10 text-white' : 'bg-white border-[#E8E4E3] text-gray-900'
        }`}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#007b8b]/15 dark:bg-[#00c4de]/15 text-[#007b8b] dark:text-[#00c4de] flex items-center justify-center shrink-0">
            <LockKey size={22} weight="duotone" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Thiết lập Mật khẩu Mới</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {emailParam ? `Tài khoản: ${emailParam}` : 'Cổng Vận hành SignTrustMap Ops'}
            </p>
          </div>
        </div>

        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Mật khẩu mới
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-4 py-2.5 pr-10 text-xs rounded-xl border focus:outline-none focus:ring-2 ${
                    isDark
                      ? 'bg-[#030708] border-white/15 text-white placeholder:text-gray-500 focus:border-[#00c4de] focus:ring-[#00c4de]/20'
                      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#007b8b] focus:ring-[#007b8b]/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 cursor-pointer"
                >
                  {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Xác nhận mật khẩu
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full px-4 py-2.5 text-xs rounded-xl border focus:outline-none focus:ring-2 ${
                  isDark
                    ? 'bg-[#030708] border-white/15 text-white placeholder:text-gray-500 focus:border-[#00c4de] focus:ring-[#00c4de]/20'
                    : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#007b8b] focus:ring-[#007b8b]/20'
                }`}
              />
            </div>

            <div className={`p-3 rounded-xl border text-xs space-y-1 ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
              <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-500' : 'text-gray-400'}`}>
                <CheckCircle size={14} weight={hasMinLength ? 'fill' : 'regular'} />
                <span>Tối thiểu 8 ký tự</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-500' : 'text-gray-400'}`}>
                <CheckCircle size={14} weight={hasNumber ? 'fill' : 'regular'} />
                <span>Chứa ít nhất 1 chữ số</span>
              </div>
              <div className={`flex items-center gap-1.5 ${passwordsMatch ? 'text-emerald-500' : 'text-gray-400'}`}>
                <CheckCircle size={14} weight={passwordsMatch ? 'fill' : 'regular'} />
                <span>Mật khẩu xác nhận trùng khớp</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !isFormValid}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold transition-all shadow-xs cursor-pointer ${
                isDark
                  ? 'bg-[#00c4de] hover:bg-[#38dbf1] text-black disabled:opacity-40'
                  : 'bg-[#007b8b] hover:bg-[#00606d] text-white disabled:opacity-40'
              }`}
            >
              <LockKey size={15} weight="bold" />
              <span>{isSubmitting ? 'Đang cập nhật...' : 'Xác nhận Mật khẩu Mới'}</span>
            </button>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle size={28} weight="fill" />
            </div>
            <div>
              <h2 className="text-base font-bold">Đặt lại mật khẩu thành công</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Bạn có thể đăng nhập vào cổng vận hành bằng mật khẩu mới vừa tạo.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isDark ? 'bg-[#00c4de] text-black' : 'bg-[#007b8b] text-white'
              }`}
            >
              Đăng nhập ngay
            </button>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-between text-xs">
          <Link to="/login" className="font-bold text-gray-600 dark:text-gray-300 hover:text-[#007b8b] dark:hover:text-[#00c4de]">
            Quay lại Đăng nhập
          </Link>
          <span className="text-gray-400 flex items-center gap-1">
            <ShieldCheck size={14} />
            <span>FIDO2 / 256-bit</span>
          </span>
        </div>
      </div>
    </div>
  )
}

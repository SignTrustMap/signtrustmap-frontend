import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import {
  Key,
  ArrowLeft,
  PaperPlaneRight,
  CheckCircle,
  EnvelopeSimple,
} from '@phosphor-icons/react'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const { isDark } = useTheme()
  const toast = useToast()

  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [mockResetLink, setMockResetLink] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsSubmitting(true)
    await new Promise((r) => setTimeout(r, 600))
    setIsSubmitting(false)
    setIsSubmitted(true)

    const token = `web_sec_${Math.random().toString(36).substring(2, 12)}`
    setMockResetLink(`/reset-password?token=${token}&email=${encodeURIComponent(email.trim())}`)
    toast.success(t('auth_recovery.toast_sent'))
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 transition-colors">
      <div
        className={`w-full max-w-md rounded-2xl border p-6 sm:p-8 shadow-xl text-left transition-colors ${
          isDark ? 'bg-[#071317] border-white/10 text-white' : 'bg-white border-[#E8E4E3] text-gray-900'
        }`}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#007b8b]/15 dark:bg-[#00c4de]/15 text-[#007b8b] dark:text-[#00c4de] flex items-center justify-center shrink-0">
            <Key size={22} weight="duotone" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{t('auth_recovery.forgot_title')}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {t('auth_recovery.forgot_subtitle')}
            </p>
          </div>
        </div>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-xs">
              {t('auth_recovery.forgot_desc')}
            </p>

            <div>
              <label className="block font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                {t('auth_recovery.email_label')}
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth_recovery.email_placeholder')}
                  className={`w-full px-4 py-2.5 pl-10 text-xs rounded-xl border focus:outline-none focus:ring-2 ${
                    isDark
                      ? 'bg-[#030708] border-white/15 text-white placeholder:text-gray-500 focus:border-[#00c4de] focus:ring-[#00c4de]/20'
                      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#007b8b] focus:ring-[#007b8b]/20'
                  }`}
                />
                <EnvelopeSimple size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold transition-all shadow-xs cursor-pointer ${
                isDark
                  ? 'bg-[#00c4de] hover:bg-[#38dbf1] text-black disabled:opacity-50'
                  : 'bg-[#007b8b] hover:bg-[#00606d] text-white disabled:opacity-50'
              }`}
            >
              <PaperPlaneRight size={15} weight="bold" />
              <span>{isSubmitting ? t('auth_recovery.btn_sending') : t('auth_recovery.btn_send_link')}</span>
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-300 flex items-start gap-2.5">
              <CheckCircle size={20} weight="fill" className="text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <p className="font-bold text-sm">{t('auth_recovery.sent_title')}</p>
                <p className="mt-1">
                  {t('auth_recovery.sent_desc', { email })}
                </p>
              </div>
            </div>

            {mockResetLink && (
              <div className={`p-3 rounded-xl border text-xs ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                <span className="text-[10px] font-bold text-[#007b8b] dark:text-[#00c4de] uppercase tracking-wider block mb-1">
                  {t('auth_recovery.demo_helper')}
                </span>
                <Link to={mockResetLink} className="font-mono text-xs underline text-gray-600 dark:text-gray-300 hover:text-[#007b8b] dark:hover:text-[#00c4de] break-all">
                  {mockResetLink}
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-between text-xs">
          <Link
            to="/login"
            className="flex items-center gap-1.5 font-bold text-gray-600 dark:text-gray-300 hover:text-[#007b8b] dark:hover:text-[#00c4de]"
          >
            <ArrowLeft size={14} weight="bold" />
            <span>{t('auth_recovery.back_login')}</span>
          </Link>
          <Link
            to="/signup"
            className="font-bold text-[#007b8b] dark:text-[#00c4de] hover:underline"
          >
            {t('auth_recovery.register_account')}
          </Link>
        </div>
      </div>
    </div>
  )
}

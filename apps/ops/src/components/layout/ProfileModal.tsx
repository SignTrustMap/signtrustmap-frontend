import { useState, useEffect, type FormEvent } from 'react'
import {
  User,
  Envelope,
  Key,
  Eye,
  EyeSlash,
  Copy,
  Check,
  Lock,
  X,
  CircleNotch,
  WarningCircle,
} from '@phosphor-icons/react'
import { isValidVietnamPhone, normalizeVietnamPhone } from '@shared/types'
import { Avatar, AvatarImage, AvatarFallback, getInitials } from '@shared/ui'
import { useAuth } from '@/features/auth/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { useTranslation } from 'react-i18next'
import { ModalPortal } from '@/components/common/ModalPortal'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Profile management modal dialog for the Operations Command Center.
 * Allows authenticated operators to inspect system roles, update profile contacts
 * (fullName, phone) via NestJS backend, and update security credentials.
 */
export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, updateProfile } = useAuth()
  const { isDark } = useTheme()
  const { t } = useTranslation('common')
  const toast = useToast()

  const [activeTab, setActiveTab] = useState<'info' | 'security'>('info')
  const [name, setName] = useState(user?.name || '')
  const [nameError, setNameError] = useState<string | null>(null)
  const [phone, setPhone] = useState(user?.phone || '')
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setPhone(user.phone || '')
    }
    setNameError(null)
    setPhoneError(null)
  }, [user, isOpen])

  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !user) return null

  const isAdmin = user.role === 'admin'

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(user.email)
    setCopiedEmail(true)
    toast.success(t('profile.copied', { defaultValue: 'Đã sao chép' }))
    setTimeout(() => setCopiedEmail(false), 2000)
  }

  const handlePhoneChange = (val: string) => {
    setPhone(val)
    if (phoneError) setPhoneError(null)
  }

  const handlePhoneBlur = () => {
    const trimmed = phone.trim()
    if (trimmed && !isValidVietnamPhone(trimmed)) {
      setPhoneError(
        t('profile.phone_invalid', {
          defaultValue: 'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại gồm 10 chữ số (Ví dụ: 0912 345 678).',
        })
      )
    }
  }

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault()
    let hasError = false

    const trimmedName = name.trim()
    if (!trimmedName) {
      setNameError(t('profile.name_required', { defaultValue: 'Họ tên không được để trống' }))
      hasError = true
    } else {
      setNameError(null)
    }

    const trimmedPhone = phone.trim()
    if (trimmedPhone && !isValidVietnamPhone(trimmedPhone)) {
      setPhoneError(
        t('profile.phone_invalid', {
          defaultValue: 'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại gồm 10 chữ số (Ví dụ: 0912 345 678).',
        })
      )
      hasError = true
    } else {
      setPhoneError(null)
    }

    if (hasError) return

    setIsSaving(true)
    try {
      await updateProfile({
        fullName: trimmedName,
        phone: trimmedPhone ? normalizeVietnamPhone(trimmedPhone) : undefined,
      })
      toast.success(t('profile.save_success', { defaultValue: 'Đã lưu thông tin tài khoản thành công!' }))
    } catch (err) {
      console.error('Failed to update ops profile:', err)
      toast.error(t('profile.save_error', { defaultValue: 'Cập nhật thông tin thất bại. Vui lòng thử lại.' }))
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = (e: FormEvent) => {
    e.preventDefault()
    if (!newPw || newPw.length < 8) {
      toast.error(t('profile.pw_too_short', { defaultValue: 'Mật khẩu phải có tối thiểu 8 ký tự' }))
      return
    }
    if (newPw !== confirmPw) {
      toast.error(t('profile.pw_mismatch', { defaultValue: 'Mật khẩu xác nhận không khớp' }))
      return
    }
    updateProfile({ password: newPw } as any)
    setCurrentPw('')
    setNewPw('')
    setConfirmPw('')
    toast.success(t('profile.pw_change_success', { defaultValue: 'Đã đổi mật khẩu thành công!' }))
  }

  const getRoleBadge = (role?: string) => {
    const r = (role || '').trim().toLowerCase()
    if (r === 'admin') {
      return {
        label: t('profile.roles.admin', { defaultValue: 'Admin' }),
        bg: isDark
          ? 'bg-purple-900/40 text-purple-200 border-purple-500/50'
          : 'bg-purple-100 text-purple-900 border-purple-300',
      }
    }
    return {
      label: t('profile.roles.staff', { defaultValue: 'Staff' }),
      bg: isDark
        ? 'bg-blue-900/40 text-blue-200 border-blue-500/50'
        : 'bg-blue-100 text-blue-900 border-blue-300',
    }
  }

  const roleBadge = getRoleBadge(user.role)

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fadeIn select-none"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
      >
      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden my-auto transition-all ${
          isDark
            ? 'bg-[#071317] border-white/10 text-white shadow-black/80'
            : 'bg-white border-[#E8E4E3] text-gray-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`p-6 border-b ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-100 bg-gray-50/70'}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="shrink-0">
                <Avatar size="xl" className="border-2 border-[#00c4de] shadow-md">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
              </div>

              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 id="profile-modal-title" className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white truncate">
                    {user.name}
                  </h3>
                  <span className={`inline-flex items-center py-0.5 px-2.5 rounded-full border text-xs font-bold ${roleBadge.bg}`}>
                    {roleBadge.label}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-300 flex-wrap">
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer shadow-2xs ${
                      isDark
                        ? 'border-white/15 bg-white/5 hover:bg-white/10 text-gray-200'
                        : 'border-gray-200 bg-white hover:bg-gray-100 text-gray-700'
                    }`}
                    title={t('profile.copy_email', { defaultValue: 'Sao chép' })}
                  >
                    <Envelope size={13} className="text-[#007b8b] dark:text-[#00c4de] shrink-0" />
                    <span className="truncate max-w-[180px] sm:max-w-[220px]">{user.email}</span>
                    {copiedEmail ? (
                      <Check size={13} className="text-emerald-500 font-bold shrink-0" />
                    ) : (
                      <Copy size={13} className="text-gray-400 shrink-0" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                isDark
                  ? 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
                  : 'border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
              aria-label={t('profile.btn_close', { defaultValue: 'Đóng' })}
            >
              <X size={16} weight="bold" />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-5 border-b border-gray-200 dark:border-white/10 -mb-6 pb-0">
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`py-2.5 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'info'
                  ? 'border-[#007b8b] text-[#007b8b] dark:border-[#00c4de] dark:text-[#00c4de]'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <User size={16} weight={activeTab === 'info' ? 'fill' : 'regular'} />
              <span>{t('profile.tab_general', { defaultValue: 'Thông tin cá nhân' })}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`py-2.5 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'security'
                  ? 'border-[#007b8b] text-[#007b8b] dark:border-[#00c4de] dark:text-[#00c4de]'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Key size={16} weight={activeTab === 'security' ? 'fill' : 'regular'} />
              <span>{t('profile.tab_security', { defaultValue: 'Bảo mật & Mật khẩu' })}</span>
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-7">
          {activeTab === 'info' && (
            <form id="profile-form" onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-1.5">
                  {t('profile.label_fullname', { defaultValue: 'Họ và tên hiển thị' })} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      if (nameError) setNameError(null)
                    }}
                    onBlur={() => {
                      if (!name.trim()) setNameError(t('profile.name_required', { defaultValue: 'Họ tên không được để trống' }))
                    }}
                    placeholder={t('profile.placeholder_fullname', { defaultValue: 'Nhập họ và tên của bạn' })}
                    aria-invalid={!!nameError}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors outline-none ${
                      nameError
                        ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-500/10 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                        : isDark
                        ? 'bg-black/30 border-white/20 text-white focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de]'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-[#007b8b] focus:ring-1 focus:ring-[#007b8b]'
                    }`}
                  />
                </div>
                {nameError ? (
                  <p className="text-xs text-rose-500 dark:text-rose-400 mt-1 flex items-center gap-1 font-medium">
                    <WarningCircle size={14} weight="fill" className="shrink-0" />
                    <span>{nameError}</span>
                  </p>
                ) : (
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 font-medium">
                    {t('profile.fullname_helper', { defaultValue: 'Tên hiển thị công khai trên hệ thống và nhật ký kiểm toán.' })}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-1.5">
                  {t('profile.label_phone', { defaultValue: 'Số điện thoại' })}
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    maxLength={15}
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onBlur={handlePhoneBlur}
                    placeholder={t('profile.placeholder_phone', { defaultValue: '0912 345 678' })}
                    aria-invalid={!!phoneError}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors outline-none ${
                      phoneError
                        ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-500/10 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                        : isDark
                        ? 'bg-black/30 border-white/20 text-white focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de]'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-[#007b8b] focus:ring-1 focus:ring-[#007b8b]'
                    }`}
                  />
                </div>
                {phoneError ? (
                  <p className="text-xs text-rose-500 dark:text-rose-400 mt-1 flex items-center gap-1 font-medium">
                    <WarningCircle size={14} weight="fill" className="shrink-0" />
                    <span>{phoneError}</span>
                  </p>
                ) : (
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 font-medium">
                    {t('profile.phone_helper', { defaultValue: 'Số điện thoại gồm 10 chữ số (Ví dụ: 0912 345 678).' })}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-1.5">
                    {t('profile.label_email', { defaultValue: 'Địa chỉ Email' })}
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      disabled
                      value={user.email}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium cursor-not-allowed ${
                        isDark
                          ? 'bg-white/5 border-white/10 text-gray-300'
                          : 'bg-gray-100 border-gray-200 text-gray-700'
                      }`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400">
                      <Lock size={14} />
                      <span>{t('profile.email_locked', { defaultValue: 'Cố định' })}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-1.5">
                    {t('profile.badge_role', { defaultValue: 'Vai trò hệ thống' })}
                  </label>
                  <div className={`flex items-center gap-2.5 h-[42px] px-3.5 rounded-xl border ${
                    isDark
                      ? 'border-white/10 bg-white/5'
                      : 'border-gray-200 bg-gray-50'
                  }`}>
                    <span className={`py-0.5 px-2.5 rounded-full border text-xs font-bold ${roleBadge.bg}`}>
                      {roleBadge.label}
                    </span>
                    <span className="text-xs text-gray-700 dark:text-gray-300 font-medium truncate">
                      {isAdmin ? t('profile.admin_role_desc') : t('profile.staff_role_desc')}
                    </span>
                  </div>
                </div>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <form id="security-form" onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-1.5">
                  {t('profile.label_current_pw', { defaultValue: 'Mật khẩu hiện tại' })} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    required
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    placeholder={t('profile.placeholder_current_pw', { defaultValue: '••••••••' })}
                    className={`w-full px-4 py-2.5 pr-11 rounded-xl border text-sm font-semibold transition-colors outline-none ${
                      isDark
                        ? 'bg-black/30 border-white/20 text-white focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de]'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-[#007b8b] focus:ring-1 focus:ring-[#007b8b]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer"
                    aria-label={showCurrentPw ? t('common.aria_hide_pw', { defaultValue: 'Ẩn mật khẩu' }) : t('common.aria_show_pw', { defaultValue: 'Hiện mật khẩu' })}
                  >
                    {showCurrentPw ? <EyeSlash size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-1.5">
                    {t('profile.label_new_pw', { defaultValue: 'Mật khẩu mới' })} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      required
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      placeholder={t('profile.placeholder_new_pw', { defaultValue: 'Tối thiểu 8 ký tự' })}
                      className={`w-full px-4 py-2.5 pr-11 rounded-xl border text-sm font-semibold transition-colors outline-none ${
                        isDark
                          ? 'bg-black/30 border-white/20 text-white focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de]'
                          : 'bg-white border-gray-300 text-gray-900 focus:border-[#007b8b] focus:ring-1 focus:ring-[#007b8b]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer"
                      aria-label={showNewPw ? t('common.aria_hide_pw', { defaultValue: 'Ẩn mật khẩu' }) : t('common.aria_show_pw', { defaultValue: 'Hiện mật khẩu' })}
                    >
                      {showNewPw ? <EyeSlash size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-1.5">
                    {t('profile.label_confirm_pw', { defaultValue: 'Xác nhận mật khẩu mới' })} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPw ? 'text' : 'password'}
                      required
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      placeholder={t('profile.placeholder_confirm_pw', { defaultValue: 'Nhập lại mật khẩu mới' })}
                      className={`w-full px-4 py-2.5 pr-11 rounded-xl border text-sm font-semibold transition-colors outline-none ${
                        isDark
                          ? 'bg-black/30 border-white/20 text-white focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de]'
                          : 'bg-white border-gray-300 text-gray-900 focus:border-[#007b8b] focus:ring-1 focus:ring-[#007b8b]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer"
                      aria-label={showConfirmPw ? t('common.aria_hide_pw', { defaultValue: 'Ẩn mật khẩu' }) : t('common.aria_show_pw', { defaultValue: 'Hiện mật khẩu' })}
                    >
                      {showConfirmPw ? <EyeSlash size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                {t('profile.pw_too_short', { defaultValue: 'Mật khẩu phải có tối thiểu 8 ký tự để đảm bảo an toàn tài khoản.' })}
              </p>
            </form>
          )}
        </div>

        <div className={`p-4 sm:p-5 border-t flex items-center justify-end gap-3 ${
          isDark
            ? 'border-white/10 bg-white/[0.02]'
            : 'border-gray-100 bg-gray-50/70'
        }`}>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-colors cursor-pointer ${
                isDark
                  ? 'border-white/15 text-gray-300 hover:bg-white/10'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {t('profile.btn_close', { defaultValue: 'Đóng' })}
            </button>

            {activeTab === 'info' ? (
              <button
                type="submit"
                form="profile-form"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white dark:text-black bg-[#007b8b] hover:bg-[#00606d] dark:bg-[#00c4de] dark:hover:bg-[#38dbf1] shadow-sm shadow-[#007b8b]/20 dark:shadow-[#00c4de]/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving && <CircleNotch size={14} className="animate-spin" />}
                <span>
                  {isSaving
                    ? t('profile.saving', { defaultValue: 'Đang lưu...' })
                    : t('profile.btn_save', { defaultValue: 'Lưu thay đổi' })}
                </span>
              </button>
            ) : (
              <button
                type="submit"
                form="security-form"
                className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white dark:text-black bg-[#007b8b] hover:bg-[#00606d] dark:bg-[#00c4de] dark:hover:bg-[#38dbf1] shadow-sm shadow-[#007b8b]/20 dark:shadow-[#00c4de]/20 transition-all cursor-pointer"
              >
                {t('profile.btn_change_pw', { defaultValue: 'Cập nhật mật khẩu' })}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    </ModalPortal>
  )
}

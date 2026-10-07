import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  User,
  Envelope,
  ShieldCheck,
  Coins,
  Key,
  CheckCircle,
  Sparkle,
  VideoCamera,
  NavigationArrow,
  BookOpen,
  Eye,
  EyeSlash,
  Copy,
  Check,
  Lock,
  CircleNotch,
  WarningCircle,
} from '@phosphor-icons/react'
import { isValidVietnamPhone, normalizeVietnamPhone } from '@shared/types'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { useTranslation } from 'react-i18next'
import { opsPortalUrl } from '@/config/env'
import { Avatar, AvatarImage, AvatarFallback, getInitials, PageHeader } from '@shared/ui'

/**
 * Dedicated Account Profile view for SignTrustMap Community Portal.
 * Enables users to review contribution statistics, edit personal information
 * (fullName, phone via PATCH /api/v1/auth/me), update security credentials,
 * and view accessible workspace environments.
 */
export default function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const { isDark } = useTheme()
  const { t } = useTranslation('common')
  const toast = useToast()

  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'workspaces'>('info')
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

  const handlePhoneChange = (val: string) => {
    setPhone(val)
    if (phoneError) setPhoneError(null)
  }

  const handlePhoneBlur = () => {
    const trimmed = phone.trim()
    if (trimmed && !isValidVietnamPhone(trimmed)) {
      setPhoneError(t('profile.phone_invalid'))
    } else {
      setPhoneError(null)
    }
  }

  if (!user) {
    return null
  }

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(user.email)
    setCopiedEmail(true)
    toast.success(t('profile.copied'))
    setTimeout(() => setCopiedEmail(false), 2000)
  }

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault()
    let hasError = false
    const cleanName = name.trim()
    if (!cleanName) {
      setNameError(t('profile.name_required'))
      hasError = true
    } else {
      setNameError(null)
    }

    const trimmedPhone = phone.trim()
    if (trimmedPhone && !isValidVietnamPhone(trimmedPhone)) {
      setPhoneError(t('profile.phone_invalid'))
      hasError = true
    } else {
      setPhoneError(null)
    }

    if (hasError) return

    setIsSaving(true)
    try {
      const normalizedPhone = trimmedPhone ? normalizeVietnamPhone(trimmedPhone) : undefined
      await updateProfile({
        name: cleanName,
        phone: normalizedPhone,
      })
      setPhoneError(null)
      toast.success(t('profile.save_success'))
    } catch (err: any) {
      toast.error(err?.message || t('profile.save_error'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = (e: FormEvent) => {
    e.preventDefault()
    if (!newPw || newPw.length < 8) {
      toast.error(t('profile.pw_too_short'))
      return
    }
    if (newPw !== confirmPw) {
      toast.error(t('profile.pw_mismatch'))
      return
    }
    updateProfile({ password: newPw })
    setCurrentPw('')
    setNewPw('')
    setConfirmPw('')
    toast.success(t('profile.pw_change_success'))
  }

  const getRoleBadge = (role: string) => {
    const r = (role || '').trim().toLowerCase()
    switch (r) {
      case 'admin':
        return {
          label: t('profile.roles.admin'),
          bg: isDark
            ? 'bg-purple-900/40 text-purple-200 border-purple-500/50'
            : 'bg-purple-100 text-purple-900 border-purple-300',
        }
      case 'staff':
        return {
          label: t('profile.roles.staff'),
          bg: isDark
            ? 'bg-blue-900/40 text-blue-200 border-blue-500/50'
            : 'bg-blue-100 text-blue-900 border-blue-300',
        }
      case 'reviewer':
        return {
          label: t('profile.roles.reviewer'),
          bg: isDark
            ? 'bg-emerald-900/40 text-emerald-200 border-emerald-500/50'
            : 'bg-emerald-100 text-emerald-900 border-emerald-300',
        }
      case 'surveyor':
        return {
          label: t('profile.roles.surveyor'),
          bg: isDark
            ? 'bg-amber-900/40 text-amber-200 border-amber-500/50'
            : 'bg-amber-100 text-amber-950 border-amber-300',
        }
      default:
        return {
          label: t('profile.roles.driver'),
          bg: isDark
            ? 'bg-cyan-900/40 text-cyan-200 border-cyan-500/50'
            : 'bg-cyan-100 text-cyan-950 border-cyan-300',
        }
    }
  }

  const roleBadge = getRoleBadge(user.role)

  return (
    <div
      className={`w-full min-h-[calc(100vh-80px)] py-8 sm:py-12 transition-colors ${
        isDark ? 'bg-[#030708] text-gray-100' : 'bg-[#F8F7F7] text-gray-900'
      }`}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-6">
        <PageHeader
          title={t('profile.modal_title')}
          subtitle={t('profile.subtitle')}
          bordered
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div
            className={`lg:col-span-4 rounded-2xl border p-6 space-y-6 ${
              isDark
                ? 'bg-[#071317] border-white/10 shadow-lg shadow-black/40'
                : 'bg-white border-[#E8E4E3] shadow-xs'
            }`}
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <Avatar size="2xl" className="border-4 border-[#00c4de] shadow-md">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>

              <div className="space-y-1 w-full">
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white break-words">
                  {user.name}
                </h2>
                <div className="pt-1">
                  <span className={`inline-flex items-center py-1 px-3.5 rounded-full border text-xs font-bold ${roleBadge.bg}`}>
                    {roleBadge.label}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyEmail}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                }`}
                title={t('profile.copy_email')}
              >
                <Envelope size={15} className="text-gray-500 dark:text-gray-400 shrink-0" />
                <span className="truncate max-w-52">{user.email}</span>
                {copiedEmail ? (
                  <Check size={14} className="text-emerald-500 font-bold shrink-0" />
                ) : (
                  <Copy size={14} className="text-gray-400 shrink-0" />
                )}
              </button>
            </div>

            {((user.role !== 'staff' && user.role !== 'admin') || user.trustScore !== undefined) && (
              <div className="pt-4 border-t border-gray-200 dark:border-white/10 space-y-3 text-sm">
                {user.role !== 'staff' && user.role !== 'admin' && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5 font-medium">
                      <Coins size={14} className="text-amber-500" />
                      <span>{t('profile.credits_balance')}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-amber-600 dark:text-amber-400 text-sm">
                        {user.credits || 0}
                      </span>
                      <Link
                        to="/wallet"
                        className="text-[11px] font-bold text-[#007b8b] dark:text-[#00c4de] hover:underline"
                      >
                        {t('profile.link_wallet')}
                      </Link>
                    </div>
                  </div>
                )}

                {user.trustScore !== undefined && (
                  <div
                    className={`flex items-center justify-between text-xs ${
                      user.role !== 'staff' && user.role !== 'admin'
                        ? 'pt-2 border-t border-gray-100 dark:border-white/5'
                        : ''
                    }`}
                  >
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5 font-medium">
                      <ShieldCheck size={14} className="text-emerald-500" />
                      <span>{t('profile.trust_score')}</span>
                    </span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      {user.trustScore}%
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div
            className={`lg:col-span-8 rounded-2xl border overflow-hidden ${
              isDark
                ? 'bg-[#071317] border-white/10 shadow-lg shadow-black/40'
                : 'bg-white border-[#E8E4E3] shadow-xs'
            }`}
          >
            <div className="flex items-center border-b border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-black/20 px-4 pt-2 gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className={`py-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'info'
                    ? isDark
                      ? 'border-[#00c4de] text-[#00c4de]'
                      : 'border-[#007b8b] text-[#007b8b]'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <User size={16} weight={activeTab === 'info' ? 'fill' : 'regular'} />
                <span>{t('profile.tab_general')}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={`py-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'security'
                    ? isDark
                      ? 'border-[#00c4de] text-[#00c4de]'
                      : 'border-[#007b8b] text-[#007b8b]'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Key size={16} weight={activeTab === 'security' ? 'fill' : 'regular'} />
                <span>{t('profile.tab_security')}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('workspaces')}
                className={`py-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'workspaces'
                    ? isDark
                      ? 'border-[#00c4de] text-[#00c4de]'
                      : 'border-[#007b8b] text-[#007b8b]'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Sparkle size={16} weight={activeTab === 'workspaces' ? 'fill' : 'regular'} />
                <span>{t('profile.tab_workspaces')}</span>
              </button>
            </div>

            {activeTab === 'info' && (
              <form onSubmit={handleUpdateProfile} className="p-6 sm:p-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-1.5">
                      {t('profile.label_fullname')} <span className="text-rose-500 font-bold ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      maxLength={100}
                      onChange={(e) => {
                        setName(e.target.value)
                        if (nameError) setNameError(null)
                      }}
                      onBlur={() => {
                        if (!name.trim()) setNameError(t('profile.name_required'))
                      }}
                      placeholder={t('profile.placeholder_fullname')}
                      aria-invalid={!!nameError}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all outline-none ${
                        nameError
                          ? isDark
                            ? 'bg-white/5 border-rose-500 text-white placeholder:text-gray-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                            : 'bg-white border-rose-500 text-gray-900 placeholder:text-gray-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 shadow-xs'
                          : isDark
                          ? 'bg-black/30 border-white/15 text-white placeholder:text-gray-500 focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de]'
                          : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#007b8b] focus:ring-1 focus:ring-[#007b8b]'
                      }`}
                    />
                    {nameError ? (
                      <p className="mt-1.5 text-[12px] text-rose-500 dark:text-rose-400 font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-top-0.5 duration-150">
                        <WarningCircle size={14} weight="fill" className="shrink-0" />
                        <span>{nameError}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t('profile.fullname_helper')}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-1.5">
                      {t('profile.label_phone')}
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      maxLength={15}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      onBlur={handlePhoneBlur}
                      placeholder={t('profile.placeholder_phone')}
                      aria-invalid={!!phoneError}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all outline-none ${
                        phoneError
                          ? isDark
                            ? 'bg-white/5 border-rose-500 text-white placeholder:text-gray-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                            : 'bg-white border-rose-500 text-gray-900 placeholder:text-gray-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 shadow-xs'
                          : isDark
                          ? 'bg-black/30 border-white/15 text-white placeholder:text-gray-500 focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de]'
                          : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#007b8b] focus:ring-1 focus:ring-[#007b8b]'
                      }`}
                    />
                    {phoneError ? (
                      <p className="mt-1.5 text-[12px] text-rose-500 dark:text-rose-400 font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-top-0.5 duration-150">
                        <WarningCircle size={14} weight="fill" className="shrink-0" />
                        <span>{phoneError}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t('profile.phone_helper')}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-1.5">
                      {t('profile.label_email')}
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
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                        <Lock size={14} />
                        <span>{t('profile.email_locked')}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-1.5">
                      {t('profile.badge_role')}
                    </label>
                    <div className="flex items-center gap-3">
                      <span className={`py-1 px-3.5 rounded-full border text-xs font-bold ${roleBadge.bg}`}>
                        {roleBadge.label}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {t('profile.role_helper')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-white/10 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className={`py-2.5 px-6 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      isDark
                        ? 'bg-[#00c4de] hover:bg-[#38dbf1] text-black shadow-[#00c4de]/20'
                        : 'bg-[#007b8b] hover:bg-[#00606d] text-white shadow-[#007b8b]/20'
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <CircleNotch size={16} className="animate-spin" />
                        <span>{t('profile.saving')}</span>
                      </>
                    ) : (
                      <span>{t('profile.btn_save')}</span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'security' && (
              <form onSubmit={handleChangePassword} className="p-6 sm:p-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-1.5">
                      {t('profile.label_current_pw')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPw ? 'text' : 'password'}
                        required
                        value={currentPw}
                        onChange={(e) => setCurrentPw(e.target.value)}
                        placeholder={t('profile.placeholder_current_pw')}
                        className={`w-full px-4 py-2.5 pr-12 rounded-xl border text-sm font-medium transition-colors outline-none ${
                          isDark
                            ? 'bg-black/30 border-white/15 text-white focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de]'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-[#007b8b] focus:ring-1 focus:ring-[#007b8b]'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
                      >
                        {showCurrentPw ? <EyeSlash size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-1.5">
                      {t('profile.label_new_pw')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPw ? 'text' : 'password'}
                        required
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        placeholder={t('profile.placeholder_new_pw')}
                        className={`w-full px-4 py-2.5 pr-12 rounded-xl border text-sm font-medium transition-colors outline-none ${
                          isDark
                            ? 'bg-black/30 border-white/15 text-white focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de]'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-[#007b8b] focus:ring-1 focus:ring-[#007b8b]'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
                      >
                        {showNewPw ? <EyeSlash size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-1.5">
                      {t('profile.label_confirm_pw')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPw ? 'text' : 'password'}
                        required
                        value={confirmPw}
                        onChange={(e) => setConfirmPw(e.target.value)}
                        placeholder={t('profile.placeholder_confirm_pw')}
                        className={`w-full px-4 py-2.5 pr-12 rounded-xl border text-sm font-medium transition-colors outline-none ${
                          isDark
                            ? 'bg-black/30 border-white/15 text-white focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de]'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-[#007b8b] focus:ring-1 focus:ring-[#007b8b]'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPw(!showConfirmPw)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
                      >
                        {showConfirmPw ? <EyeSlash size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-white/10 flex justify-end">
                  <button
                    type="submit"
                    className={`py-2.5 px-6 rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer ${
                      isDark
                        ? 'bg-[#00c4de] hover:bg-[#38dbf1] text-black shadow-[#00c4de]/20'
                        : 'bg-[#007b8b] hover:bg-[#00606d] text-white shadow-[#007b8b]/20'
                    }`}
                  >
                    {t('profile.btn_change_pw')}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'workspaces' && (
              <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(!user.role || user.role === 'driver') && (
                  <Link
                    to="/product/map"
                    className={`p-4 rounded-xl border transition-all flex items-start gap-3.5 group ${
                      isDark
                        ? 'bg-white/[0.02] border-white/10 hover:border-[#00c4de]/50 hover:bg-white/[0.04]'
                        : 'bg-gray-50/50 border-gray-200 hover:border-[#007b8b]/40 hover:bg-white shadow-xs'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#00c4de]/15 text-[#007b8b] dark:text-[#00c4de] flex items-center justify-center shrink-0">
                      <NavigationArrow size={20} weight="duotone" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-[#007b8b] dark:group-hover:text-[#00c4de] transition-colors">
                        {t('profile.workspace_driver_title')}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {t('profile.workspace_driver_desc')}
                      </p>
                    </div>
                  </Link>
                )}

                {user.role === 'surveyor' && (
                  <Link
                    to="/survey"
                    className={`p-4 rounded-xl border transition-all flex items-start gap-3.5 group ${
                      isDark
                        ? 'bg-white/[0.02] border-white/10 hover:border-amber-400/50 hover:bg-white/[0.04]'
                        : 'bg-gray-50/50 border-gray-200 hover:border-amber-400/40 hover:bg-white shadow-xs'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <VideoCamera size={20} weight="duotone" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {t('profile.workspace_survey_title')}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {t('profile.workspace_survey_desc')}
                      </p>
                    </div>
                  </Link>
                )}

                {user.role === 'reviewer' && (
                  <Link
                    to="/review"
                    className={`p-4 rounded-xl border transition-all flex items-start gap-3.5 group ${
                      isDark
                        ? 'bg-white/[0.02] border-white/10 hover:border-emerald-400/50 hover:bg-white/[0.04]'
                        : 'bg-gray-50/50 border-gray-200 hover:border-emerald-400/40 hover:bg-white shadow-xs'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle size={20} weight="duotone" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {t('profile.workspace_reviewer_title')}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {t('profile.workspace_reviewer_desc')}
                      </p>
                    </div>
                  </Link>
                )}

                {(user.role === 'admin' || user.role === 'staff') && (
                  <a
                    href={`${opsPortalUrl}/overview`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-4 rounded-xl border transition-all flex items-start gap-3.5 group ${
                      isDark
                        ? 'bg-white/[0.02] border-white/10 hover:border-blue-400/50 hover:bg-white/[0.04]'
                        : 'bg-gray-50/50 border-gray-200 hover:border-blue-400/40 hover:bg-white shadow-xs'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <ShieldCheck size={20} weight="duotone" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {t('profile.workspace_ops_title')}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {t('profile.workspace_ops_desc')}
                      </p>
                    </div>
                  </a>
                )}

                <Link
                  to="/catalog"
                  className={`p-4 rounded-xl border transition-all flex items-start gap-3.5 group ${
                    isDark
                      ? 'bg-white/[0.02] border-white/10 hover:border-purple-400/50 hover:bg-white/[0.04]'
                      : 'bg-gray-50/50 border-gray-200 hover:border-purple-400/40 hover:bg-white shadow-xs'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <BookOpen size={20} weight="duotone" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {t('nav.catalog')}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                      {t('user_menu.desc_catalog')}
                    </p>
                  </div>
                </Link>

                {user.role !== 'admin' && user.role !== 'staff' && (
                  <Link
                    to="/wallet"
                    className={`p-4 rounded-xl border transition-all flex items-start gap-3.5 group ${
                      isDark
                        ? 'bg-white/[0.02] border-white/10 hover:border-amber-400/50 hover:bg-white/[0.04]'
                        : 'bg-gray-50/50 border-gray-200 hover:border-amber-400/40 hover:bg-white shadow-xs'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Coins size={20} weight="duotone" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {t('nav.wallet')}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {t('profile.credits_balance')}
                      </p>
                    </div>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


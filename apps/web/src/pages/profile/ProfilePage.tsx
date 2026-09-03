import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  User,
  Envelope,
  ShieldCheck,
  Coins,
  Key,
  SignOut,
  CheckCircle,
  WarningCircle,
  Sparkle,
  VideoCamera,
  MapPin,
  BookOpen,
  ArrowRight,
  Eye,
  EyeSlash,
  Calendar,
  Copy,
  Check,
} from '@phosphor-icons/react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useTranslation } from 'react-i18next'
import { opsPortalUrl } from '@/config/env'

export default function ProfilePage() {
  const { user, updateProfile, logout } = useAuth()
  const { isDark } = useTheme()
  const { t } = useTranslation('common')
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'workspaces'>('info')
  const [name, setName] = useState(user?.name || '')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState('')
  const [saveError, setSaveError] = useState('')

  if (!user) {
    return null
  }

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(user.email)
    setCopiedEmail(true)
    setTimeout(() => setCopiedEmail(false), 2000)
  }

  const handleUpdateName = (e: FormEvent) => {
    e.preventDefault()
    setSaveError('')
    setSaveSuccess('')
    if (!name.trim()) {
      setSaveError(t('profile.name_required') || 'Họ và tên không được để trống')
      return
    }
    updateProfile({ name: name.trim() })
    setSaveSuccess(t('profile.save_success') || 'Cập nhật thông tin tài khoản thành công!')
    setTimeout(() => setSaveSuccess(''), 3000)
  }

  const handleChangePassword = (e: FormEvent) => {
    e.preventDefault()
    setSaveError('')
    setSaveSuccess('')
    if (!newPw || newPw.length < 8) {
      setSaveError(t('profile.pw_too_short') || 'Mật khẩu mới phải có ít nhất 8 ký tự')
      return
    }
    if (newPw !== confirmPw) {
      setSaveError(t('profile.pw_mismatch') || 'Mật khẩu xác nhận không khớp')
      return
    }
    updateProfile({ password: newPw })
    setCurrentPw('')
    setNewPw('')
    setConfirmPw('')
    setSaveSuccess(t('profile.pw_change_success') || 'Đổi mật khẩu thành công!')
    setTimeout(() => setSaveSuccess(''), 3000)
  }

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  const getRoleBadge = (role: string) => {
    const r = (role || '').trim().toLowerCase()
    switch (r) {
      case 'admin':
        return { label: 'Admin', bg: 'bg-purple-500/15 text-purple-400 border-purple-500/30' }
      case 'staff':
        return { label: 'Staff', bg: 'bg-blue-500/15 text-blue-400 border-blue-500/30' }
      case 'reviewer':
        return { label: 'Reviewer', bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' }
      case 'surveyor':
        return { label: 'Surveyor', bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30' }
      default:
        return { label: 'Driver', bg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' }
    }
  }

  const roleBadge = getRoleBadge(user.role)

  return (
    <div
      className={`w-full min-h-screen pt-6 sm:pt-8 pb-16 transition-colors ${
        isDark ? 'bg-[#030708] text-white' : 'bg-[#F8F7F7] text-gray-900'
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* ─── Profile Hero Banner ────────────────────────────────────── */}
        <div
          className={`rounded-[28px] p-6 sm:p-10 border relative overflow-hidden transition-all shadow-sm ${
            isDark ? 'bg-[#061417]/80 border-white/10' : 'bg-white border-[#E8E4E3]'
          }`}
        >
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00c4de]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            {/* Avatar & User Details */}
            <div className="flex items-center gap-6">
              <div className="relative shrink-0">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-20 h-20 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-[#00c4de] shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-[#00c4de]/20 text-[#00c4de] flex items-center justify-center font-extrabold text-4xl border-2 border-[#00c4de]/40">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-3 border-white dark:border-[#061417]" />
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                    {user.name}
                  </h1>
                  <span className={`py-1.5 px-4 rounded-full border text-xs sm:text-sm font-bold tracking-wide ${roleBadge.bg}`}>
                    {roleBadge.label}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-5 text-sm text-gray-500 dark:text-gray-400">
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="inline-flex items-center gap-2 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                    title={t('profile.copy_email')}
                  >
                    <Envelope size={16} />
                    <span className="font-medium">{user.email}</span>
                    {copiedEmail ? <Check size={15} className="text-emerald-500 font-bold" /> : <Copy size={15} />}
                  </button>

                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>{t('profile.member_since')}: <strong className="font-semibold text-gray-700 dark:text-gray-300">{user.joinDate || '15/05/2026'}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Logout Action Button */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleLogout}
                className={`py-3 px-5 rounded-2xl border text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  isDark
                    ? 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-400'
                    : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700 shadow-xs'
                }`}
              >
                <SignOut size={18} />
                <span>{t('profile.btn_logout')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ─── Contribution & Metric Cards (4 Columns) ────────────────── */}
        {user.role !== 'staff' && user.role !== 'admin' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* 1. Wallet Balance */}
            <div
              className={`p-5 sm:p-6 rounded-[24px] border flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 shadow-xs ${
                isDark
                  ? 'bg-[#061417]/80 border-white/10 hover:border-amber-500/30'
                  : 'bg-white border-[#E8E4E3] hover:border-amber-400/50 hover:shadow-md'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                    {t('profile.credits_balance')}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Coins size={20} weight="duotone" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-amber-500 dark:text-amber-400 tracking-tight">
                    {user.credits || 0}
                  </span>
                  <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Credits</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs">
                <span className="text-gray-400 font-mono">
                  ≈ {((user.credits || 0) * 500).toLocaleString('vi-VN')} đ
                </span>
                <Link
                  to="/wallet"
                  className="font-bold text-amber-500 hover:text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                  <span>{t('nav.wallet')}</span>
                  <ArrowRight size={13} weight="bold" />
                </Link>
              </div>
            </div>

            {/* 2. Trust Score */}
            <div
              className={`p-5 sm:p-6 rounded-[24px] border flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 shadow-xs ${
                isDark
                  ? 'bg-[#061417]/80 border-white/10 hover:border-[#00c4de]/30'
                  : 'bg-white border-[#E8E4E3] hover:border-[#007b8b]/50 hover:shadow-md'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                    {t('profile.trust_score')}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-[#00c4de]/15 text-[#007b8b] dark:text-[#00c4de] flex items-center justify-center shrink-0">
                    <ShieldCheck size={20} weight="duotone" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-[#007b8b] dark:text-[#00c4de] tracking-tight">
                    {user.trustScore || 85}%
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs">
                <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Tier A
                </span>
                <span className="text-gray-400 font-mono">
                  w_R = {((user.trustScore || 85) / 100).toFixed(2)}
                </span>
              </div>
            </div>

            {/* 3. Submissions */}
            <div
              className={`p-5 sm:p-6 rounded-[24px] border flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 shadow-xs ${
                isDark
                  ? 'bg-[#061417]/80 border-white/10 hover:border-purple-500/30'
                  : 'bg-white border-[#E8E4E3] hover:border-purple-400/50 hover:shadow-md'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider truncate mr-2">
                    {t('survey.history_list_title')}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-500 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <VideoCamera size={20} weight="duotone" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                    {user.totalSubmissions || 0}
                  </span>
                  <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Trips</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs">
                <span className="text-gray-400 font-mono">
                  GPX + Video
                </span>
                <Link
                  to="/survey/history"
                  className="font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                >
                  <span>{t('survey.btn_view_history')}</span>
                  <ArrowRight size={13} weight="bold" />
                </Link>
              </div>
            </div>

            {/* 4. Validated Signs */}
            <div
              className={`p-5 sm:p-6 rounded-[24px] border flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 shadow-xs ${
                isDark
                  ? 'bg-[#061417]/80 border-white/10 hover:border-emerald-500/30'
                  : 'bg-white border-[#E8E4E3] hover:border-emerald-400/50 hover:shadow-md'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider truncate mr-2">
                    {t('survey.validated_count')}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle size={20} weight="duotone" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-emerald-500 dark:text-emerald-400 tracking-tight">
                    {user.validatedCount || 0}
                  </span>
                  <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Signs</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs">
                <span className="text-gray-400 font-mono">
                  Consensus
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  98% {t('reviewer.confidence')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ─── Main Tabs & Management Panel ───────────────────────────── */}
        <div
          className={`rounded-[28px] border overflow-hidden transition-all ${
            isDark ? 'bg-[#061417]/80 border-white/10' : 'bg-white border-[#E8E4E3] shadow-sm'
          }`}
        >
          {/* Tab Navigation */}
          <div className="flex flex-wrap items-center gap-2 p-3 sm:p-4 border-b border-[#E8E4E3] dark:border-white/10 bg-black/5 dark:bg-black/20">
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`py-3 px-5 rounded-2xl text-sm font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                activeTab === 'info'
                  ? isDark
                    ? 'bg-[#00c4de] text-black shadow-md shadow-[#00c4de]/20'
                    : 'bg-[#007b8b] text-white shadow-md shadow-[#007b8b]/20'
                  : isDark
                  ? 'text-gray-400 hover:text-white hover:bg-white/5'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <User size={18} weight="duotone" />
              <span>{t('profile.tab_general')}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`py-3 px-5 rounded-2xl text-sm font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                activeTab === 'security'
                  ? isDark
                    ? 'bg-[#00c4de] text-black shadow-md shadow-[#00c4de]/20'
                    : 'bg-[#007b8b] text-white shadow-md shadow-[#007b8b]/20'
                  : isDark
                  ? 'text-gray-400 hover:text-white hover:bg-white/5'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Key size={18} weight="duotone" />
              <span>{t('profile.tab_security')}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('workspaces')}
              className={`py-3 px-5 rounded-2xl text-sm font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                activeTab === 'workspaces'
                  ? isDark
                    ? 'bg-[#00c4de] text-black shadow-md shadow-[#00c4de]/20'
                    : 'bg-[#007b8b] text-white shadow-md shadow-[#007b8b]/20'
                  : isDark
                  ? 'text-gray-400 hover:text-white hover:bg-white/5'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Sparkle size={18} weight="duotone" />
              <span>{t('profile.tab_workspaces')}</span>
            </button>
          </div>

          {/* Feedback alerts */}
          {saveSuccess && (
            <div className="m-6 p-4 rounded-2xl border flex items-center gap-3 text-sm font-medium bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
              <CheckCircle size={20} weight="fill" className="shrink-0 text-emerald-500" />
              <span>{saveSuccess}</span>
            </div>
          )}

          {saveError && (
            <div className="m-6 p-4 rounded-2xl border flex items-center gap-3 text-sm font-medium bg-rose-500/10 border-rose-500/20 text-rose-400">
              <WarningCircle size={20} weight="fill" className="shrink-0 text-rose-500" />
              <span>{saveError}</span>
            </div>
          )}

          {/* Tab Content 1: Personal Info */}
          {activeTab === 'info' && (
            <form onSubmit={handleUpdateName} className="p-6 sm:p-10 space-y-6 max-w-2xl">
              <div className="space-y-5">
                <div>
                  <label className="block text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-gray-400 mb-2">
                    {t('profile.label_fullname')}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full px-4 py-3 rounded-2xl border text-sm sm:text-base transition-colors ${
                      isDark
                        ? 'bg-black/30 border-white/15 text-white focus:outline-none focus:border-[#00c4de]'
                        : 'bg-gray-50 border-gray-300 text-gray-900 focus:outline-none focus:border-[#007b8b]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-gray-400 mb-2">
                    {t('profile.label_email')}
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className={`w-full px-4 py-3 rounded-2xl border text-sm sm:text-base opacity-60 cursor-not-allowed ${
                      isDark ? 'bg-black/40 border-white/10 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-600'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-gray-400 mb-2">
                    {t('profile.badge_role')}
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`py-1.5 px-4 rounded-full border text-xs sm:text-sm font-bold ${roleBadge.bg}`}>
                      {roleBadge.label}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className={`py-3 px-7 rounded-2xl font-bold text-sm sm:text-base shadow-md transition-all cursor-pointer ${
                  isDark
                    ? 'bg-[#00c4de] hover:bg-[#38dbf1] text-black shadow-[#00c4de]/20'
                    : 'bg-[#007b8b] hover:bg-[#00606d] text-white shadow-[#007b8b]/20'
                }`}
              >
                {t('profile.btn_save')}
              </button>
            </form>
          )}

          {/* Tab Content 2: Security & Password */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="p-6 sm:p-10 space-y-6 max-w-2xl">
              <div className="space-y-5">
                <div>
                  <label className="block text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-gray-400 mb-2">
                    {t('profile.label_current_pw')}
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPw ? 'text' : 'password'}
                      required
                      value={currentPw}
                      onChange={(e) => setCurrentPw(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full px-4 py-3 pr-12 rounded-2xl border text-sm sm:text-base transition-colors ${
                        isDark
                          ? 'bg-black/30 border-white/15 text-white focus:outline-none focus:border-[#00c4de]'
                          : 'bg-gray-50 border-gray-300 text-gray-900 focus:outline-none focus:border-[#007b8b]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 cursor-pointer"
                    >
                      {showCurrentPw ? <EyeSlash size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-gray-400 mb-2">
                    {t('profile.label_new_pw')}
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      required
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full px-4 py-3 pr-12 rounded-2xl border text-sm sm:text-base transition-colors ${
                        isDark
                          ? 'bg-black/30 border-white/15 text-white focus:outline-none focus:border-[#00c4de]'
                          : 'bg-gray-50 border-gray-300 text-gray-900 focus:outline-none focus:border-[#007b8b]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 cursor-pointer"
                    >
                      {showNewPw ? <EyeSlash size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-gray-400 mb-2">
                    {t('profile.label_confirm_pw')}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPw ? 'text' : 'password'}
                      required
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full px-4 py-3 pr-12 rounded-2xl border text-sm sm:text-base transition-colors ${
                        isDark
                          ? 'bg-black/30 border-white/15 text-white focus:outline-none focus:border-[#00c4de]'
                          : 'bg-gray-50 border-gray-300 text-gray-900 focus:outline-none focus:border-[#007b8b]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 cursor-pointer"
                    >
                      {showConfirmPw ? <EyeSlash size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className={`py-3 px-7 rounded-2xl font-bold text-sm sm:text-base shadow-md transition-all cursor-pointer ${
                  isDark
                    ? 'bg-[#00c4de] hover:bg-[#38dbf1] text-black shadow-[#00c4de]/20'
                    : 'bg-[#007b8b] hover:bg-[#00606d] text-white shadow-[#007b8b]/20'
                }`}
              >
                {t('profile.btn_change_pw')}
              </button>
            </form>
          )}

          {/* Tab Content 3: Workspaces Launchers */}
          {activeTab === 'workspaces' && (
            <div className="p-6 sm:p-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <Link
                to="/product/map"
                className={`p-6 rounded-[22px] border transition-all flex flex-col justify-between group ${
                  isDark ? 'bg-white/[0.02] border-white/10 hover:border-[#00c4de]/40 hover:bg-white/[0.04]' : 'bg-white border-[#E8E4E3] hover:border-[#007b8b]/40 hover:bg-gray-50 shadow-xs'
                }`}
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#00c4de]/15 text-[#00c4de] flex items-center justify-center">
                    <MapPin size={26} weight="duotone" />
                  </div>
                  <h3 className="font-bold text-base sm:text-lg">{t('profile.workspace_gis_title')}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                    {t('profile.workspace_gis_desc')}
                  </p>
                </div>
                <div className="mt-5 flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#007b8b] dark:text-[#00c4de] group-hover:translate-x-1.5 transition-transform">
                  <span>{t('profile.open_workspace')}</span>
                  <ArrowRight size={16} />
                </div>
              </Link>

              {(user.role === 'surveyor' || user.role === 'reviewer') && (
                <Link
                  to="/survey"
                  className={`p-6 rounded-[22px] border transition-all flex flex-col justify-between group ${
                    isDark ? 'bg-white/[0.02] border-white/10 hover:border-amber-400/40 hover:bg-white/[0.04]' : 'bg-white border-[#E8E4E3] hover:border-amber-500/40 hover:bg-gray-50 shadow-xs'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                      <VideoCamera size={26} weight="duotone" />
                    </div>
                    <h3 className="font-bold text-base sm:text-lg">{t('profile.workspace_survey_title')}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                      {t('profile.workspace_survey_desc')}
                    </p>
                  </div>
                  <div className="mt-5 flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-500 group-hover:translate-x-1.5 transition-transform">
                    <span>{t('profile.open_workspace')}</span>
                    <ArrowRight size={16} />
                  </div>
                </Link>
              )}

              {user.role === 'reviewer' && (
                <Link
                  to="/review"
                  className={`p-6 rounded-[22px] border transition-all flex flex-col justify-between group ${
                    isDark ? 'bg-white/[0.02] border-white/10 hover:border-emerald-400/40 hover:bg-white/[0.04]' : 'bg-white border-[#E8E4E3] hover:border-emerald-500/40 hover:bg-gray-50 shadow-xs'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                      <CheckCircle size={26} weight="duotone" />
                    </div>
                    <h3 className="font-bold text-base sm:text-lg">{t('profile.workspace_reviewer_title')}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                      {t('profile.workspace_reviewer_desc')}
                    </p>
                  </div>
                  <div className="mt-5 flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-500 group-hover:translate-x-1.5 transition-transform">
                    <span>{t('profile.open_workspace')}</span>
                    <ArrowRight size={16} />
                  </div>
                </Link>
              )}

              <Link
                to="/catalog"
                className={`p-6 rounded-[22px] border transition-all flex flex-col justify-between group ${
                  isDark ? 'bg-white/[0.02] border-white/10 hover:border-purple-400/40 hover:bg-white/[0.04]' : 'bg-white border-[#E8E4E3] hover:border-purple-500/40 hover:bg-gray-50 shadow-xs'
                }`}
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                    <BookOpen size={26} weight="duotone" />
                  </div>
                  <h3 className="font-bold text-base sm:text-lg">{t('nav.catalog')}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                    {t('user_menu.desc_catalog')}
                  </p>
                </div>
                <div className="mt-5 flex items-center gap-1.5 text-xs sm:text-sm font-bold text-purple-500 group-hover:translate-x-1.5 transition-transform">
                  <span>{t('profile.open_workspace')}</span>
                  <ArrowRight size={16} />
                </div>
              </Link>

              {(user.role === 'admin' || user.role === 'staff') && (
                <a
                  href={`${opsPortalUrl}/overview`}
                  className={`p-6 rounded-[22px] border transition-all flex flex-col justify-between group ${
                    isDark ? 'bg-white/[0.02] border-white/10 hover:border-blue-400/40 hover:bg-white/[0.04]' : 'bg-white border-[#E8E4E3] hover:border-blue-500/40 hover:bg-gray-50 shadow-xs'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
                      <ShieldCheck size={26} weight="duotone" />
                    </div>
                    <h3 className="font-bold text-base sm:text-lg">{t('profile.workspace_ops_title')}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                      {t('profile.workspace_ops_desc')}
                    </p>
                  </div>
                  <div className="mt-5 flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-400 group-hover:translate-x-1.5 transition-transform">
                    <span>{t('profile.open_workspace')}</span>
                    <ArrowRight size={16} />
                  </div>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

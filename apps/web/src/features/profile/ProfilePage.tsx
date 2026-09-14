import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  User,
  Envelope,
  ShieldCheck,
  Coins,
  Key,
  SignOut,
  CheckCircle,
  Sparkle,
  VideoCamera,
  NavigationArrow,
  BookOpen,
  Eye,
  EyeSlash,
  Calendar,
  Copy,
  Check,
  Lock,
} from '@phosphor-icons/react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { useTranslation } from 'react-i18next'
import { opsPortalUrl } from '@/config/env'

export default function ProfilePage() {
  const { user, updateProfile, logout } = useAuth()
  const { isDark } = useTheme()
  const { t } = useTranslation('common')
  const toast = useToast()

  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'workspaces'>('info')
  const [name, setName] = useState(user?.name || '')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)

  if (!user) {
    return null
  }

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(user.email)
    setCopiedEmail(true)
    toast.success(t('profile.copied'))
    setTimeout(() => setCopiedEmail(false), 2000)
  }

  const handleUpdateName = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error(t('profile.name_required'))
      return
    }
    updateProfile({ name: name.trim() })
    toast.success(t('profile.save_success'))
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

  const handleLogout = () => {
    logout('/')
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
        {/* ─── Page Header ────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200 dark:border-white/10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {t('profile.modal_title')}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('profile.subtitle')}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-colors cursor-pointer self-start sm:self-auto ${
              isDark
                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30'
                : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
            }`}
          >
            <SignOut size={16} weight="bold" />
            <span>{t('profile.btn_logout')}</span>
          </button>
        </div>

        {/* ─── Main 2-Column Grid ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: User Summary Card (4 cols) */}
          <div
            className={`lg:col-span-4 rounded-2xl border p-6 space-y-6 ${
              isDark
                ? 'bg-[#071317] border-white/10 shadow-lg shadow-black/40'
                : 'bg-white border-[#E8E4E3] shadow-xs'
            }`}
          >
            {/* Avatar & User Core */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="relative">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-[#00c4de] shadow-md"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#007b8b]/15 text-[#007b8b] dark:text-[#00c4de] flex items-center justify-center font-extrabold text-3xl border-4 border-[#00c4de]">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#071317]" />
              </div>

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

              {/* Email with copy button */}
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
                <span className="truncate max-w-[200px]">{user.email}</span>
                {copiedEmail ? (
                  <Check size={14} className="text-emerald-500 font-bold shrink-0" />
                ) : (
                  <Copy size={14} className="text-gray-400 shrink-0" />
                )}
              </button>
            </div>

            {/* Member Info & Stats */}
            <div className="pt-4 border-t border-gray-200 dark:border-white/10 space-y-3 text-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5 font-medium">
                  <Calendar size={14} />
                  <span>{t('profile.member_since')}</span>
                </span>
                <span className="font-bold text-gray-800 dark:text-gray-200">
                  {user.joinDate || '15/05/2026'}
                </span>
              </div>

              {/* Credits Row */}
              {user.role !== 'staff' && user.role !== 'admin' && (
                <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100 dark:border-white/5">
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

              {/* Trust Score Row */}
              {user.trustScore !== undefined && (
                <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100 dark:border-white/5">
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
          </div>

          {/* Right Column: Settings Panel with Tabs (8 cols) */}
          <div
            className={`lg:col-span-8 rounded-2xl border overflow-hidden ${
              isDark
                ? 'bg-[#071317] border-white/10 shadow-lg shadow-black/40'
                : 'bg-white border-[#E8E4E3] shadow-xs'
            }`}
          >
            {/* Tab Headers */}
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

            {/* Tab 1: General Info */}
            {activeTab === 'info' && (
              <form onSubmit={handleUpdateName} className="p-6 sm:p-8 space-y-6">
                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-1.5">
                      {t('profile.label_fullname')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('profile.placeholder_fullname')}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors outline-none ${
                        isDark
                          ? 'bg-black/30 border-white/15 text-white focus:border-[#00c4de] focus:ring-1 focus:ring-[#00c4de]'
                          : 'bg-white border-gray-300 text-gray-900 focus:border-[#007b8b] focus:ring-1 focus:ring-[#007b8b]'
                      }`}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t('profile.fullname_helper')}
                    </p>
                  </div>

                  {/* Email (Read only) */}
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

                  {/* System Role Info */}
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
                    className={`py-2.5 px-6 rounded-xl font-bold text-sm shadow-sm transition-all cursor-pointer ${
                      isDark
                        ? 'bg-[#00c4de] hover:bg-[#38dbf1] text-black shadow-[#00c4de]/20'
                        : 'bg-[#007b8b] hover:bg-[#00606d] text-white shadow-[#007b8b]/20'
                    }`}
                  >
                    {t('profile.btn_save')}
                  </button>
                </div>
              </form>
            )}

            {/* Tab 2: Security & Password */}
            {activeTab === 'security' && (
              <form onSubmit={handleChangePassword} className="p-6 sm:p-8 space-y-6">
                <div className="space-y-4">
                  {/* Current Password */}
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

                  {/* New Password */}
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

                  {/* Confirm New Password */}
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

            {/* Tab 3: Workspaces & Quick Access */}
            {activeTab === 'workspaces' && (
              <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Driver Workspace (Driver / Default) */}
                {(!user.role || user.role === 'driver') && (
                  <Link
                    to="/driver"
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

                {/* 2. Survey Studio (Surveyor Only) */}
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

                {/* 3. Reviewer Workspace (Reviewer Only) */}
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

                {/* 4. Ops Portal (Admin / Staff) */}
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

                {/* 5. Standard Catalog (All users) */}
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

                {/* 6. Wallet & Rewards (Non-staff) */}
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


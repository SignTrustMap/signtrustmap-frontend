import { useState, type FormEvent } from 'react'
import { X, User, Envelope, ShieldCheck, Coins, Key, SignOut } from '@phosphor-icons/react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { useTranslation } from 'react-i18next'

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { user, updateProfile, logout } = useAuth()
  const { isDark } = useTheme()
  const { t } = useTranslation('common')
  const toast = useToast()

  const [name, setName] = useState(user?.name || '')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [activeTab, setActiveTab] = useState<'info' | 'security'>('info')

  if (!isOpen || !user) return null

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

  const getRoleBadge = (role: string) => {
    const r = (role || '').trim().toLowerCase()
    switch (r) {
      case 'admin':
        return { label: t('profile.roles.admin'), bg: 'bg-purple-500/15 text-purple-400 border-purple-500/30' }
      case 'staff':
        return { label: t('profile.roles.staff'), bg: 'bg-blue-500/15 text-blue-400 border-blue-500/30' }
      case 'reviewer':
        return { label: t('profile.roles.reviewer'), bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' }
      case 'surveyor':
        return { label: t('profile.roles.surveyor'), bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30' }
      default:
        return { label: t('profile.roles.driver'), bg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' }
    }
  }

  const roleBadge = getRoleBadge(user.role)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className={`relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden transition-all ${
          isDark
            ? 'bg-[#061417]/95 border-white/10 text-white shadow-black/80'
            : 'bg-white/95 border-gray-200 text-gray-900 shadow-gray-400/40'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
          <div className="flex items-center gap-2">
            <span className="text-xl">{user.icon || '👤'}</span>
            <div>
              <h2 className="text-base font-bold">{t('profile.modal_title')}</h2>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* User Summary Card */}
        <div className={`p-6 border-b ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-100 bg-gray-50/50'}`}>
          <div className="flex items-center gap-4">
            <div className="relative">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-full object-cover border-2 border-[#00c4de]" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#00c4de]/20 flex items-center justify-center text-xl font-bold text-[#00c4de]">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 text-sm">{user.icon}</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-bold text-base truncate">{user.name}</h3>
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${roleBadge.bg}`}>
                  {roleBadge.label}
                </span>
              </div>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
            <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
              <span className="text-[10px] uppercase font-mono text-gray-400 block mb-0.5 flex items-center gap-1">
                <Coins size={12} className="text-amber-400" />
                {t('profile.credits_balance')}
              </span>
              <span className="text-sm font-bold text-amber-400">{user.credits || 0}</span>
            </div>

            <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
              <span className="text-[10px] uppercase font-mono text-gray-400 block mb-0.5 flex items-center gap-1">
                <ShieldCheck size={12} className="text-emerald-400" />
                {t('profile.trust_score')}
              </span>
              <span className="text-sm font-bold text-emerald-400">{user.trustScore || 100}%</span>
            </div>

            <div className={`p-2.5 rounded-xl border col-span-2 sm:col-span-1 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
              <span className="text-[10px] uppercase font-mono text-gray-400 block mb-0.5">
                {t('profile.joined_date')}
              </span>
              <span className="text-xs font-semibold">{user.joinDate || '2026'}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`flex border-b text-xs font-semibold px-6 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'info'
                ? isDark
                  ? 'border-[#00c4de] text-[#00c4de]'
                  : 'border-[#007b8b] text-[#007b8b]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            {t('profile.tab_general')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'security'
                ? isDark
                  ? 'border-[#00c4de] text-[#00c4de]'
                  : 'border-[#007b8b] text-[#007b8b]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            {t('profile.tab_security')}
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6">
          {activeTab === 'info' ? (
            <form onSubmit={handleUpdateName} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  {t('profile.label_fullname')}
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border outline-none transition-colors ${
                      isDark
                        ? 'bg-white/5 border-white/10 focus:border-[#00c4de] text-white'
                        : 'bg-white border-gray-300 focus:border-[#007b8b] text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  {t('profile.label_email')}
                </label>
                <div className="relative">
                  <Envelope size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className={`w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border opacity-60 cursor-not-allowed ${
                      isDark ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-500'
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer ${
                    isDark
                      ? 'bg-[#00c4de] hover:bg-[#38dbf1] text-black'
                      : 'bg-[#007b8b] hover:bg-[#00606d] text-white'
                  }`}
                >
                  {t('profile.btn_save')}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  {t('profile.label_current_pw')}
                </label>
                <div className="relative">
                  <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    placeholder={t('profile.placeholder_current_pw')}
                    className={`w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border outline-none transition-colors ${
                      isDark
                        ? 'bg-white/5 border-white/10 focus:border-[#00c4de] text-white'
                        : 'bg-white border-gray-300 focus:border-[#007b8b] text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  {t('profile.label_new_pw')}
                </label>
                <div className="relative">
                  <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder={t('profile.placeholder_new_pw')}
                    className={`w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border outline-none transition-colors ${
                      isDark
                        ? 'bg-white/5 border-white/10 focus:border-[#00c4de] text-white'
                        : 'bg-white border-gray-300 focus:border-[#007b8b] text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  {t('profile.label_confirm_pw')}
                </label>
                <div className="relative">
                  <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    placeholder={t('profile.placeholder_confirm_pw')}
                    className={`w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border outline-none transition-colors ${
                      isDark
                        ? 'bg-white/5 border-white/10 focus:border-[#00c4de] text-white'
                        : 'bg-white border-gray-300 focus:border-[#007b8b] text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer ${
                    isDark
                      ? 'bg-[#00c4de] hover:bg-[#38dbf1] text-black'
                      : 'bg-[#007b8b] hover:bg-[#00606d] text-white'
                  }`}
                >
                  {t('profile.btn_change_pw')}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer with Sign Out */}
        <div className={`px-6 py-3.5 border-t flex items-center justify-between ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-100 bg-gray-50/50'}`}>
          <button
            type="button"
            onClick={() => {
              onClose()
              logout('/')
            }}
            className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <SignOut size={16} />
            <span>{t('profile.btn_logout')}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
              isDark ? 'bg-white/5 hover:bg-white/10 border-white/15 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700'
            }`}
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  )
}

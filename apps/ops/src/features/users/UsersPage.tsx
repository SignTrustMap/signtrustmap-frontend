import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Users,
  MagnifyingGlass,
  Funnel,
  ShieldCheck,
  Prohibit,
  CheckCircle,
  X,
  Eye,
} from '@phosphor-icons/react'
import { mockAdminUsers, type AdminUserItem } from '@/data/adminGovernanceData'

export default function UsersPage() {
  const { t } = useTranslation('ops')

  const [users, setUsers] = useState<AdminUserItem[]>(mockAdminUsers)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  function showToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 2500)
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  function handleToggleStatus(userId: string) {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextStatus = u.status === 'Active' ? 'Suspended' : 'Active'
          showToast(
            nextStatus === 'Active'
              ? t('users.toast_unlocked', { name: u.name })
              : t('users.toast_locked', { name: u.name })
          )
          return { ...u, status: nextStatus }
        }
        return u
      })
    )
    if (selectedUser?.id === userId) {
      setSelectedUser((prev) => prev ? { ...prev, status: prev.status === 'Active' ? 'Suspended' : 'Active' } : null)
    }
  }

  function handleChangeRole(userId: string, newRole: 'driver' | 'surveyor' | 'reviewer' | 'staff' | 'admin') {
    if (userId === 'USR-1004' && newRole !== 'admin') {
      showToast(t('users.toast_root_admin_warn'))
      return
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    )
    showToast(t('users.toast_role_updated', { role: newRole.toUpperCase() }))
    if (selectedUser?.id === userId) {
      setSelectedUser((prev) => prev ? { ...prev, role: newRole } : null)
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#007b8b] dark:text-[#00c4de] uppercase tracking-wider mb-1">
          <Users size={16} weight="bold" />
          <span>{t('users.tag')}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          {t('users.title')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('users.subtitle')}
        </p>
      </div>

      {toastMsg && (
        <div
          onClick={() => setToastMsg(null)}
          className="fixed top-20 right-8 z-50 bg-[#007b8b] text-white text-xs font-mono font-bold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 cursor-pointer hover:bg-[#00606d] transition-all active:scale-95 select-none"
          title="Bấm để đóng thông báo"
        >
          <CheckCircle size={16} weight="bold" />
          <span>{toastMsg}</span>
          <span className="ml-2 text-white/70 hover:text-white text-xs font-bold font-sans">✕</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl p-4 shadow-xs">
        <div className="relative w-full sm:w-80">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('users.search_placeholder')}
            className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Funnel size={14} className="text-gray-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs font-mono font-bold bg-gray-50 dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 cursor-pointer focus:outline-none"
          >
            <option value="all">{t('users.role_all')}</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
            <option value="reviewer">Reviewer</option>
            <option value="surveyor">Surveyor</option>
            <option value="driver">Driver</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-mono font-bold bg-gray-50 dark:bg-[#061115] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 cursor-pointer focus:outline-none"
          >
            <option value="all">{t('users.status_all')}</option>
            <option value="Active">{t('users.status_active')}</option>
            <option value="Suspended">{t('users.status_locked')}</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-mono uppercase border-b border-gray-200 dark:border-white/10">
              <tr>
                <th className="py-3 px-4 font-semibold">{t('users.th_user')}</th>
                <th className="py-3 px-4 font-semibold">{t('users.th_role')}</th>
                <th className="py-3 px-4 font-semibold">{t('users.th_reliability')}</th>
                <th className="py-3 px-4 font-semibold">{t('users.th_credits')}</th>
                <th className="py-3 px-4 font-semibold">{t('users.th_joined')}</th>
                <th className="py-3 px-4 font-semibold">{t('users.th_status')}</th>
                <th className="py-3 px-4 font-semibold text-center">{t('users.th_action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${u.avatarBg} text-white flex items-center justify-center font-bold font-mono text-xs shrink-0`}>
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{u.name}</p>
                        <p className="font-mono text-gray-400 text-[11px]">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-xs uppercase px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold">
                    {u.reliabilityScore !== undefined ? (
                      <span className={u.reliabilityScore >= 0.9 ? 'text-emerald-600' : u.reliabilityScore >= 0.7 ? 'text-amber-600' : 'text-red-500'}>
                        {(u.reliabilityScore * 100).toFixed(0)}%
                      </span>
                    ) : (
                      <span className="text-gray-400 font-normal">--</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-gray-700 dark:text-gray-300">
                    {u.credits.toLocaleString()} pts
                  </td>
                  <td className="py-3.5 px-4 font-mono text-gray-400">{u.joinedAt}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      u.status === 'Active'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-red-500/15 text-red-600 dark:text-red-400'
                    }`}>
                      {u.status === 'Active' ? t('users.status_active') : t('users.status_locked')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedUser(u)}
                        className="p-1.5 text-gray-500 hover:text-[#007b8b] hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                        title={t('users.detail_account_type')}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(u.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          u.status === 'Active'
                            ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
                            : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                        }`}
                        title={u.status === 'Active' ? t('users.btn_lock') : t('users.btn_unlock')}
                      >
                        {u.status === 'Active' ? <Prohibit size={16} /> : <ShieldCheck size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full ${selectedUser.avatarBg} text-white flex items-center justify-center font-bold font-mono text-xs`}>
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{selectedUser.name}</h3>
                  <p className="font-mono text-gray-400 text-xs">{selectedUser.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl space-y-1">
                <span className="text-gray-400 font-mono text-[10px] block uppercase">{t('users.detail_account_type')}</span>
                <span className="font-bold text-gray-900 dark:text-white capitalize">{selectedUser.role}</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl space-y-1">
                <span className="text-gray-400 font-mono text-[10px] block uppercase">{t('users.th_status')}</span>
                <span className={`font-bold ${selectedUser.status === 'Active' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {selectedUser.status === 'Active' ? t('users.status_active') : t('users.status_locked')}
                </span>
              </div>
              
              {/* Role-specific Metrics */}
              {(selectedUser.role === 'reviewer' || selectedUser.role === 'surveyor') && selectedUser.reliabilityScore !== undefined && (
                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl space-y-1">
                  <span className="text-gray-400 font-mono text-[10px] block uppercase">{t('users.detail_reliability')}</span>
                  <span className="font-bold font-mono text-gray-900 dark:text-white">
                    {(selectedUser.reliabilityScore * 100).toFixed(1)}%
                  </span>
                </div>
              )}
              {selectedUser.role === 'surveyor' && selectedUser.surveysSubmitted !== undefined && (
                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl space-y-1">
                  <span className="text-gray-400 font-mono text-[10px] block uppercase">{t('users.detail_surveys')}</span>
                  <span className="font-bold font-mono text-gray-900 dark:text-white">{selectedUser.surveysSubmitted}</span>
                </div>
              )}
              {selectedUser.role === 'staff' && selectedUser.moderationHandled !== undefined && (
                <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl space-y-1">
                  <span className="text-gray-400 font-mono text-[10px] block uppercase">{t('users.detail_moderation')}</span>
                  <span className="font-bold font-mono text-gray-900 dark:text-white">{selectedUser.moderationHandled}</span>
                </div>
              )}

              <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl space-y-1 col-span-2">
                <span className="text-gray-400 font-mono text-[10px] block uppercase">{t('users.detail_credits')}</span>
                <span className="text-sm font-bold font-mono text-[#007b8b] dark:text-[#00c4de]">
                  {selectedUser.credits.toLocaleString()} pts
                </span>
              </div>
            </div>

            {/* Change Role Section */}
            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-white/10">
              <label className="text-xs font-mono font-bold text-gray-500 uppercase">{t('users.detail_change_role')}</label>
              <div className="grid grid-cols-5 gap-2">
                {(['driver', 'surveyor', 'reviewer', 'staff', 'admin'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleChangeRole(selectedUser.id, r)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      selectedUser.role === r
                        ? 'bg-[#007b8b] text-white shadow-xs'
                        : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                    }`}
                  >
                    {r.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => handleToggleStatus(selectedUser.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedUser.status === 'Active'
                    ? 'bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:hover:bg-red-900/40'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40'
                }`}
              >
                {selectedUser.status === 'Active' ? t('users.btn_lock') : t('users.btn_unlock')}
              </button>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-800 dark:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {t('users.btn_close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

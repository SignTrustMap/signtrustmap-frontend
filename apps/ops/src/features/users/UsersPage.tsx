import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/context/ToastContext'
import CustomSelect from '@/components/common/CustomSelect'
import { Pagination } from '@/components/common/Pagination'
import { DataFilterBar } from '@/components/common/DataFilterBar'
import { ModalPortal } from '@/components/common/ModalPortal'
import PageHeader from '@/components/common/PageHeader'
import {
  Funnel,
  ShieldCheck,
  Prohibit,
  X,
  CheckCircle,
  NotePencil,
  FloppyDisk,
  PaperPlaneTilt,
  Copy,
  Check,
} from '@phosphor-icons/react'
import { mockAdminUsers, type AdminUserItem } from '@/data/adminGovernanceData'
import { mockOpsDemoAccounts } from '@/data/mockAccounts'

export default function UsersPage() {
  const { t } = useTranslation(['ops', 'common'])
  const toast = useToast()

  const [users, setUsers] = useState<AdminUserItem[]>(mockAdminUsers)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Direct Editable Form state
  const [editForm, setEditForm] = useState<AdminUserItem | null>(null)

  // Send Password Reset Email state
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false)
  const [resetEmailSentInfo, setResetEmailSentInfo] = useState<{
    email: string
    sentAt: string
    expiresInMinutes: number
    tokenLink: string
  } | null>(null)
  const [hasCopiedResetLink, setHasCopiedResetLink] = useState(false)

  // Open modal with user details ready for direct editing
  function handleOpenUser(u: AdminUserItem) {
    setSelectedUser(u)
    setEditForm({ ...u })
    setResetEmailSentInfo(null)
  }

  function handleCloseModal() {
    setSelectedUser(null)
    setEditForm(null)
    setIsSendingResetEmail(false)
    setResetEmailSentInfo(null)
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && selectedUser) {
        handleCloseModal()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedUser])

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.includes(searchTerm)) ||
      (u.location && u.location.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  function handleToggleStatus(userId: string) {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextStatus = u.status === 'Active' ? 'Suspended' : 'Active'
          if (nextStatus === 'Active') {
            toast.success(t('users.toast_unlocked', { name: u.name }))
          } else {
            toast.warning(t('users.toast_locked', { name: u.name }))
          }
          return { ...u, status: nextStatus }
        }
        return u
      })
    )
    if (selectedUser?.id === userId) {
      const nextStatus = selectedUser.status === 'Active' ? 'Suspended' : 'Active'
      setSelectedUser((prev) => (prev ? { ...prev, status: nextStatus } : null))
      setEditForm((prev) => (prev ? { ...prev, status: nextStatus } : null))
    }
  }

  // Enterprise Password Reset Email Dispatcher
  function handleSendPasswordResetEmail() {
    if (!selectedUser) return
    setIsSendingResetEmail(true)

    setTimeout(() => {
      setIsSendingResetEmail(false)
      const token = `st_sec_${Math.random().toString(36).substring(2, 12)}_${Date.now().toString(36)}`
      const resetLink = `https://signtrustmap.com/reset-password?token=${token}&email=${encodeURIComponent(selectedUser.email)}`

      setResetEmailSentInfo({
        email: selectedUser.email,
        sentAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        expiresInMinutes: 30,
        tokenLink: resetLink,
      })

      toast.success(t('users.lbl_reset_pwd_desc') + ` ${selectedUser.email}`)
    }, 600)
  }

  function handleSaveEdit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!editForm || !selectedUser) return

    if (!editForm.name.trim()) {
      toast.error('Họ tên người dùng không được để trống!')
      return
    }
    if (!editForm.email.trim()) {
      toast.error('Địa chỉ email không được để trống!')
      return
    }
    if ((selectedUser.id === 'USR-001' || selectedUser.id === 'USR-006') && editForm.role !== 'admin') {
      toast.warning(t('users.toast_root_admin_warn'))
      return
    }

    const updatedUser: AdminUserItem = {
      ...editForm,
      name: editForm.name.trim(),
      email: editForm.email.trim(),
      phone: editForm.phone?.trim() || '',
      location: editForm.location?.trim() || '',
      department: editForm.department?.trim() || '',
      avatar: editForm.avatar?.trim() || '',
      credits: Number(editForm.credits) || 0,
    }

    // 1. Update list state
    setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? updatedUser : u)))
    setSelectedUser(updatedUser)
    setEditForm(updatedUser)

    // 2. Synchronize with demo accounts in memory if it's one of the official demo users
    const demoAcc = mockOpsDemoAccounts.find(
      (a) => a.email.toLowerCase() === selectedUser.email.toLowerCase() || a.id === selectedUser.id
    )
    if (demoAcc) {
      demoAcc.name = updatedUser.name
      demoAcc.email = updatedUser.email
      if (updatedUser.avatar) demoAcc.avatar = updatedUser.avatar
    }

    handleCloseModal()
    toast.success(t('users.toast_saved', { name: updatedUser.name }))
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center font-mono font-bold text-[11px] uppercase px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
            {t('users.role_admin')}
          </span>
        )
      case 'staff':
        return (
          <span className="inline-flex items-center font-mono font-bold text-[11px] uppercase px-2 py-0.5 rounded-md bg-[#007b8b]/15 text-[#007b8b] dark:bg-[#00c4de]/20 dark:text-[#00c4de] border border-[#007b8b]/30 dark:border-[#00c4de]/40">
            {t('users.role_staff')}
          </span>
        )
      case 'reviewer':
        return (
          <span className="inline-flex items-center font-mono font-bold text-[11px] uppercase px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            {t('users.role_reviewer')}
          </span>
        )
      case 'surveyor':
        return (
          <span className="inline-flex items-center font-mono font-bold text-[11px] uppercase px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
            {t('users.role_surveyor')}
          </span>
        )
      case 'driver':
      default:
        return (
          <span className="inline-flex items-center font-mono font-bold text-[11px] uppercase px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
            {t('users.role_driver')}
          </span>
        )
    }
  }

  const roleOptions = [
    { value: 'driver', label: t('users.role_driver') },
    { value: 'surveyor', label: t('users.role_surveyor') },
    { value: 'reviewer', label: t('users.role_reviewer') },
    { value: 'staff', label: t('users.role_staff') },
    { value: 'admin', label: t('users.role_admin') },
  ]

  const statusOptions = [
    { value: 'Active', label: t('users.status_active') },
    { value: 'Suspended', label: t('users.status_suspended') },
  ]

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Page Title Only - Clean & Minimalist */}
      <PageHeader title={t('users.title')} />

      {/* Unified Filter and Search Bar */}
      <DataFilterBar
        searchQuery={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('users.search_placeholder')}
      >
        <CustomSelect
          value={roleFilter}
          onChange={setRoleFilter}
          size="sm"
          leftIcon={<Funnel size={14} />}
          options={[
            { value: 'all', label: t('users.role_all') },
            ...roleOptions,
          ]}
        />

        <CustomSelect
          value={statusFilter}
          onChange={setStatusFilter}
          size="sm"
          options={[
            { value: 'all', label: t('users.status_all') },
            ...statusOptions,
          ]}
        />
      </DataFilterBar>

      {/* Minimalist Users Table */}
      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 font-mono uppercase border-b border-neutral-200/80 dark:border-white/10">
              <tr>
                <th className="py-3.5 px-4 font-semibold">{t('users.th_user_id')}</th>
                <th className="py-3.5 px-4 font-semibold">{t('users.th_contact')}</th>
                <th className="py-3.5 px-4 font-semibold">{t('users.th_role')}</th>
                <th className="py-3.5 px-4 font-semibold">{t('users.th_location')}</th>
                <th className="py-3.5 px-4 font-semibold">{t('users.th_metrics')}</th>
                <th className="py-3.5 px-4 font-semibold">{t('users.th_credits')}</th>
                <th className="py-3.5 px-4 font-semibold">{t('users.th_status')}</th>
                <th className="py-3.5 px-4 font-semibold text-center">{t('users.th_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400 font-medium">
                    {t('users.empty_filter')}
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => handleOpenUser(u)}
                    className="hover:bg-neutral-50/80 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    {/* User ID & Name (Clean text - NO AVATAR IMAGE IN TABLE) */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-mono text-[11px] font-bold text-[#007b8b] dark:text-[#00c4de] group-hover:underline">
                          {u.id}
                        </span>
                        <span className="font-medium text-neutral-900 dark:text-white text-xs sm:text-sm">
                          {u.name}
                        </span>
                      </div>
                    </td>

                    {/* Email & Phone */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col text-xs font-mono">
                        <span className="text-neutral-700 dark:text-neutral-300 font-medium">{u.email}</span>
                        <span className="text-neutral-400 text-[11px]">{u.phone || '--'}</span>
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td className="py-3.5 px-4">
                      {getRoleBadge(u.role)}
                    </td>

                    {/* Location / Division */}
                    <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-300 font-medium">
                      {u.department || u.location || 'Toàn quốc'}
                    </td>

                    {/* Role Metrics / Contribution strictly matching documents */}
                    <td className="py-3.5 px-4 font-mono">
                      {u.role === 'reviewer' && (
                        <div className="text-[11px]">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {u.reliabilityScore ? `${(u.reliabilityScore * 100).toFixed(0)}%` : '--'}
                          </span>
                          <span className="text-neutral-400 ml-1">({u.reviewsCount || 0} reviews)</span>
                        </div>
                      )}
                      {u.role === 'surveyor' && (
                        <div className="text-[11px]">
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            {u.reliabilityScore ? `${(u.reliabilityScore * 100).toFixed(0)}%` : '--'}
                          </span>
                          <span className="text-neutral-400 ml-1">({u.surveysSubmitted || 0} bài gửi)</span>
                        </div>
                      )}
                      {u.role === 'staff' && (
                        <div className="text-[11px] text-[#007b8b] dark:text-[#00c4de] font-semibold">
                          {u.moderationHandled || 0} ca đã xử lý
                        </div>
                      )}
                      {u.role === 'driver' && (
                        <div className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                          {u.distanceTraveled || 'Hoạt động'}
                        </div>
                      )}
                      {u.role === 'admin' && (
                        <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
                          Platform Governance
                        </span>
                      )}
                    </td>

                    {/* Credits */}
                    <td className="py-3.5 px-4 font-mono font-bold text-neutral-800 dark:text-neutral-200">
                      {u.credits.toLocaleString()} pts
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          u.status === 'Active'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30'
                        }`}
                      >
                        {u.status === 'Active' ? t('users.status_active') : t('users.status_suspended')}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleOpenUser(u)}
                          className="p-1.5 text-neutral-500 hover:text-[#007b8b] dark:hover:text-[#00c4de] hover:bg-neutral-100 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                          title="Xem & Chỉnh sửa thông tin tài khoản"
                        >
                          <NotePencil size={16} />
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-neutral-100 dark:border-white/5">
          <Pagination
            currentPage={currentPage}
            totalItems={filteredUsers.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize)
              setCurrentPage(1)
            }}
            pageSizeOptions={[5, 10, 20]}
          />
        </div>
      </div>

      {/* ─── Direct Editable User Modal ─── */}
      {selectedUser && editForm && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto select-none"
            onClick={handleCloseModal}
          >
            <div
              className="bg-white dark:bg-[#0A171C] border border-neutral-200 dark:border-white/15 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 my-auto max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-neutral-100 dark:border-white/10 pb-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative shrink-0">
                      {selectedUser.avatar ? (
                        <img
                          src={selectedUser.avatar}
                          alt={selectedUser.name}
                          className="w-12 h-12 rounded-full object-cover border border-neutral-200 dark:border-white/20 shadow-xs"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-base text-white shadow-xs ${
                            selectedUser.avatarBg || 'bg-[#007b8b]'
                          }`}
                        >
                          {selectedUser.initials || selectedUser.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-neutral-900 dark:text-white truncate">
                          {selectedUser.name}
                        </h3>
                        <span className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-neutral-100 dark:bg-white/10 text-neutral-500 dark:text-neutral-400 font-bold">
                          {selectedUser.id}
                        </span>
                      </div>
                      <p className="font-mono text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                        {selectedUser.email}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {getRoleBadge(editForm.role)}
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                            editForm.status === 'Active'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                          }`}
                        >
                          {editForm.status === 'Active'
                            ? t('users.status_active')
                            : t('users.status_suspended')}
                        </span>
                        <span className="text-[11px] text-neutral-400 font-mono">
                          • {selectedUser.joinedAt}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Close Button */}
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    title={t('users.btn_close')}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Direct Editable Form Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Họ và tên */}
                  <div className="space-y-1">
                    <label className="font-semibold text-neutral-700 dark:text-neutral-300 block">
                      {t('users.lbl_name')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Nhập họ và tên..."
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-white/15 bg-white dark:bg-white/5 text-neutral-900 dark:text-white outline-none focus:border-[#007b8b] dark:focus:border-[#00c4de]"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="font-semibold text-neutral-700 dark:text-neutral-300 block">
                      {t('users.lbl_email')} *
                    </label>
                    <input
                      type="email"
                      required
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="name@signtrustmap.com"
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-white/15 bg-white dark:bg-white/5 text-neutral-900 dark:text-white outline-none focus:border-[#007b8b] dark:focus:border-[#00c4de]"
                    />
                  </div>

                  {/* Số điện thoại */}
                  <div className="space-y-1">
                    <label className="font-semibold text-neutral-700 dark:text-neutral-300 block">
                      {t('users.lbl_phone')}
                    </label>
                    <input
                      type="tel"
                      value={editForm.phone || ''}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="0901234567"
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-white/15 bg-white dark:bg-white/5 text-neutral-900 dark:text-white outline-none focus:border-[#007b8b] dark:focus:border-[#00c4de] font-mono"
                    />
                  </div>

                  {/* Khu vực / Địa bàn */}
                  <div className="space-y-1">
                    <label className="font-semibold text-neutral-700 dark:text-neutral-300 block">
                      {t('users.lbl_location')}
                    </label>
                    <input
                      type="text"
                      value={editForm.location || ''}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      placeholder="TP. Hồ Chí Minh"
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-white/15 bg-white dark:bg-white/5 text-neutral-900 dark:text-white outline-none focus:border-[#007b8b] dark:focus:border-[#00c4de]"
                    />
                  </div>

                  {/* Vai trò (Role) - CustomSelect pure text without emojis */}
                  <div className="space-y-1">
                    <label className="font-semibold text-neutral-700 dark:text-neutral-300 block">
                      {t('users.lbl_role')}
                    </label>
                    <CustomSelect
                      value={editForm.role}
                      onChange={(val) =>
                        setEditForm({
                          ...editForm,
                          role: val as 'driver' | 'surveyor' | 'reviewer' | 'staff' | 'admin',
                        })
                      }
                      options={roleOptions}
                      className="w-full"
                      buttonClassName="w-full rounded-xl border-neutral-300 dark:border-white/15 min-h-[38px]"
                    />
                  </div>

                  {/* Trạng thái tài khoản - CustomSelect pure text without emojis */}
                  <div className="space-y-1">
                    <label className="font-semibold text-neutral-700 dark:text-neutral-300 block">
                      {t('users.lbl_status')}
                    </label>
                    <CustomSelect
                      value={editForm.status}
                      onChange={(val) =>
                        setEditForm({
                          ...editForm,
                          status: val as 'Active' | 'Suspended',
                        })
                      }
                      options={statusOptions}
                      className="w-full"
                      buttonClassName="w-full rounded-xl border-neutral-300 dark:border-white/15 min-h-[38px]"
                    />
                  </div>

                  {/* Phòng ban / Phụ trách */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-semibold text-neutral-700 dark:text-neutral-300 block">
                      {t('users.lbl_department')}
                    </label>
                    <input
                      type="text"
                      value={editForm.department || ''}
                      onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                      placeholder="Vận hành, Kiểm duyệt, Kỹ thuật..."
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-white/15 bg-white dark:bg-white/5 text-neutral-900 dark:text-white outline-none focus:border-[#007b8b] dark:focus:border-[#00c4de]"
                    />
                  </div>
                </div>

                {/* Password Reset Section */}
                <div className="p-3.5 bg-neutral-50 dark:bg-white/5 border border-neutral-200/80 dark:border-white/10 rounded-xl space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-neutral-900 dark:text-white text-xs">
                        {t('users.lbl_reset_pwd')}
                      </h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        {t('users.lbl_reset_pwd_desc')} {selectedUser.email}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isSendingResetEmail}
                      onClick={handleSendPasswordResetEmail}
                      className="px-3.5 py-2 rounded-xl bg-[#007b8b] hover:bg-[#006471] dark:bg-[#00c4de] dark:hover:bg-[#00b2c9] text-white dark:text-black font-semibold text-xs transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <PaperPlaneTilt size={13} weight="bold" className={isSendingResetEmail ? 'animate-spin' : ''} />
                      <span>{isSendingResetEmail ? t('users.btn_sending') : t('users.btn_send_reset_link')}</span>
                    </button>
                  </div>

                  {resetEmailSentInfo && resetEmailSentInfo.email === selectedUser.email && (
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 rounded-lg space-y-2 animate-in fade-in">
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-medium">
                          <CheckCircle size={14} weight="fill" className="text-emerald-500" />
                          <span>Đã gửi lúc {resetEmailSentInfo.sentAt} (hết hạn trong 30 phút)</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={resetEmailSentInfo.tokenLink}
                          className="flex-1 px-2.5 py-1 text-[11px] font-mono rounded-lg bg-white dark:bg-black/40 border border-emerald-500/30 text-neutral-700 dark:text-neutral-200 outline-none select-all"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(resetEmailSentInfo.tokenLink)
                            setHasCopiedResetLink(true)
                            toast.success(t('users.toast_copied'))
                            setTimeout(() => setHasCopiedResetLink(false), 2000)
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
                        >
                          {hasCopiedResetLink ? <Check size={12} weight="bold" /> : <Copy size={12} weight="bold" />}
                          <span>{hasCopiedResetLink ? t('users.btn_copied') : t('users.btn_copy_link')}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Direct Editable Footer Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-white/10 gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(selectedUser.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedUser.status === 'Active'
                        ? 'bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:hover:bg-red-900/40'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40'
                    }`}
                  >
                    {selectedUser.status === 'Active' ? (
                      <>
                        <Prohibit size={14} />
                        <span>{t('users.btn_lock')}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={14} />
                        <span>{t('users.btn_unlock')}</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/10 font-medium text-xs transition-colors cursor-pointer"
                    >
                      {t('users.btn_close')}
                    </button>

                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#007b8b] hover:bg-[#006471] dark:bg-[#00c4de] dark:hover:bg-[#00b2c9] text-white dark:text-black font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <FloppyDisk size={14} weight="bold" />
                      <span>{t('users.btn_save')}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  )
}

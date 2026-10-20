import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/context/ToastContext'
import PageHeader from '@/components/common/PageHeader'
import { DataFilterBar } from '@/components/common/DataFilterBar'
import CustomSelect from '@/components/common/CustomSelect'
import { Pagination } from '@/components/common/Pagination'
import { ModalPortal } from '@/components/common/ModalPortal'
import {
  ArrowsClockwise,
  CircleNotch,
  X,
  Copy,
  Check,
} from '@phosphor-icons/react'
import { userService, type BackendUserItem } from '@/api/services/user.service'

const SYSTEM_ROLES = [
  { code: 'ADMIN', label: 'Admin' },
  { code: 'STAFF', label: 'Staff' },
  { code: 'REVIEWER', label: 'Reviewer' },
  { code: 'SURVEYOR', label: 'Surveyor' },
  { code: 'DRIVER', label: 'Driver' },
] as const

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  STAFF: 'Staff',
  REVIEWER: 'Reviewer',
  SURVEYOR: 'Surveyor',
  DRIVER: 'Driver',
}

function formatRoleName(code: string): string {
  const upper = (code || '').toUpperCase()
  return ROLE_LABELS[upper] || code
}

function formatShortDate(dateStr?: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatFullDateTime(dateStr?: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getStatusMeta(status: string) {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
      return {
        label: 'Hoạt động',
        textColor: 'text-emerald-700 dark:text-emerald-400 font-medium',
      }
    case 'SUSPENDED':
      return {
        label: 'Tạm khóa',
        textColor: 'text-amber-700 dark:text-amber-400 font-medium',
      }
    case 'BANNED':
      return {
        label: 'Đã cấm',
        textColor: 'text-red-700 dark:text-red-400 font-medium',
      }
    default:
      return {
        label: status || '—',
        textColor: 'text-gray-600 dark:text-gray-400',
      }
  }
}

function UserAvatar({
  url,
  name,
  size = 'sm',
  className = '',
}: {
  url?: string | null
  name?: string
  size?: 'sm' | 'md'
  className?: string
}) {
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    setImgError(false)
  }, [url])

  const words = (name || '').trim().split(/\s+/).filter(Boolean)
  const initials =
    words.length >= 2
      ? (words[0][0] + words[words.length - 1][0]).toUpperCase()
      : (words[0]?.[0] || 'U').toUpperCase()

  const dim = size === 'md' ? 'w-10 h-10 text-xs' : 'w-8 h-8 text-[11px]'

  if (url && !imgError) {
    return (
      <img
        src={url}
        alt={name || ''}
        onError={() => setImgError(true)}
        className={`${dim} rounded-full object-cover border border-gray-200 dark:border-white/10 shrink-0 ${className}`}
      />
    )
  }

  return (
    <div
      className={`${dim} rounded-full bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 font-semibold flex items-center justify-center shrink-0 border border-neutral-200/60 dark:border-white/10 select-none font-mono ${className}`}
    >
      {initials}
    </div>
  )
}

export default function UsersPage() {
  const { t } = useTranslation(['ops', 'common'])
  const toast = useToast()

  // Real API State (Zero mock data)
  const [users, setUsers] = useState<BackendUserItem[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Modal State
  const [selectedUser, setSelectedUser] = useState<BackendUserItem | null>(null)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState<'ACTIVE' | 'SUSPENDED' | 'BANNED'>('ACTIVE')
  const [statusReason, setStatusReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copiedId, setCopiedId] = useState(false)

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch users directly from real NestJS API
  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await userService.getUsers({
        page: currentPage,
        pageSize,
        search: debouncedSearch.trim() || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      })

      if (response && Array.isArray(response.items)) {
        setUsers(response.items)
        setTotalCount(response.total ?? response.items.length)
      } else {
        setUsers([])
        setTotalCount(0)
      }
    } catch (err: any) {
      // If remote backend returns 500 for role query (pending deployment of backend fix),
      // gracefully fetch without role param and filter locally so user experience is uninterrupted
      if (roleFilter !== 'all') {
        try {
          const fallbackRes = await userService.getUsers({
            page: 1,
            pageSize: 100,
            search: debouncedSearch.trim() || undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
          })
          if (fallbackRes && Array.isArray(fallbackRes.items)) {
            const matched = fallbackRes.items.filter((u) =>
              (u.roles || []).some((r) => r.toUpperCase() === roleFilter.toUpperCase())
            )
            setUsers(matched.slice((currentPage - 1) * pageSize, currentPage * pageSize))
            setTotalCount(matched.length)
            setIsLoading(false)
            return
          }
        } catch {
          // If fallback fails too, proceed to error toast
        }
      }

      console.error('Failed to load users from API:', err)
      toast.error(err?.message || 'Không thể tải danh sách người dùng từ máy chủ')
      setUsers([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSize, debouncedSearch, roleFilter, statusFilter, toast])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Open Edit Modal
  const handleOpenModal = (user: BackendUserItem) => {
    setSelectedUser(user)
    setSelectedRoles(Array.isArray(user.roles) ? [...user.roles.map((r) => r.toUpperCase())] : [])
    setSelectedStatus(user.status || 'ACTIVE')
    setStatusReason('')
    setCopiedId(false)
  }

  const handleCloseModal = () => {
    setSelectedUser(null)
    setIsSubmitting(false)
    setCopiedId(false)
  }

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedUser) {
        handleCloseModal()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedUser])

  // Toggle role in modal
  const handleToggleRole = (roleCode: string) => {
    const code = roleCode.toUpperCase()
    setSelectedRoles((prev) =>
      prev.includes(code) ? prev.filter((r) => r !== code) : [...prev, code]
    )
  }

  // Handle Save User Changes
  const handleSaveUser = async () => {
    if (!selectedUser) return
    if (selectedRoles.length === 0) {
      toast.warning('Người dùng phải có ít nhất 1 vai trò')
      return
    }

    setIsSubmitting(true)
    try {
      const originalRoles = (selectedUser.roles || []).map((r) => r.toUpperCase())
      const newRoles = selectedRoles.map((r) => r.toUpperCase())

      // 1. Assign added roles
      const rolesToAdd = newRoles.filter((r) => !originalRoles.includes(r))
      for (const r of rolesToAdd) {
        await userService.assignRole(selectedUser.id, { roleCode: r, isActive: true })
      }

      // 2. Revoke removed roles
      const rolesToRemove = originalRoles.filter((r) => !newRoles.includes(r))
      for (const r of rolesToRemove) {
        await userService.assignRole(selectedUser.id, { roleCode: r, isActive: false })
      }

      // 3. Update status if changed
      if (selectedStatus !== selectedUser.status) {
        await userService.updateStatus(selectedUser.id, {
          status: selectedStatus,
          reason: statusReason.trim() || 'Admin cập nhật trạng thái từ Ops Portal',
        })
      }

      toast.success(`Cập nhật tài khoản ${selectedUser.full_name || selectedUser.email} thành công`)
      handleCloseModal()
      fetchUsers()
    } catch (err: any) {
      console.error('Failed to update user:', err)
      toast.error(err?.message || 'Không thể cập nhật người dùng trên máy chủ')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 w-full animate-in fade-in duration-200">
      {/* ─── PAGE HEADER ──────────────────────────────────────────────── */}
      <PageHeader
        title={t('users.title', 'Quản lý người dùng')}
        actions={
          <button
            type="button"
            disabled={isLoading}
            onClick={fetchUsers}
            className="p-2 border border-neutral-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-neutral-50 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-200 rounded-xl transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            title="Làm mới danh sách"
          >
            <ArrowsClockwise size={16} weight="bold" className={isLoading ? 'animate-spin' : ''} />
          </button>
        }
      />

      {/* ─── DATA FILTER BAR ───────────────────────────────────────────── */}
      <DataFilterBar
        searchQuery={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Tìm theo tên, email, SĐT..."
      >
        {/* Role Filter */}
        <CustomSelect
          value={roleFilter}
          onChange={(val) => {
            setRoleFilter(val)
            setCurrentPage(1)
          }}
          size="sm"
          options={[
            { value: 'all', label: 'Tất cả vai trò' },
            { value: 'ADMIN', label: 'Admin' },
            { value: 'STAFF', label: 'Staff' },
            { value: 'REVIEWER', label: 'Reviewer' },
            { value: 'SURVEYOR', label: 'Surveyor' },
            { value: 'DRIVER', label: 'Driver' },
          ]}
          className="w-full sm:w-44"
        />

        {/* Status Filter */}
        <CustomSelect
          value={statusFilter}
          onChange={(val) => {
            setStatusFilter(val)
            setCurrentPage(1)
          }}
          size="sm"
          options={[
            { value: 'all', label: 'Tất cả trạng thái' },
            { value: 'ACTIVE', label: 'Hoạt động' },
            { value: 'SUSPENDED', label: 'Tạm khóa' },
            { value: 'BANNED', label: 'Đã cấm' },
          ]}
          className="w-full sm:w-44"
        />
      </DataFilterBar>

      {/* ─── CLEAN, CONCISE USERS TABLE (Pure API Data, Zero Mock) ─────── */}
      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-mono border-b border-gray-200 dark:border-white/10">
              <tr>
                <th className="py-3 px-3 font-semibold w-14 text-center">Hình ảnh</th>
                <th className="py-3 px-4 font-semibold">Người dùng</th>
                <th className="py-3 px-4 font-semibold">Mã ID</th>
                <th className="py-3 px-4 font-semibold">Số điện thoại</th>
                <th className="py-3 px-4 font-semibold">Vai trò</th>
                <th className="py-3 px-4 font-semibold">Trạng thái</th>
                <th className="py-3 px-4 font-semibold">Ngày tham gia</th>
                <th className="py-3 px-4 font-semibold text-center">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400 font-medium">
                    <div className="inline-flex items-center gap-2 text-neutral-500">
                      <CircleNotch size={18} className="animate-spin text-[#007b8b] dark:text-[#00c4de]" />
                      <span>Đang tải danh sách người dùng từ hệ thống...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="space-y-1">
                      <p className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                        Không tìm thấy người dùng nào
                      </p>
                      <p className="text-xs text-gray-400">
                        Thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc vai trò/trạng thái.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const statusMeta = getStatusMeta(u.status)

                  return (
                    <tr
                      key={u.id}
                      onClick={() => handleOpenModal(u)}
                      className="hover:bg-neutral-50/80 dark:hover:bg-white/[0.03] transition-colors cursor-pointer group"
                    >
                      {/* Cột hình ảnh kế bên cột Người dùng */}
                      <td className="py-3 px-3 text-center w-14">
                        <UserAvatar url={u.avatar_url} name={u.full_name} size="sm" className="mx-auto" />
                      </td>

                      {/* 1. Người dùng: Tên + Email */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {u.full_name || 'Chưa đặt tên'}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                            {u.email}
                          </p>
                        </div>
                      </td>

                      {/* 2. Mã ID: Rút gọn 8 ký tự, font-mono */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#007b8b] dark:text-[#00c4de]">
                        <span className="group-hover:underline">#{u.id.slice(0, 8)}</span>
                      </td>

                      {/* 3. Số điện thoại */}
                      <td className="py-3.5 px-4 font-mono text-gray-700 dark:text-gray-300">
                        {u.phone || '—'}
                      </td>

                      {/* 4. Vai trò: Chuỗi văn bản thuần ngăn cách bằng dấu phẩy */}
                      <td className="py-3.5 px-4 text-xs">
                        {u.roles && u.roles.length > 0 ? (
                          u.roles.map((r, i) => {
                            const isAdmin = r.toUpperCase() === 'ADMIN'
                            return (
                              <span key={r}>
                                {i > 0 && ', '}
                                <span
                                  className={
                                    isAdmin
                                      ? 'font-semibold text-purple-700 dark:text-purple-400'
                                      : 'text-gray-700 dark:text-gray-300'
                                  }
                                >
                                  {formatRoleName(r)}
                                </span>
                              </span>
                            )
                          })
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* 5. Trạng thái: Chữ thuần có màu ngữ cảnh */}
                      <td className="py-3.5 px-4">
                        <span className={statusMeta.textColor}>{statusMeta.label}</span>
                      </td>

                      {/* 6. Ngày tham gia */}
                      <td className="py-3.5 px-4 text-gray-500 dark:text-gray-400 font-mono text-[11px] whitespace-nowrap">
                        {formatShortDate(u.created_at)}
                      </td>

                      {/* 7. Nút xem chi tiết */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenModal(u)
                          }}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-[#007b8b] hover:text-white dark:bg-white/10 dark:hover:bg-[#00c4de] dark:hover:text-black transition-all cursor-pointer"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ─── PAGINATION (Clean backend-paginated) ────────────────────── */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5">
          <Pagination
            currentPage={currentPage}
            totalItems={totalCount}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize)
              setCurrentPage(1)
            }}
            pageSizeOptions={[5, 10, 20, 50]}
          />
        </div>
      </div>

      {/* ─── SIMPLE & CLEAN USER DETAIL & EDIT MODAL (Identical style to /escalations & catalog) ───────────────────── */}
      {selectedUser && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
            onClick={handleCloseModal}
          >
            <div
              className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl max-w-[560px] w-full shadow-2xl animate-in zoom-in-95 my-auto max-h-[92vh] flex flex-col overflow-hidden text-xs text-gray-800 dark:text-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-sm text-gray-900 dark:text-white truncate">
                    {selectedUser.full_name || selectedUser.email}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className={`font-medium text-xs whitespace-nowrap ${getStatusMeta(selectedUser.status).textColor}`}>
                    {getStatusMeta(selectedUser.status).label}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-2"
                  title="Đóng (Esc)"
                >
                  <X size={18} weight="bold" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4 overflow-y-auto text-xs">
                {/* 1. Profile Card */}
                <div className="flex items-center gap-3.5 p-3.5 rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
                  <UserAvatar url={selectedUser.avatar_url} name={selectedUser.full_name} size="md" />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {selectedUser.full_name || 'Chưa đặt tên'}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
                      {selectedUser.email}
                    </p>
                  </div>
                </div>

                {/* 2. Key-Value Info Card (Full ID shown cleanly) */}
                <div className="rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] divide-y divide-gray-200/60 dark:divide-white/5">
                  <div className="flex items-center justify-between py-2 px-3.5">
                    <span className="text-gray-500 dark:text-gray-400">Mã người dùng</span>
                    <div className="flex items-center gap-1.5 font-mono text-gray-800 dark:text-gray-200">
                      <span className="select-all break-all">{selectedUser.id}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedUser.id)
                          setCopiedId(true)
                          setTimeout(() => setCopiedId(false), 2000)
                        }}
                        className="text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
                        title="Sao chép UUID"
                      >
                        {copiedId ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2 px-3.5">
                    <span className="text-gray-500 dark:text-gray-400">Số điện thoại</span>
                    <span className="font-mono text-gray-800 dark:text-gray-200">{selectedUser.phone || '—'}</span>
                  </div>

                  <div className="flex items-center justify-between py-2 px-3.5">
                    <span className="text-gray-500 dark:text-gray-400">Ngày tạo</span>
                    <span className="font-mono text-gray-800 dark:text-gray-200">{formatFullDateTime(selectedUser.created_at)}</span>
                  </div>

                  {selectedUser.updated_at && (
                    <div className="flex items-center justify-between py-2 px-3.5">
                      <span className="text-gray-500 dark:text-gray-400">Cập nhật lần cuối</span>
                      <span className="font-mono text-gray-800 dark:text-gray-200">{formatFullDateTime(selectedUser.updated_at)}</span>
                    </div>
                  )}
                </div>

                {/* 3. Vai trò */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-900 dark:text-white">
                    Vai trò
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                    {SYSTEM_ROLES.map((r) => {
                      const isSelected = selectedRoles.includes(r.code)
                      return (
                        <button
                          key={r.code}
                          type="button"
                          onClick={() => handleToggleRole(r.code)}
                          className={`py-2 px-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer text-center ${
                            isSelected
                              ? 'bg-[#007b8b] text-white border-[#007b8b] dark:bg-[#00c4de] dark:text-black dark:border-[#00c4de] shadow-xs'
                              : 'bg-white dark:bg-black/30 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                          }`}
                        >
                          {r.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 4. Trạng thái */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-900 dark:text-white">
                    Trạng thái
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedStatus('ACTIVE')}
                      className={`py-2 px-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer text-center ${
                        selectedStatus === 'ACTIVE'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white dark:bg-black/30 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                      }`}
                    >
                      Hoạt động
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedStatus('SUSPENDED')}
                      className={`py-2 px-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer text-center ${
                        selectedStatus === 'SUSPENDED'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white dark:bg-black/30 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                      }`}
                    >
                      Tạm khóa
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedStatus('BANNED')}
                      className={`py-2 px-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer text-center ${
                        selectedStatus === 'BANNED'
                          ? 'bg-red-600 text-white border-red-600 shadow-xs'
                          : 'bg-white dark:bg-black/30 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                      }`}
                    >
                      Đã cấm
                    </button>
                  </div>

                  {selectedStatus !== selectedUser.status && (selectedStatus === 'SUSPENDED' || selectedStatus === 'BANNED') && (
                    <div className="space-y-1 pt-1 animate-in fade-in duration-150">
                      <label className="text-[11px] text-gray-500">
                        Lý do thay đổi trạng thái
                      </label>
                      <input
                        type="text"
                        value={statusReason}
                        onChange={(e) => setStatusReason(e.target.value)}
                        placeholder="Nhập lý do..."
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/15 bg-white dark:bg-white/5 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-1 focus:ring-[#007b8b]"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 px-5 py-3 border-t border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] shrink-0">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/15 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSaveUser}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#007b8b] hover:bg-[#00606d] text-white font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <CircleNotch size={14} className="animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>Lưu thay đổi</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  )
}

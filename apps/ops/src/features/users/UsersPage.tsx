import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
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
import {
  userService,
  type BackendUserItem,
  type LowReliabilityUserItem,
  type BanWaveResponse,
} from '@/api/services/user.service'

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
  const [searchParams, setSearchParams] = useSearchParams()

  const activeTab = searchParams.get('tab') === 'low_reliability' ? 'low_reliability' : 'all'

  const handleTabChange = (tab: 'all' | 'low_reliability') => {
    const next = new URLSearchParams(searchParams)
    if (tab === 'all') {
      next.delete('tab')
    } else {
      next.set('tab', tab)
    }
    setSearchParams(next, { replace: true })
  }

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

  // Low Reliability Users State
  const [lowUsers, setLowUsers] = useState<LowReliabilityUserItem[]>([])
  const [lowTotalCount, setLowTotalCount] = useState<number>(0)
  const [isLowLoading, setIsLowLoading] = useState<boolean>(false)
  const [thresholdInput, setThresholdInput] = useState<number>(50)
  const [minReviewsInput, setMinReviewsInput] = useState<number>(1)
  const [lowCurrentPage, setLowCurrentPage] = useState<number>(1)
  const [lowPageSize, setLowPageSize] = useState<number>(10)

  // Ban Wave Modal State
  const [isBanWaveModalOpen, setIsBanWaveModalOpen] = useState(false)
  const [isBanWavePreviewing, setIsBanWavePreviewing] = useState(false)
  const [banWavePreview, setBanWavePreview] = useState<BanWaveResponse | null>(null)
  const [banWaveReason, setBanWaveReason] = useState('Điểm uy tín dưới ngưỡng cho phép')
  const [isBanWaveExecuting, setIsBanWaveExecuting] = useState(false)

  // Single User Ban Modal State
  const [banTargetUser, setBanTargetUser] = useState<LowReliabilityUserItem | null>(null)
  const [singleBanReason, setSingleBanReason] = useState('Điểm uy tín dưới ngưỡng cho phép')
  const [isSingleBanning, setIsSingleBanning] = useState(false)

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
    setSelectedRoles(Array.isArray(user.roles) ? user.roles.map((r) => r.toUpperCase()) : [])
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

  // Fetch low-reliability users
  const fetchLowUsers = useCallback(async () => {
    setIsLowLoading(true)
    try {
      const res = await userService.getLowReliabilityUsers({
        threshold: thresholdInput,
        minReviews: minReviewsInput,
        page: lowCurrentPage,
        pageSize: lowPageSize,
      })
      if (res && Array.isArray(res.items)) {
        setLowUsers(res.items)
        setLowTotalCount(res.total ?? res.items.length)
      } else {
        setLowUsers([])
        setLowTotalCount(0)
      }
    } catch (err: any) {
      toast.error(err?.message || 'Không thể tải danh sách tài khoản uy tín thấp')
      setLowUsers([])
      setLowTotalCount(0)
    } finally {
      setIsLowLoading(false)
    }
  }, [thresholdInput, minReviewsInput, lowCurrentPage, lowPageSize, toast])

  useEffect(() => {
    if (activeTab === 'low_reliability') {
      fetchLowUsers()
    }
  }, [activeTab, fetchLowUsers])

  const handleOpenBanWave = async () => {
    setIsBanWaveModalOpen(true)
    setIsBanWavePreviewing(true)
    setBanWavePreview(null)
    setBanWaveReason('Điểm uy tín dưới ngưỡng cho phép')
    try {
      const res = await userService.executeBanWave({
        reliabilityThreshold: thresholdInput,
        minReviews: minReviewsInput,
        dryRun: true,
      })
      setBanWavePreview(res)
    } catch (err: any) {
      toast.error(err?.message || 'Không thể kiểm tra trước danh sách cấm hàng loạt')
    } finally {
      setIsBanWavePreviewing(false)
    }
  }

  const handleConfirmBanWave = async () => {
    if (!banWavePreview || banWavePreview.matchedCount === 0) return
    setIsBanWaveExecuting(true)
    try {
      const res = await userService.executeBanWave({
        reliabilityThreshold: thresholdInput,
        minReviews: minReviewsInput,
        reason: banWaveReason.trim() || 'Điểm uy tín dưới ngưỡng cho phép',
        dryRun: false,
      })
      toast.success(`Đã cấm ${res.bannedCount} tài khoản thành công`)
      setIsBanWaveModalOpen(false)
      fetchLowUsers()
      fetchUsers()
    } catch (err: any) {
      toast.error(err?.message || 'Không thể thực hiện cấm hàng loạt')
    } finally {
      setIsBanWaveExecuting(false)
    }
  }

  const handleConfirmSingleBan = async () => {
    if (!banTargetUser) return
    setIsSingleBanning(true)
    try {
      await userService.updateStatus(banTargetUser.id, {
        status: 'BANNED',
        reason: singleBanReason.trim() || 'Điểm uy tín dưới ngưỡng cho phép',
      })
      toast.success(`Đã cấm tài khoản ${banTargetUser.fullName || banTargetUser.email}`)
      setBanTargetUser(null)
      fetchLowUsers()
      fetchUsers()
    } catch (err: any) {
      toast.error(err?.message || 'Không thể cấm tài khoản này')
    } finally {
      setIsSingleBanning(false)
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
            disabled={activeTab === 'all' ? isLoading : isLowLoading}
            onClick={() => {
              if (activeTab === 'all') {
                fetchUsers()
              } else {
                fetchLowUsers()
              }
            }}
            className="p-2 border border-neutral-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-neutral-50 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-200 rounded-xl transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            title="Làm mới danh sách"
          >
            <ArrowsClockwise size={16} weight="bold" className={(activeTab === 'all' ? isLoading : isLowLoading) ? 'animate-spin' : ''} />
          </button>
        }
      />

      {/* ─── SEGMENTED TAB NAVIGATION BAR ─────────────────────────────── */}
      <div className="p-1 bg-neutral-100 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-white/10 rounded-xl inline-flex items-center gap-1 shadow-2xs max-w-full overflow-x-auto flex-nowrap scrollbar-none">
        <button
          type="button"
          onClick={() => handleTabChange('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0 ${activeTab === 'all'
            ? 'bg-white dark:bg-[#0A171C] text-neutral-900 dark:text-white shadow-xs border border-neutral-200/60 dark:border-white/10'
            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 border border-transparent'
            }`}
        >
          <span>Danh sách người dùng</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('low_reliability')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0 ${activeTab === 'low_reliability'
            ? 'bg-white dark:bg-[#0A171C] text-neutral-900 dark:text-white shadow-xs border border-neutral-200/60 dark:border-white/10'
            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 border border-transparent'
            }`}
        >
          <span>Tài khoản uy tín thấp</span>
        </button>
      </div>

      {activeTab === 'all' ? (
        <>
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
        </>
      ) : (
        <>
          {/* ─── LOW RELIABILITY FILTER & ACTION BAR ─── */}
          <div className="p-4 bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Ngưỡng uy tín
                </span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={thresholdInput}
                  onChange={(e) => setThresholdInput(Number(e.target.value))}
                  className="w-20 px-2.5 py-1.5 text-xs font-mono font-bold bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-hidden focus:border-[#007b8b]"
                />
                <span className="text-xs text-gray-500 font-bold">%</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Số bài đánh giá tối thiểu
                </span>
                <input
                  type="number"
                  min={0}
                  value={minReviewsInput}
                  onChange={(e) => setMinReviewsInput(Number(e.target.value))}
                  className="w-20 px-2.5 py-1.5 text-xs font-mono font-bold bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg focus:outline-hidden focus:border-[#007b8b]"
                />
              </div>

              <button
                type="button"
                disabled={isLowLoading}
                onClick={() => {
                  setLowCurrentPage(1)
                  fetchLowUsers()
                }}
                className="px-4 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-800 dark:text-gray-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                Lọc dữ liệu
              </button>
            </div>

            <button
              type="button"
              onClick={handleOpenBanWave}
              className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Cấm hàng loạt
            </button>
          </div>

          {/* ─── LOW RELIABILITY TABLE ─── */}
          <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-mono border-b border-gray-200 dark:border-white/10">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Người dùng</th>
                    <th className="py-3 px-4 font-semibold">Mã tài khoản</th>
                    <th className="py-3 px-4 font-semibold">Điểm uy tín</th>
                    <th className="py-3 px-4 font-semibold">Tổng bài đánh giá</th>
                    <th className="py-3 px-4 font-semibold">Sai liên tiếp</th>
                    <th className="py-3 px-4 font-semibold">Phân loại</th>
                    <th className="py-3 px-4 font-semibold text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {isLowLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400 font-medium">
                        <div className="inline-flex items-center gap-2 text-neutral-500">
                          <CircleNotch size={18} className="animate-spin text-[#007b8b] dark:text-[#00c4de]" />
                          <span>Đang tải danh sách tài khoản uy tín thấp...</span>
                        </div>
                      </td>
                    </tr>
                  ) : lowUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500 dark:text-gray-400">
                        <p className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                          Không có tài khoản nào có điểm uy tín dưới ngưỡng này
                        </p>
                      </td>
                    </tr>
                  ) : (
                    lowUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-neutral-50/80 dark:hover:bg-white/[0.03] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {u.fullName || 'Chưa đặt tên'}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                              {u.email}
                            </p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-[#007b8b] dark:text-[#00c4de]">
                          #{u.id.slice(0, 8)}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-red-600 dark:text-red-400">
                          {u.reliabilityScore}%
                        </td>
                        <td className="py-3.5 px-4 font-mono text-gray-700 dark:text-gray-300">
                          {u.totalReviews}
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <span className={u.consecutiveErrors > 0 ? 'font-bold text-amber-600 dark:text-amber-400' : 'text-gray-700 dark:text-gray-300'}>
                            {u.consecutiveErrors}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {u.isProvisional ? (
                            <span className="px-2 py-0.5 rounded text-[11px] bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium">
                              Tài khoản mới
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[11px] bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-300">
                              Tài khoản bình thường
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setBanTargetUser(u)
                              setSingleBanReason('Điểm uy tín dưới ngưỡng cho phép')
                            }}
                            className="px-3 py-1 rounded-lg text-xs font-semibold text-red-600 hover:text-white hover:bg-red-600 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white border border-red-200 dark:border-red-900/40 transition-colors cursor-pointer"
                          >
                            Cấm
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5">
              <Pagination
                currentPage={lowCurrentPage}
                totalItems={lowTotalCount}
                pageSize={lowPageSize}
                onPageChange={setLowCurrentPage}
                onPageSizeChange={(newSize) => {
                  setLowPageSize(newSize)
                  setLowCurrentPage(1)
                }}
                pageSizeOptions={[5, 10, 20, 50]}
              />
            </div>
          </div>
        </>
      )}

      {/* ─── BAN WAVE MODAL ────────────────────────────────────────────── */}
      {isBanWaveModalOpen && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
            onClick={() => !isBanWaveExecuting && setIsBanWaveModalOpen(false)}
          >
            <div
              className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl max-w-[560px] w-full shadow-2xl animate-in zoom-in-95 my-auto max-h-[92vh] flex flex-col overflow-hidden text-xs text-gray-800 dark:text-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] shrink-0">
                <span className="font-bold text-sm text-gray-900 dark:text-white">
                  Cấm tài khoản hàng loạt
                </span>
                <button
                  type="button"
                  disabled={isBanWaveExecuting}
                  onClick={() => setIsBanWaveModalOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                >
                  <X size={18} weight="bold" />
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto text-xs">
                {isBanWavePreviewing ? (
                  <div className="py-8 text-center text-gray-500">
                    <CircleNotch size={24} className="animate-spin mx-auto mb-2 text-[#007b8b] dark:text-[#00c4de]" />
                    <p>Đang kiểm tra danh sách tài khoản cần cấm...</p>
                  </div>
                ) : (
                  <>
                    <div className="p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5 space-y-1">
                      <p className="font-semibold text-amber-900 dark:text-amber-200 text-xs">
                        Có {banWavePreview?.matchedCount || 0} tài khoản có điểm uy tín dưới {thresholdInput}% sẽ bị cấm.
                      </p>
                      <p className="text-[11px] text-amber-700/80 dark:text-amber-300/70">
                        Thao tác này sẽ chuyển trạng thái của toàn bộ tài khoản đủ điều kiện sang Đã cấm và thu hồi quyền đánh giá.
                      </p>
                    </div>

                    {banWavePreview && banWavePreview.bannedUsers.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="font-bold text-gray-900 dark:text-white">
                          Danh sách tài khoản áp dụng
                        </span>
                        <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] divide-y divide-gray-200/60 dark:divide-white/5 p-2">
                          {banWavePreview.bannedUsers.map((u: any) => (
                            <div key={u.id} className="py-1.5 px-2 flex items-center justify-between">
                              <div>
                                <span className="font-semibold text-gray-900 dark:text-white mr-2">
                                  {u.fullName || 'Chưa đặt tên'}
                                </span>
                                <span className="font-mono text-gray-500 text-[11px]">
                                  {u.email}
                                </span>
                              </div>
                              <span className="font-mono font-bold text-red-600 dark:text-red-400">
                                {u.reliabilityScore}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="block font-bold text-gray-900 dark:text-white">
                        Lý do cấm
                      </label>
                      <input
                        type="text"
                        value={banWaveReason}
                        onChange={(e) => setBanWaveReason(e.target.value)}
                        placeholder="Nhập lý do cấm..."
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/15 bg-white dark:bg-white/5 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-1 focus:ring-[#007b8b]"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 px-5 py-3 border-t border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] shrink-0">
                <button
                  type="button"
                  disabled={isBanWaveExecuting}
                  onClick={() => setIsBanWaveModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/15 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={isBanWaveExecuting || isBanWavePreviewing || !banWavePreview || banWavePreview.matchedCount === 0}
                  onClick={handleConfirmBanWave}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isBanWaveExecuting ? 'Đang thực hiện...' : 'Xác nhận cấm'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ─── SINGLE USER BAN CONFIRMATION MODAL ─────────────────────────── */}
      {banTargetUser && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
            onClick={() => !isSingleBanning && setBanTargetUser(null)}
          >
            <div
              className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl max-w-[480px] w-full shadow-2xl animate-in zoom-in-95 my-auto flex flex-col overflow-hidden text-xs text-gray-800 dark:text-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] shrink-0">
                <span className="font-bold text-sm text-gray-900 dark:text-white">
                  Cấm tài khoản
                </span>
                <button
                  type="button"
                  disabled={isSingleBanning}
                  onClick={() => setBanTargetUser(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                >
                  <X size={18} weight="bold" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <p>
                  Bạn có chắc muốn cấm tài khoản <span className="font-bold text-gray-900 dark:text-white">{banTargetUser.fullName || banTargetUser.email}</span> không?
                </p>

                <div className="space-y-1.5">
                  <label className="block font-bold text-gray-900 dark:text-white">
                    Lý do cấm
                  </label>
                  <input
                    type="text"
                    value={singleBanReason}
                    onChange={(e) => setSingleBanReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/15 bg-white dark:bg-white/5 text-xs text-gray-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#007b8b]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 px-5 py-3 border-t border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] shrink-0">
                <button
                  type="button"
                  disabled={isSingleBanning}
                  onClick={() => setBanTargetUser(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/15 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={isSingleBanning}
                  onClick={handleConfirmSingleBan}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSingleBanning ? 'Đang thực hiện...' : 'Xác nhận cấm'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

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
                          className={`py-2 px-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer text-center ${isSelected
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
                      className={`py-2 px-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer text-center ${selectedStatus === 'ACTIVE'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white dark:bg-black/30 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                    >
                      Hoạt động
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedStatus('SUSPENDED')}
                      className={`py-2 px-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer text-center ${selectedStatus === 'SUSPENDED'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white dark:bg-black/30 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                    >
                      Tạm khóa
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedStatus('BANNED')}
                      className={`py-2 px-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer text-center ${selectedStatus === 'BANNED'
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

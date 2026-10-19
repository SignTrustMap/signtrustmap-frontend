import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/context/ToastContext'
import { Pagination } from '@/components/common/Pagination'
import { DataFilterBar } from '@/components/common/DataFilterBar'
import PageHeader from '@/components/common/PageHeader'
import CustomSelect from '@/components/common/CustomSelect'
import { ModalPortal } from '@/components/common/ModalPortal'
import {
  X,
  ArrowsClockwise,
  CircleNotch,
  Copy,
  Check,
} from '@phosphor-icons/react'
import {
  auditService,
  type AuditLogRecord,
} from '@/api/services/audit.service'

/** Format Date string cleanly to HH:mm • DD/MM/YYYY */
function formatDate(dateStr?: string | Date): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return String(dateStr)
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${hours}:${minutes} • ${day}/${month}/${year}`
}

/** Format Date with seconds cleanly to HH:mm:ss • DD/MM/YYYY */
function formatFullDate(dateStr?: string | Date): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return String(dateStr)
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${hours}:${minutes}:${seconds} • ${day}/${month}/${year}`
}

interface ActionConfig {
  labelVi: string
  labelEn: string
  textColor: string
}

function getActionConfig(action?: string): ActionConfig {
  const a = (action || '').toUpperCase()

  if (
    a.includes('BAN') ||
    a.includes('SUSPEND') ||
    a.includes('FREEZE') ||
    a.includes('DELETE') ||
    a.includes('REJECT') ||
    a.includes('ROLLBACK')
  ) {
    let vi = 'Vô hiệu hóa tài nguyên'
    let en = 'Disable resource'
    if (a.includes('BAN_USER')) {
      vi = 'Khóa tài khoản'
      en = 'Ban user'
    } else if (a.includes('DELETE_SIGN')) {
      vi = 'Xóa biển báo'
      en = 'Delete sign'
    } else if (a.includes('ROLLBACK')) {
      vi = 'Thu hồi mô hình'
      en = 'Rollback model'
    }
    return {
      labelVi: vi,
      labelEn: en,
      textColor: 'text-red-700 dark:text-red-400',
    }
  }

  if (a.includes('ROLE') || a.includes('PERMISSION') || a === 'ASSIGN_ROLE') {
    return {
      labelVi: 'Thay đổi vai trò',
      labelEn: 'Change user role',
      textColor: 'text-purple-700 dark:text-purple-400',
    }
  }

  if (a.includes('STATUS') || a.includes('UPDATE_USER')) {
    return {
      labelVi: 'Cập nhật trạng thái người dùng',
      labelEn: 'Update user status',
      textColor: 'text-amber-700 dark:text-amber-400',
    }
  }

  if (a.includes('RESOLVE') || a.includes('APPROVE') || a.includes('PROMOTE')) {
    return {
      labelVi: a.includes('PROMOTE') ? 'Phát hành mô hình' : 'Xử lý ca chuyển tiếp',
      labelEn: a.includes('PROMOTE') ? 'Promote model' : 'Resolve escalation',
      textColor: 'text-emerald-700 dark:text-emerald-400',
    }
  }

  if (a.includes('CONFIG') || a.includes('SETTINGS') || a.includes('MATRIX')) {
    let vi = 'Cập nhật cài đặt'
    let en = 'Update settings'
    if (a.includes('CONSENSUS')) {
      vi = 'Cấu hình đồng thuận'
      en = 'Consensus config'
    } else if (a.includes('ROUTE')) {
      vi = 'Ma trận tuyến đường'
      en = 'Route matrix'
    } else if (a.includes('ACTIVE_LEARNING')) {
      vi = 'Cấu hình học chủ động'
      en = 'Active learning config'
    }
    return {
      labelVi: vi,
      labelEn: en,
      textColor: 'text-sky-700 dark:text-sky-400',
    }
  }

  if (
    a.includes('TRIGGER') ||
    a.includes('CREATE') ||
    a.includes('ADD') ||
    a.includes('RETRAIN')
  ) {
    return {
      labelVi: a.includes('RETRAIN') ? 'Huấn luyện mô hình' : 'Tạo mới dữ liệu',
      labelEn: a.includes('RETRAIN') ? 'Retrain model' : 'Create data',
      textColor: 'text-emerald-700 dark:text-emerald-400',
    }
  }

  return {
    labelVi: action || 'Thao tác hệ thống',
    labelEn: action || 'System action',
    textColor: 'text-gray-700 dark:text-gray-300',
  }
}

function formatResourceName(resourceName?: string, isEn?: boolean): string {
  const r = (resourceName || '').toLowerCase()
  if (r === 'user_roles') return isEn ? 'User Role' : 'Vai trò người dùng'
  if (r === 'users' || r === 'user') return isEn ? 'User' : 'Người dùng'
  if (r === 'signs' || r === 'sign' || r === 'candidate') return isEn ? 'Sign' : 'Biển báo'
  if (r === 'consensus_configs') return isEn ? 'Consensus Config' : 'Cấu hình đồng thuận'
  if (r === 'route_classifications') return isEn ? 'Route Classification' : 'Tuyến đường'
  if (r === 'model_training_jobs') return isEn ? 'Training Job' : 'Tác vụ huấn luyện'
  if (r === 'ai_model_versions') return isEn ? 'AI Model' : 'Mô hình AI'
  if (r === 'system_parameters' || r === 'settings') return isEn ? 'System Parameter' : 'Tham số hệ thống'
  if (r === 'moderation_cases' || r === 'escalations') return isEn ? 'Escalation Case' : 'Ca chuyển tiếp'
  return resourceName || (isEn ? 'Resource' : 'Đối tượng')
}

function formatActor(userId?: string | null, isEn?: boolean): string {
  if (!userId) return isEn ? 'System Daemon' : 'Hệ thống tự động'
  return `Admin ${userId.slice(0, 8)}`
}

function formatIpAddress(ip?: string | null): string {
  if (!ip) return '127.0.0.1'
  let cleanIp = ip.trim()
  if (cleanIp.startsWith('::ffff:')) {
    cleanIp = cleanIp.slice(7)
  }
  if (cleanIp === '::1') {
    return '127.0.0.1'
  }
  return cleanIp
}

function formatFieldValue(val: any, isEn?: boolean): string {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'boolean') {
    if (isEn) return val ? 'Enabled' : 'Disabled'
    return val ? 'Bật' : 'Tắt'
  }
  if (typeof val === 'string') {
    const s = val.toUpperCase()
    if (s === 'ACTIVE') return isEn ? 'Active' : 'Hoạt động'
    if (s === 'SUSPENDED') return isEn ? 'Suspended' : 'Tạm khóa'
    if (s === 'BANNED') return isEn ? 'Banned' : 'Đã khóa'
    if (s === 'PENDING') return isEn ? 'Pending' : 'Chờ xử lý'
    if (s === 'RESOLVED') return isEn ? 'Resolved' : 'Đã giải quyết'
    if (s === 'DISMISSED') return isEn ? 'Dismissed' : 'Đã bác bỏ'
    if (s === 'ADMIN') return isEn ? 'Administrator' : 'Quản trị viên'
    if (s === 'STAFF') return isEn ? 'Staff Moderator' : 'Nhân viên kiểm duyệt'
    if (s === 'SURVEYOR') return isEn ? 'Surveyor' : 'Cộng tác viên thu thập'
    if (s === 'USER') return isEn ? 'Standard User' : 'Người dùng thông thường'
    return val
  }
  if (typeof val === 'object') {
    return JSON.stringify(val, null, 2)
  }
  return String(val)
}

function formatFieldKey(key: string, isEn?: boolean): string {
  const k = key.toLowerCase()
  if (k === 'status') return isEn ? 'Status' : 'Trạng thái'
  if (k === 'role' || k === 'rolecode') return isEn ? 'Role' : 'Vai trò'
  if (k === 'isactive') return isEn ? 'Active status' : 'Trạng thái kích hoạt'
  if (k === 'email') return 'Email'
  if (k === 'name') return isEn ? 'Full name' : 'Họ và tên'
  if (k === 'phone') return isEn ? 'Phone number' : 'Số điện thoại'
  if (k === 'trust_score' || k === 'trustscore') return isEn ? 'Trust score' : 'Điểm uy tín'
  if (k === 'reason') return isEn ? 'Reason' : 'Lý do'
  if (k === 'note' || k === 'notes') return isEn ? 'Note' : 'Ghi chú'
  return key
}

function renderValuesCard(values: any, isEn?: boolean, isAfter?: boolean) {
  if (!values || (typeof values === 'object' && Object.keys(values).length === 0)) {
    return (
      <div className="py-4 text-center text-gray-400 font-mono text-[11px]">
        {isAfter
          ? (isEn ? 'Resource removed from system' : 'Đã xóa khỏi hệ thống')
          : (isEn ? 'No previous data' : 'Không có dữ liệu trước')}
      </div>
    )
  }

  if (typeof values !== 'object') {
    return (
      <div className="font-mono text-xs text-gray-800 dark:text-gray-200 break-all">
        {String(values)}
      </div>
    )
  }

  const entries = Object.entries(values).filter(([k]) => k.toLowerCase() !== 'reason')
  if (entries.length === 0) {
    return (
      <div className="py-4 text-center text-gray-400 font-mono text-[11px]">
        {isEn ? 'No other field changes' : 'Không có thay đổi trường khác'}
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-200/40 dark:divide-white/5">
      {entries.map(([key, val]) => (
        <div key={key} className="py-1.5 flex items-baseline justify-between gap-2">
          <span className="text-gray-500 dark:text-gray-400 text-[11px]">
            {formatFieldKey(key, isEn)}
          </span>
          <span className="font-mono font-medium text-gray-900 dark:text-gray-100 text-right break-all">
            {formatFieldValue(val, isEn)}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function AuditLogsPage() {
  const { t, i18n } = useTranslation('ops')
  const { error } = useToast()
  const isEn = i18n.language?.startsWith('en')

  // Pure API State, Zero mock data
  const [logs, setLogs] = useState<AuditLogRecord[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [resourceFilter, setResourceFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Modal State
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null)
  const [copiedId, setCopiedId] = useState(false)
  const [copiedUserId, setCopiedUserId] = useState(false)
  const [copiedResourceId, setCopiedResourceId] = useState(false)

  // Fetch Logs from Real Backend API
  const fetchAuditLogs = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await auditService.getAuditLogs({
        page: currentPage,
        pageSize,
        action: actionFilter !== 'all' ? actionFilter : undefined,
        resourceName: resourceFilter !== 'all' ? resourceFilter : undefined,
      })
      if (response && Array.isArray(response.items)) {
        setLogs(response.items)
        setTotalCount(response.total ?? response.items.length)
      } else {
        setLogs([])
        setTotalCount(0)
      }
    } catch (err: any) {
      console.error('Failed to load audit logs from API:', err)
      error(
        err?.message ||
          (isEn
            ? 'Failed to fetch audit logs'
            : 'Không thể tải danh sách nhật ký kiểm toán từ máy chủ')
      )
      setLogs([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSize, actionFilter, resourceFilter, error, isEn])

  useEffect(() => {
    fetchAuditLogs()
  }, [fetchAuditLogs])

  // Client Search Filter
  const filteredLogs = logs.filter((log) => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return true
    const id = (log.id || '').toLowerCase()
    const userId = (log.user_id || '').toLowerCase()
    const action = (log.action || '').toLowerCase()
    const resName = (log.resource_name || '').toLowerCase()
    const resId = (log.resource_id || '').toLowerCase()
    const ip = (log.ip_address || '').toLowerCase()
    const actionConfig = getActionConfig(log.action)
    const actionVi = actionConfig.labelVi.toLowerCase()
    const actionEn = actionConfig.labelEn.toLowerCase()

    return (
      id.includes(q) ||
      userId.includes(q) ||
      action.includes(q) ||
      actionVi.includes(q) ||
      actionEn.includes(q) ||
      resName.includes(q) ||
      resId.includes(q) ||
      ip.includes(q)
    )
  })

  // Extract Reason from selected log
  const reasonText =
    selectedLog?.new_values && typeof selectedLog.new_values === 'object'
      ? selectedLog.new_values.reason || selectedLog.new_values.note || null
      : null

  return (
    <div className="p-6 sm:p-8 w-full max-w-[1680px] mx-auto space-y-6 animate-in fade-in duration-200">
      {/* ─── PAGE HEADER (Identical to Escalations) ────────────────────────── */}
      <PageHeader
        title={t('audit.title', isEn ? 'Activity audit logs' : 'Nhật ký hoạt động')}
        actions={
          <button
            type="button"
            onClick={fetchAuditLogs}
            disabled={isLoading}
            className="p-2 border border-neutral-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-neutral-50 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-200 rounded-xl transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            title={isEn ? 'Refresh audit logs' : 'Làm mới nhật ký'}
          >
            <ArrowsClockwise
              size={16}
              weight="bold"
              className={isLoading ? 'animate-spin' : ''}
            />
          </button>
        }
      />

      {/* ─── DATA FILTER BAR (Only real backend-supported filters) ───────── */}
      <DataFilterBar
        searchQuery={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={
          isEn
            ? 'Search by log ID, user, action, resource...'
            : 'Tìm theo mã log, người dùng, hành động, đối tượng...'
        }
      >
        {/* Action Filter */}
        <CustomSelect
          value={actionFilter}
          onChange={(val) => {
            setActionFilter(val)
            setCurrentPage(1)
          }}
          size="sm"
          options={[
            { value: 'all', label: isEn ? 'All actions' : 'Tất cả hành động' },
            { value: 'ASSIGN_ROLE', label: isEn ? 'Change user role' : 'Thay đổi vai trò' },
            {
              value: 'UPDATE_USER_STATUS',
              label: isEn ? 'User status change' : 'Cập nhật trạng thái người dùng',
            },
            {
              value: 'UPDATE_CONSENSUS_CONFIG',
              label: isEn ? 'Consensus config' : 'Cấu hình đồng thuận',
            },
            {
              value: 'UPDATE_ROUTE_MATRIX',
              label: isEn ? 'Route matrix' : 'Ma trận tuyến đường',
            },
            {
              value: 'TRIGGER_MODEL_RETRAINING',
              label: isEn ? 'Retrain AI model' : 'Huấn luyện mô hình AI',
            },
            {
              value: 'PROMOTE_MODEL_VERSION',
              label: isEn ? 'Promote AI model' : 'Phát hành mô hình AI',
            },
            {
              value: 'ROLLBACK_MODEL_VERSION',
              label: isEn ? 'Rollback AI model' : 'Thu hồi mô hình AI',
            },
            {
              value: 'UPDATE_ACTIVE_LEARNING_CONFIG',
              label: isEn ? 'Active learning config' : 'Cấu hình học chủ động',
            },
          ]}
          className="w-full sm:w-60"
        />

        {/* Resource Filter */}
        <CustomSelect
          value={resourceFilter}
          onChange={(val) => {
            setResourceFilter(val)
            setCurrentPage(1)
          }}
          size="sm"
          options={[
            {
              value: 'all',
              label: isEn ? 'All resources' : 'Tất cả đối tượng',
            },
            { value: 'user_roles', label: isEn ? 'User roles' : 'Vai trò người dùng' },
            { value: 'users', label: isEn ? 'Users' : 'Người dùng' },
            { value: 'consensus_configs', label: isEn ? 'Consensus' : 'Cấu hình đồng thuận' },
            { value: 'route_classifications', label: isEn ? 'Routes' : 'Tuyến đường' },
            { value: 'model_training_jobs', label: isEn ? 'AI Training' : 'Tác vụ huấn luyện' },
            { value: 'ai_model_versions', label: isEn ? 'AI Models' : 'Mô hình AI' },
            { value: 'system_parameters', label: isEn ? 'System params' : 'Tham số hệ thống' },
          ]}
          className="w-full sm:w-48"
        />
      </DataFilterBar>

      {/* ─── AUDIT LOGS TABLE (Full-width, Identical to Escalations) ────── */}
      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs overflow-hidden w-full">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-mono border-b border-gray-200 dark:border-white/10">
              <tr>
                <th className="py-3 px-4 font-semibold">{isEn ? 'Log ID' : 'Mã log'}</th>
                <th className="py-3 px-4 font-semibold">{isEn ? 'Timestamp' : 'Thời gian'}</th>
                <th className="py-3 px-4 font-semibold">{isEn ? 'Actor' : 'Người thực hiện'}</th>
                <th className="py-3 px-4 font-semibold">{isEn ? 'Action' : 'Hành động'}</th>
                <th className="py-3 px-4 font-semibold">{isEn ? 'Target resource' : 'Đối tượng'}</th>
                <th className="py-3 px-4 font-semibold text-center">{isEn ? 'Details' : 'Chi tiết'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 font-medium">
                    <div className="inline-flex items-center gap-2 text-neutral-500">
                      <CircleNotch
                        size={18}
                        className="animate-spin text-[#007b8b] dark:text-[#00c4de]"
                      />
                      <span>
                        {isEn
                          ? 'Loading audit logs from server...'
                          : 'Đang tải danh sách nhật ký hoạt động từ máy chủ...'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="space-y-1">
                      <p className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                        {isEn ? 'No audit logs found' : 'Không có nhật ký nào'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {isEn
                          ? 'No security or audit activities recorded.'
                          : 'Chưa ghi nhận hoạt động nào trong hệ thống.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((item) => {
                  const actionConfig = getActionConfig(item.action)
                  const actorText = formatActor(item.user_id, isEn)
                  const resText = item.resource_id
                    ? `${item.resource_name || 'resource'} #${item.resource_id.slice(0, 8)}`
                    : item.resource_name || 'system'

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedLog(item)}
                      className="hover:bg-neutral-50/80 dark:hover:bg-white/[0.03] transition-colors cursor-pointer group"
                    >
                      {/* 1. Log ID */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#007b8b] dark:text-[#00c4de]">
                        <span className="group-hover:underline">#{item.id}</span>
                      </td>

                      {/* 2. Created At */}
                      <td className="py-3.5 px-4 text-gray-500 dark:text-gray-400 font-mono text-[11px] whitespace-nowrap">
                        {formatDate(item.created_at)}
                      </td>

                      {/* 3. Actor */}
                      <td className="py-3.5 px-4 font-medium text-gray-900 dark:text-gray-100">
                        {actorText}
                      </td>

                      {/* 4. Action */}
                      <td className="py-3.5 px-4">
                        <span className={`font-medium ${actionConfig.textColor}`}>
                          {isEn ? actionConfig.labelEn : actionConfig.labelVi}
                        </span>
                      </td>

                      {/* 5. Target Resource */}
                      <td className="py-3.5 px-4 text-gray-700 dark:text-gray-300 font-mono">
                        {resText}
                      </td>

                      {/* 6. Chi tiết */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedLog(item)
                          }}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-[#007b8b] hover:text-white dark:bg-white/10 dark:hover:bg-[#00c4de] dark:hover:text-black transition-all cursor-pointer"
                        >
                          {isEn ? 'Chi tiết' : 'Chi tiết'}
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5">
          <Pagination
            currentPage={currentPage}
            totalItems={
              filteredLogs.length === logs.length
                ? totalCount
                : filteredLogs.length
            }
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize)
              setCurrentPage(1)
            }}
            pageSizeOptions={[10, 20, 50]}
          />
        </div>
      </div>

      {/* ─── AUDIT LOG DETAIL MODAL (Identical styling to Escalations) ─── */}
      {selectedLog && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
            onClick={() => setSelectedLog(null)}
          >
            <div
              className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl max-w-[760px] w-full shadow-2xl animate-in zoom-in-95 my-auto max-h-[90vh] flex flex-col overflow-hidden text-xs text-gray-800 dark:text-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] shrink-0">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedLog.id)
                      setCopiedId(true)
                      setTimeout(() => setCopiedId(false), 2000)
                    }}
                    className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 transition-colors cursor-pointer"
                    title={isEn ? 'Copy log ID' : 'Sao chép mã log'}
                  >
                    <span>#{selectedLog.id}</span>
                    {copiedId ? (
                      <Check size={12} className="text-emerald-500" />
                    ) : (
                      <Copy size={12} className="text-gray-400" />
                    )}
                  </button>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {isEn
                      ? getActionConfig(selectedLog.action).labelEn
                      : getActionConfig(selectedLog.action).labelVi}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="text-gray-500 dark:text-gray-400 font-mono text-[11px]">
                    {formatDate(selectedLog.created_at)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-2"
                  title={isEn ? 'Close' : 'Đóng'}
                >
                  <X size={18} weight="bold" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
                {/* 1. Key-Value Specs Card */}
                <div className="rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] divide-y divide-gray-200/60 dark:divide-white/5 text-xs">
                  {/* Actor */}
                  <div className="flex items-center justify-between py-2 px-3">
                    <span className="text-gray-500 dark:text-gray-400">
                      {isEn ? 'Actor:' : 'Người thực hiện:'}
                    </span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {selectedLog.user_id ? 'Admin' : (isEn ? 'System Daemon' : 'Hệ thống tự động')}
                      </span>
                      {selectedLog.user_id && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-600 dark:text-gray-300">
                            #{selectedLog.user_id}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(selectedLog.user_id)
                              setCopiedUserId(true)
                              setTimeout(() => setCopiedUserId(false), 2000)
                            }}
                            className="text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer ml-1"
                            title={isEn ? 'Copy UUID' : 'Sao chép mã'}
                          >
                            {copiedUserId ? (
                              <Check size={12} className="text-emerald-500" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Target Resource */}
                  <div className="flex items-center justify-between py-2 px-3">
                    <span className="text-gray-500 dark:text-gray-400">
                      {isEn ? 'Target resource:' : 'Đối tượng tác động:'}
                    </span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {formatResourceName(selectedLog.resource_name, isEn)}
                      </span>
                      {selectedLog.resource_id && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-600 dark:text-gray-300">
                            #{selectedLog.resource_id}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                selectedLog.resource_id!
                              )
                              setCopiedResourceId(true)
                              setTimeout(() => setCopiedResourceId(false), 2000)
                            }}
                            className="text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer ml-1"
                            title={isEn ? 'Copy UUID' : 'Sao chép mã'}
                          >
                            {copiedResourceId ? (
                              <Check size={12} className="text-emerald-500" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* IP Address */}
                  <div className="flex items-center justify-between py-2 px-3">
                    <span className="text-gray-500 dark:text-gray-400">
                      {isEn ? 'IP Address:' : 'Địa chỉ IP:'}
                    </span>
                    <span className="font-mono text-gray-800 dark:text-gray-200">
                      {formatIpAddress(selectedLog.ip_address)}
                    </span>
                  </div>

                  {/* Exact Timestamp */}
                  <div className="flex items-center justify-between py-2 px-3">
                    <span className="text-gray-500 dark:text-gray-400">
                      {isEn ? 'Recorded at:' : 'Thời gian ghi nhận:'}
                    </span>
                    <span className="font-mono text-gray-800 dark:text-gray-200">
                      {formatFullDate(selectedLog.created_at)}
                    </span>
                  </div>
                </div>

                {/* 2. Reason Block (if present) */}
                {reasonText && (
                  <div>
                    <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block mb-1">
                      {isEn ? 'Execution Reason:' : 'Lý do thực hiện:'}
                    </span>
                    <div className="px-3 py-2 rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.02] text-gray-800 dark:text-gray-200 text-xs leading-relaxed">
                      {reasonText}
                    </div>
                  </div>
                )}

                {/* 3. Before & After Values Comparison */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block">
                    {isEn ? 'Data Changes:' : 'Chi tiết thay đổi:'}
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Left: Before */}
                    <div className="rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] p-3 space-y-2">
                      <div className="text-xs font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200/60 dark:border-white/5 pb-1.5">
                        {isEn ? 'Before values' : 'Dữ liệu trước'}
                      </div>
                      {renderValuesCard(selectedLog.old_values, isEn)}
                    </div>

                    {/* Right: After */}
                    <div className="rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] p-3 space-y-2">
                      <div className="text-xs font-semibold text-[#007b8b] dark:text-[#00c4de] border-b border-gray-200/60 dark:border-white/5 pb-1.5">
                        {isEn ? 'After values' : 'Dữ liệu sau'}
                      </div>
                      {renderValuesCard(selectedLog.new_values, isEn, true)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end px-5 py-3 border-t border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                >
                  {isEn ? 'Close' : 'Đóng'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  )
}

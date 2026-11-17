import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/context/ToastContext'
import { extractApiErrorMessage } from '@/api/client'
import { Pagination } from '@/components/common/Pagination'
import { DataFilterBar } from '@/components/common/DataFilterBar'
import PageHeader from '@/components/common/PageHeader'
import CustomSelect from '@/components/common/CustomSelect'
import { ModalPortal } from '@/components/common/ModalPortal'
import {
  UserIdentityButton,
  UserProfileDetailModal,
  useResolvedUserProfile,
} from '@/components/common/UserProfileDetailModal'
import { SignMiniMap } from '@/features/catalog/components/SignMiniMap'
import { resolveImageUrl } from '@/features/map/utils/signUrlHelpers'
import type { UserProfileSummary } from '@/api/services/user.service'
import { catalogService, normalizeRecaptureRequestSummary } from '@/api/services/catalog.service'
import {
  X,
  XCircle,
  ArrowsClockwise,
  CircleNotch,
  Copy,
  CheckCircle,
  Clock,
  User,
  ShieldCheck,
  Camera,
  UserMinus,
  Check,
  ArrowSquareOut,
  MapPin,
  Image as ImageIcon,
  CalendarBlank,
  ChatText,
  Hash,
  Tag,
} from '@phosphor-icons/react'
import {
  escalationService,
  type ModerationCaseItem,
  type BanTargetRole,
} from '@/api/services/escalation.service'
import { CatalogProposalStepView } from './components'
import { TaskHistoryTimelineModal } from '@/features/audit/components/TaskHistoryTimelineModal'

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

interface ResolvedCoordinates {
  lat: number
  lng: number
}

function parseCoordinateNumber(val: any, min: number, max: number): number | null {
  if (val == null || val === '') return null
  const num = typeof val === 'number' ? val : parseFloat(String(val))
  if (Number.isFinite(num) && num >= min && num <= max) {
    return num
  }
  return null
}

function extractCoordinatesFromAny(source: any): ResolvedCoordinates | null {
  if (!source || typeof source !== 'object') return null

  // 1. Direct properties: latitude / longitude, lat / lng, lat / lon, lat_dd / lon_dd, gps_latitude / gps_longitude
  const directLat = parseCoordinateNumber(source.latitude ?? source.lat ?? source.lat_dd ?? source.gps_latitude ?? source.gps_lat, -90, 90)
  const directLng = parseCoordinateNumber(source.longitude ?? source.lng ?? source.lon ?? source.lon_dd ?? source.gps_longitude ?? source.gps_lng, -180, 180)
  if (directLat != null && directLng != null && (directLat !== 0 || directLng !== 0)) {
    return { lat: directLat, lng: directLng }
  }

  // 2. Nested locationContext
  if (source.locationContext) {
    const coords = extractCoordinatesFromAny(source.locationContext.coordinates || source.locationContext)
    if (coords) return coords
  }

  // 3. Array or Object coordinates property
  if (source.coordinates) {
    if (Array.isArray(source.coordinates) && source.coordinates.length >= 2) {
      const c0 = parseFloat(source.coordinates[0])
      const c1 = parseFloat(source.coordinates[1])
      if (Number.isFinite(c0) && Number.isFinite(c1) && (c0 !== 0 || c1 !== 0)) {
        if (Math.abs(c0) > 90 || (c0 > 30 && c1 <= 30)) {
          return { lat: c1, lng: c0 }
        }
        if (c1 > 30 && c0 <= 30) {
          return { lat: c0, lng: c1 }
        }
        return { lat: c1, lng: c0 }
      }
    } else if (typeof source.coordinates === 'object') {
      const coords = extractCoordinatesFromAny(source.coordinates)
      if (coords) return coords
    }
  }

  // 4. Location property: GeoJSON object, coordinates array, object, or string
  if (source.location) {
    if (typeof source.location === 'object') {
      if (Array.isArray(source.location.coordinates)) {
        const coords = extractCoordinatesFromAny({ coordinates: source.location.coordinates })
        if (coords) return coords
      }
      const coords = extractCoordinatesFromAny(source.location)
      if (coords) return coords
    } else if (typeof source.location === 'string') {
      const wktMatch = source.location.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i)
      if (wktMatch) {
        const p1 = parseFloat(wktMatch[1])
        const p2 = parseFloat(wktMatch[2])
        if (Number.isFinite(p1) && Number.isFinite(p2)) {
          if (p2 > 90 || (p1 <= 30 && p2 > 30)) {
            return { lat: p1, lng: p2 }
          }
          return { lat: p2, lng: p1 }
        }
      }
      try {
        const parsed = JSON.parse(source.location)
        const coords = extractCoordinatesFromAny(parsed)
        if (coords) return coords
      } catch { }
    }
  }

  // 5. GPS property: object, string lat,lng, or array
  if (source.gps) {
    if (typeof source.gps === 'object') {
      const coords = extractCoordinatesFromAny(source.gps)
      if (coords) return coords
    } else if (typeof source.gps === 'string') {
      const m = source.gps.match(/([-\d.]+)[,\s]+([-\d.]+)/)
      if (m) {
        const p1 = parseFloat(m[1])
        const p2 = parseFloat(m[2])
        if (Number.isFinite(p1) && Number.isFinite(p2)) {
          if (p2 > 90 || (p1 <= 30 && p2 > 30)) {
            return { lat: p1, lng: p2 }
          }
          return { lat: p2, lng: p1 }
        }
      }
    }
  }

  // 6. sign_location or vehicle_location
  if (source.sign_location || source.signLocation) {
    const coords = extractCoordinatesFromAny(source.sign_location || source.signLocation)
    if (coords) return coords
  }
  if (source.vehicle_location || source.vehicleLocation) {
    const coords = extractCoordinatesFromAny(source.vehicle_location || source.vehicleLocation)
    if (coords) return coords
  }

  // 7. location_wkt or locationWkt
  if (source.location_wkt || source.locationWkt) {
    const str = String(source.location_wkt || source.locationWkt)
    const wktMatch = str.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i)
    if (wktMatch) {
      const p1 = parseFloat(wktMatch[1])
      const p2 = parseFloat(wktMatch[2])
      if (Number.isFinite(p1) && Number.isFinite(p2)) {
        if (p2 > 90 || (p1 <= 30 && p2 > 30)) {
          return { lat: p1, lng: p2 }
        }
        return { lat: p2, lng: p1 }
      }
    }
  }

  // 8. Text note containing GPS: lat, lon
  const textNote = source.note || source.description || source.reporterNote || source.reporter_note || source.fieldNotes || source.staffNotes
  if (typeof textNote === 'string') {
    const m = textNote.match(/GPS:\s*([-\d.]+)[,\s]+([-\d.]+)/i)
    if (m) {
      const p1 = parseFloat(m[1])
      const p2 = parseFloat(m[2])
      if (Number.isFinite(p1) && Number.isFinite(p2) && (p1 !== 0 || p2 !== 0)) {
        if (p2 > 90 || (p1 <= 30 && p2 > 30)) {
          return { lat: p1, lng: p2 }
        }
        return { lat: p2, lng: p1 }
      }
    }
  }

  return null
}

interface ActionDecisionConfig {
  labelVi: string
  labelEn: string
  icon: typeof CheckCircle
  cardClass: string
  titleClass: string
  badgeClass: string
  iconClass: string
}

function getDecisionConfig(actionType?: string | null, status?: string): ActionDecisionConfig {
  const normAction = (actionType || '').toUpperCase()
  const normStatus = (status || '').toUpperCase()

  if (normAction === 'DISMISS' || normAction === 'REJECT' || normStatus === 'DISMISSED') {
    return {
      labelVi: 'Bác bỏ',
      labelEn: 'Dismissed',
      icon: XCircle,
      cardClass: 'border-red-500/25 bg-red-50/50 dark:bg-red-950/20',
      titleClass: 'text-red-700 dark:text-red-400',
      badgeClass: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/60',
      iconClass: 'text-red-600 dark:text-red-400',
    }
  }

  if (normAction === 'REQUEST_RECAPTURE') {
    return {
      labelVi: 'Yêu cầu chụp lại',
      labelEn: 'Recapture Requested',
      icon: Camera,
      cardClass: 'border-amber-500/25 bg-amber-50/50 dark:bg-amber-950/20',
      titleClass: 'text-amber-700 dark:text-amber-400',
      badgeClass: 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60',
      iconClass: 'text-amber-600 dark:text-amber-400',
    }
  }

  if (normAction === 'BAN_USER') {
    return {
      labelVi: 'Khóa tài khoản',
      labelEn: 'User Banned',
      icon: UserMinus,
      cardClass: 'border-red-600/30 bg-red-100/30 dark:bg-red-950/30',
      titleClass: 'text-red-800 dark:text-red-400',
      badgeClass: 'bg-red-200 dark:bg-red-900/60 text-red-900 dark:text-red-200 border border-red-300 dark:border-red-700',
      iconClass: 'text-red-600 dark:text-red-400',
    }
  }

  // Default: RESOLVE / Approved
  return {
    labelVi: 'Phê chuẩn',
    labelEn: 'Approved',
    icon: CheckCircle,
    cardClass: 'border-emerald-500/25 bg-emerald-50/60 dark:bg-emerald-950/20',
    titleClass: 'text-emerald-700 dark:text-emerald-400',
    badgeClass: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
  }
}


/** Translate Case Type into standard Vietsub & Engsub with subtle dot indicator */
function getCaseType(type?: string): { vi: string; en: string; dot: string } {
  const t = (type || '').toUpperCase()
  switch (t) {
    case 'REVIEW_CONFLICT':
      return { vi: 'Xung đột đánh giá', en: 'Review conflict', dot: 'bg-purple-500' }
    case 'SUSPICIOUS_GPS':
      return { vi: 'GPS bất thường', en: 'Suspicious GPS', dot: 'bg-amber-500' }
    case 'SPAM_SUBMISSION':
      return { vi: 'Nghi vấn spam', en: 'Spam submission', dot: 'bg-red-500' }
    case 'PAYMENT_DISCREPANCY':
      return { vi: 'Sai lệch thù lao', en: 'Payment discrepancy', dot: 'bg-emerald-500' }
    case 'CATALOG_PROPOSAL':
      return { vi: 'Đề xuất loại biển mới', en: 'Catalog proposal', dot: 'bg-sky-500' }
    default:
      return { vi: type || 'Khác', en: type || 'Other', dot: 'bg-gray-400' }
  }
}

/** Translate Target Entity Type into normal Vietsub & Engsub */
function getTargetEntityType(type?: string): { vi: string; en: string } {
  const t = (type || '').toLowerCase()
  switch (t) {
    case 'candidate':
      return { vi: 'Biển báo ứng viên', en: 'Sign candidate' }
    case 'revalidation_task':
    case 'revalidation':
      return { vi: 'Nhiệm vụ tái kiểm tra', en: 'Revalidation task' }
    case 'missing_type_report':
    case 'missing_sign_type_report':
    case 'report':
      return { vi: 'Báo cáo biển chưa có', en: 'Missing sign report' }
    case 'user':
      return { vi: 'Người dùng', en: 'User' }
    default:
      return { vi: type || 'Đối tượng', en: type || 'Target entity' }
  }
}

/** Translate Status into normal Vietsub & Engsub with subtle dot and soft text color */
function getStatus(status?: string): { vi: string; en: string; dot: string; textColor: string } {
  const s = (status || '').toUpperCase()
  switch (s) {
    case 'PENDING':
    case 'PENDING ADMIN REVIEW':
      return {
        vi: 'Chờ xử lý',
        en: 'Pending',
        dot: 'bg-amber-500',
        textColor: 'text-amber-700 dark:text-amber-400',
      }
    case 'IN_REVIEW':
      return {
        vi: 'Đang xem xét',
        en: 'In review',
        dot: 'bg-sky-500',
        textColor: 'text-sky-700 dark:text-sky-400',
      }
    case 'RESOLVED':
      return {
        vi: 'Đã xử lý',
        en: 'Resolved',
        dot: 'bg-emerald-500',
        textColor: 'text-emerald-700 dark:text-emerald-400',
      }
    case 'DISMISSED':
    case 'REJECTED':
      return {
        vi: 'Đã bác bỏ',
        en: 'Dismissed',
        dot: 'bg-gray-400',
        textColor: 'text-gray-500 dark:text-gray-400',
      }
    case 'ESCALATED_ADMIN':
      return {
        vi: 'Chờ Admin xử lý',
        en: 'Escalated to Admin',
        dot: 'bg-purple-500',
        textColor: 'text-purple-700 dark:text-purple-400',
      }
    default:
      return {
        vi: status || 'Chờ xử lý',
        en: status || 'Pending',
        dot: 'bg-amber-500',
        textColor: 'text-amber-700 dark:text-amber-400',
      }
  }
}

function removeAccents(str?: string | null): string {
  if (!str) return ''
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
}

export default function AdminEscalationsPage() {
  const { t, i18n } = useTranslation('ops')
  const { success, warning, error } = useToast()
  const isEn = i18n.language?.startsWith('en')

  // 100% Real API State, Zero mock data
  const [cases, setCases] = useState<ModerationCaseItem[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const [reportTitleById, setReportTitleById] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedSort, setSelectedSort] = useState<'newest' | 'oldest' | 'a_z' | 'z_a'>('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    const normalized = searchTerm.trim().replace(/^#+/, '').trim()
    if (!normalized) {
      setDebouncedSearch('')
      return
    }
    const timer = window.setTimeout(() => {
      setDebouncedSearch(normalized)
    }, 250)
    return () => window.clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, typeFilter, statusFilter, selectedSort])

  // Modal State
  const [selectedCase, setSelectedCase] = useState<ModerationCaseItem | null>(null)
  const [detailedCase, setDetailedCase] = useState<ModerationCaseItem | null>(null)
  const [targetData, setTargetData] = useState<any | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [copiedTargetId, setCopiedTargetId] = useState(false)
  const [copiedCaseId, setCopiedCaseId] = useState(false)
  const [activeImageTab, setActiveImageTab] = useState<'crop' | 'frame'>('crop')
  const [imgLoadError, setImgLoadError] = useState(false)

  // Verdict Form
  const [actionType, setActionType] = useState<string>('RESOLVE')
  const [banTarget, setBanTarget] = useState<BanTargetRole>('REVIEWER')
  const [decisionNotes, setDecisionNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modalStep, setModalStep] = useState<'DETAIL' | 'CATALOG_PROPOSAL'>('DETAIL')
  const [inspectingUser, setInspectingUser] = useState<{
    id: string
    summary?: UserProfileSummary | null
  } | null>(null)
  const [timelineTaskId, setTimelineTaskId] = useState<string | null>(null)

  const handleOpenUserProfile = useCallback(
    (userId: string, summary?: UserProfileSummary | null) => {
      setInspectingUser({ id: userId, summary })
    },
    []
  )

  // Fetch Cases from Real Backend API
  const fetchCases = useCallback(async () => {
    setIsLoading(true)
    try {
      let sortByParam = 'newest'
      let sortOrderParam: 'ASC' | 'DESC' = 'DESC'
      if (selectedSort === 'newest') {
        sortByParam = 'newest'
        sortOrderParam = 'DESC'
      } else if (selectedSort === 'oldest') {
        sortByParam = 'oldest'
        sortOrderParam = 'ASC'
      } else if (selectedSort === 'a_z') {
        sortByParam = 'a_z'
        sortOrderParam = 'ASC'
      } else if (selectedSort === 'z_a') {
        sortByParam = 'z_a'
        sortOrderParam = 'DESC'
      }

      const hasRemoteFilter = Boolean(debouncedSearch) || typeFilter !== 'all'
      const response = await escalationService.getCases({
        page: hasRemoteFilter ? 1 : currentPage,
        pageSize: hasRemoteFilter ? 100 : pageSize,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: debouncedSearch || undefined,
        sortBy: sortByParam,
        sortOrder: sortOrderParam,
      })
      if (response && Array.isArray(response.items)) {
        setCases(response.items)
        setTotalCount(response.total ?? response.items.length)

        // Fallback report title enrichment when backend listCases doesn't include proposedName yet
        const missingReportTitles = response.items.some((item) => {
          const tType = (item.targetEntityType || item.target_entity_type || '').toLowerCase()
          const cType = (item.caseType || item.case_type || '').toUpperCase()
          return (
            (tType.includes('report') || tType.includes('missing') || cType === 'CATALOG_PROPOSAL') &&
            !item.proposedName &&
            !item.targetTitle
          )
        })
        if (missingReportTitles) {
          catalogService
            .getMissingReports({
              page: 1,
              pageSize: 100,
              search: debouncedSearch || undefined,
            })
            .then((repRes) => {
              if (repRes?.items?.length) {
                setReportTitleById((prev) => {
                  const next = { ...prev }
                  for (const rep of repRes.items as Array<Record<string, any>>) {
                    const title = rep.proposedName || rep.proposed_name || rep.tempLabel
                    if (rep.id && title) {
                      next[String(rep.id)] = String(title)
                    }
                  }
                  return next
                })
              }
            })
            .catch(() => { })
        }
      } else {
        setCases([])
        setTotalCount(0)
      }
    } catch (err: any) {
      console.error('Failed to load moderation cases from API:', err)
      error(err?.message || (isEn ? 'Failed to fetch escalation cases' : 'Không thể tải danh sách ca chuyển tiếp từ máy chủ'))
      setCases([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, pageSize, statusFilter, typeFilter, debouncedSearch, selectedSort, error, isEn])

  useEffect(() => {
    fetchCases()
  }, [fetchCases])

  // Open Detailed Modal & Fetch Target Entity Details + Case Actions
  const handleOpenModal = async (item: ModerationCaseItem) => {
    setSelectedCase(item)
    setDetailedCase(item)
    setTargetData(null)
    setDecisionNotes('')
    setActionType('RESOLVE')
    setBanTarget('REVIEWER')
    setCopiedTargetId(false)
    setCopiedCaseId(false)
    setActiveImageTab('crop')
    setImgLoadError(false)
    setModalStep('DETAIL')
    setIsLoadingDetail(true)

    try {
      const [detailRes, targetRes] = await Promise.allSettled([
        escalationService.getCaseById(item.id),
        escalationService.getTargetEntity(
          item.targetEntityType || item.target_entity_type,
          item.targetEntityId || item.target_entity_id,
          item.caseType || item.case_type
        ),
      ])

      let loadedDetail: ModerationCaseItem | null = null
      if (detailRes.status === 'fulfilled' && detailRes.value) {
        loadedDetail = detailRes.value
        setSelectedCase(loadedDetail)
        setDetailedCase(loadedDetail)
      }

      let loadedTarget: any = null
      if (targetRes.status === 'fulfilled' && targetRes.value) {
        loadedTarget = targetRes.value
      }

      // Robust fallback: if initial call didn't have targetId, fetch using loadedDetail
      if (!loadedTarget && loadedDetail) {
        const tType = loadedDetail.targetEntityType || loadedDetail.target_entity_type
        const tId = loadedDetail.targetEntityId || loadedDetail.target_entity_id
        const cType = loadedDetail.caseType || loadedDetail.case_type
        if (tId) {
          loadedTarget = await escalationService.getTargetEntity(tType, tId, cType)
        }
      }

      if (loadedTarget) {
        setTargetData(loadedTarget)
      }
    } catch (err) {
      console.warn('Error loading case detail or target entity:', err)
    } finally {
      setIsLoadingDetail(false)
    }
  }

  // Handle Admin Resolution Submit
  const handleResolveSubmit = async () => {
    if (!selectedCase) return

    const cType = (selectedCase.caseType || selectedCase.case_type || '').toUpperCase()
    const tType = (selectedCase.targetEntityType || selectedCase.target_entity_type || '').toLowerCase()
    const isCatProposal = cType === 'CATALOG_PROPOSAL' || tType.includes('report') || tType.includes('missing')
    const reportId = targetEntityId || selectedCase.targetEntityId || selectedCase.target_entity_id || (targetData && targetData.id)

    if (isCatProposal && isReportAlreadyFinalized) {
      const syncNote =
        decisionNotes.trim() ||
        rawStaffNote ||
        (isEn
          ? `Synced escalation case with finalized report (${reportRawStatus}).`
          : `Đồng bộ đóng ca theo báo cáo đã xử lý (${reportRawStatus}).`)
      setIsSubmitting(true)
      try {
        await escalationService.resolveCase(selectedCase.id, {
          resolutionNote: syncNote,
          actionType:
            reportRawStatus === 'MERGED'
              ? 'MERGED'
              : reportRawStatus === 'REJECTED'
                ? 'DISMISS'
                : 'APPROVED',
          targetSignTypeId: reportMergedSignTypeId,
          reportId: reportId || undefined,
        })
        success(
          isEn
            ? `Case #${selectedCase.id.slice(0, 8)} synced and closed!`
            : `Đã đồng bộ và đóng ca #${selectedCase.id.slice(0, 8)}!`
        )
        setSelectedCase(null)
        fetchCases()
        window.dispatchEvent(new CustomEvent('stm:refresh-badges'))
      } catch (err: any) {
        const msg = extractApiErrorMessage(err)
        console.error('Failed to sync escalation case:', msg || err)
        error(msg || (isEn ? 'Failed to sync escalation case' : 'Không thể đồng bộ đóng ca trên máy chủ'))
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    if (isCatProposal && isReportIncomplete) {
      warning(
        isEn
          ? 'This report is awaiting field recapture and cannot be adjudicated yet.'
          : 'Báo cáo này đang chờ Surveyor chụp lại ảnh (INCOMPLETE), chưa thể xử lý.'
      )
      return
    }

    if (!decisionNotes.trim()) {
      warning(isEn ? 'Please provide notes!' : 'Vui lòng nhập ghi chú xử lý!')
      return
    }

    // Intercept catalog proposals when approving: transition modal to Step 2 (Catalog sign specs)
    if (actionType === 'RESOLVE' && isCatProposal) {
      setModalStep('CATALOG_PROPOSAL')
      return
    }

    setIsSubmitting(true)
    try {
      // Specialized novel sign report actions: REJECT, REQUEST_RECAPTURE, BAN_USER
      if (isCatProposal && reportId) {
        let mappedAction: 'REJECT' | 'REQUEST_RECAPTURE' | 'BAN_USER'
        if (actionType === 'DISMISS') mappedAction = 'REJECT'
        else if (actionType === 'REQUEST_RECAPTURE') mappedAction = 'REQUEST_RECAPTURE'
        else if (actionType === 'BAN_USER') mappedAction = 'BAN_USER'
        else mappedAction = 'REJECT'

        if (mappedAction === 'BAN_USER' && !banTarget) {
          warning(isEn ? 'Please choose which user to ban!' : 'Vui lòng chọn đối tượng cần khóa tài khoản!')
          setIsSubmitting(false)
          return
        }

        const res: any = await escalationService.applyAdminMissingReportAction(reportId, {
          actionType: mappedAction,
          reason: decisionNotes.trim(),
          banTarget: mappedAction === 'BAN_USER' ? banTarget : undefined,
        })

        const rec = normalizeRecaptureRequestSummary(res?.recaptureRequest || res)
        const assignedSurveyor = res?.assignedSurveyor || rec?.assignedSurveyor
        const surveyorName =
          assignedSurveyor?.fullName ||
          (rec?.surveyorId ? `#${rec.surveyorId.slice(0, 8)}` : null)

        const actionSuccessMsg = {
          REJECT: isEn ? `Report #${reportId.slice(0, 8)} rejected successfully!` : `Đã từ chối báo cáo #${reportId.slice(0, 8)}!`,
          REQUEST_RECAPTURE: surveyorName
            ? (isEn ? `Recapture task assigned to Surveyor ${surveyorName}!` : `Đã phân công cho Surveyor ${surveyorName} chụp lại thực địa!`)
            : (isEn ? 'Field recapture task assigned to a random surveyor!' : 'Đã giao nhiệm vụ chụp lại thực địa cho một surveyor ngẫu nhiên!'),
          BAN_USER: isEn
            ? `User ${banTarget === 'SURVEYOR' ? 'Surveyor' : banTarget === 'REVIEWER' ? 'Reviewer' : 'Staff'} has been banned successfully!`
            : `Đã khóa tài khoản ${banTarget === 'SURVEYOR' ? 'Surveyor' : banTarget === 'REVIEWER' ? 'Reviewer' : 'Staff'}!`,
        }[mappedAction]

        success(actionSuccessMsg)
        setSelectedCase(null)
        fetchCases()
        window.dispatchEvent(new CustomEvent('stm:refresh-badges'))
        return
      }

      // Standard moderation case resolve
      const res: any = await escalationService.resolveCase(selectedCase.id, {
        resolutionNote: decisionNotes.trim(),
        actionType,
      })
      if (actionType === 'REQUEST_RECAPTURE') {
        const rec = normalizeRecaptureRequestSummary(res?.recaptureRequest || res)
        const assignedSurveyor = res?.assignedSurveyor || rec?.assignedSurveyor
        const surveyorName =
          assignedSurveyor?.fullName ||
          (res?.surveyorId ? `#${res.surveyorId.slice(0, 8)}` : null)
        success(
          surveyorName
            ? (isEn ? `Recapture task assigned to Surveyor ${surveyorName}!` : `Đã phân công cho Surveyor ${surveyorName} chụp lại thực địa!`)
            : (isEn ? `Case #${selectedCase.id.slice(0, 8)} resolved with recapture request!` : `Đã yêu cầu chụp lại cho ca #${selectedCase.id.slice(0, 8)}!`)
        )
      } else {
        success(
          isEn
            ? `Case #${selectedCase.id.slice(0, 8)} resolved successfully!`
            : `Đã xử lý ca #${selectedCase.id.slice(0, 8)} thành công!`
        )
      }
      setSelectedCase(null)
      fetchCases()
      window.dispatchEvent(new CustomEvent('stm:refresh-badges'))
    } catch (err: any) {
      const msg = extractApiErrorMessage(err)
      console.error('Failed to resolve moderation case:', msg || err)
      error(msg || (isEn ? 'Failed to resolve case' : 'Không thể giải quyết vụ việc trên máy chủ'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Client Filter for Search & Type
  const normalizedSearchTerm = searchTerm.trim().replace(/^#+/, '').trim().toLowerCase()
  const cleanSearchTerm = removeAccents(normalizedSearchTerm)
  const hasLocalFilter = Boolean(normalizedSearchTerm) || typeFilter !== 'all'

  const filteredCases = cases.filter((c) => {
    const q = normalizedSearchTerm
    const qClean = cleanSearchTerm
    const id = (c.id || '').toLowerCase()
    const rawTargetId = String(c.targetEntityId || c.target_entity_id || '')
    const targetId = rawTargetId.toLowerCase()
    const targetType = (c.targetEntityType || c.target_entity_type || '').toLowerCase()
    const caseType = (c.caseType || c.case_type || '').toLowerCase()
    const reportTitle = (c.proposedName || c.targetTitle || reportTitleById[rawTargetId] || '').toLowerCase()
    const reporterLabel = (c.reporter?.fullName || c.reporter?.email || '').toLowerCase()
    const staffName = (c.assignedStaff?.fullName || (c as any).assignedStaff?.full_name || '').toLowerCase()
    const staffEmail = (c.assignedStaff?.email || '').toLowerCase()
    const note = (c.resolutionNote || c.resolution_note || c.notes || '').toLowerCase()

    const matchesSearch =
      !q ||
      id.includes(q) ||
      targetId.includes(q) ||
      targetType.includes(q) ||
      caseType.includes(q) ||
      reportTitle.includes(q) ||
      reporterLabel.includes(q) ||
      staffName.includes(q) ||
      staffEmail.includes(q) ||
      note.includes(q) ||
      removeAccents(reportTitle).includes(qClean) ||
      removeAccents(reporterLabel).includes(qClean) ||
      removeAccents(staffName).includes(qClean) ||
      removeAccents(staffEmail).includes(qClean) ||
      removeAccents(note).includes(qClean)

    const matchesType =
      typeFilter === 'all' ||
      (c.caseType || c.case_type || '').toUpperCase() === typeFilter.toUpperCase()

    return matchesSearch && matchesType
  })

  const sortedCases = [...filteredCases].sort((a, b) => {
    switch (selectedSort) {
      case 'newest': {
        const dateA = new Date(a.createdAt || a.created_at || 0).getTime()
        const dateB = new Date(b.createdAt || b.created_at || 0).getTime()
        return dateB - dateA
      }
      case 'oldest': {
        const dateA = new Date(a.createdAt || a.created_at || 0).getTime()
        const dateB = new Date(b.createdAt || b.created_at || 0).getTime()
        return dateA - dateB
      }
      case 'a_z': {
        const nameA = a.proposedName || a.targetTitle || a.caseType || a.case_type || a.id || ''
        const nameB = b.proposedName || b.targetTitle || b.caseType || b.case_type || b.id || ''
        return nameA.localeCompare(nameB, 'vi')
      }
      case 'z_a': {
        const nameA = a.proposedName || a.targetTitle || a.caseType || a.case_type || a.id || ''
        const nameB = b.proposedName || b.targetTitle || b.caseType || b.case_type || b.id || ''
        return nameB.localeCompare(nameA, 'vi')
      }
      default:
        return 0
    }
  })

  const paginatedCases = hasLocalFilter
    ? sortedCases.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedCases

  // Target entity visual & contextual extraction
  const targetTypeStr = (selectedCase?.targetEntityType || selectedCase?.target_entity_type || '').toLowerCase()
  const caseTypeStr = (selectedCase?.caseType || selectedCase?.case_type || '').toUpperCase()
  const isCandidate = targetTypeStr === 'candidate'
  const isRevalidation = targetTypeStr.includes('reval')
  const isMissingReport =
    targetTypeStr.includes('report') ||
    targetTypeStr.includes('missing') ||
    caseTypeStr === 'CATALOG_PROPOSAL'
  const rawReport = targetData?.data || targetData
  const reportRawStatus = isMissingReport
    ? String(rawReport?.rawStatus || rawReport?.status || '').toUpperCase()
    : ''
  const reportMergedSignTypeId: number | undefined =
    rawReport?.mergedIntoSignTypeId ?? undefined
  const isReportAlreadyFinalized =
    isMissingReport && ['APPROVED', 'MERGED', 'REJECTED'].includes(reportRawStatus)
  const isReportIncomplete = isMissingReport && reportRawStatus === 'INCOMPLETE'

  let cropUrl: string | null = null
  let frameUrl: string | null = null
  let signName: string | null = null
  let lat: number | null = null
  let lng: number | null = null
  let description: string | null = null
  let reporterId: string | null = null
  let reporterSummary: UserProfileSummary | null = null
  let reviewedBy: string | null = null
  let reviewerSummary: UserProfileSummary | null = null
  let targetEntityId: string | null = selectedCase?.targetEntityId || selectedCase?.target_entity_id || null

  const isCaseResolved = selectedCase?.status === 'RESOLVED' || selectedCase?.status === 'DISMISSED'

  const activeCase = detailedCase && detailedCase.id === selectedCase?.id ? detailedCase : selectedCase
  const caseActions = activeCase?.actions || selectedCase?.actions || []

  // Staff escalation action containing original staff notes and staff reviewer ID
  const escalateAction = caseActions.find((a) => {
    const act = (a.actionType || (a as any).action_type || '').toUpperCase()
    return act.includes('ESCALAT')
  })

  // Final resolution / verdict action performed by Admin
  const resolutionAction = [...caseActions].reverse().find((a) => {
    const act = (a.actionType || (a as any).action_type || '').toUpperCase()
    return !act.includes('ESCALAT') && act !== 'CREATE'
  })

  const latestAction = resolutionAction || (caseActions.length > 0 ? caseActions[caseActions.length - 1] : null)
  const decisionActionType = latestAction?.actionType || (selectedCase?.status === 'DISMISSED' ? 'DISMISS' : 'RESOLVE')
  const decisionConfig = getDecisionConfig(decisionActionType, selectedCase?.status)
  const DecisionIcon = decisionConfig.icon

  const adminResolutionNote =
    resolutionAction?.note || latestAction?.note || selectedCase?.resolutionNote || selectedCase?.resolution_note || null

  let rawStaffNote: string | null = null

  if (targetData) {
    const raw = targetData.data || targetData

    if (isMissingReport) {
      const cand = raw.candidate || raw
      if (cand) {
        cropUrl = resolveImageUrl(cand.signCropUrl || raw.sampleImageUrl)
        frameUrl = resolveImageUrl(cand.bestFrameUrl || raw.bestFrameUrl)
      }
      signName = raw.proposedName || raw.tempLabel || cand?.predictedSignType?.nameVi || cand?.predictedSignType?.nameEn
      description =
        raw.description ||
        raw.reporterNote ||
        raw.reporter_note ||
        raw.note ||
        raw.regulationNotes ||
        raw.fieldNotes ||
        raw.submission?.note ||
        cand?.submission?.note ||
        null
      rawStaffNote = raw.staffNotes || null
      const rawRep = raw.reporterId || raw.reporter_id || raw.reportedBy || raw.reported_by || null
      reporterId = typeof rawRep === 'string' ? rawRep : (rawRep?.id ? String(rawRep.id) : null)
      reporterSummary = (typeof raw.reporter === 'object' && raw.reporter)
        ? raw.reporter
        : (typeof rawRep === 'object' && rawRep ? rawRep : null)
      const rawRev = raw.reviewedBy || raw.reviewed_by || selectedCase?.assignedStaffId || selectedCase?.assigned_staff_id || null
      reviewedBy = typeof rawRev === 'string' ? rawRev : (rawRev?.id ? String(rawRev.id) : null)
      reviewerSummary = (typeof raw.reviewer === 'object' && raw.reviewer)
        ? raw.reviewer
        : (typeof rawRev === 'object' && rawRev ? rawRev : null)
      if (raw.id) targetEntityId = raw.id
    } else if (isCandidate) {
      const cand = raw.candidate || raw
      cropUrl = resolveImageUrl(cand.signCropUrl)
      frameUrl = resolveImageUrl(cand.bestFrameUrl)
      reporterId =
        raw.submission?.surveyor_id ||
        raw.submission?.surveyorId ||
        cand?.submission?.surveyor_id ||
        cand?.submission?.surveyorId ||
        cand?.surveyorId ||
        cand?.surveyor_id ||
        null
      const candSurv = raw.submission?.surveyor || cand?.surveyor
      if (candSurv) {
        reporterSummary = candSurv
      } else if (cand?.surveyorName || cand?.surveyor_name || raw.submission?.surveyor_name) {
        reporterSummary = {
          id: reporterId || undefined,
          fullName: cand?.surveyorName || cand?.surveyor_name || raw.submission?.surveyor_name,
          email: cand?.surveyorEmail || raw.submission?.surveyor_email || null,
        }
      }
      if (cand.predictedSignType) {
        signName = isEn
          ? cand.predictedSignType.nameEn || cand.predictedSignType.name_en || cand.predictedSignType.nameVi || cand.predictedSignType.name_vi
          : cand.predictedSignType.nameVi || cand.predictedSignType.name_vi || cand.predictedSignType.nameEn || cand.predictedSignType.name_en
      }
      description =
        raw.description ||
        raw.reporterNote ||
        raw.reporter_note ||
        raw.note ||
        raw.regulationNotes ||
        raw.fieldNotes ||
        raw.submission?.note ||
        cand?.submission?.note ||
        null
    } else if (isRevalidation) {
      const ev = raw.evidences?.[0]
      cropUrl = resolveImageUrl(ev?.media_url || ev?.mediaUrl)
      reporterId = ev?.userId || ev?.user_id || ev?.surveyorId || ev?.surveyor_id || raw.surveyorId || null
      const revSurv = ev?.surveyor || raw.surveyor
      if (revSurv) {
        reporterSummary = revSurv
      } else if (ev?.surveyorName || ev?.surveyor_name || raw.surveyorName) {
        reporterSummary = {
          id: reporterId || undefined,
          fullName: ev?.surveyorName || ev?.surveyor_name || raw.surveyorName,
          email: ev?.surveyorEmail || null,
        }
      }
      if (raw.name_en || raw.name_vi) {
        signName = isEn
          ? raw.name_en || raw.name_vi
          : raw.name_vi || raw.name_en
      }
    }
  }

  const rawTargetObj = targetData?.data || targetData || {}
  const candTargetObj = rawTargetObj?.candidate

  // Universal GPS Coordinates & Location Address Extraction
  const resolvedCoords =
    extractCoordinatesFromAny(candTargetObj) ||
    extractCoordinatesFromAny(rawTargetObj) ||
    extractCoordinatesFromAny(rawTargetObj?.locationContext) ||
    extractCoordinatesFromAny(candTargetObj?.locationContext) ||
    extractCoordinatesFromAny(rawTargetObj?.submission) ||
    extractCoordinatesFromAny(candTargetObj?.submission) ||
    extractCoordinatesFromAny(rawTargetObj?.evidences?.[0]) ||
    extractCoordinatesFromAny(detailedCase) ||
    extractCoordinatesFromAny(selectedCase)

  if (resolvedCoords) {
    lat = resolvedCoords.lat
    lng = resolvedCoords.lng
  }

  const historyTaskId: string | null =
    isCandidate || isRevalidation
      ? targetEntityId
      : rawTargetObj?.candidateId || rawTargetObj?.candidate?.id || null

  // Determine effective Staff Notes: prioritize escalateAction.note to prevent overwrite by admin decisions
  let effectiveStaffNotes: string | null = null
  if (escalateAction?.note) {
    effectiveStaffNotes = escalateAction.note
  } else if (rawStaffNote) {
    // If backend overwrote raw.staffNotes with the admin resolution note, suppress duplication
    if (isCaseResolved && adminResolutionNote && rawStaffNote.trim() === adminResolutionNote.trim()) {
      effectiveStaffNotes = null
    } else {
      effectiveStaffNotes = rawStaffNote
    }
  } else if (!isCaseResolved) {
    effectiveStaffNotes = selectedCase?.resolutionNote || selectedCase?.resolution_note || null
  }

  // Determine true Staff Reviewer ID & escalation timestamp
  const staffReviewerId =
    escalateAction?.performedBy ||
    selectedCase?.assignedStaffId ||
    selectedCase?.assigned_staff_id ||
    (!isCaseResolved ? reviewedBy : null)

  const staffReviewedAt =
    escalateAction?.performedAt ||
    selectedCase?.createdAt ||
    selectedCase?.created_at ||
    targetData?.updatedAt

  const staffSummary: UserProfileSummary | null =
    (reviewerSummary && (!staffReviewerId || reviewerSummary.id === staffReviewerId)
      ? reviewerSummary
      : null) ||
    (activeCase?.assignedStaff && (!staffReviewerId || activeCase.assignedStaff.id === staffReviewerId)
      ? activeCase.assignedStaff
      : null)

  const recaptureRequest = normalizeRecaptureRequestSummary(
    rawReport?.recaptureRequest || activeCase?.recaptureRequest || null
  )

  const surveyorUserId = (typeof recaptureRequest?.surveyorId === 'string' ? recaptureRequest.surveyorId : (recaptureRequest?.surveyorId as any)?.id) || (activeCase as any)?.involvedUsers?.surveyor?.id || (targetData as any)?.candidate?.submission?.surveyorId || null
  const reviewerUserId = (typeof reporterId === 'string' ? reporterId : (reporterId as any)?.id) || (activeCase as any)?.involvedUsers?.reviewer?.id || null
  const staffUserId = (typeof reviewedBy === 'string' ? reviewedBy : (reviewedBy as any)?.id) || (typeof staffReviewerId === 'string' ? staffReviewerId : (staffReviewerId as any)?.id) || (activeCase as any)?.involvedUsers?.staff?.id || null

  const surveyorInitial = recaptureRequest?.assignedSurveyor || (activeCase as any)?.involvedUsers?.surveyor || null
  const reviewerInitial = reporterSummary || (activeCase as any)?.involvedUsers?.reviewer || null
  const staffInitial = staffSummary || (activeCase as any)?.involvedUsers?.staff || null

  const { profile: surveyorProfile, displayName: resolvedSurveyorName } = useResolvedUserProfile(
    surveyorUserId,
    surveyorInitial
  )
  const { profile: reviewerProfile, displayName: resolvedReporterName } = useResolvedUserProfile(
    reviewerUserId,
    reviewerInitial
  )
  const { profile: staffProfile, displayName: resolvedStaffName } = useResolvedUserProfile(
    staffUserId,
    staffInitial
  )

  useEffect(() => {
    if (actionType === 'BAN_USER') {
      const availableKeys: BanTargetRole[] = []
      if (surveyorUserId) availableKeys.push('SURVEYOR')
      if (reviewerUserId) availableKeys.push('REVIEWER')
      if (staffUserId) availableKeys.push('STAFF')
      if (availableKeys.length > 0 && !availableKeys.includes(banTarget)) {
        setBanTarget(availableKeys[0])
      }
    }
  }, [actionType, surveyorUserId, reviewerUserId, staffUserId, banTarget])

  const hasContextFrame = Boolean(frameUrl)
  const activeImageUrl = activeImageTab === 'frame' && frameUrl ? frameUrl : cropUrl
  const hasValidMapLocation = Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)

  return (
    <div className="p-6 sm:p-8 w-full max-w-[1680px] mx-auto space-y-6 animate-in fade-in duration-200">
      {/* ─── PAGE HEADER ──────────────────────────────────────────────── */}
      <PageHeader
        title={t('escalations.title', isEn ? 'High-Level Escalations' : 'Phê duyệt cấp cao')}
        actions={
          <button
            type="button"
            disabled={isLoading}
            onClick={fetchCases}
            className="p-2 border border-neutral-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-neutral-50 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-200 rounded-xl transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            title={isEn ? 'Refresh list' : 'Làm mới danh sách'}
          >
            <ArrowsClockwise size={16} weight="bold" className={isLoading ? 'animate-spin' : ''} />
          </button>
        }
      />

      {/* ─── DATA FILTER BAR ───────────────────────────────────────────── */}
      <DataFilterBar
        searchQuery={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={isEn ? 'Search by case ID, staff name, email, report...' : 'Tìm mã ca, tên nhân viên, email, báo cáo...'}
        sortOptions={[
          { id: 'newest', label: isEn ? 'Newest' : 'Mới nhất' },
          { id: 'oldest', label: isEn ? 'Oldest' : 'Cũ nhất' },
          { id: 'a_z', label: isEn ? 'A to Z' : 'Tên A-Z' },
          { id: 'z_a', label: isEn ? 'Z to A' : 'Tên Z-A' },
        ]}
        selectedSort={selectedSort}
        onSelectSort={(val) => {
          setSelectedSort(val as 'newest' | 'oldest' | 'a_z' | 'z_a')
          setCurrentPage(1)
        }}
      >
        {/* Case Type Filter */}
        <CustomSelect
          value={typeFilter}
          onChange={setTypeFilter}
          size="sm"
          options={[
            { value: 'all', label: isEn ? 'All case types' : 'Tất cả phân loại' },
            { value: 'REVIEW_CONFLICT', label: isEn ? 'Review conflict' : 'Xung đột đánh giá' },
            { value: 'CATALOG_PROPOSAL', label: isEn ? 'Catalog proposal' : 'Đề xuất loại biển mới' },
            { value: 'SUSPICIOUS_GPS', label: isEn ? 'Suspicious GPS' : 'GPS bất thường' },
            { value: 'SPAM_SUBMISSION', label: isEn ? 'Spam submission' : 'Nghi vấn spam' },
            { value: 'PAYMENT_DISCREPANCY', label: isEn ? 'Payment discrepancy' : 'Sai lệch thù lao' },
          ]}
          className="w-full sm:w-52"
        />

        {/* Status Filter */}
        <CustomSelect
          value={statusFilter}
          onChange={setStatusFilter}
          size="sm"
          options={[
            { value: 'all', label: isEn ? 'All statuses' : 'Tất cả trạng thái' },
            { value: 'PENDING', label: isEn ? 'Pending' : 'Chờ xử lý' },
            { value: 'IN_REVIEW', label: isEn ? 'In review' : 'Đang xem xét' },
            { value: 'RESOLVED', label: isEn ? 'Resolved' : 'Đã xử lý' },
            { value: 'DISMISSED', label: isEn ? 'Dismissed' : 'Đã bác bỏ' },
          ]}
          className="w-full sm:w-44"
        />
      </DataFilterBar>

      {/* ─── CLEAN, CONCISE ESCALATIONS TABLE (Pure API Data, No unnecessary badges) ─── */}
      <div className="bg-white dark:bg-[#0A171C] border border-[#E8E4E3] dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-mono border-b border-gray-200 dark:border-white/10">
              <tr>
                <th className="py-3 px-4 font-semibold">{isEn ? 'Case ID' : 'Mã ca'}</th>
                <th className="py-3 px-4 font-semibold">{isEn ? 'Target ID' : 'Mã đối tượng'}</th>
                <th className="py-3 px-4 font-semibold">{isEn ? 'Case type' : 'Phân loại'}</th>
                <th className="py-3 px-4 font-semibold">{isEn ? 'Target entity' : 'Đối tượng'}</th>
                <th className="py-3 px-4 font-semibold">{isEn ? 'Status' : 'Trạng thái'}</th>
                <th className="py-3 px-4 font-semibold">{isEn ? 'Created at' : 'Thời gian tạo'}</th>
                <th className="py-3 px-4 font-semibold text-center">{isEn ? 'Details' : 'Chi tiết'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 font-medium">
                    <div className="inline-flex items-center gap-2 text-neutral-500">
                      <CircleNotch size={18} className="animate-spin text-[#007b8b] dark:text-[#00c4de]" />
                      <span>{isEn ? 'Loading escalation cases from server...' : 'Đang tải danh sách ca chuyển tiếp từ API...'}</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedCases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="space-y-1">
                      <p className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                        {isEn ? 'No escalation cases found' : 'Không có vụ việc nào'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {isEn ? 'All moderation cases have been processed.' : 'Tất cả các ca chuyển tiếp đã được xử lý xong.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedCases.map((item) => {
                  const caseType = getCaseType(item.caseType || item.case_type)
                  const targetEntity = getTargetEntityType(item.targetEntityType || item.target_entity_type)
                  const status = getStatus(item.status)
                  const rawTargetId = String(item.targetEntityId || item.target_entity_id || '')
                  const targetTitle = item.proposedName || item.targetTitle || reportTitleById[rawTargetId]

                  return (
                    <tr
                      key={item.id}
                      onClick={() => handleOpenModal(item)}
                      className="hover:bg-neutral-50/80 dark:hover:bg-white/[0.03] transition-colors cursor-pointer group"
                    >
                      {/* 1. Mã ca: font mono có màu nhấn nhẹ */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#007b8b] dark:text-[#00c4de] whitespace-nowrap">
                        <span className="group-hover:underline">#{item.id.slice(0, 8)}</span>
                      </td>

                      {/* 2. Mã đối tượng: cột riêng kèm nút sao chép nhanh */}
                      <td className="py-3.5 px-4 font-mono text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {rawTargetId ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-gray-800 dark:text-gray-200">
                              #{rawTargetId.slice(0, 8)}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigator.clipboard.writeText(rawTargetId)
                              }}
                              className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                              title="Sao chép mã đối tượng"
                            >
                              <Copy size={13} weight="bold" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      {/* 3. Phân loại */}
                      <td className="py-3.5 px-4 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                        {isEn ? caseType.en : caseType.vi}
                      </td>

                      {/* 4. Đối tượng */}
                      <td className="py-3.5 px-4 text-gray-700 dark:text-gray-300">
                        <span className="truncate font-medium block max-w-xs">
                          {targetTitle || (isEn ? targetEntity.en : targetEntity.vi)}
                        </span>
                      </td>

                      {/* 5. Trạng thái */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`font-medium ${status.textColor}`}>
                          {isEn ? status.en : status.vi}
                        </span>
                      </td>

                      {/* 6. Thời gian tạo */}
                      <td className="py-3.5 px-4 text-gray-500 dark:text-gray-400 font-mono text-[11px] whitespace-nowrap">
                        {formatDate(item.createdAt || item.created_at)}
                      </td>

                      {/* 7. Chi tiết */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenModal(item)
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

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5">
          <Pagination
            currentPage={currentPage}
            totalItems={hasLocalFilter ? filteredCases.length : totalCount}
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

      {/* ─── DETAILED DOSSIER & ADMIN VERDICT MODAL ───────────────────── */}
      {selectedCase && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
            onClick={() => setSelectedCase(null)}
          >
            <div
              className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl max-w-[980px] w-full shadow-2xl animate-in zoom-in-95 my-auto max-h-[92vh] flex flex-col overflow-hidden text-xs text-gray-800 dark:text-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header (Dynamically switches between Step 1: Case Detail & Step 2: Catalog Proposal Form) */}
              {modalStep === 'CATALOG_PROPOSAL' ? (
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] shrink-0">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {isEn ? 'Create Traffic Sign' : 'Tạo biển báo mới'}
                    </span>
                    {targetEntityId && (
                      <>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          {isEn ? 'Target' : 'Đối tượng'} #{targetEntityId.slice(0, 8)}
                        </span>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedCase(null)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-2"
                    title={isEn ? 'Close modal' : 'Đóng'}
                  >
                    <X size={18} weight="bold" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] shrink-0">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {isEn
                        ? getCaseType(selectedCase.caseType || selectedCase.case_type).en
                        : getCaseType(selectedCase.caseType || selectedCase.case_type).vi}
                    </span>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <span className={`font-medium ${decisionActionType === 'DISMISS' ? 'text-red-600 dark:text-red-400' : getStatus(selectedCase.status).textColor}`}>
                      {decisionActionType === 'DISMISS' ? (isEn ? 'Dismissed' : 'Đã bác bỏ') : (isEn ? getStatus(selectedCase.status).en : getStatus(selectedCase.status).vi)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedCase(null)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-2"
                    title={isEn ? 'Close modal' : 'Đóng'}
                  >
                    <X size={18} weight="bold" />
                  </button>
                </div>
              )}

              {/* Modal Body (Switches between Step 2: Catalog Proposal Form & Step 1: Case Detail Dossier) */}
              {modalStep === 'CATALOG_PROPOSAL' ? (
                <CatalogProposalStepView
                  caseId={selectedCase.id}
                  reportId={targetEntityId || selectedCase.targetEntityId || selectedCase.target_entity_id || ''}
                  targetData={targetData}
                  initialNotes={decisionNotes}
                  candidateCropUrl={cropUrl}
                  candidateFrameUrl={frameUrl}
                  isEn={isEn}
                  onBack={() => setModalStep('DETAIL')}
                  onSuccess={() => {
                    setSelectedCase(null)
                    setModalStep('DETAIL')
                    fetchCases()
                  }}
                />
              ) : (
                <>
                  {/* Modal Body */}
                  <div className="p-4 sm:p-5 overflow-y-auto text-xs sm:text-sm flex-1">
                    {isLoadingDetail && !targetData ? (
                      <div className="py-16 flex flex-col items-center justify-center gap-3 text-gray-400">
                        <CircleNotch size={24} className="animate-spin text-[#007b8b] dark:text-[#00c4de]" />
                        <span className="text-xs font-medium">
                          {isEn ? 'Loading dossier & target evidence from server...' : 'Đang tải hồ sơ vụ việc & đối tượng từ máy chủ...'}
                        </span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                        {/* ─── LEFT COLUMN: EVIDENCE PHOTO + MINI MAP (5 cols) ───── */}
                        <div className="md:col-span-5 flex flex-col gap-2.5 md:sticky md:top-0">
                          {/* 1. Evidence Photo Container */}
                          <div className="relative aspect-4/3 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-900 group shadow-2xs flex items-center justify-center shrink-0">
                            {!imgLoadError && activeImageUrl ? (
                              <img
                                src={activeImageUrl}
                                alt={signName || 'Bằng chứng thực địa'}
                                onError={() => setImgLoadError(true)}
                                className="w-full h-full object-contain sm:object-cover transition-transform duration-200 group-hover:scale-102"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-gray-400 space-y-1">
                                <ImageIcon size={32} weight="light" className="opacity-50" />
                                <p className="text-xs text-gray-400">{isEn ? 'No image attached' : 'Không có ảnh đính kèm'}</p>
                              </div>
                            )}

                            {/* Floating View Switcher Inside Image Container */}
                            {hasContextFrame && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute top-3 left-3 p-1 rounded-xl backdrop-blur-md border shadow-lg flex items-center gap-1 z-10 transition-colors bg-white/95 dark:bg-[#071317]/90 border-gray-200 dark:border-white/20 shadow-gray-900/10"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveImageTab('crop')
                                    setImgLoadError(false)
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeImageTab === 'crop'
                                    ? 'bg-[#007b8b] text-white dark:bg-[#00c4de] dark:text-black shadow-xs'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/10'
                                    }`}
                                >
                                  {isEn ? 'Crop' : 'Ảnh cắt'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveImageTab('frame')
                                    setImgLoadError(false)
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeImageTab === 'frame'
                                    ? 'bg-[#007b8b] text-white dark:bg-[#00c4de] dark:text-black shadow-xs'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/10'
                                    }`}
                                >
                                  {isEn ? 'Context' : 'Toàn cảnh'}
                                </button>
                              </div>
                            )}

                            {/* External link to full image */}
                            {activeImageUrl && !imgLoadError && (
                              <a
                                href={activeImageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/75 hover:bg-black/90 backdrop-blur-xs text-white text-[10px] font-mono transition-colors"
                                title={isEn ? 'Open original image in new tab' : 'Xem ảnh gốc trong tab mới'}
                              >
                                <ArrowSquareOut size={12} />
                                <span>{isEn ? 'Original' : 'Ảnh gốc'}</span>
                              </a>
                            )}
                          </div>

                          {/* 2. Map */}
                          {hasValidMapLocation ? (
                            <SignMiniMap
                              lat={lat!}
                              lng={lng!}
                              title={signName || (isEn ? 'Field location' : 'Vị trí thực địa')}
                              heightClassName="w-full h-[160px] sm:h-[180px]"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-gray-200 dark:border-white/10 text-center text-gray-400 text-xs min-h-[140px]">
                              <MapPin size={16} className="mx-auto mb-1 opacity-50" />
                              <span>{isEn ? 'No GPS coordinates available' : 'Không có toạ độ định vị GPS'}</span>
                            </div>
                          )}
                        </div>

                        {/* ─── RIGHT COLUMN: SPECS & VERDICT FORM (7 cols) ───────── */}
                        <div className="md:col-span-7 flex flex-col gap-3">
                          {/* Proposed Sign / Object Title */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight min-w-0">
                              {signName || (isEn ? 'Catalog Proposal' : 'Đề xuất biển mới')}
                            </h3>

                            {historyTaskId && (
                              <button
                                type="button"
                                onClick={() => setTimelineTaskId(historyTaskId)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-white/15 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-[#007b8b] dark:text-[#00c4de] text-[11px] font-semibold transition-colors cursor-pointer shrink-0"
                              >
                                <Clock size={13} weight="bold" />
                                <span>{isEn ? 'View history' : 'Xem lịch sử'}</span>
                              </button>
                            )}
                          </div>

                          {/* Key-Value Specs Card (Clean, neutral layout) */}
                          <div className="rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] divide-y divide-gray-200/60 dark:divide-white/5 text-xs">
                            {/* Mã ca chính */}
                            <div className="flex items-center justify-between py-1.5 px-3 text-gray-500 dark:text-gray-400 text-[11px] font-mono">
                              <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 shrink-0">
                                <Hash size={12} className="text-[#007b8b] dark:text-[#00c4de] shrink-0" />
                                <span>{isEn ? 'Case ID:' : 'Mã ca:'}</span>
                              </span>
                              <div className="flex items-center gap-1.5 min-w-0 font-mono">
                                <span className="font-semibold text-[#007b8b] dark:text-[#00c4de] select-all truncate">
                                  #{selectedCase.id}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(selectedCase.id)
                                    setCopiedCaseId(true)
                                    setTimeout(() => setCopiedCaseId(false), 2000)
                                  }}
                                  className="p-0.5 rounded text-gray-400 hover:text-[#007b8b] dark:hover:text-[#00c4de] cursor-pointer shrink-0 transition-colors"
                                  title={isEn ? 'Copy full case UUID' : 'Sao chép UUID ca'}
                                >
                                  {copiedCaseId ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                </button>
                              </div>
                            </div>

                            {/* Mã đối tượng */}
                            {targetEntityId && (
                              <div className="flex items-center justify-between py-1.5 px-3 text-gray-500 dark:text-gray-400 text-[11px] font-mono">
                                <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 shrink-0">
                                  <Tag size={12} className="text-gray-400 shrink-0" />
                                  <span>{isEn ? 'Target ID:' : 'Mã đối tượng:'}</span>
                                </span>
                                <div className="flex items-center gap-1.5 min-w-0 font-mono">
                                  <span className="text-gray-700 dark:text-gray-300 select-all truncate">
                                    #{targetEntityId}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(targetEntityId)
                                      setCopiedTargetId(true)
                                      setTimeout(() => setCopiedTargetId(false), 2000)
                                    }}
                                    className="p-0.5 rounded text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer shrink-0 transition-colors"
                                    title={isEn ? 'Copy full target UUID' : 'Sao chép UUID đối tượng'}
                                  >
                                    {copiedTargetId ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Reporter & Submitted Date */}
                            <div className="flex items-center justify-between py-1.5 px-3 text-gray-500 dark:text-gray-400 text-[11px] font-mono">
                              <div className="flex items-center gap-1 min-w-0">
                                <User size={12} className="text-gray-400 shrink-0" />
                                {reporterId ? (
                                  <UserIdentityButton
                                    userId={reporterId}
                                    initialUser={reporterSummary}
                                    prefix={isEn ? 'Reporter' : 'Người báo cáo'}
                                    isEn={isEn}
                                    onOpenProfile={handleOpenUserProfile}
                                  />
                                ) : (
                                  <span className="truncate">
                                    <span>{isEn ? 'Reporter:' : 'Người báo cáo:'}</span>{' '}
                                    <span className="text-gray-700 dark:text-gray-200">
                                      {isEn ? 'Anonymous' : 'Hệ thống'}
                                    </span>
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 shrink-0 ml-2">
                                <CalendarBlank size={12} />
                                <span>{formatDate(targetData?.createdAt || selectedCase.createdAt || selectedCase.created_at)}</span>
                              </div>
                            </div>

                            {/* Staff Reviewer */}
                            {staffReviewerId && (
                              <div className="flex items-center justify-between py-1.5 px-3 text-gray-500 dark:text-gray-400 text-[11px] font-mono">
                                <div className="flex items-center gap-1 min-w-0">
                                  <User size={12} className="text-[#007b8b] dark:text-[#00c4de] shrink-0" />
                                  <UserIdentityButton
                                    userId={staffReviewerId}
                                    initialUser={staffSummary}
                                    prefix="Staff"
                                    isEn={isEn}
                                    onOpenProfile={handleOpenUserProfile}
                                  />
                                </div>
                                <div className="flex items-center gap-1 shrink-0 ml-2">
                                  <Clock size={12} />
                                  <span>{formatDate(staffReviewedAt)}</span>
                                </div>
                              </div>
                            )}

                            {/* Assigned Surveyor / Recapture Request */}
                            {(recaptureRequest || (isReportIncomplete && isLoadingDetail)) && (
                              <div className="flex items-center justify-between py-1.5 px-3 text-gray-500 dark:text-gray-400 text-[11px] font-mono">
                                <div className="flex items-center gap-1 min-w-0">
                                  <Camera size={12} className="text-amber-600 dark:text-amber-400 shrink-0" />
                                  {(recaptureRequest?.surveyorId || recaptureRequest?.assignedSurveyor?.id || (activeCase as any)?.involvedUsers?.surveyor?.id) ? (
                                    <UserIdentityButton
                                      userId={recaptureRequest?.surveyorId || recaptureRequest?.assignedSurveyor?.id || (activeCase as any)?.involvedUsers?.surveyor?.id}
                                      initialUser={recaptureRequest?.assignedSurveyor || (activeCase as any)?.involvedUsers?.surveyor}
                                      prefix="Surveyor"
                                      isEn={isEn}
                                      onOpenProfile={handleOpenUserProfile}
                                    />
                                  ) : (
                                    <span className="truncate">
                                      <span>Surveyor:</span>{' '}
                                      <span className="text-amber-700 dark:text-amber-400">
                                        {isEn ? 'Assigning' : 'Đang phân công'}
                                      </span>
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0 ml-2">
                                  <span
                                    className={`text-[10px] font-semibold ${recaptureRequest?.completedAt
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-amber-600 dark:text-amber-400'
                                      }`}
                                  >
                                    {recaptureRequest?.completedAt
                                      ? isEn
                                        ? 'Done'
                                        : 'Đã chụp'
                                      : isEn
                                        ? 'Pending'
                                        : 'Chờ chụp'}
                                  </span>
                                  {recaptureRequest?.completedAt && (
                                    <>
                                      <span>•</span>
                                      <span>{formatDate(recaptureRequest.completedAt)}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Description & Staff Notes - Symmetrical, clean presentation */}
                          {(description || effectiveStaffNotes) && (
                            <div className="space-y-2">
                              {description && (
                                <div>
                                  <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1">
                                    <ChatText size={12} className="text-gray-400 shrink-0" />
                                    <span>{isEn ? 'Reporter Description:' : 'Mô tả từ người gửi:'}</span>
                                  </span>
                                  <div className="px-2.5 py-1.5 rounded-lg border border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.02] text-gray-800 dark:text-gray-200 text-xs leading-relaxed">
                                    {description}
                                  </div>
                                </div>
                              )}

                              {effectiveStaffNotes && (
                                <div>
                                  <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 block mb-1">
                                    {isEn ? 'Staff Note:' : 'Ghi chú của Staff:'}
                                  </span>
                                  <div className="px-2.5 py-1.5 rounded-lg border border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.02] text-gray-800 dark:text-gray-200 text-xs leading-relaxed">
                                    {effectiveStaffNotes}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Resolved / Adjudicated State View */}
                          {isCaseResolved && (
                            <div className={`p-3 rounded-xl border ${decisionConfig.cardClass} space-y-1.5`}>
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 font-bold">
                                  <div className={`flex items-center gap-1.5 ${decisionConfig.titleClass}`}>
                                    <DecisionIcon size={15} weight="fill" className={decisionConfig.iconClass} />
                                    <span>{isEn ? 'Resolution Result' : 'Kết quả xử lý'}</span>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${decisionConfig.badgeClass}`}>
                                    {isEn ? decisionConfig.labelEn : decisionConfig.labelVi}
                                  </span>
                                </div>
                                {(resolutionAction?.performedAt || latestAction?.performedAt || selectedCase.resolvedAt || selectedCase.resolved_at) && (
                                  <span className="font-mono text-[11px] text-gray-500 dark:text-gray-400">
                                    {formatDate(resolutionAction?.performedAt || latestAction?.performedAt || selectedCase.resolvedAt || selectedCase.resolved_at || undefined)}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed">
                                {adminResolutionNote || (isEn ? 'Case resolved under Administrator authority.' : 'Ca đã được giải quyết theo thẩm quyền Quản trị viên.')}
                              </p>
                            </div>
                          )}

                          {/* Adjudication / Action Decision Form (If Pending, In Review, Escalated) */}
                          {(selectedCase.status === 'PENDING' ||
                            selectedCase.status === 'IN_REVIEW' ||
                            selectedCase.status === 'ESCALATED_ADMIN') && (
                              isReportAlreadyFinalized ? (
                                <div className="p-3 rounded-xl border border-amber-300/70 dark:border-amber-700/50 bg-amber-50/70 dark:bg-amber-950/20 space-y-2.5">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                                    <ShieldCheck size={15} weight="bold" className="shrink-0" />
                                    <span>
                                      {isEn ? 'Report Already Finalized' : 'Báo cáo đã được xử lý trước đó'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
                                    {isEn
                                      ? `Linked report status is ${reportRawStatus}${reportMergedSignTypeId ? ` (Sign type #${reportMergedSignTypeId})` : ''}, but this escalation case remained open. Sync to close the case without recreating the sign.`
                                      : `Báo cáo nguồn đang ở trạng thái ${reportRawStatus === 'APPROVED' ? 'Đã phê duyệt' : reportRawStatus === 'MERGED' ? 'Đã gộp' : 'Đã từ chối'}${reportMergedSignTypeId ? ` (Loại biển #${reportMergedSignTypeId})` : ''}, nhưng ca chuyển tiếp chưa được đóng. Bấm "Đồng bộ & Đóng ca" để hoàn tất ca này.`}
                                  </p>
                                  <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                                      {isEn ? 'Closing note optional:' : 'Ghi chú đóng ca:'}
                                    </label>
                                    <textarea
                                      rows={2}
                                      value={decisionNotes}
                                      onChange={(e) => setDecisionNotes(e.target.value)}
                                      placeholder={isEn ? 'Optional closing note...' : 'Nhập ghi chú đóng ca hoặc để trống để dùng mặc định...'}
                                      className="w-full p-2 rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-black/50 text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-[#007b8b] dark:focus:border-[#00c4de] focus:ring-1 focus:ring-[#007b8b]/20 text-xs resize-none"
                                    />
                                  </div>
                                </div>
                              ) : isReportIncomplete ? (
                                <div className="p-3 rounded-xl border border-amber-300/70 dark:border-amber-700/50 bg-amber-50/70 dark:bg-amber-950/20 space-y-1.5">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                                    <Clock size={15} weight="bold" className="shrink-0" />
                                    <span>
                                      {isEn ? 'Awaiting Field Recapture' : 'Đang chờ chụp lại ảnh thực địa'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
                                    {isEn
                                      ? 'This report is currently INCOMPLETE while waiting for a Surveyor to submit recapture evidence. Actions are disabled until recapture completes.'
                                      : 'Báo cáo đang ở trạng thái INCOMPLETE - chờ Surveyor chụp lại ảnh thực địa. Vui lòng đợi hoàn tất chụp lại trước khi tạo biển mới.'}
                                  </p>
                                </div>
                              ) : (
                                <div className="p-2.5 sm:p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] space-y-2">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-white">
                                    <ShieldCheck size={15} weight="bold" className="text-[#007b8b] dark:text-[#00c4de]" />
                                    <span>{isEn ? 'Action Decision' : 'Quyết định xử lý'}</span>
                                  </div>

                                  {/* Action Choice Pills (Clean, simple, non-flashy, text-only) */}
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setActionType('RESOLVE')}
                                      className={`py-2 px-2 rounded-lg border text-[11px] sm:text-xs font-bold transition-all cursor-pointer text-center whitespace-nowrap ${actionType === 'RESOLVE'
                                        ? 'bg-[#007b8b] text-white border-[#007b8b] dark:bg-[#00c4de] dark:text-black dark:border-[#00c4de] shadow-xs'
                                        : 'bg-white dark:bg-black/30 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                                        }`}
                                    >
                                      {isEn ? 'Approve' : 'Phê chuẩn'}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setActionType('DISMISS')}
                                      className={`py-2 px-2 rounded-lg border text-[11px] sm:text-xs font-bold transition-all cursor-pointer text-center whitespace-nowrap ${actionType === 'DISMISS'
                                        ? 'bg-gray-800 text-white border-gray-800 dark:bg-white dark:text-black dark:border-white shadow-xs'
                                        : 'bg-white dark:bg-black/30 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                                        }`}
                                    >
                                      {isEn ? 'Dismiss' : 'Bác bỏ'}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setActionType('REQUEST_RECAPTURE')}
                                      className={`py-2 px-2 rounded-lg border text-[11px] sm:text-xs font-bold transition-all cursor-pointer text-center whitespace-nowrap ${actionType === 'REQUEST_RECAPTURE'
                                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                        : 'bg-white dark:bg-black/30 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                                        }`}
                                    >
                                      {isEn ? 'Recapture' : 'Yêu cầu chụp lại'}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setActionType('BAN_USER')}
                                      className={`py-2 px-2 rounded-lg border text-[11px] sm:text-xs font-bold transition-all cursor-pointer text-center whitespace-nowrap ${actionType === 'BAN_USER'
                                        ? 'bg-red-600 text-white border-red-600 shadow-xs'
                                        : 'bg-white dark:bg-black/30 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                                        }`}
                                    >
                                      {isEn ? 'Ban user' : 'Khóa tài khoản'}
                                    </button>
                                  </div>

                                  {/* Ban Target Selector (Rendered when actionType === 'BAN_USER') */}
                                  {actionType === 'BAN_USER' && (
                                    <div className="p-3 rounded-xl border border-gray-200/90 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] space-y-2">
                                      <div className="text-[11px] font-bold text-gray-800 dark:text-gray-200">
                                        <span>{isEn ? 'Select User to Ban' : 'Chọn đối tượng cần khóa tài khoản'} <span className="text-red-500">*</span></span>
                                      </div>

                                      {/* Vertical List of Ban Candidates with Reputation Badges */}
                                      <div className="flex flex-col gap-2">
                                        {(() => {
                                          const candidates = [
                                            ...(surveyorUserId
                                              ? [
                                                {
                                                  key: 'SURVEYOR' as const,
                                                  roleTitleVi: 'Surveyor',
                                                  roleTitleEn: 'Surveyor',
                                                  userId: surveyorUserId,
                                                  userName: (resolvedSurveyorName && resolvedSurveyorName !== '[object Object]')
                                                    ? resolvedSurveyorName
                                                    : `#${String(surveyorUserId).slice(0, 8)}`,
                                                  profile: surveyorProfile,
                                                  summary: surveyorInitial,
                                                  statistics: surveyorProfile?.statistics || (surveyorInitial as any)?.statistics,
                                                },
                                              ]
                                              : []),
                                            ...(reviewerUserId
                                              ? [
                                                {
                                                  key: 'REVIEWER' as const,
                                                  roleTitleVi: 'Reviewer',
                                                  roleTitleEn: 'Reviewer',
                                                  userId: reviewerUserId,
                                                  userName: (resolvedReporterName && resolvedReporterName !== '[object Object]')
                                                    ? resolvedReporterName
                                                    : `#${String(reviewerUserId).slice(0, 8)}`,
                                                  profile: reviewerProfile,
                                                  summary: reviewerInitial,
                                                  statistics: reviewerProfile?.statistics || (reviewerInitial as any)?.statistics,
                                                },
                                              ]
                                              : []),
                                            ...(staffUserId
                                              ? [
                                                {
                                                  key: 'STAFF' as const,
                                                  roleTitleVi: 'Staff',
                                                  roleTitleEn: 'Staff',
                                                  userId: staffUserId,
                                                  userName: (resolvedStaffName && resolvedStaffName !== '[object Object]')
                                                    ? resolvedStaffName
                                                    : `#${String(staffUserId).slice(0, 8)}`,
                                                  profile: staffProfile,
                                                  summary: staffInitial,
                                                  statistics: staffProfile?.statistics || (staffInitial as any)?.statistics,
                                                },
                                              ]
                                              : []),
                                          ]

                                          if (candidates.length === 0) {
                                            return (
                                              <div className="p-3 text-center text-xs text-gray-500">
                                                {isEn ? 'No users found to ban' : 'Không tìm thấy người dùng phù hợp để khóa tài khoản'}
                                              </div>
                                            )
                                          }

                                          return candidates.map((item) => {
                                            const selected = banTarget === item.key
                                            return (
                                              <div
                                                key={item.key}
                                                onClick={() => setBanTarget(item.key)}
                                                className={`px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${selected
                                                  ? 'bg-white dark:bg-white/5 border-rose-500 dark:border-rose-500 shadow-xs ring-1 ring-rose-500/20'
                                                  : 'bg-white dark:bg-white/[0.02] border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                                                  }`}
                                              >
                                                {/* Left: Radio + Role Title */}
                                                <div className="flex items-center gap-2.5 shrink-0">
                                                  <div
                                                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${selected
                                                      ? 'border-rose-500 bg-rose-500 text-white'
                                                      : 'border-gray-300 dark:border-white/30 bg-transparent'
                                                      }`}
                                                  >
                                                    {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                  </div>

                                                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                                                    {isEn ? item.roleTitleEn : item.roleTitleVi}
                                                  </span>
                                                </div>

                                                {/* Right: User Name Clickable Link to View Profile Modal */}
                                                {item.userId && (
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation()
                                                      handleOpenUserProfile(item.userId!, item.profile || item.summary)
                                                    }}
                                                    className="text-xs font-mono text-gray-600 dark:text-gray-300 hover:text-[#007b8b] dark:hover:text-[#00c4de] hover:underline cursor-pointer truncate max-w-[220px] text-right transition-colors"
                                                    title={
                                                      isEn
                                                        ? `UUID: ${item.userId} - Click to view details`
                                                        : `UUID: ${item.userId} - Bấm để xem thông tin người dùng`
                                                    }
                                                  >
                                                    {item.userName}
                                                  </button>
                                                )}
                                              </div>
                                            )
                                          })
                                        })()}
                                      </div>
                                    </div>
                                  )}

                                  {/* Verdict Justification Textarea */}
                                  <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                                      {isEn ? 'Notes: ' : 'Ghi chú: '}
                                      <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                      rows={2}
                                      maxLength={500}
                                      value={decisionNotes}
                                      onChange={(e) => setDecisionNotes(e.target.value)}
                                      placeholder={isEn ? 'Enter notes...' : 'Nhập ghi chú...'}
                                      className="w-full p-2 rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-black/50 text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-[#007b8b] dark:focus:border-[#00c4de] focus:ring-1 focus:ring-[#007b8b]/20 text-xs resize-none"
                                    />
                                  </div>
                                </div>
                              )
                            )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Modal Footer Actions */}
                  {(selectedCase.status === 'PENDING' ||
                    selectedCase.status === 'IN_REVIEW' ||
                    selectedCase.status === 'ESCALATED_ADMIN') && !isReportIncomplete && (
                      <div className="px-5 py-3 border-t border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/[0.02] flex items-center justify-end gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={handleResolveSubmit}
                          disabled={isSubmitting || (!isReportAlreadyFinalized && !decisionNotes.trim())}
                          className={`inline-flex items-center justify-center px-6 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-98 ${(isReportAlreadyFinalized || decisionNotes.trim()) && !isSubmitting
                            ? 'bg-[#007b8b] hover:bg-[#006471] dark:bg-[#00c4de] dark:hover:bg-[#00b2c9] text-white dark:text-black shadow-[#007b8b]/20'
                            : 'bg-gray-200 dark:bg-white/10 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                          {isSubmitting ? (
                            <span className="inline-flex items-center gap-1.5">
                              <CircleNotch size={14} className="animate-spin" />
                              <span>{isEn ? 'Updating...' : 'Đang cập nhật...'}</span>
                            </span>
                          ) : isReportAlreadyFinalized ? (
                            <span>{isEn ? 'Sync & Close Case' : 'Đồng bộ & Đóng ca'}</span>
                          ) : (
                            <span>{isEn ? 'Update' : 'Cập nhật'}</span>
                          )}
                        </button>
                      </div>
                    )}
                </>
              )}
            </div>
          </div>
        </ModalPortal>
      )}

      <UserProfileDetailModal
        userId={inspectingUser?.id || null}
        initialSummary={inspectingUser?.summary}
        isEn={isEn}
        onClose={() => setInspectingUser(null)}
      />

      <TaskHistoryTimelineModal
        taskId={timelineTaskId}
        isEn={isEn}
        onClose={() => setTimelineTaskId(null)}
      />
    </div>
  )
}

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ModalPortal } from '@/components/common/ModalPortal'
import {
  X,
  Copy,
  Check,
  ArrowSquareOut,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Camera,
  Clock,
  User,
  CalendarBlank,
  MapPin,
  ShieldCheck,
  CircleNotch,
  ChatText,
} from '@phosphor-icons/react'
import { CategoryBadge } from './MissingSignsBadges'
import { SignMiniMap } from './SignMiniMap'
import CustomSelect from '@/components/common/CustomSelect'
import type { MissingSignTypeReport } from '@/data'
import type { RecaptureReasonCode, MissingRejectReasonKey } from './index'

const RECAPTURE_REASON_OPTIONS = [
  { value: 'BLURRY', label: 'Ảnh mờ hoặc rung tay' },
  { value: 'POOR_LIGHTING', label: 'Ngược sáng hoặc thiếu sáng' },
  { value: 'WRONG_ANGLE', label: 'Góc chụp quá nghiêng' },
  { value: 'OCCLUDED', label: 'Bị vật cản che khuất' },
  { value: 'MISSING_CONTEXT', label: 'Thiếu ảnh toàn cảnh' },
  { value: 'OTHER', label: 'Lý do khác' },
]

const REJECT_REASON_OPTIONS = [
  { value: 'reason_not_sign', label: 'Không phải biển báo giao thông' },
  { value: 'reason_blurred', label: 'Hình ảnh không đạt tiêu chuẩn' },
  { value: 'reason_duplicate', label: 'Báo cáo trùng lặp đã tồn tại' },
]

interface MissingSignInspectionModalProps {
  report: MissingSignTypeReport
  isAdmin?: boolean
  onClose: () => void
  onOpenMerge: () => void
  onOpenEscalate?: () => void
  onOpenReject?: () => void
  onOpenApprove?: () => void
  onOpenIncomplete?: () => void
  onDirectEscalate?: (note?: string) => Promise<void> | void
  onDirectReject?: (reasonKey?: MissingRejectReasonKey) => Promise<void> | void
  onDirectRecapture?: (reason: RecaptureReasonCode, note: string) => Promise<void> | void
}

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

function formatShapeVi(shape?: string | null): string {
  if (!shape) return ''
  switch (shape.toLowerCase()) {
    case 'circle':
      return 'Hình tròn'
    case 'triangle':
      return 'Hình tam giác'
    case 'rectangle':
      return 'Hình chữ nhật'
    case 'square':
      return 'Hình vuông'
    case 'octagon':
      return 'Hình bát giác'
    default:
      return shape
  }
}

function formatColorVi(color?: string | null): string {
  if (!color) return ''
  switch (color.toLowerCase()) {
    case 'red-white':
      return 'Đỏ - Trắng'
    case 'yellow-black':
      return 'Vàng - Đen'
    case 'blue-white':
      return 'Xanh dương - Trắng'
    case 'green-white':
      return 'Xanh lá - Trắng'
    case 'black-white':
      return 'Đen - Trắng'
    default:
      return color
  }
}

function getHeaderStatusConfig(status: MissingSignTypeReport['status']) {
  switch (status) {
    case 'Approved':
      return {
        label: 'Đã phê duyệt',
        textColor: 'text-emerald-700 dark:text-emerald-400',
      }
    case 'Rejected':
      return {
        label: 'Đã bác bỏ',
        textColor: 'text-red-600 dark:text-red-400',
      }
    case 'Merged':
      return {
        label: 'Đã gộp Catalog',
        textColor: 'text-purple-700 dark:text-purple-400',
      }
    case 'Incomplete':
      return {
        label: 'Yêu cầu chụp lại',
        textColor: 'text-amber-700 dark:text-amber-400',
      }
    case 'Escalated':
      return {
        label: 'Chờ Admin xử lý',
        textColor: 'text-purple-700 dark:text-purple-400',
      }
    case 'Open':
    default:
      return {
        label: 'Chờ xử lý',
        textColor: 'text-amber-700 dark:text-amber-400',
      }
  }
}

interface DecisionConfig {
  label: string
  icon: typeof CheckCircle
  cardClass: string
  titleClass: string
  badgeClass: string
  iconClass: string
  defaultNote: string
}

function getDecisionConfig(status: MissingSignTypeReport['status'], mergedIntoId?: number | null): DecisionConfig {
  switch (status) {
    case 'Approved':
      return {
        label: 'Phê chuẩn',
        icon: CheckCircle,
        cardClass: 'border-emerald-500/25 bg-emerald-50/60 dark:bg-emerald-950/20',
        titleClass: 'text-emerald-700 dark:text-emerald-400',
        badgeClass: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60',
        iconClass: 'text-emerald-600 dark:text-emerald-400',
        defaultNote: 'Đã phê duyệt và ban hành vào Catalog.',
      }
    case 'Rejected':
      return {
        label: 'Bác bỏ',
        icon: XCircle,
        cardClass: 'border-red-500/25 bg-red-50/50 dark:bg-red-950/20',
        titleClass: 'text-red-700 dark:text-red-400',
        badgeClass: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/60',
        iconClass: 'text-red-600 dark:text-red-400',
        defaultNote: 'Đề xuất đã bị từ chối.',
      }
    case 'Merged':
      return {
        label: 'Đã gộp Catalog',
        icon: CheckCircle,
        cardClass: 'border-purple-500/25 bg-purple-50/60 dark:bg-purple-950/20',
        titleClass: 'text-purple-700 dark:text-purple-400',
        badgeClass: 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60',
        iconClass: 'text-purple-600 dark:text-purple-400',
        defaultNote: mergedIntoId ? `Đã gộp vào biển báo #${mergedIntoId} trong Catalog chuẩn.` : 'Đề xuất đã được gộp vào Catalog chuẩn.',
      }
    case 'Incomplete':
      return {
        label: 'Yêu cầu chụp lại',
        icon: Camera,
        cardClass: 'border-amber-500/25 bg-amber-50/50 dark:bg-amber-950/20',
        titleClass: 'text-amber-700 dark:text-amber-400',
        badgeClass: 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60',
        iconClass: 'text-amber-600 dark:text-amber-400',
        defaultNote: 'Đang chờ Surveyor chụp lại ảnh hiện trường mới.',
      }
    default:
      return {
        label: 'Đang xử lý',
        icon: CheckCircle,
        cardClass: 'border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]',
        titleClass: 'text-gray-700 dark:text-gray-300',
        badgeClass: 'bg-gray-100 text-gray-700 border border-gray-200',
        iconClass: 'text-gray-500',
        defaultNote: 'Hồ sơ đang trong quy trình đánh giá.',
      }
  }
}

type ActionType = 'APPROVE' | 'MERGE' | 'ESCALATE' | 'RECAPTURE' | 'REJECT'

export function MissingSignInspectionModal({
  report,
  isAdmin = false,
  onClose,
  onOpenMerge,
  onOpenEscalate,
  onOpenReject,
  onOpenApprove,
  onOpenIncomplete,
  onDirectEscalate,
  onDirectReject,
  onDirectRecapture,
}: MissingSignInspectionModalProps) {
  const { t } = useTranslation('ops')
  const [activeImageTab, setActiveImageTab] = useState<'crop' | 'context'>('crop')
  const [imgLoadError, setImgLoadError] = useState(false)
  const [copiedId, setCopiedId] = useState(false)
  const [copiedTargetId, setCopiedTargetId] = useState(false)

  // Action decision form state (Exactly like /escalations)
  const [actionType, setActionType] = useState<ActionType>(() => {
    if (isAdmin && onOpenApprove) return 'APPROVE'
    if (!isAdmin && report.status === 'Open') return 'ESCALATE'
    return 'MERGE'
  })

  const [escalateNotes, setEscalateNotes] = useState('')
  const [recaptureReason, setRecaptureReason] = useState<RecaptureReasonCode>('BLURRY')
  const [recaptureNote, setRecaptureNote] = useState(
    'Ảnh biển báo bị mờ hoặc rung tay, vui lòng chụp thẳng góc và rõ nét hơn tại vị trí này.'
  )
  const [rejectReason, setRejectReason] = useState<MissingRejectReasonKey>('reason_not_sign')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const hasContextFrame = Boolean(report.bestFrameUrl)
  const activeImageUrl =
    activeImageTab === 'context' && report.bestFrameUrl
      ? report.bestFrameUrl
      : report.sampleImageUrl

  const hasValidLocation =
    Number.isFinite(report.lat) &&
    Number.isFinite(report.lng) &&
    (report.lat !== 0 || report.lng !== 0)

  const headerStatusConfig = getHeaderStatusConfig(report.status)

  const isResolvedOrClosed =
    report.status === 'Approved' ||
    report.status === 'Rejected' ||
    report.status === 'Merged' ||
    report.status === 'Incomplete'

  const decisionConfig = getDecisionConfig(report.status, report.mergedIntoSignTypeId)
  const DecisionIcon = decisionConfig.icon

  const handleRecaptureReasonChange = (code: RecaptureReasonCode) => {
    setRecaptureReason(code)
    switch (code) {
      case 'BLURRY':
        setRecaptureNote('Ảnh biển báo bị mờ hoặc rung tay, vui lòng chụp thẳng góc và rõ nét hơn tại vị trí này.')
        break
      case 'POOR_LIGHTING':
        setRecaptureNote('Ảnh chụp bị ngược sáng hoặc trong điều kiện trời quá tối, không nhận diện được mặt biển báo.')
        break
      case 'WRONG_ANGLE':
        setRecaptureNote('Góc chụp quá nghiêng, méo hình học, vui lòng chụp trực diện và vuông góc với mặt biển.')
        break
      case 'OCCLUDED':
        setRecaptureNote('Mặt biển báo bị cây cối, cột điện hoặc phương tiện khác che khuất một phần.')
        break
      case 'MISSING_CONTEXT':
        setRecaptureNote('Thiếu ảnh toàn cảnh khu vực để xác thực tính hợp lệ của biển báo.')
        break
      case 'OTHER':
        setRecaptureNote('')
        break
    }
  }

  const handleConfirmAction = async () => {
    if (actionType === 'APPROVE') {
      if (onOpenApprove) onOpenApprove()
      return
    }

    if (actionType === 'MERGE') {
      onOpenMerge()
      return
    }

    if (actionType === 'ESCALATE') {
      if (!escalateNotes.trim()) return
      setIsSubmitting(true)
      try {
        if (onDirectEscalate) {
          await onDirectEscalate(escalateNotes.trim())
        } else if (onOpenEscalate) {
          onOpenEscalate()
        }
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    if (actionType === 'RECAPTURE') {
      if (!recaptureNote.trim()) return
      setIsSubmitting(true)
      try {
        if (onDirectRecapture) {
          await onDirectRecapture(recaptureReason, recaptureNote.trim())
        } else if (onOpenIncomplete) {
          onOpenIncomplete()
        }
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    if (actionType === 'REJECT') {
      setIsSubmitting(true)
      try {
        if (onDirectReject) {
          await onDirectReject(rejectReason)
        } else if (onOpenReject) {
          onOpenReject()
        }
      } finally {
        setIsSubmitting(false)
      }
      return
    }
  }

  let isSubmitDisabled = false
  if (actionType === 'ESCALATE' && !escalateNotes.trim()) isSubmitDisabled = true
  if (actionType === 'RECAPTURE' && !recaptureNote.trim()) isSubmitDisabled = true

  let actionButtonText = 'Xác nhận xử lý'
  if (actionType === 'APPROVE') actionButtonText = 'Tiếp tục'
  else if (actionType === 'MERGE') actionButtonText = 'Tiếp tục'
  else if (actionType === 'ESCALATE') actionButtonText = 'Xác nhận chuyển Admin'
  else if (actionType === 'RECAPTURE') actionButtonText = 'Gửi yêu cầu chụp lại'
  else if (actionType === 'REJECT') actionButtonText = 'Xác nhận từ chối'

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/15 rounded-2xl shadow-2xl max-w-[980px] w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 my-auto text-xs text-gray-800 dark:text-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ─── MODAL HEADER (Identical to /escalations) ─────────────── */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] shrink-0">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(report.id)
                  setCopiedId(true)
                  setTimeout(() => setCopiedId(false), 2000)
                }}
                className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 transition-colors cursor-pointer"
                title="Sao chép toàn bộ UUID ca"
              >
                <span>#{report.id}</span>
                {copiedId ? (
                  <Check size={12} className="text-emerald-500" />
                ) : (
                  <Copy size={12} className="text-gray-400" />
                )}
              </button>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {t('missing_signs.catalog_proposal', 'Đề xuất loại biển mới')}
              </span>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span className={`font-medium ${headerStatusConfig.textColor}`}>
                {headerStatusConfig.label}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-2"
              title="Đóng (Esc)"
            >
              <X size={18} weight="bold" />
            </button>
          </div>

          {/* ─── MODAL BODY ───────────────────────────────────────────── */}
          <div className="p-4 sm:p-5 overflow-y-auto text-xs sm:text-sm flex-1">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
              {/* ─── LEFT COLUMN: EVIDENCE PHOTO + MINI MAP (5 cols) ───── */}
              <div className="md:col-span-5 flex flex-col gap-2.5 h-full">
                {/* 1. Evidence Photo Container */}
                <div className="relative aspect-4/3 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-900 group shadow-2xs flex items-center justify-center shrink-0">
                  {!imgLoadError && activeImageUrl ? (
                    <img
                      src={activeImageUrl}
                      alt={report.tempLabel}
                      onError={() => setImgLoadError(true)}
                      className="w-full h-full object-contain sm:object-cover transition-transform duration-200 group-hover:scale-102"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-gray-400 space-y-1">
                      <ImageIcon size={32} weight="light" className="opacity-50" />
                      <p className="text-xs text-gray-400">Không có ảnh hiển thị</p>
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
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          activeImageTab === 'crop'
                            ? 'bg-[#007b8b] text-white dark:bg-[#00c4de] dark:text-black shadow-xs'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/10'
                        }`}
                      >
                        Ảnh cắt
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveImageTab('context')
                          setImgLoadError(false)
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          activeImageTab === 'context'
                            ? 'bg-[#007b8b] text-white dark:bg-[#00c4de] dark:text-black shadow-xs'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/10'
                        }`}
                      >
                        Toàn cảnh
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
                      title="Mở ảnh gốc trong tab mới"
                    >
                      <ArrowSquareOut size={12} />
                      <span>Ảnh gốc</span>
                    </a>
                  )}
                </div>

                {/* 2. Mini Map or Fallback */}
                {hasValidLocation ? (
                  <div className="flex-1 min-h-[130px] rounded-xl overflow-hidden border border-gray-200 dark:border-white/10">
                    <SignMiniMap
                      lat={report.lat}
                      lng={report.lng}
                      title={report.tempLabel}
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-gray-200 dark:border-white/10 text-center text-gray-400 text-xs min-h-[130px]">
                    <MapPin size={16} className="mx-auto mb-1 opacity-50" />
                    <span>Không có toạ độ định vị GPS</span>
                  </div>
                )}
              </div>

              {/* ─── RIGHT COLUMN: SPECS & DECISION (7 cols) ─────────────── */}
              <div className="md:col-span-7 flex flex-col gap-3">
                {/* Proposed Sign Title */}
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                    {report.tempLabel}
                  </h3>
                  {report.id && (
                    <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                      <span>Mã đối tượng:</span>
                      <span className="font-mono text-gray-700 dark:text-gray-300 select-all break-all">
                        #{report.id}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(report.id)
                          setCopiedTargetId(true)
                          setTimeout(() => setCopiedTargetId(false), 2000)
                        }}
                        className="text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer shrink-0"
                        title="Sao chép UUID đối tượng"
                      >
                        {copiedTargetId ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Key-Value Specs Card (Clean, neutral layout) */}
                <div className="rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] divide-y divide-gray-200/60 dark:divide-white/5 text-xs">
                  {/* Category */}
                  <div className="flex items-center justify-between py-1.5 px-3">
                    <span className="text-gray-500 dark:text-gray-400">Danh mục:</span>
                    <CategoryBadge category={report.category} categoryId={report.proposedCategoryId} />
                  </div>

                  {/* Shape & Color Scheme */}
                  {(report.suggestedShape || report.suggestedColorScheme) && (
                    <div className="flex items-center justify-between py-1.5 px-3">
                      <span className="text-gray-500 dark:text-gray-400">Quy cách hình ảnh:</span>
                      <div className="flex items-center gap-2 font-medium text-gray-800 dark:text-gray-200">
                        {report.suggestedShape && <span>{formatShapeVi(report.suggestedShape)}</span>}
                        {report.suggestedShape && report.suggestedColorScheme && (
                          <span className="text-gray-300 dark:text-gray-600">•</span>
                        )}
                        {report.suggestedColorScheme && <span>{formatColorVi(report.suggestedColorScheme)}</span>}
                      </div>
                    </div>
                  )}

                  {/* AI Confidence Score */}
                  {report.aiConfidence !== undefined && (
                    <div className="flex items-center justify-between py-1.5 px-3">
                      <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <CheckCircle size={13} className="text-[#007b8b] dark:text-[#00c4de]" />
                        <span>Độ tin cậy AI:</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#007b8b] dark:bg-[#00c4de] rounded-full"
                            style={{ width: `${Math.min(100, Math.max(0, report.aiConfidence * 100))}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-gray-900 dark:text-white text-xs">
                          {(report.aiConfidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Reporter & Submitted Date */}
                  <div className="flex items-center justify-between py-1.5 px-3 text-gray-500 dark:text-gray-400 text-[11px] font-mono">
                    <div className="flex items-center gap-1 min-w-0">
                      <User size={12} className="text-gray-400 shrink-0" />
                      <span className="truncate">
                        {report.reporterId
                          ? report.reporterId.startsWith('#')
                            ? report.reporterId
                            : '#' + report.reporterId
                          : report.reportedBy || 'Hệ thống'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <CalendarBlank size={12} />
                      <span>{formatDate(report.createdAt || report.reportedAt)}</span>
                    </div>
                  </div>

                  {/* Staff Reviewer */}
                  {report.reviewedBy && (
                    <div className="flex items-center justify-between py-1.5 px-3 text-gray-500 dark:text-gray-400 text-[11px] font-mono">
                      <div className="flex items-center gap-1 min-w-0">
                        <User size={12} className="text-[#007b8b] dark:text-[#00c4de] shrink-0" />
                        <span className="truncate">Staff #{report.reviewedBy.slice(0, 8)}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <Clock size={12} />
                        <span>{formatDate(report.updatedAt)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description & Staff Notes - Symmetrical, clean presentation */}
                {(report.reporterNote || (report.staffNotes && !isResolvedOrClosed)) && (
                  <div className="space-y-2">
                    {report.reporterNote && (
                      <div>
                        <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1">
                          <ChatText size={12} className="text-gray-400 shrink-0" />
                          <span>Mô tả từ người gửi:</span>
                        </span>
                        <div className="px-2.5 py-1.5 rounded-lg border border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.02] text-gray-800 dark:text-gray-200 text-xs leading-relaxed">
                          {report.reporterNote}
                        </div>
                      </div>
                    )}

                    {report.staffNotes && !isResolvedOrClosed && (
                      <div>
                        <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 block mb-1">
                          Ghi chú của Staff:
                        </span>
                        <div className="px-2.5 py-1.5 rounded-lg border border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.02] text-gray-800 dark:text-gray-200 text-xs leading-relaxed">
                          {report.staffNotes}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Adjudication / Action Decision Form (If Open or Escalated for Admin) */}
                {(report.status === 'Open' || (report.status === 'Escalated' && isAdmin)) && (
                  <div className="p-2.5 sm:p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 dark:text-white">
                      <ShieldCheck size={15} weight="bold" className="text-[#007b8b] dark:text-[#00c4de]" />
                      <span>Quyết định xử lý</span>
                    </div>

                    {/* Action Choice Pills (Clean, simple, text-only, exactly like /escalations) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {isAdmin && onOpenApprove && (
                        <button
                          type="button"
                          onClick={() => setActionType('APPROVE')}
                          className={`py-2 px-2 rounded-lg border text-[11px] sm:text-xs font-bold transition-all cursor-pointer text-center whitespace-nowrap ${
                            actionType === 'APPROVE'
                              ? 'bg-[#007b8b] text-white border-[#007b8b] dark:bg-[#00c4de] dark:text-black dark:border-[#00c4de] shadow-xs'
                              : 'bg-white dark:bg-black/30 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                          }`}
                        >
                          Phê chuẩn
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setActionType('MERGE')}
                        className={`py-2 px-2 rounded-lg border text-[11px] sm:text-xs font-bold transition-all cursor-pointer text-center whitespace-nowrap ${
                          actionType === 'MERGE'
                            ? 'bg-[#007b8b] text-white border-[#007b8b] dark:bg-[#00c4de] dark:text-black dark:border-[#00c4de] shadow-xs'
                            : 'bg-white dark:bg-black/30 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                      >
                        Gộp Catalog
                      </button>

                      {report.status === 'Open' && !isAdmin && (
                        <button
                          type="button"
                          onClick={() => setActionType('ESCALATE')}
                          className={`py-2 px-2 rounded-lg border text-[11px] sm:text-xs font-bold transition-all cursor-pointer text-center whitespace-nowrap ${
                            actionType === 'ESCALATE'
                              ? 'bg-[#007b8b] text-white border-[#007b8b] dark:bg-[#00c4de] dark:text-black dark:border-[#00c4de] shadow-xs'
                              : 'bg-white dark:bg-black/30 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                          }`}
                        >
                          Chuyển Admin
                        </button>
                      )}

                      {onOpenIncomplete && (
                        <button
                          type="button"
                          onClick={() => setActionType('RECAPTURE')}
                          className={`py-2 px-2 rounded-lg border text-[11px] sm:text-xs font-bold transition-all cursor-pointer text-center whitespace-nowrap ${
                            actionType === 'RECAPTURE'
                              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                              : 'bg-white dark:bg-black/30 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                          }`}
                        >
                          Yêu cầu chụp lại
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setActionType('REJECT')}
                        className={`py-2 px-2 rounded-lg border text-[11px] sm:text-xs font-bold transition-all cursor-pointer text-center whitespace-nowrap ${
                          actionType === 'REJECT'
                            ? 'bg-red-600 text-white border-red-600 shadow-xs'
                            : 'bg-white dark:bg-black/30 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                      >
                        Từ chối
                      </button>
                    </div>

                    {/* Contextual Notes / Action Form Inputs */}
                    {actionType === 'APPROVE' && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 py-0.5 leading-relaxed">
                        Phê duyệt báo cáo đề xuất biển mới. Bạn sẽ tiến hành hiệu chỉnh thông số kỹ thuật và ban hành biển vào Catalog chuẩn ở bước tiếp theo.
                      </p>
                    )}

                    {actionType === 'MERGE' && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 py-0.5 leading-relaxed">
                        Gộp đề xuất này vào một loại biển báo đã tồn tại trong Catalog. Bước tiếp theo sẽ mở danh mục tra cứu để chọn biển báo chuẩn.
                      </p>
                    )}

                    {actionType === 'ESCALATE' && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                          Ghi chú: <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          rows={2}
                          value={escalateNotes}
                          onChange={(e) => setEscalateNotes(e.target.value)}
                          placeholder="Nhập ghi chú..."
                          className="w-full p-2 rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-black/50 text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-[#007b8b] dark:focus:border-[#00c4de] focus:ring-1 focus:ring-[#007b8b]/20 text-xs resize-none"
                        />
                      </div>
                    )}

                    {actionType === 'RECAPTURE' && (
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                            Lý do yêu cầu chụp lại:
                          </label>
                          <CustomSelect
                            value={recaptureReason}
                            onChange={(val) => handleRecaptureReasonChange(val as RecaptureReasonCode)}
                            options={RECAPTURE_REASON_OPTIONS}
                            size="sm"
                            direction="down"
                            portal={true}
                            className="w-full"
                            buttonClassName="w-full bg-white dark:bg-black/40 border-gray-300 dark:border-white/15 text-xs py-2"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                            Hướng dẫn cụ thể: <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            rows={2}
                            value={recaptureNote}
                            onChange={(e) => setRecaptureNote(e.target.value)}
                            placeholder="Nhập yêu cầu chụp lại cho Surveyor..."
                            className="w-full p-2 rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-black/50 text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-[#007b8b] dark:focus:border-[#00c4de] focus:ring-1 focus:ring-[#007b8b]/20 text-xs resize-none"
                          />
                        </div>
                      </div>
                    )}

                    {actionType === 'REJECT' && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                          Lý do từ chối:
                        </label>
                        <CustomSelect
                          value={rejectReason}
                          onChange={(val) => setRejectReason(val as MissingRejectReasonKey)}
                          options={REJECT_REASON_OPTIONS}
                          size="sm"
                          direction="down"
                          portal={true}
                          className="w-full"
                          buttonClassName="w-full bg-white dark:bg-black/40 border-gray-300 dark:border-white/15 text-xs py-2"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Resolved / Closed State View - Clean, direct, no parentheses or quotation marks */}
                {isResolvedOrClosed && (
                  <div className={`p-3 rounded-xl border ${decisionConfig.cardClass} space-y-1.5`}>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-bold">
                        <div className={`flex items-center gap-1.5 ${decisionConfig.titleClass}`}>
                          <DecisionIcon size={15} weight="fill" className={decisionConfig.iconClass} />
                          <span>Kết quả xử lý</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${decisionConfig.badgeClass}`}>
                          {decisionConfig.label}
                        </span>
                      </div>
                      {(report.resolvedAt || report.updatedAt) && (
                        <span className="font-mono text-[11px] text-gray-500 dark:text-gray-400">
                          {formatDate(report.resolvedAt || report.updatedAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed">
                      {report.staffNotes || decisionConfig.defaultNote}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─── MODAL FOOTER ─────────────────────────────────────────── */}
          <div className="px-5 py-3 border-t border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/[0.02] flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
            >
              {t('missing_signs.btn_cancel', 'Hủy')}
            </button>

            {(report.status === 'Open' || (report.status === 'Escalated' && isAdmin)) && (
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={isSubmitting || isSubmitDisabled}
                className={`inline-flex items-center justify-center px-6 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-98 ${
                  isSubmitDisabled || isSubmitting
                    ? 'bg-gray-200 dark:bg-white/10 text-gray-400 cursor-not-allowed'
                    : actionType === 'REJECT'
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20'
                      : actionType === 'RECAPTURE'
                        ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                        : 'bg-[#007b8b] hover:bg-[#006471] dark:bg-[#00c4de] dark:hover:bg-[#00b2c9] text-white dark:text-black shadow-[#007b8b]/20'
                }`}
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-1.5">
                    <CircleNotch size={14} className="animate-spin" />
                    <span>Đang xử lý...</span>
                  </span>
                ) : (
                  <span>{actionButtonText}</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}
export default MissingSignInspectionModal

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/context/ToastContext'
import { ModalPortal } from '@/components/common/ModalPortal'
import {
  X,
  Copy,
  ArrowSquareOut,
  Image as ImageIcon,
  CheckCircle,
  ChatText,
  User,
  CalendarBlank,
} from '@phosphor-icons/react'
import { CategoryBadge, StatusBadge } from './MissingSignsBadges'
import { SignMiniMap } from './SignMiniMap'
import type { MissingSignTypeReport } from '@/data'

interface MissingSignInspectionModalProps {
  report: MissingSignTypeReport
  isAdmin?: boolean
  onClose: () => void
  onOpenMerge: () => void
  onOpenEscalate: () => void
  onOpenReject: () => void
  onOpenApprove?: () => void
  onOpenIncomplete?: () => void
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

export function MissingSignInspectionModal({
  report,
  isAdmin = false,
  onClose,
  onOpenMerge,
  onOpenEscalate,
  onOpenReject,
  onOpenApprove,
  onOpenIncomplete,
}: MissingSignInspectionModalProps) {
  const { t } = useTranslation('ops')
  const { success } = useToast()
  const [activeImageTab, setActiveImageTab] = useState<'crop' | 'context'>('crop')
  const [imgLoadError, setImgLoadError] = useState(false)

  const hasContextFrame = Boolean(report.bestFrameUrl)
  const activeImageUrl =
    activeImageTab === 'context' && report.bestFrameUrl
      ? report.bestFrameUrl
      : report.sampleImageUrl

  const hasValidLocation =
    Number.isFinite(report.lat) &&
    Number.isFinite(report.lng) &&
    (report.lat !== 0 || report.lng !== 0)

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-[#0A171C] border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 text-gray-800 dark:text-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ─── MODAL HEADER (Minimal, Neutral) ───────────────────────── */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Proposal ID Chip */}
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(report.id)
                  success(`Đã sao chép UUID: ${report.id}`)
                }}
                className="inline-flex items-center gap-1.5 text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 transition-colors cursor-pointer"
                title="Sao chép toàn bộ UUID"
              >
                <span>#{report.id.slice(0, 8)}</span>
                <Copy size={12} className="text-gray-400" />
              </button>

              <StatusBadge status={report.status} />
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-2"
              title="Đóng (Esc)"
            >
              <X size={16} weight="bold" />
            </button>
          </div>

          {/* ─── MODAL BODY (Curated API Data + Compact Map) ───────────── */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* ─── LEFT COLUMN: EVIDENCE PHOTO + MINI MAP (5 cols) ───── */}
              <div className="md:col-span-5 space-y-3">
                {/* 1. Evidence Photo Container */}
                <div className="relative aspect-4/3 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-gray-900 group shadow-2xs flex items-center justify-center">
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

                  {/* Floating View Switcher Inside Image Container (Exact style as /review) */}
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

                {/* 2. Compact Map (Exactly like /review page) */}
                {hasValidLocation && (
                  <div className="space-y-1">
                    <SignMiniMap
                      lat={report.lat}
                      lng={report.lng}
                      title={report.tempLabel}
                      heightClassName="h-[150px] sm:h-[165px]"
                    />
                  </div>
                )}
              </div>

              {/* ─── RIGHT COLUMN: CURATED API DATA (7 cols) ─────────────── */}
              <div className="md:col-span-7 space-y-3.5">
                {/* Proposed Sign Title */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                    {report.tempLabel}
                  </h3>
                </div>

                {/* Key-Value Specs Card (Clean, neutral layout) */}
                <div className="rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] divide-y divide-gray-200/60 dark:divide-white/5 text-xs">
                  {/* Category */}
                  <div className="flex items-center justify-between py-2 px-3.5">
                    <span className="text-gray-500 dark:text-gray-400">Danh mục:</span>
                    <CategoryBadge category={report.category} categoryId={report.proposedCategoryId} />
                  </div>

                  {/* Shape & Color Scheme */}
                  {(report.suggestedShape || report.suggestedColorScheme) && (
                    <div className="flex items-center justify-between py-2 px-3.5">
                      <span className="text-gray-500 dark:text-gray-400">Quy cách hình ảnh:</span>
                      <div className="flex items-center gap-2 font-medium text-gray-800 dark:text-gray-200">
                        {report.suggestedShape && <span>{formatShapeVi(report.suggestedShape)}</span>}
                        {report.suggestedShape && report.suggestedColorScheme && <span className="text-gray-300 dark:text-gray-600">•</span>}
                        {report.suggestedColorScheme && <span>{formatColorVi(report.suggestedColorScheme)}</span>}
                      </div>
                    </div>
                  )}

                  {/* AI Confidence Score */}
                  {report.aiConfidence !== undefined && (
                    <div className="flex items-center justify-between py-2 px-3.5">
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
                  <div className="flex items-center justify-between py-2 px-3.5 text-gray-500 dark:text-gray-400 text-[11px] font-mono">
                    <div className="flex items-center gap-1">
                      <User size={12} className="text-gray-400" />
                      <span>{report.reportedBy}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CalendarBlank size={12} />
                      <span>{report.reportedAt}</span>
                    </div>
                  </div>
                </div>

                {/* Reporter Field Notes (Clean, neutral quote style) */}
                {report.reporterNote && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <ChatText size={12} />
                      <span>Ghi chú từ Reviewer:</span>
                    </span>
                    <div className="p-3 rounded-xl border border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.02] text-gray-700 dark:text-gray-300 text-xs italic leading-relaxed">
                      &ldquo;{report.reporterNote}&rdquo;
                    </div>
                  </div>
                )}

                {/* Staff Notes if already triaged */}
                {report.staffNotes && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                      Ghi chú xử lý của Staff:
                    </span>
                    <div className="p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100/60 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-xs font-mono">
                      {report.staffNotes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─── MODAL FOOTER (Clean, Distinct Decision Actions) ───────── */}
          <div className="px-5 py-3 border-t border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/[0.02] flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              {/* Primary Admin Action: Only when report is Open or Escalated AND user is Admin */}
              {(report.status === 'Open' || report.status === 'Escalated') && isAdmin && onOpenApprove && (
                <button
                  type="button"
                  onClick={onOpenApprove}
                  className="inline-flex items-center px-4 py-2 rounded-xl bg-[#007b8b] hover:bg-[#00606d] text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-98"
                >
                  <span>Phê duyệt &amp; Tạo loại biển</span>
                </button>
              )}

              {/* Secondary Actions: When Open, or when Admin reviews an Escalated report */}
              {(report.status === 'Open' || (report.status === 'Escalated' && isAdmin)) && (
                <>
                  <button
                    type="button"
                    onClick={onOpenMerge}
                    className="inline-flex items-center px-4 py-2 rounded-xl border border-purple-300 dark:border-purple-500/30 bg-purple-50/80 hover:bg-purple-100 dark:bg-purple-500/15 dark:hover:bg-purple-500/25 text-purple-700 dark:text-purple-300 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-98"
                  >
                    <span>Gộp Catalog</span>
                  </button>

                  {/* Staff only: Escalate to Admin when status is Open */}
                  {report.status === 'Open' && !isAdmin && (
                    <button
                      type="button"
                      onClick={onOpenEscalate}
                      className="inline-flex items-center px-4 py-2 rounded-xl border border-sky-300 dark:border-sky-500/30 bg-sky-50/80 hover:bg-sky-100 dark:bg-sky-500/15 dark:hover:bg-sky-500/25 text-sky-700 dark:text-sky-300 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-98"
                    >
                      <span>Chuyển Admin</span>
                    </button>
                  )}

                  {onOpenIncomplete && report.status === 'Open' && (
                    <button
                      type="button"
                      onClick={onOpenIncomplete}
                      className="inline-flex items-center px-4 py-2 rounded-xl border border-amber-300 dark:border-amber-500/30 bg-amber-50/80 hover:bg-amber-100 dark:bg-amber-500/15 dark:hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-98"
                    >
                      <span>Yêu cầu chụp lại</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={onOpenReject}
                    className="inline-flex items-center px-4 py-2 rounded-xl border border-red-300 dark:border-red-500/30 bg-red-50/80 hover:bg-red-100 dark:bg-red-500/15 dark:hover:bg-red-500/25 text-red-600 dark:text-red-400 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-98"
                  >
                    <span>Từ chối</span>
                  </button>
                </>
              )}

              {/* Escalated status indicator for Staff (non-admin) */}
              {report.status === 'Escalated' && !isAdmin && (
                <div className="flex items-center gap-1.5 text-xs text-sky-700 dark:text-sky-300 font-medium bg-sky-50 dark:bg-sky-500/10 px-3 py-1.5 rounded-xl border border-sky-200 dark:border-sky-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                  <span>Đã chuyển Admin xem xét phê duyệt</span>
                </div>
              )}

              {/* Terminal / Resolved state indicators */}
              {report.status === 'Merged' && (
                <div className="flex items-center gap-1.5 text-xs text-purple-700 dark:text-purple-300 font-medium bg-purple-50 dark:bg-purple-500/10 px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                  <span>Đề xuất đã gộp vào Catalog (Hồ sơ đã hoàn tất)</span>
                </div>
              )}

              {report.status === 'Rejected' && (
                <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-500/10 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  <span>Đề xuất đã bị từ chối (Hồ sơ đã đóng)</span>
                </div>
              )}

              {report.status === 'Approved' && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 font-medium bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>Đã phê duyệt và ban hành vào Catalog</span>
                </div>
              )}

              {report.status === 'Incomplete' && (
                <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 font-medium bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span>Đang chờ Surveyor chụp lại ảnh mới</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer shadow-2xs"
            >
              {t('missing_signs.btn_cancel', 'Đóng')}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}
export default MissingSignInspectionModal

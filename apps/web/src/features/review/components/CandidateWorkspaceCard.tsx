import { useState } from 'react'
import {
  CheckCircle,
  XCircle,
  Flag,
  ArrowUUpLeft,
  Eye,
  MagnifyingGlassPlus,
  MapPin,
  Sparkle,
  X,
  BookOpen,
  ArrowBendUpRight,
  Keyboard,
  CircleNotch,
} from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import type { CandidateToReview } from '@/data'
import { Modal } from '@/components/common/Modal'
import { ReviewerMiniMap } from './ReviewerMiniMap'

export interface CandidateWorkspaceCardProps {
  candidate: CandidateToReview
  currentIndex: number
  totalCandidates: number
  activeView: 'crop' | 'context'
  isDark: boolean
  onViewChange: (view: 'crop' | 'context') => void
  onDecision: (action: 'approve' | 'reject') => void
  onOpenDecline: () => void
  onSkip?: () => void
  onOpenCatalog?: () => void
  onOpenFlag?: () => void
  onUndo?: () => void
  canUndo?: boolean
  onQuickCorrect?: (signCode: string) => void
  onPrev?: () => void
  onNext?: () => void
  canPrev?: boolean
  canNext?: boolean
  onOpenGuide?: () => void
  isSubmitting?: boolean
  submittingAction?: 'approve' | 'reject' | 'skip' | 'flag' | null
}

// Frequent traffic sign codes for 1-click quick correction
const QUICK_SUGGEST_SIGNS = [
  { code: 'P.130', nameVi: 'Cấm dừng xe và đỗ xe' },
  { code: 'P.131a', nameVi: 'Cấm đỗ xe ngày lẻ' },
  { code: 'P.102', nameVi: 'Cấm đi ngược chiều' },
  { code: 'P.103a', nameVi: 'Cấm ô tô' },
  { code: 'W.205', nameVi: 'Đường giao nhau' },
]

export function CandidateWorkspaceCard({
  candidate,
  activeView,
  isDark,
  onViewChange,
  onDecision,
  onOpenDecline,
  onSkip,
  onOpenCatalog,
  onOpenFlag,
  onUndo,
  canUndo = false,
  onQuickCorrect,
  onOpenGuide,
  isSubmitting = false,
  submittingAction = null,
}: CandidateWorkspaceCardProps) {
  const { t } = useTranslation('common')
  const [isZoomed, setIsZoomed] = useState(false)

  const hasCrop = Boolean(candidate.cropImageUrl?.trim())
  const hasContext = Boolean(candidate.contextImageUrl?.trim())
  const hasAnyImage = hasCrop || hasContext

  const imageUrl =
    activeView === 'crop'
      ? (candidate.cropImageUrl || candidate.contextImageUrl || '')
      : (candidate.contextImageUrl || candidate.cropImageUrl || '')

  const badgeLabel =
    activeView === 'crop'
      ? t('reviewer.badge_crop', 'Ảnh chi tiết')
      : t('reviewer.badge_context', 'Ảnh toàn cảnh')

  const handleDeclineClick = () => {
    if (onOpenDecline) {
      onOpenDecline()
    } else {
      onDecision('reject')
    }
  }

  // Confidence calculation
  const confidencePercent = Math.round(candidate.confidence * 100)

  return (
    <>
      <div
        className={`rounded-2xl border shadow-xs overflow-hidden transition-colors ${
          isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-gray-200'
        }`}
      >
        {/* Candidate Top Meta Bar */}
        <div
          className={`px-5 sm:px-6 py-3 border-b flex items-center justify-between flex-wrap gap-2 ${
            isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-100 bg-gray-50/70'
          }`}
        >
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
            <span>{t('reviewer.trip_ref', 'Chuyến khảo sát')}:</span>
            <strong className="text-gray-900 dark:text-white font-bold font-mono">
              {candidate.sourceTripId}
            </strong>
          </div>

          <div className="flex items-center gap-2">
            {onOpenGuide && (
              <button
                type="button"
                onClick={onOpenGuide}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isDark
                    ? 'border-white/10 hover:bg-white/10 text-gray-300'
                    : 'border-gray-200 hover:bg-gray-100 text-gray-700 shadow-xs'
                }`}
                title="Hướng dẫn & Phím tắt"
              >
                <Keyboard size={14} weight="bold" />
                <span>{t('reviewer.btn_guide', 'Hướng dẫn')}</span>
              </button>
            )}

            {canUndo && onUndo && (
              <button
                type="button"
                onClick={onUndo}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isDark
                    ? 'border-white/10 hover:bg-white/10 text-gray-300'
                    : 'border-gray-200 hover:bg-gray-100 text-gray-700 shadow-xs'
                }`}
                title="Hoàn tác"
              >
                <ArrowUUpLeft size={14} weight="bold" />
                <span>{t('reviewer.btn_undo', 'Hoàn tác')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Candidate Content 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-5 sm:p-7 items-start">
          {/* Left: Media & Compact Map */}
          <div className="lg:col-span-7 space-y-4">
            {hasAnyImage && imageUrl && (
              <div
                onClick={() => setIsZoomed(true)}
                className={`relative h-[290px] sm:h-[320px] rounded-2xl overflow-hidden border flex items-center justify-center cursor-zoom-in group ${
                  isDark ? 'bg-black/60 border-white/10' : 'bg-gray-100 border-gray-200'
                }`}
              >
                <img
                  src={imageUrl}
                  alt={candidate.suggestedName}
                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                />

                {/* Floating View Switcher Inside Image Container */}
                {hasCrop && hasContext ? (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className={`absolute top-3 left-3 p-1 rounded-xl backdrop-blur-md border shadow-lg flex items-center gap-1 z-10 transition-colors ${
                      isDark
                        ? 'bg-[#071317]/90 border-white/20'
                        : 'bg-white/95 border-gray-200 shadow-gray-900/10'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onViewChange('crop')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeView === 'crop'
                          ? isDark
                            ? 'bg-[#00c4de] text-black shadow-xs'
                            : 'bg-[#007b8b] text-white shadow-xs'
                          : isDark
                            ? 'text-gray-300 hover:text-white hover:bg-white/10'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {t('reviewer.btn_view_crop', 'Ảnh chi tiết')}
                    </button>
                    <button
                      type="button"
                      onClick={() => onViewChange('context')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeView === 'context'
                          ? isDark
                            ? 'bg-[#00c4de] text-black shadow-xs'
                            : 'bg-[#007b8b] text-white shadow-xs'
                          : isDark
                            ? 'text-gray-300 hover:text-white hover:bg-white/10'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {t('reviewer.btn_view_context', 'Ảnh toàn cảnh')}
                    </button>
                  </div>
                ) : (
                  <div
                    className={`absolute top-3 left-3 px-3 py-1.5 rounded-xl backdrop-blur-md text-xs font-mono flex items-center gap-2 border shadow-md transition-colors ${
                      isDark
                        ? 'bg-[#071317]/90 text-white border-white/20'
                        : 'bg-white/95 text-gray-800 border-gray-200'
                    }`}
                  >
                    <Eye size={14} className={isDark ? 'text-[#00c4de]' : 'text-[#007b8b]'} />
                    <span>{badgeLabel}</span>
                  </div>
                )}

                <div
                  className={`absolute bottom-3 right-3 px-2.5 py-1.5 rounded-xl backdrop-blur-md text-xs font-mono flex items-center gap-1.5 border opacity-0 group-hover:opacity-100 transition-all shadow-md ${
                    isDark
                      ? 'bg-[#071317]/90 text-white border-white/20'
                      : 'bg-white/95 text-gray-800 border-gray-200'
                  }`}
                >
                  <MagnifyingGlassPlus size={15} />
                  <span>{t('reviewer.zoom_in', 'Phóng to')}</span>
                </div>
              </div>
            )}

            {/* Compact Map */}
            <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10">
              <ReviewerMiniMap
                lat={candidate.lat}
                lng={candidate.lng}
                signCode={candidate.code}
                signName={candidate.suggestedName}
                heightClassName="h-[210px] sm:h-[230px]"
              />
            </div>
          </div>

          {/* Right: AI Prediction & Decision Controls */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            {/* AI Prediction Card */}
            <div
              className={`p-5 sm:p-6 rounded-2xl border space-y-4 ${
                isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50/70 border-gray-200'
              }`}
            >
              {/* Header with Theme-aligned AI Indicator & Confidence Progress */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-200/60 dark:border-white/10">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#007b8b]/10 dark:bg-[#00c4de]/10 text-[#007b8b] dark:text-[#00c4de] text-xs font-bold tracking-wide">
                  <Sparkle size={14} weight="fill" />
                  <span>{t('reviewer.ai_prediction', 'AI DỰ ĐOÁN')}</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-[#007b8b] dark:bg-[#00c4de] transition-all duration-300 rounded-full"
                      style={{ width: `${confidencePercent}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300">
                    {confidencePercent}%
                  </span>
                </div>
              </div>

              {/* Sign Code & Standard */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg text-sm font-mono font-black bg-gray-900 text-white dark:bg-white dark:text-gray-950 shadow-2xs">
                    {candidate.code}
                  </span>
                  <span className="text-[11px] font-mono font-medium text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-md border border-gray-200 dark:border-white/10">
                    QCVN 41:2019
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white leading-snug">
                  {candidate.suggestedName}
                </h3>
              </div>

              {/* Location Info */}
              <div className="p-3 rounded-xl bg-white dark:bg-white/[0.03] border border-gray-200/70 dark:border-white/10 space-y-1.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5 shrink-0">
                    <MapPin size={13} className="text-[#007b8b] dark:text-[#00c4de]" />
                    <span>{t('reviewer.lbl_road', 'Tuyến đường')}</span>
                  </span>
                  <span className="font-bold text-gray-900 dark:text-gray-100 truncate text-right">
                    {candidate.roadName}
                  </span>
                </div>
                <div className="flex items-center justify-between font-mono text-[11px] pt-1.5 border-t border-gray-100 dark:border-white/5">
                  <span className="text-gray-400">{t('reviewer.lbl_coords', 'Tọa độ GPS')}</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {candidate.lat.toFixed(5)}, {candidate.lng.toFixed(5)}
                  </span>
                </div>
              </div>

              {/* Quick Correction Chips */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-600 dark:text-gray-400">
                    {t('reviewer.quick_suggest_title', 'Sửa nhanh mã hiệu:')}
                  </span>
                  {onOpenCatalog && (
                    <button
                      type="button"
                      onClick={onOpenCatalog}
                      className="text-xs font-bold text-[#007b8b] dark:text-[#00c4de] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <BookOpen size={13} />
                      <span>{t('reviewer.catalog_cat_all', 'Tất cả')}</span>
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_SUGGEST_SIGNS.filter((s) => s.code !== candidate.code).map((s) => (
                    <button
                      key={s.code}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => onQuickCorrect?.(s.code)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                        isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                      } ${
                        isDark
                          ? 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-200 hover:text-white'
                          : 'bg-white hover:bg-gray-100 border-gray-200 text-gray-800 shadow-2xs hover:border-gray-300'
                      }`}
                      title={s.nameVi}
                    >
                      {s.code}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Core Action Buttons */}
            <div className="space-y-2.5">
              {/* Primary Actions: Approve & Decline */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => onDecision('approve')}
                  className={`py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] shadow-xs ${
                    isSubmitting ? 'opacity-80 cursor-not-allowed' : ''
                  } ${
                    isDark
                      ? 'bg-[#00c4de] hover:bg-[#00b2ca] text-gray-950 font-extrabold'
                      : 'bg-[#007b8b] hover:bg-[#006876] text-white'
                  }`}
                >
                  {isSubmitting && submittingAction === 'approve' ? (
                    <CircleNotch size={18} className="animate-spin" />
                  ) : (
                    <CheckCircle size={18} weight="bold" />
                  )}
                  <span>
                    {isSubmitting && submittingAction === 'approve'
                      ? t('reviewer.btn_approving', 'Đang duyệt...')
                      : t('reviewer.btn_approve', 'Duyệt')}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleDeclineClick}
                  className={`py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer border active:scale-[0.98] shadow-xs ${
                    isSubmitting ? 'opacity-80 cursor-not-allowed' : ''
                  } ${
                    isDark
                      ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-300'
                      : 'bg-red-50 hover:bg-red-100 border-red-200 text-red-700'
                  }`}
                >
                  {isSubmitting && submittingAction === 'reject' ? (
                    <CircleNotch size={18} className="animate-spin" />
                  ) : (
                    <XCircle size={18} weight="bold" />
                  )}
                  <span>
                    {isSubmitting && submittingAction === 'reject'
                      ? t('reviewer.btn_declining', 'Đang từ chối...')
                      : t('reviewer.btn_reject', 'Từ chối')}
                  </span>
                </button>
              </div>

              {/* Secondary Actions: Skip & Report */}
              <div className="grid grid-cols-2 gap-2.5">
                {onSkip && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={onSkip}
                    className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-[0.98] ${
                      isSubmitting ? 'opacity-80 cursor-not-allowed' : ''
                    } ${
                      isDark
                        ? 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300'
                        : 'bg-white hover:bg-gray-100 border-gray-200 text-gray-700'
                    }`}
                  >
                    {isSubmitting && submittingAction === 'skip' ? (
                      <CircleNotch size={15} className="animate-spin" />
                    ) : (
                      <ArrowBendUpRight size={15} weight="bold" />
                    )}
                    <span>{t('reviewer.btn_skip', 'Bỏ qua')}</span>
                  </button>
                )}

                {onOpenFlag && (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={onOpenFlag}
                    className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-[0.98] ${
                      isSubmitting ? 'opacity-80 cursor-not-allowed' : ''
                    } ${
                      isDark
                        ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300'
                        : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900'
                    }`}
                  >
                    {isSubmitting && submittingAction === 'flag' ? (
                      <CircleNotch size={15} className="animate-spin" />
                    ) : (
                      <Flag size={15} weight="bold" />
                    )}
                    <span>
                      {isSubmitting && submittingAction === 'flag'
                        ? t('reviewer.btn_flagging', 'Đang báo lỗi...')
                        : t('reviewer.btn_flag', 'Báo lỗi')}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Zoom Modal */}
      <Modal isOpen={isZoomed && Boolean(imageUrl)} onClose={() => setIsZoomed(false)} maxWidth="max-w-4xl" topSpacing="py-6 sm:py-8">
        <div className={`p-4 sm:p-5 rounded-2xl border shadow-2xl ${isDark ? 'bg-[#071317] border-white/15' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-white/10 mb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-red-100 dark:bg-red-500/20 text-red-950 dark:text-red-300 border border-red-300 dark:border-red-500/30">
                {candidate.code}
              </span>
              <h4 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                {candidate.suggestedName}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setIsZoomed(false)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${isDark
                  ? 'border-white/10 hover:bg-white/10 text-gray-300 hover:text-white'
                  : 'border-gray-200 hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
              title={t('reviewer.close_esc', 'Đóng')}
            >
              <X size={18} weight="bold" />
            </button>
          </div>
          <div className="max-h-[75vh] overflow-hidden flex items-center justify-center rounded-xl bg-black/5 dark:bg-black/40">
            <img src={imageUrl} alt={candidate.suggestedName} className="max-h-[75vh] w-auto object-contain rounded-lg" />
          </div>
        </div>
      </Modal>
    </>
  )
}

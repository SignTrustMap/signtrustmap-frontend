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
      ? t('reviewer.badge_crop', 'Ảnh cắt từ YOLO12')
      : t('reviewer.badge_context', 'Toàn cảnh Dashcam')

  const handleDeclineClick = () => {
    if (onOpenDecline) {
      onOpenDecline()
    } else {
      onDecision('reject')
    }
  }

  // Confidence styling
  const confidencePercent = Math.round(candidate.confidence * 100)
  const isHighConfidence = candidate.confidence >= 0.85
  const isMediumConfidence = candidate.confidence >= 0.65 && candidate.confidence < 0.85
  const confidenceColor = isHighConfidence
    ? 'text-emerald-500'
    : isMediumConfidence
      ? 'text-amber-500'
      : 'text-rose-500'
  const confidenceProgressBg = isHighConfidence
    ? 'bg-emerald-500'
    : isMediumConfidence
      ? 'bg-amber-500'
      : 'bg-rose-500'

  return (
    <>
      <div
        className={`rounded-2xl border shadow-sm overflow-hidden transition-colors ${isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-gray-200'
          }`}
      >
        {/* Candidate Top Meta Bar */}
        <div
          className={`px-5 sm:px-6 py-3 border-b flex items-center justify-between flex-wrap gap-2 ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-100 bg-gray-50/70'
            }`}
        >
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
            <span>{t('reviewer.trip_ref', 'Chuyến khảo sát')}:</span>
            <strong className="text-gray-900 dark:text-white font-bold font-mono">
              {candidate.sourceTripId}
            </strong>
          </div>

          {canUndo && onUndo && (
            <button
              type="button"
              onClick={onUndo}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${isDark
                  ? 'border-white/10 hover:bg-white/10 text-gray-300'
                  : 'border-gray-200 hover:bg-gray-100 text-gray-700 shadow-xs'
                }`}
              title="Ctrl+Z"
            >
              <ArrowUUpLeft size={14} weight="bold" />
              <span>{t('reviewer.btn_undo', 'Hoàn tác')}</span>
              <kbd className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-[9px] font-mono">
                Ctrl+Z
              </kbd>
            </button>
          )}
        </div>

        {/* Candidate Content 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-5 sm:p-7 items-start">
          {/* Left: Media & Compact Map */}
          <div className="lg:col-span-7 space-y-4">
            {hasAnyImage && imageUrl && (
              <>
                {/* View Mode Switcher */}
                {hasCrop && hasContext && (
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`inline-flex rounded-xl p-1 border text-xs sm:text-sm ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'
                        }`}
                    >
                      <button
                        type="button"
                        onClick={() => onViewChange('crop')}
                        className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer font-bold ${activeView === 'crop'
                            ? isDark
                              ? 'bg-[#00c4de] text-black shadow-xs'
                              : 'bg-[#007b8b] text-white shadow-xs'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                          }`}
                      >
                        {t('reviewer.btn_view_crop', 'Ảnh phóng to (Crop)')}
                      </button>
                      <button
                        type="button"
                        onClick={() => onViewChange('context')}
                        className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer font-bold ${activeView === 'context'
                            ? isDark
                              ? 'bg-[#00c4de] text-black shadow-xs'
                              : 'bg-[#007b8b] text-white shadow-xs'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                          }`}
                      >
                        {t('reviewer.btn_view_context', 'Toàn cảnh Dashcam')}
                      </button>
                    </div>

                    <span className="text-xs text-gray-500 font-mono hidden sm:inline">
                      {t('reviewer.click_to_zoom', 'Nhấp để phóng to')}
                    </span>
                  </div>
                )}

                {/* Main Image Container */}
                <div
                  onClick={() => setIsZoomed(true)}
                  className={`relative h-[280px] sm:h-[310px] rounded-2xl overflow-hidden border flex items-center justify-center cursor-zoom-in group ${isDark ? 'bg-black/60 border-white/10' : 'bg-gray-100 border-gray-200'
                    }`}
                >
                  <img
                    src={imageUrl}
                    alt={candidate.suggestedName}
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />

                  <div className="absolute top-3 left-3 px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-md text-white text-xs font-mono flex items-center gap-2 border border-white/20 shadow-md">
                    <Eye size={14} className="text-cyan-400" />
                    <span>{badgeLabel}</span>
                  </div>

                  <div className="absolute bottom-3 right-3 px-2.5 py-1.5 rounded-xl bg-black/75 backdrop-blur-md text-white text-xs font-mono flex items-center gap-1.5 border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                    <MagnifyingGlassPlus size={15} />
                    <span>{t('reviewer.zoom_in', 'Phóng to')}</span>
                  </div>
                </div>
              </>
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
              className={`p-5 sm:p-6 rounded-2xl border space-y-4 ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50/80 border-gray-200'
                }`}
            >
              {/* Header with Confidence Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                    <Sparkle size={15} className="text-amber-500" weight="fill" />
                    <span>{t('reviewer.ai_prediction', 'AI DỰ ĐOÁN')}</span>
                  </span>

                  <span className={`text-xs sm:text-sm font-mono font-black ${confidenceColor}`}>
                    {confidencePercent}% {t('reviewer.confidence', 'Độ chính xác AI')}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                  <div
                    className={`h-full ${confidenceProgressBg} transition-all duration-300 rounded-full`}
                    style={{ width: `${confidencePercent}%` }}
                  />
                </div>
              </div>

              {/* Sign Code & Standard */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl text-base font-mono font-black bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-500/30">
                    {candidate.code}
                  </span>
                  <span className="text-xs font-mono font-semibold text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-lg border border-gray-200 dark:border-white/10">
                    QCVN 41:2019
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white leading-snug">
                  {candidate.suggestedName}
                </h3>
              </div>

              {/* Location Info */}
              <div className="pt-3 border-t border-gray-200/60 dark:border-white/10 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-500 flex items-center gap-1 shrink-0">
                    <MapPin size={13} className="text-[#007b8b] dark:text-[#00c4de]" />
                    {t('reviewer.lbl_road', 'Tuyến đường')}
                  </span>
                  <span className="font-bold text-gray-900 dark:text-gray-100 truncate text-right">
                    {candidate.roadName}
                  </span>
                </div>
                <div className="flex items-center justify-between font-mono">
                  <span className="text-gray-500">{t('reviewer.lbl_coords', 'Tọa độ GPS')}</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {candidate.lat.toFixed(5)}, {candidate.lng.toFixed(5)}
                  </span>
                </div>
              </div>

              {/* Quick Correction Chips (When AI confidence is questionable or reviewer wants 1-click fix) */}
              <div className="pt-3 border-t border-gray-200/60 dark:border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-600 dark:text-gray-400">
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
                      onClick={() => onQuickCorrect?.(s.code)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${isDark
                          ? 'bg-white/5 hover:bg-white/10 border-white/10 text-cyan-300'
                          : 'bg-white hover:bg-cyan-50 border-gray-200 text-cyan-800 shadow-xs'
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
                  onClick={() => onDecision('approve')}
                  className="py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <CheckCircle size={19} weight="bold" />
                  <span>{t('reviewer.btn_approve', 'Duyệt (Chính xác)')}</span>
                  <kbd className="px-2 py-0.5 rounded bg-black/20 text-xs font-mono">1/A</kbd>
                </button>

                <button
                  type="button"
                  onClick={handleDeclineClick}
                  className="py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-rose-600/20 transition-all cursor-pointer"
                >
                  <XCircle size={19} weight="bold" />
                  <span>{t('reviewer.btn_reject', 'Từ chối (Sai biển)')}</span>
                  <kbd className="px-2 py-0.5 rounded bg-black/20 text-xs font-mono">2/R</kbd>
                </button>
              </div>

              {/* Secondary Actions: Skip & Report */}
              <div className="grid grid-cols-2 gap-2.5">
                {onSkip && (
                  <button
                    type="button"
                    onClick={onSkip}
                    className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-[0.98] ${isDark
                        ? 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300'
                        : 'bg-white hover:bg-gray-100 border-gray-200 text-gray-700'
                      }`}
                  >
                    <ArrowBendUpRight size={15} weight="bold" />
                    <span>{t('reviewer.btn_skip', 'Bỏ qua')}</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-[10px] font-mono">
                      4
                    </kbd>
                  </button>
                )}

                {onOpenFlag && (
                  <button
                    type="button"
                    onClick={onOpenFlag}
                    className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-[0.98] ${isDark
                        ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300'
                        : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900'
                      }`}
                  >
                    <Flag size={15} weight="bold" />
                    <span>{t('reviewer.btn_flag', 'Báo lỗi / Gắn cờ')}</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-amber-200 dark:bg-black/20 text-[10px] font-mono">
                      F
                    </kbd>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Hotkey Guide Bar */}
        <div
          className={`px-6 py-2.5 border-t text-center text-xs font-mono text-gray-500 ${isDark ? 'border-white/10 bg-white/[0.01]' : 'border-gray-100 bg-gray-50/50'
            }`}
        >
          <span>{t('reviewer.hotkey_summary_tip', 'Phím tắt: 1 / A (Duyệt) • 2 / R (Từ chối) • 4 (Bỏ qua) • F (Báo cờ) • Ctrl+Z (Hoàn tác)')}</span>
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
              title={t('reviewer.close_esc', 'Đóng (Esc)')}
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

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Eye,
  MapPin,
  Sparkle,
  CheckCircle,
  XCircle,
  PencilSimple,
  Flag,
  ArrowLeft,
  ArrowRight,
  ArrowUUpLeft,
  MagnifyingGlassPlus,
  X,
} from '@phosphor-icons/react'
import { ReviewerMiniMap } from './ReviewerMiniMap'
import { Modal } from '@/components/common/Modal'
import type { CandidateToReview } from '@/data'

interface CandidateWorkspaceCardProps {
  candidate: CandidateToReview
  currentIndex: number
  totalCandidates: number
  activeView: 'crop' | 'context'
  isDark: boolean
  onViewChange: (view: 'crop' | 'context') => void
  onDecision: (action: 'approve' | 'reject') => void
  onOpenDecline?: () => void
  onSkip?: () => void
  onOpenCatalog: () => void
  onOpenFlag: () => void
  onUndo?: () => void
  canUndo?: boolean
  onPrev: () => void
  onNext: () => void
  canPrev: boolean
  canNext: boolean
}

export function CandidateWorkspaceCard({
  candidate,
  currentIndex,
  totalCandidates,
  activeView,
  isDark,
  onViewChange,
  onDecision,
  onOpenDecline,
  onSkip,
  onOpenCatalog,
  onOpenFlag,
  onUndo,
  canUndo,
  onPrev,
  onNext,
  canPrev,
  canNext,
}: CandidateWorkspaceCardProps) {
  const { t } = useTranslation('common')
  const [isZoomed, setIsZoomed] = useState(false)

  const badgeLabel = activeView === 'crop' ? t('reviewer.badge_crop') : t('reviewer.badge_context')
  const imageUrl = activeView === 'crop' ? candidate.cropImageUrl : candidate.contextImageUrl

  const handleDeclineClick = () => {
    if (onOpenDecline) {
      onOpenDecline()
    } else {
      onDecision('reject')
    }
  }

  return (
    <>
      <div
        className={`rounded-2xl border shadow-sm overflow-hidden ${
          isDark ? 'bg-black/30 border-white/10' : 'bg-white border-gray-200'
        }`}
      >
        {/* Candidate Top Meta Bar */}
        <div
          className={`px-6 py-3.5 border-b flex items-center justify-between flex-wrap gap-3 ${
            isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-100 bg-gray-50/70'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-xl text-xs sm:text-sm font-mono font-bold bg-[#007b8b]/15 dark:bg-[#00c4de]/15 text-[#007b8b] dark:text-[#00c4de] border border-[#007b8b]/30 dark:border-[#00c4de]/30">
              {candidate.id}
            </span>
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
              {t('reviewer.trip_ref')}:{' '}
              <strong className="text-gray-900 dark:text-white font-bold">
                {candidate.sourceTripId}
              </strong>{' '}
              (YOLO Track #{candidate.yoloTrackId})
            </span>
          </div>

          <div className="flex items-center gap-3">
            {canUndo && onUndo && (
              <button
                type="button"
                onClick={onUndo}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isDark
                    ? 'border-white/10 hover:bg-white/10 text-gray-300'
                    : 'border-gray-200 hover:bg-gray-100 text-gray-700'
                }`}
                title="Ctrl+Z"
              >
                <ArrowUUpLeft size={14} weight="bold" />
                <span>{t('reviewer.btn_undo', 'Hoàn tác')}</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-mono font-bold">
              <span className="text-gray-600 dark:text-gray-400">{t('reviewer.candidate_counter')}</span>
              <span className="text-[#007b8b] dark:text-[#00c4de] font-black">{currentIndex + 1}</span>
              <span className="text-gray-500">/ {totalCandidates}</span>
            </div>
          </div>
        </div>

        {/* Candidate Content 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-5 sm:p-8 items-start">
          {/* Left: Media & MiniMap */}
          <div className="lg:col-span-7 space-y-4">
            {/* View Mode Switcher */}
            <div className="flex items-center justify-between">
              <div
                className={`inline-flex rounded-xl p-1 border text-xs sm:text-sm ${
                  isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onViewChange('crop')}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeView === 'crop'
                      ? isDark
                        ? 'bg-[#00c4de] text-black shadow-xs font-bold'
                        : 'bg-[#007b8b] text-white shadow-xs font-bold'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {t('reviewer.btn_view_crop')}
                </button>
                <button
                  type="button"
                  onClick={() => onViewChange('context')}
                  className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeView === 'context'
                      ? isDark
                        ? 'bg-[#00c4de] text-black shadow-xs font-bold'
                        : 'bg-[#007b8b] text-white shadow-xs font-bold'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {t('reviewer.btn_view_context')}
                </button>
              </div>

              <span className="text-xs sm:text-sm font-mono text-gray-600 dark:text-gray-400 font-medium">
                {t('reviewer.est_distance')}:{' '}
                <strong className="text-[#007b8b] dark:text-cyan-400 font-bold">
                  {candidate.estimatedDistanceMeters}m
                </strong>
              </span>
            </div>

            {/* Image Viewer with Zoom Trigger */}
            <div
              onClick={() => setIsZoomed(true)}
              className={`relative h-[280px] sm:h-[320px] rounded-2xl overflow-hidden border flex items-center justify-center cursor-zoom-in group ${
                isDark ? 'bg-black/60 border-white/10' : 'bg-gray-100 border-gray-200'
              }`}
            >
              <img
                src={imageUrl}
                alt={candidate.suggestedName}
                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
              />

              <div className="absolute top-3 left-3 px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-md text-white text-xs font-mono flex items-center gap-2 border border-white/20">
                <Eye size={15} className="text-cyan-400" />
                <span>{badgeLabel}</span>
              </div>

              <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-white text-xs font-mono flex items-center gap-1.5 border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
                <MagnifyingGlassPlus size={14} />
                <span>Phóng to</span>
              </div>
            </div>

            {/* Integrated Mini-Map */}
            <ReviewerMiniMap
              lat={candidate.lat}
              lng={candidate.lng}
              heading={candidate.directionHeading}
              roadName={candidate.roadName}
              signCode={candidate.code}
              trafficFlowDirection={candidate.trafficFlowDirection}
            />
          </div>

          {/* Right: AI Prediction & Decision Form */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
            <div
              className={`p-5 sm:p-6 rounded-2xl border space-y-4 ${
                isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50/80 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                  <Sparkle size={15} className="text-amber-500" weight="bold" />
                  <span>{t('reviewer.ai_prediction')}</span>
                </span>

                <div className="flex items-center gap-1.5">
                  {candidate.confidence < 0.75 && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40">
                      {t('reviewer.uncertainty_badge')}
                    </span>
                  )}
                  <span
                    className={`text-xs sm:text-sm font-mono font-black ${
                      candidate.confidence >= 0.85
                        ? 'text-emerald-500'
                        : candidate.confidence >= 0.7
                        ? 'text-amber-500'
                        : 'text-rose-500'
                    }`}
                  >
                    {Math.round(candidate.confidence * 100)}% {t('reviewer.confidence')}
                  </span>
                </div>
              </div>

              {/* Sign Code & Name */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-0.5 rounded-lg text-sm font-mono font-extrabold bg-red-100 dark:bg-red-500/20 text-red-950 dark:text-red-300 border border-red-300 dark:border-red-500/30">
                    {candidate.code}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">QCVN 41:2019</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white leading-snug">
                  {candidate.suggestedName}
                </h3>
              </div>

              {/* Location info */}
              <div className="pt-2 border-t border-gray-100 dark:border-white/10 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-1">
                    <MapPin size={13} className="text-[#007b8b] dark:text-[#00c4de]" />
                    {t('reviewer.lbl_road')}
                  </span>
                  <span className="font-bold text-gray-900 dark:text-gray-100 truncate max-w-48 text-right">
                    {candidate.roadName}
                  </span>
                </div>
                <div className="flex items-center justify-between font-mono">
                  <span className="text-gray-500">{t('reviewer.lbl_coords')}</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {candidate.lat.toFixed(5)}, {candidate.lng.toFixed(5)}
                  </span>
                </div>
              </div>
            </div>

            {/* Core Action Buttons (Mobile Parity: Approve, Decline, Skip, Report, Correct) */}
            <div className="space-y-3">
              {/* Top Row: Approve vs Decline */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onDecision('approve')}
                  className="py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
                >
                  <CheckCircle size={19} weight="bold" />
                  <span>{t('reviewer.btn_approve')}</span>
                  <kbd className="px-2 py-0.5 rounded bg-black/20 text-xs font-mono">1/A</kbd>
                </button>

                <button
                  type="button"
                  onClick={handleDeclineClick}
                  className="py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-rose-600/20 active:scale-95 transition-all cursor-pointer"
                >
                  <XCircle size={19} weight="bold" />
                  <span>{t('reviewer.btn_reject')}</span>
                  <kbd className="px-2 py-0.5 rounded bg-black/20 text-xs font-mono">2/R</kbd>
                </button>
              </div>

              {/* Bottom Row: Skip, Correct Catalog, Flag */}
              <div className="grid grid-cols-3 gap-2">
                {onSkip && (
                  <button
                    type="button"
                    onClick={onSkip}
                    className={`py-2.5 px-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                      isDark
                        ? 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300'
                        : 'bg-white hover:bg-gray-100 border-gray-200 text-gray-700'
                    }`}
                  >
                    <span className="font-mono text-sm">↷</span>
                    <span>{t('reviewer.btn_skip', 'Bỏ qua')}</span>
                    <kbd className="px-1 py-0.2 rounded bg-black/10 dark:bg-white/10 text-[9px] font-mono">4</kbd>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onOpenCatalog}
                  className={`py-2.5 px-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-200'
                      : 'bg-white hover:bg-gray-100 border-gray-200 text-gray-800'
                  }`}
                >
                  <PencilSimple size={15} className="text-[#007b8b] dark:text-cyan-400" weight="bold" />
                  <span>{t('reviewer.btn_correct')}</span>
                  <kbd className="px-1 py-0.2 rounded bg-gray-200 dark:bg-black/20 text-[9px] font-mono">3/C</kbd>
                </button>

                <button
                  type="button"
                  onClick={onOpenFlag}
                  className={`py-2.5 px-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                    isDark
                      ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300'
                      : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900'
                  }`}
                >
                  <Flag size={15} weight="bold" />
                  <span>{t('reviewer.btn_flag')}</span>
                  <kbd className="px-1 py-0.2 rounded bg-amber-200 dark:bg-black/20 text-[9px] font-mono">F</kbd>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Candidate Footer Navigation */}
        <div
          className={`px-6 sm:px-8 py-3.5 border-t flex items-center justify-between text-xs sm:text-sm ${
            isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-100 bg-gray-50/70'
          }`}
        >
          <button
            type="button"
            disabled={!canPrev}
            onClick={onPrev}
            className={`px-4 py-2 rounded-xl border font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isDark
                ? 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300'
                : 'bg-white hover:bg-gray-100 border-gray-200 text-gray-700 shadow-xs'
            }`}
          >
            <ArrowLeft size={16} />
            <span>{t('reviewer.btn_prev')}</span>
          </button>

          <span className="text-xs font-mono text-gray-600 dark:text-gray-400 font-medium hidden sm:inline">
            {t('reviewer.hotkey_tip')}
          </span>

          <button
            type="button"
            disabled={!canNext}
            onClick={onNext}
            className={`px-4 py-2 rounded-xl border font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              isDark
                ? 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300'
                : 'bg-white hover:bg-gray-100 border-gray-200 text-gray-700 shadow-xs'
            }`}
          >
            <span>{t('reviewer.btn_next')}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Image Zoom Modal */}
      <Modal isOpen={isZoomed} onClose={() => setIsZoomed(false)} maxWidth="max-w-4xl" topSpacing="pt-10">
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-black border-white/10' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-white/10 mb-3">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
              {candidate.suggestedName} (#{candidate.code})
            </h4>
            <button
              type="button"
              onClick={() => setIsZoomed(false)}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-400 hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
          <div className="max-h-[75vh] overflow-hidden flex items-center justify-center">
            <img src={imageUrl} alt={candidate.suggestedName} className="max-h-[75vh] w-auto object-contain" />
          </div>
        </div>
      </Modal>
    </>
  )
}

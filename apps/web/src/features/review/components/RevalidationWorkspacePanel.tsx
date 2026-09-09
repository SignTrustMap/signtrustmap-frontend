import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CheckCircle,
  ClockCounterClockwise,
  Trash,
  Question,
  Prohibit,
  MapPin,
  Eye,
  CalendarCheck,
  ShieldCheck,
  WarningCircle,
  ArrowLeft,
  ArrowRight,
} from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import type { RevalidationCandidate } from '@/data'

interface RevalidationWorkspacePanelProps {
  candidate: RevalidationCandidate | null
  currentIndex: number
  totalCount: number
  onDecision: (action: 'confirm' | 'update' | 'retire' | 'unclear' | 'invalid') => void
  onPrev: () => void
  onNext: () => void
  canPrev: boolean
  canNext: boolean
}

export function RevalidationWorkspacePanel({
  candidate,
  currentIndex,
  totalCount,
  onDecision,
  onPrev,
  onNext,
  canPrev,
  canNext,
}: RevalidationWorkspacePanelProps) {
  const { t } = useTranslation('common')
  const { isDark } = useTheme()

  const [histView, setHistView] = useState<'crop' | 'context'>('crop')
  const [newView, setNewView] = useState<'crop' | 'context'>('crop')

  const getViewBadgeLabel = (view: 'crop' | 'context') => {
    if (view === 'crop') {
      return t('reviewer.badge_crop')
    }
    return t('reviewer.badge_context')
  }

  const getHistoricalImageUrl = (view: 'crop' | 'context') => {
    if (!candidate) return ''
    if (view === 'crop') {
      return candidate.historicalRecord.cropImageUrl
    }
    return candidate.historicalRecord.contextImageUrl
  }

  const getNewSurveyImageUrl = (view: 'crop' | 'context') => {
    if (!candidate) return ''
    if (view === 'crop') {
      return candidate.newSurveyRecord.cropImageUrl
    }
    return candidate.newSurveyRecord.contextImageUrl
  }

  const handleAction = useCallback(
    (action: 'confirm' | 'update' | 'retire' | 'unclear' | 'invalid') => {
      onDecision(action)
    },
    [onDecision]
  )

  // Hotkey listener for Revalidation
  useEffect(() => {
    if (!candidate) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.key === 'c' || e.key === 'C') {
        handleAction('confirm')
      } else if (e.key === 'u' || e.key === 'U') {
        handleAction('update')
      } else if (e.key === 'd' || e.key === 'D') {
        handleAction('retire')
      } else if (e.key === '?' || e.key === '/') {
        handleAction('unclear')
      } else if (e.key === 'x' || e.key === 'X') {
        handleAction('invalid')
      } else if (e.key === 'ArrowLeft' && canPrev) {
        onPrev()
      } else if (e.key === 'ArrowRight' && canNext) {
        onNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [candidate, handleAction, onPrev, onNext, canPrev, canNext])

  if (!candidate) {
    return (
      <div className="text-center py-20">
        <CheckCircle size={56} className="text-emerald-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold">{t('reviewer.reval_queue_clear_title')}</h2>
        <p className="text-sm text-gray-400 mt-2">{t('reviewer.reval_queue_clear_desc')}</p>
      </div>
    )
  }

  return (
    <div
      className={`rounded-[28px] border shadow-2xl overflow-hidden transition-colors ${
        isDark ? 'bg-[#061417]/95 border-white/10' : 'bg-white border-gray-200'
      }`}
    >
      {/* Top Meta Bar */}
      <div
        className={`px-6 sm:px-8 py-5 border-b flex items-center justify-between flex-wrap gap-3 ${
          isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-100 bg-gray-50/50'
        }`}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-mono font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
            {candidate.id}
          </span>
          <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-[#007b8b]/15 dark:bg-[#00c4de]/15 text-[#007b8b] dark:text-[#00c4de] border border-[#007b8b]/30 dark:border-[#00c4de]/30">
            {candidate.code}
          </span>
          <span className="text-sm font-extrabold text-gray-900 dark:text-white">{candidate.name}</span>
          <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1 font-medium">
            <MapPin size={14} className="text-red-500" weight="fill" />
            <span className="truncate max-w-[240px] text-gray-800 dark:text-gray-200">{candidate.roadName}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs sm:text-sm font-mono font-bold">
          <span className="text-gray-600 dark:text-gray-400">{t('reviewer.candidate_counter')}</span>
          <span className="text-purple-600 dark:text-purple-400">{currentIndex + 1}</span>
          <span className="text-gray-500">/ {totalCount}</span>
        </div>
      </div>

      {/* Side-by-Side Photo Comparison */}
      <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Historical Verified Record */}
        <div
          className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
            isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50/70 border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <CalendarCheck size={14} />
                <span>{t('reviewer.reval_hist_label')}</span>
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400 font-mono font-semibold">
                {candidate.historicalRecord.verifiedDate}
              </span>
            </div>

            <div className={`flex rounded-xl p-1 border text-xs font-semibold ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-200 border-gray-300'}`}>
              <button
                type="button"
                onClick={() => setHistView('crop')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  histView === 'crop'
                    ? isDark ? 'bg-emerald-500 text-black font-bold' : 'bg-emerald-600 text-white font-bold'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {t('reviewer.btn_view_crop')}
              </button>
              <button
                type="button"
                onClick={() => setHistView('context')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  histView === 'context'
                    ? isDark ? 'bg-emerald-500 text-black font-bold' : 'bg-emerald-600 text-white font-bold'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {t('reviewer.btn_view_context')}
              </button>
            </div>
          </div>

          <div
            className={`relative h-[240px] sm:h-[280px] rounded-xl overflow-hidden border flex items-center justify-center ${
              isDark ? 'bg-black/60 border-white/10' : 'bg-gray-100 border-gray-300'
            }`}
          >
            <img
              src={getHistoricalImageUrl(histView)}
              alt="Historical"
              className="w-full h-full object-contain"
            />
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/75 text-white text-[11px] font-mono flex items-center gap-1.5 border border-white/20">
              <Eye size={13} className="text-emerald-400" />
              <span>{getViewBadgeLabel(histView)}</span>
            </div>
          </div>

          <div className="text-xs space-y-1.5 pt-2.5 border-t border-gray-200 dark:border-white/10">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400 font-medium">
                <ShieldCheck size={14} className="text-emerald-500" weight="bold" />
                <span>{t('reviewer.reval_trust_label')}:</span>
              </span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                {candidate.historicalRecord.trustScore}%
              </strong>
            </div>
            <p className="text-[11px] text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
              {candidate.historicalRecord.condition}
            </p>
          </div>
        </div>

        {/* Right: New Survey Capture */}
        <div
          className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
            isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50/70 border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-cyan-500/15 text-[#007b8b] dark:text-[#00c4de] border border-[#007b8b]/30 dark:border-[#00c4de]/30 flex items-center gap-1.5">
                <ClockCounterClockwise size={14} />
                <span>{t('reviewer.reval_new_label')}</span>
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400 font-mono font-semibold">
                {candidate.newSurveyRecord.surveyDate} ({candidate.newSurveyRecord.tripId})
              </span>
            </div>

            <div className={`flex rounded-xl p-1 border text-xs font-semibold ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-200 border-gray-300'}`}>
              <button
                type="button"
                onClick={() => setNewView('crop')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  newView === 'crop'
                    ? isDark ? 'bg-[#00c4de] text-black font-bold' : 'bg-[#007b8b] text-white font-bold'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {t('reviewer.btn_view_crop')}
              </button>
              <button
                type="button"
                onClick={() => setNewView('context')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  newView === 'context'
                    ? isDark ? 'bg-[#00c4de] text-black font-bold' : 'bg-[#007b8b] text-white font-bold'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {t('reviewer.btn_view_context')}
              </button>
            </div>
          </div>

          <div
            className={`relative h-[240px] sm:h-[280px] rounded-xl overflow-hidden border flex items-center justify-center ${
              isDark ? 'bg-black/60 border-white/10' : 'bg-gray-100 border-gray-300'
            }`}
          >
            <img
              src={getNewSurveyImageUrl(newView)}
              alt="New Survey"
              className="w-full h-full object-contain"
            />
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/75 text-white text-[11px] font-mono flex items-center gap-1.5 border border-white/20">
              <Eye size={13} className="text-cyan-400" />
              <span>{getViewBadgeLabel(newView)}</span>
            </div>
          </div>

          <div className="text-xs space-y-1.5 pt-2.5 border-t border-gray-200 dark:border-white/10">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400 font-medium">
                <WarningCircle size={14} className="text-[#007b8b] dark:text-[#00c4de]" weight="bold" />
                <span>{t('reviewer.reval_surveyor_score')}:</span>
              </span>
              <strong className="text-[#007b8b] dark:text-[#00c4de] font-mono font-bold">
                {candidate.newSurveyRecord.surveyorTrustScore}%
              </strong>
            </div>
            <p className="text-[11px] text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
              {candidate.newSurveyRecord.observedChange}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons for Revalidation */}
      <div className="px-6 sm:px-8 pb-6 pt-2">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* Confirm */}
          <button
            type="button"
            onClick={() => handleAction('confirm')}
            className="py-3 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <CheckCircle size={16} />
            <span>{t('reviewer.btn_reval_confirm')}</span>
            <kbd className="px-1.5 py-0.5 rounded bg-black/20 text-[10px] font-mono">C</kbd>
          </button>

          {/* Update */}
          <button
            type="button"
            onClick={() => handleAction('update')}
            className="py-3 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <ClockCounterClockwise size={16} />
            <span>{t('reviewer.btn_reval_update')}</span>
            <kbd className="px-1.5 py-0.5 rounded bg-black/20 text-[10px] font-mono">U</kbd>
          </button>

          {/* Retire */}
          <button
            type="button"
            onClick={() => handleAction('retire')}
            className="py-3 px-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-red-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Trash size={16} />
            <span>{t('reviewer.btn_reval_retire')}</span>
            <kbd className="px-1.5 py-0.5 rounded bg-black/20 text-[10px] font-mono">D</kbd>
          </button>

          {/* Unclear */}
          <button
            type="button"
            onClick={() => handleAction('unclear')}
            className={`py-3 px-3 rounded-xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isDark
                ? 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300'
                : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-800'
            }`}
          >
            <Question size={16} className="text-cyan-400" />
            <span>{t('reviewer.btn_reval_unclear')}</span>
            <kbd className="px-1.5 py-0.5 rounded bg-black/20 text-[10px] font-mono">?</kbd>
          </button>

          {/* Invalid */}
          <button
            type="button"
            onClick={() => handleAction('invalid')}
            className={`py-3 px-3 rounded-xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer col-span-2 sm:col-span-1 ${
              isDark
                ? 'bg-white/5 hover:bg-white/10 border-white/10 text-rose-400'
                : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-rose-700'
            }`}
          >
            <Prohibit size={16} />
            <span>{t('reviewer.btn_reval_invalid')}</span>
            <kbd className="px-1.5 py-0.5 rounded bg-black/20 text-[10px] font-mono">X</kbd>
          </button>
        </div>
      </div>

      {/* Navigation Footer */}
      <div
        className={`px-6 sm:px-8 py-3.5 border-t flex items-center justify-between text-xs ${
          isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-100 bg-gray-50/50'
        }`}
      >
        <button
          type="button"
          disabled={!canPrev}
          onClick={onPrev}
          className="px-3.5 py-1.5 rounded-lg border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer font-semibold"
        >
          <ArrowLeft size={14} />
          <span>{t('reviewer.btn_prev')}</span>
        </button>

        <span className="text-gray-400 font-mono hidden sm:inline">
          {t('reviewer.reval_hotkey_tip')}
        </span>

        <button
          type="button"
          disabled={!canNext}
          onClick={onNext}
          className="px-3.5 py-1.5 rounded-lg border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer font-semibold"
        >
          <span>{t('reviewer.btn_next')}</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}

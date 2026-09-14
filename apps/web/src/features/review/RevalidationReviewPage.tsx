import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  CheckCircle,
  WarningCircle,
  ClockCounterClockwise,
  ArrowLeft,
  ArrowRight,
  Eye,
  Check,
  XCircle,
  ArrowClockwise,
  Question,
} from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { useTranslation } from 'react-i18next'
import { mockRevalidationCandidates, type RevalidationCandidate } from '@/data'

type ImageViewMode = 'crop' | 'context'

export function RevalidationReviewPage() {
  const { t } = useTranslation('common')
  const { isDark } = useTheme()
  const toast = useToast()

  const [candidates, setCandidates] = useState<RevalidationCandidate[]>(mockRevalidationCandidates)
  const [currentIndex, setCurrentIndex] = useState(0)

  const [histView, setHistView] = useState<ImageViewMode>('crop')
  const [newView, setNewView] = useState<ImageViewMode>('crop')

  const currentCandidate = candidates[currentIndex] || null

  const getViewBadgeLabel = (view: ImageViewMode) => {
    if (view === 'crop') {
      return t('reviewer.badge_crop')
    }
    return t('reviewer.badge_context')
  }

  const getHistoricalImageUrl = (view: ImageViewMode) => {
    if (!currentCandidate) return ''
    if (view === 'crop') {
      return currentCandidate.historicalRecord.cropImageUrl
    }
    return currentCandidate.historicalRecord.contextImageUrl
  }

  const getNewSurveyImageUrl = (view: ImageViewMode) => {
    if (!currentCandidate) return ''
    if (view === 'crop') {
      return currentCandidate.newSurveyRecord.cropImageUrl
    }
    return currentCandidate.newSurveyRecord.contextImageUrl
  }

  const getToggleTabClass = (active: boolean) => {
    if (active) {
      if (isDark) {
        return 'bg-[#00c4de] text-black font-black shadow-xs'
      }
      return 'bg-[#007b8b] text-white font-black shadow-xs'
    }
    return 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
  }

  const handleRevalDecision = useCallback(
    (action: 'confirm' | 'update' | 'retire' | 'unclear') => {
      if (!currentCandidate) return

      let newStatus: 'Confirmed' | 'Updated' | 'Retired' | 'Unclear' = 'Confirmed'
      if (action === 'update') {
        newStatus = 'Updated'
      } else if (action === 'retire') {
        newStatus = 'Retired'
      } else if (action === 'unclear') {
        newStatus = 'Unclear'
      }

      setCandidates((prev) =>
        prev.map((c) =>
          c.id === currentCandidate.id
            ? { ...c, status: newStatus }
            : c
        )
      )

      if (action === 'confirm') {
        toast.success(`${t('reviewer.toast_reval_confirm')} ${currentCandidate.code}`)
      } else if (action === 'update') {
        toast.info(`${t('reviewer.toast_reval_update')} ${currentCandidate.code}`)
      } else if (action === 'retire') {
        toast.warning(`${t('reviewer.toast_reval_retire')} ${currentCandidate.code}`)
      } else if (action === 'unclear') {
        toast.info(`${t('reviewer.toast_reval_unclear')} ${currentCandidate.code}`)
      }

      // Advance
      if (currentIndex < candidates.length - 1) {
        setCurrentIndex((i) => i + 1)
      }
    },
    [currentCandidate, currentIndex, candidates.length, toast, t]
  )

  // Hotkey listener (1: Confirm, 2: Update, 3: Retire, 4: Unclear)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      if (e.key === '1' || e.key === 'c' || e.key === 'C') {
        e.preventDefault()
        handleRevalDecision('confirm')
      } else if (e.key === '2' || e.key === 'u' || e.key === 'U') {
        e.preventDefault()
        handleRevalDecision('update')
      } else if (e.key === '3' || e.key === 'd' || e.key === 'D') {
        e.preventDefault()
        handleRevalDecision('retire')
      } else if (e.key === '4' || e.key === '?') {
        e.preventDefault()
        handleRevalDecision('unclear')
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        if (currentIndex < candidates.length - 1) setCurrentIndex((i) => i + 1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        if (currentIndex > 0) setCurrentIndex((i) => i - 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, candidates.length, handleRevalDecision])

  return (
    <div
      className={`min-h-[calc(100vh-80px)] py-4 sm:py-6 transition-colors ${
        isDark ? 'bg-[#030708] text-gray-100' : 'bg-[#F8F7F7] text-gray-900'
      }`}
    >
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 space-y-4 text-left">
        {/* ─── Top Bar: Navigation & Progress ─────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-3">
            <Link
              to="/review"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-[0.98] ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10 hover:text-white'
                  : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200'
              }`}
            >
              <ArrowLeft size={15} weight="bold" />
              <span>{t('reviewer.btn_back_to_hub')}</span>
            </Link>

            <div className="h-4 w-px bg-gray-200 dark:bg-white/10 hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="font-mono font-extrabold text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-500/30">
                {t('reviewer.queue_reval_badge')}
              </span>
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100 font-mono">
                {t('reviewer.progress_counter', {
                  current: candidates.length > 0 ? currentIndex + 1 : 0,
                  total: candidates.length,
                })}
              </span>
            </div>
          </div>

          {/* Clean Hotkey Tip */}
          <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
            <span className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-lg border border-gray-200 dark:border-white/10 font-mono text-[11px]">
              {t('reviewer.reval_hotkey_tip')}
            </span>
          </div>
        </div>

        {/* ─── Main Comparison Screen (Split View) ───────────────────────────── */}
        {!currentCandidate ? (
          <div
            className={`p-12 text-center rounded-2xl border space-y-4 ${
              isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-[#E8E4E3]'
            }`}
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center">
              <CheckCircle size={32} weight="fill" />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white">
              {t('reviewer.reval_queue_clear_title')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              {t('reviewer.reval_queue_clear_desc')}
            </p>
            <Link
              to="/review"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#007b8b] text-white font-bold text-sm"
            >
              <ArrowLeft size={16} />
              <span>{t('reviewer.btn_back_to_hub')}</span>
            </Link>
          </div>
        ) : (
          <div
            className={`rounded-2xl border overflow-hidden transition-all shadow-sm ${
              isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-[#E8E4E3]'
            }`}
          >
            {/* Header: Sign Details */}
            <div className="px-5 py-3 border-b border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-black/30 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-md font-mono font-black bg-red-100 text-red-950 border border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30 text-xs">
                  {currentCandidate.code}
                </span>
                <strong className="text-sm sm:text-base text-gray-900 dark:text-white font-black">
                  {currentCandidate.name}
                </strong>
                <span className="text-gray-600 dark:text-gray-400 font-semibold hidden sm:inline">
                  • {currentCandidate.roadName}
                </span>
              </div>

              <div className="font-mono text-gray-700 dark:text-gray-300 font-black text-xs">
                {currentIndex + 1} / {candidates.length}
              </div>
            </div>

            {/* Split Comparison View Grid (2 Columns) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 sm:p-6">
              {/* Left Column: Historical Verified Record */}
              <div
                className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
                  isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50/70 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-lg text-xs font-mono font-black bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                      <ShieldCheck size={15} weight="bold" />
                      <span>{t('reviewer.reval_hist_label')}</span>
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-mono font-semibold">
                      {currentCandidate.historicalRecord.verifiedDate}
                    </span>
                  </div>

                  <div
                    className={`flex rounded-xl p-1 border text-xs font-semibold ${
                      isDark ? 'bg-white/5 border-white/10' : 'bg-gray-200 border-gray-300'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setHistView('crop')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${getToggleTabClass(
                        histView === 'crop'
                      )}`}
                    >
                      {t('reviewer.btn_view_crop')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistView('context')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${getToggleTabClass(
                        histView === 'context'
                      )}`}
                    >
                      {t('reviewer.btn_view_context')}
                    </button>
                  </div>
                </div>

                <div
                  className={`relative h-[260px] sm:h-[300px] rounded-xl overflow-hidden border flex items-center justify-center ${
                    isDark ? 'bg-gray-950 border-white/10 shadow-inner' : 'bg-gray-950 border-gray-300 shadow-inner'
                  }`}
                >
                  <img
                    src={getHistoricalImageUrl(histView)}
                    alt="Historical"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/80 text-white text-[11px] font-mono flex items-center gap-1.5 border border-white/20">
                    <Eye size={13} className="text-emerald-400" />
                    <span>{getViewBadgeLabel(histView)}</span>
                  </div>
                </div>

                <div className="text-xs space-y-2 pt-3 border-t border-gray-200 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-semibold">
                      <ShieldCheck size={16} className="text-emerald-500" weight="bold" />
                      <span>{t('reviewer.reval_trust_label')}:</span>
                    </span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-black text-sm">
                      {currentCandidate.historicalRecord.trustScore}%
                    </strong>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                    {currentCandidate.historicalRecord.condition}
                  </p>
                </div>
              </div>

              {/* Right Column: New Survey Capture */}
              <div
                className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
                  isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50/70 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-lg text-xs font-mono font-black bg-cyan-500/15 text-[#007b8b] dark:text-[#00c4de] border border-[#007b8b]/30 dark:border-[#00c4de]/30 flex items-center gap-1.5">
                      <ClockCounterClockwise size={15} weight="bold" />
                      <span>{t('reviewer.reval_new_label')}</span>
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-mono font-semibold">
                      {currentCandidate.newSurveyRecord.surveyDate} ({currentCandidate.newSurveyRecord.tripId})
                    </span>
                  </div>

                  <div
                    className={`flex rounded-xl p-1 border text-xs font-semibold ${
                      isDark ? 'bg-white/5 border-white/10' : 'bg-gray-200 border-gray-300'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setNewView('crop')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${getToggleTabClass(
                        newView === 'crop'
                      )}`}
                    >
                      {t('reviewer.btn_view_crop')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewView('context')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${getToggleTabClass(
                        newView === 'context'
                      )}`}
                    >
                      {t('reviewer.btn_view_context')}
                    </button>
                  </div>
                </div>

                <div
                  className={`relative h-[260px] sm:h-[300px] rounded-xl overflow-hidden border flex items-center justify-center ${
                    isDark ? 'bg-gray-950 border-white/10 shadow-inner' : 'bg-gray-950 border-gray-300 shadow-inner'
                  }`}
                >
                  <img
                    src={getNewSurveyImageUrl(newView)}
                    alt="New Survey"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/80 text-white text-[11px] font-mono flex items-center gap-1.5 border border-white/20">
                    <Eye size={13} className="text-cyan-400" />
                    <span>{getViewBadgeLabel(newView)}</span>
                  </div>
                </div>

                <div className="text-xs space-y-2 pt-3 border-t border-gray-200 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-semibold">
                      <WarningCircle size={16} className="text-[#007b8b] dark:text-[#00c4de]" weight="bold" />
                      <span>{t('reviewer.reval_surveyor_score')}:</span>
                    </span>
                    <strong className="text-[#007b8b] dark:text-[#00c4de] font-mono font-black text-sm">
                      {currentCandidate.newSurveyRecord.surveyorTrustScore}%
                    </strong>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                    {currentCandidate.newSurveyRecord.observedChange}
                  </p>
                </div>
              </div>
            </div>

            {/* Decision Bar */}
            <div className="p-5 border-t border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-black/30 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all shadow-xs active:scale-[0.98]"
                >
                  <ArrowLeft size={14} />
                  <span>{t('reviewer.btn_prev')}</span>
                </button>

                <button
                  type="button"
                  disabled={currentIndex >= candidates.length - 1}
                  onClick={() => setCurrentIndex((i) => Math.min(candidates.length - 1, i + 1))}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all shadow-xs active:scale-[0.98]"
                >
                  <span>{t('reviewer.btn_next')}</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              {/* 4 Action Decision Buttons */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* 1. Confirm (Still exists) */}
                <button
                  type="button"
                  onClick={() => handleRevalDecision('confirm')}
                  className="px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 flex items-center gap-2 cursor-pointer active:scale-[0.98] transition-all"
                >
                  <Check size={16} weight="bold" />
                  <span>{t('reviewer.btn_reval_confirm')}</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/25 text-[10px] font-mono">1</kbd>
                </button>

                {/* 2. Update (Modified/Replaced) */}
                <button
                  type="button"
                  onClick={() => handleRevalDecision('update')}
                  className="px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm bg-[#007b8b] hover:bg-[#006977] text-white shadow-md shadow-[#007b8b]/25 flex items-center gap-2 cursor-pointer active:scale-[0.98] transition-all"
                >
                  <ArrowClockwise size={16} weight="bold" />
                  <span>{t('reviewer.btn_reval_update')}</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/25 text-[10px] font-mono">2</kbd>
                </button>

                {/* 3. Retire (Removed/Dismantled) */}
                <button
                  type="button"
                  onClick={() => handleRevalDecision('retire')}
                  className="px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/25 flex items-center gap-2 cursor-pointer active:scale-[0.98] transition-all"
                >
                  <XCircle size={16} weight="bold" />
                  <span>{t('reviewer.btn_reval_retire')}</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/25 text-[10px] font-mono">3</kbd>
                </button>

                {/* 4. Unclear (Need revisit) */}
                <button
                  type="button"
                  onClick={() => handleRevalDecision('unclear')}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm border flex items-center gap-2 cursor-pointer active:scale-[0.98] transition-all ${
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/15'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
                  }`}
                >
                  <Question size={16} weight="bold" />
                  <span>{t('reviewer.btn_reval_unclear')}</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-[10px] font-mono">4</kbd>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

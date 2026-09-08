import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle,
  XCircle,
  PencilSimple,
  Flag,
  MapPin,
  Sparkle,
  ArrowRight,
  ArrowLeft,
  SlidersHorizontal,
  Warning,
  Eye,
  MagnifyingGlass,
  Compass,
} from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { useTranslation } from 'react-i18next'
import {
  mockReviewCandidates,
  mockTrafficCatalog,
  type CandidateToReview,
  type FlagReasonCode,
  type TrafficCatalogSign,
} from '@/data'
import { ReviewerMiniMap } from '@/components/review/ReviewerMiniMap'
import { FlagCandidateModal } from '@/components/review/FlagCandidateModal'
import { TrafficSignGraphic } from '@/components/catalog/TrafficSignGraphic'

type MediaViewType = 'crop' | 'context' | 'map'
type QueueFilterType = 'all' | 'uncertain' | 'confident' | 'P' | 'W' | 'R'
type CatalogCategoryFilter = 'all' | 'prohibitory' | 'warning' | 'mandatory' | 'guide' | 'speed_limit'

export function CandidateReviewPage() {
  const { t } = useTranslation('common')
  const { isDark } = useTheme()
  const toast = useToast()

  const [candidates, setCandidates] = useState<CandidateToReview[]>(mockReviewCandidates)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [activeMediaView, setActiveMediaView] = useState<MediaViewType>('crop')
  const [filterMode, setFilterMode] = useState<QueueFilterType>('all')

  // Modals
  const [showCatalogModal, setShowCatalogModal] = useState(false)
  const [catalogSearch, setCatalogSearch] = useState('')
  const [catalogCat, setCatalogCat] = useState<CatalogCategoryFilter>('all')
  const [showFlagModal, setShowFlagModal] = useState(false)

  // Filter candidate queue according to Active Learning criteria
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      if (filterMode === 'all') return true
      if (filterMode === 'uncertain') return c.confidence >= 0.4 && c.confidence <= 0.75
      if (filterMode === 'confident') return c.confidence > 0.75
      if (filterMode === 'P') return c.category === 'P'
      if (filterMode === 'W') return c.category === 'W'
      if (filterMode === 'R') return c.category === 'R'
      return true
    })
  }, [candidates, filterMode])

  const currentCandidate = filteredCandidates[currentIndex] || null

  const getCandidateBadgeLabel = (view: MediaViewType) => {
    if (view === 'crop') {
      return t('reviewer.badge_crop')
    }
    if (view === 'context') {
      return t('reviewer.badge_context')
    }
    return t('reviewer.btn_view_map')
  }

  const getCandidateImageUrl = (cand: CandidateToReview, view: MediaViewType) => {
    if (view === 'crop') {
      return cand.cropImageUrl
    }
    return cand.contextImageUrl
  }

  const getFilterPillClass = (mode: QueueFilterType) => {
    if (filterMode === mode) {
      if (mode === 'all') {
        if (isDark) return 'bg-white text-black font-black shadow-xs'
        return 'bg-gray-900 text-white font-black shadow-xs'
      }
      if (mode === 'uncertain') {
        if (isDark) return 'bg-amber-400 text-black font-black shadow-xs'
        return 'bg-amber-500 text-white font-black shadow-xs'
      }
      if (mode === 'confident') {
        if (isDark) return 'bg-emerald-400 text-black font-black shadow-xs'
        return 'bg-emerald-600 text-white font-black shadow-xs'
      }
      if (mode === 'P') {
        if (isDark) return 'bg-rose-500 text-white font-black shadow-xs'
        return 'bg-rose-600 text-white font-black shadow-xs'
      }
      if (mode === 'W') {
        if (isDark) return 'bg-amber-500 text-white font-black shadow-xs'
        return 'bg-amber-600 text-white font-black shadow-xs'
      }
      if (mode === 'R') {
        if (isDark) return 'bg-[#00c4de] text-black font-black shadow-xs'
        return 'bg-[#007b8b] text-white font-black shadow-xs'
      }
    }

    if (isDark) {
      return 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10'
    }
    return 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  }

  const getMediaTabClass = (tab: MediaViewType) => {
    if (activeMediaView === tab) {
      if (isDark) {
        return 'bg-[#00c4de] text-black font-black shadow-xs'
      }
      return 'bg-[#007b8b] text-white font-black shadow-xs'
    }
    return 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
  }

  // Handle Review Decision
  const handleCandidateAction = useCallback(
    (action: 'approve' | 'reject' | 'flag', correctedCode?: string, _flagNotes?: string) => {
      if (!currentCandidate) return

      const candidateId = currentCandidate.id
      let candidateStatus: 'Approved' | 'Rejected' | 'Flagged' = 'Flagged'
      if (action === 'approve') {
        candidateStatus = 'Approved'
      } else if (action === 'reject') {
        candidateStatus = 'Rejected'
      }

      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidateId
            ? {
                ...c,
                status: candidateStatus,
                code: correctedCode || c.code,
              }
            : c
        )
      )

      if (action === 'approve') {
        if (correctedCode) {
          toast.success(`${t('reviewer.toast_corrected')} ${correctedCode}`)
        } else {
          toast.success(`${t('reviewer.toast_approved')} ${currentCandidate.code}`)
        }
      } else if (action === 'reject') {
        toast.warning(`${t('reviewer.toast_rejected')} ${currentCandidate.code}`)
      } else if (action === 'flag') {
        toast.info(`${t('reviewer.toast_flagged')} ${currentCandidate.code}`)
      }

      // Advance to next
      if (currentIndex < filteredCandidates.length - 1) {
        setCurrentIndex((i) => i + 1)
      }
    },
    [currentCandidate, currentIndex, filteredCandidates.length, toast, t]
  )

  // Hotkey listener (A, R, C, F, Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable hotkeys if inside modal or typing in input/textarea
      if (showCatalogModal || showFlagModal) return
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault()
        handleCandidateAction('approve')
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        handleCandidateAction('reject')
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault()
        setShowCatalogModal(true)
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        setShowFlagModal(true)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        if (currentIndex < filteredCandidates.length - 1) setCurrentIndex((i) => i + 1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        if (currentIndex > 0) setCurrentIndex((i) => i - 1)
      } else if (e.key === '1') {
        setActiveMediaView('crop')
      } else if (e.key === '2') {
        setActiveMediaView('context')
      } else if (e.key === '3') {
        setActiveMediaView('map')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    showCatalogModal,
    showFlagModal,
    currentIndex,
    filteredCandidates.length,
    handleCandidateAction,
  ])

  // Filter QCVN 41 catalog modal
  const filteredCatalogSigns = useMemo(() => {
    return mockTrafficCatalog.filter((sign) => {
      if (catalogCat !== 'all' && sign.category !== catalogCat) return false
      if (!catalogSearch.trim()) return true
      const q = catalogSearch.toLowerCase().trim()
      return (
        sign.code.toLowerCase().includes(q) ||
        sign.nameVi.toLowerCase().includes(q) ||
        sign.nameEn.toLowerCase().includes(q)
      )
    })
  }, [catalogCat, catalogSearch])

  const handleSelectCatalogSign = (sign: TrafficCatalogSign) => {
    setShowCatalogModal(false)
    handleCandidateAction('approve', sign.code)
  }

  const handleConfirmFlagModal = (reason: FlagReasonCode, notes?: string) => {
    setShowFlagModal(false)
    handleCandidateAction('flag', undefined, notes || reason)
  }

  return (
    <div
      className={`min-h-[calc(100vh-80px)] py-4 sm:py-6 transition-colors ${
        isDark ? 'bg-[#030708] text-gray-100' : 'bg-[#F8F7F7] text-gray-900'
      }`}
    >
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 space-y-4 text-left">
        {/* ─── Top Bar: Hub Navigation & Queue Controls ───────────────────────── */}
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
              <span className="font-mono font-extrabold text-xs px-2.5 py-0.5 rounded-full bg-[#007b8b]/15 text-[#007b8b] dark:text-[#00c4de] border border-[#007b8b]/30">
                {t('reviewer.zen_mode_badge')}
              </span>
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100 font-mono">
                {t('reviewer.progress_counter', {
                  current: filteredCandidates.length > 0 ? currentIndex + 1 : 0,
                  total: filteredCandidates.length,
                })}
              </span>
            </div>
          </div>

          {/* Clean Hotkey Tip Indicator */}
          <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
            <span className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-lg border border-gray-200 dark:border-white/10 font-mono text-[11px]">
              {t('reviewer.hotkey_tip')}
            </span>
          </div>
        </div>

        {/* ─── Queue Filter Pills Bar ─────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-gray-500 dark:text-gray-400 font-bold flex items-center gap-1 shrink-0 uppercase tracking-wider text-[11px]">
            <SlidersHorizontal size={13} />
            <span>{t('reviewer.queue_filter_lbl')}</span>
          </span>

          <button
            type="button"
            onClick={() => {
              setFilterMode('all')
              setCurrentIndex(0)
            }}
            className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${getFilterPillClass(
              'all'
            )}`}
          >
            {t('reviewer.filter_all')} ({candidates.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterMode('uncertain')
              setCurrentIndex(0)
            }}
            className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${getFilterPillClass(
              'uncertain'
            )}`}
          >
            {t('reviewer.filter_uncertain')}
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterMode('confident')
              setCurrentIndex(0)
            }}
            className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${getFilterPillClass(
              'confident'
            )}`}
          >
            {t('reviewer.filter_confident')}
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterMode('P')
              setCurrentIndex(0)
            }}
            className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${getFilterPillClass(
              'P'
            )}`}
          >
            {t('reviewer.filter_p')}
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterMode('W')
              setCurrentIndex(0)
            }}
            className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${getFilterPillClass(
              'W'
            )}`}
          >
            {t('reviewer.filter_w')}
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterMode('R')
              setCurrentIndex(0)
            }}
            className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${getFilterPillClass(
              'R'
            )}`}
          >
            {t('reviewer.filter_r')}
          </button>
        </div>

        {/* ─── Main Review Card (2 Columns Viewport Fit) ─────────────────────── */}
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
              {t('reviewer.queue_clear_title')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              {t('reviewer.queue_clear_desc')}
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
            {/* Candidate Sub-Header: Reference & Progress */}
            <div className="px-5 py-3 border-b border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-black/30 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-md font-mono font-black bg-[#007b8b]/15 text-[#007b8b] dark:text-[#00c4de] border border-[#007b8b]/20 text-xs">
                  {currentCandidate.id}
                </span>
                <span className="text-gray-600 dark:text-gray-400 font-semibold">
                  {t('reviewer.trip_ref')}:{' '}
                  <strong className="text-gray-900 dark:text-white font-mono">{currentCandidate.sourceTripId}</strong>{' '}
                  <span className="text-gray-500 dark:text-gray-400">(YOLO Track #{currentCandidate.yoloTrackId})</span>
                </span>
              </div>

              <div className="flex items-center gap-3">
                {currentCandidate.confidence >= 0.4 && currentCandidate.confidence <= 0.75 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-800 dark:text-amber-400 border border-amber-500/25">
                    <Warning size={14} weight="bold" />
                    <span>{t('reviewer.uncertainty_badge')}</span>
                  </span>
                )}
                <span className="font-mono text-gray-700 dark:text-gray-300 font-black text-xs">
                  {currentIndex + 1} / {filteredCandidates.length}
                </span>
              </div>
            </div>

            {/* Candidate Content Grid (7 cols Media, 5 cols Actions) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-5 sm:p-6 items-start">
              {/* Left Column: Media (Crop / Dashcam / Map) */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  {/* Segmented Media Mode Tabs */}
                  <div
                    className={`flex rounded-xl p-1 border text-xs font-bold ${
                      isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveMediaView('crop')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${getMediaTabClass(
                        'crop'
                      )}`}
                    >
                      <span>{t('reviewer.view_media_crop')}</span>
                      <kbd className="text-[10px] font-mono opacity-80">(1)</kbd>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveMediaView('context')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${getMediaTabClass(
                        'context'
                      )}`}
                    >
                      <span>{t('reviewer.view_media_context')}</span>
                      <kbd className="text-[10px] font-mono opacity-80">(2)</kbd>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveMediaView('map')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${getMediaTabClass(
                        'map'
                      )}`}
                    >
                      <Compass size={14} weight="bold" />
                      <span>{t('reviewer.view_media_map')}</span>
                      <kbd className="text-[10px] font-mono opacity-80">(3)</kbd>
                    </button>
                  </div>

                  <span className="text-xs font-mono text-gray-600 dark:text-gray-400 font-medium">
                    {t('reviewer.est_distance')}:{' '}
                    <strong className="text-[#007b8b] dark:text-cyan-400 font-bold">
                      {currentCandidate.estimatedDistanceMeters}m
                    </strong>
                  </span>
                </div>

                {/* Media Container (380px fixed height for clean fit) */}
                <div
                  className={`relative h-[340px] sm:h-[380px] rounded-2xl overflow-hidden border flex items-center justify-center ${
                    isDark ? 'bg-gray-950 border-white/10 shadow-inner' : 'bg-gray-950 border-gray-200 shadow-inner'
                  }`}
                >
                  {activeMediaView === 'map' ? (
                    <div className="w-full h-full relative">
                      <ReviewerMiniMap
                        lat={currentCandidate.lat}
                        lng={currentCandidate.lng}
                        heading={currentCandidate.directionHeading}
                        roadName={currentCandidate.roadName}
                        signCode={currentCandidate.code}
                        trafficFlowDirection={currentCandidate.trafficFlowDirection}
                      />
                    </div>
                  ) : (
                    <>
                      <img
                        src={getCandidateImageUrl(currentCandidate, activeMediaView)}
                        alt={currentCandidate.suggestedName}
                        className="w-full h-full object-contain"
                      />

                      <div className="absolute top-3 left-3 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md text-white text-xs font-mono flex items-center gap-2 border border-white/20">
                        <Eye size={15} className="text-cyan-400" />
                        <span>{getCandidateBadgeLabel(activeMediaView)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Right Column: AI Prediction & Decision Form */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                {/* AI Detection Card */}
                <div
                  className={`p-5 rounded-2xl border space-y-4 text-left ${
                    isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50/70 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkle size={15} className="text-[#007b8b] dark:text-[#00c4de]" weight="fill" />
                      <span>{t('reviewer.ai_prediction')}</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30">
                      {(currentCandidate.confidence * 100).toFixed(1)}% {t('reviewer.confidence')}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                      {currentCandidate.suggestedName}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md font-mono font-black text-xs bg-red-100 text-red-950 border border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30">
                        {currentCandidate.code}
                      </span>
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                        QCVN 41:2019 / BGTVT
                      </span>
                    </div>
                  </div>

                  {/* Metadata Table */}
                  <div className="pt-3 border-t border-gray-200 dark:border-white/10 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-gray-600 dark:text-gray-400 font-semibold flex items-center gap-1.5 shrink-0">
                        <MapPin size={15} className="text-red-500 shrink-0" weight="fill" />
                        <span>{t('reviewer.lbl_road')}:</span>
                      </span>
                      <span className="font-bold text-gray-900 dark:text-white truncate text-right">
                        {currentCandidate.roadName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between font-mono">
                      <span className="text-gray-600 dark:text-gray-400 font-semibold">
                        {t('reviewer.lbl_coords')}:
                      </span>
                      <span className="font-bold text-gray-900 dark:text-gray-100">
                        {currentCandidate.lat.toFixed(5)}, {currentCandidate.lng.toFixed(5)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between font-mono">
                      <span className="text-gray-600 dark:text-gray-400 font-semibold">
                        {t('reviewer.lbl_heading')}:
                      </span>
                      <span className="font-bold text-[#007b8b] dark:text-[#00c4de]">
                        {currentCandidate.directionHeading}° ({currentCandidate.trafficFlowDirection})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons Grid with Keyboard Badges */}
                <div className="space-y-2.5 pt-1">
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* 1. Approve */}
                    <button
                      type="button"
                      onClick={() => handleCandidateAction('approve')}
                      className="py-3 px-4 rounded-xl font-black text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all"
                    >
                      <CheckCircle size={18} weight="bold" />
                      <span>{t('reviewer.btn_approve')}</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-white/25 text-[11px] font-mono">A</kbd>
                    </button>

                    {/* 2. Reject */}
                    <button
                      type="button"
                      onClick={() => handleCandidateAction('reject')}
                      className="py-3 px-4 rounded-xl font-black text-xs sm:text-sm bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/25 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all"
                    >
                      <XCircle size={18} weight="bold" />
                      <span>{t('reviewer.btn_reject')}</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-white/25 text-[11px] font-mono">R</kbd>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {/* 3. Correct Label */}
                    <button
                      type="button"
                      onClick={() => setShowCatalogModal(true)}
                      className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm border flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all ${
                        isDark
                          ? 'bg-white/5 hover:bg-white/10 text-cyan-300 border-cyan-500/30'
                          : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border-cyan-200'
                      }`}
                    >
                      <PencilSimple size={18} weight="bold" />
                      <span>{t('reviewer.btn_correct')}</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-[11px] font-mono">C</kbd>
                    </button>

                    {/* 4. Flag Anomaly */}
                    <button
                      type="button"
                      onClick={() => setShowFlagModal(true)}
                      className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm border flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all ${
                        isDark
                          ? 'bg-white/5 hover:bg-white/10 text-amber-300 border-amber-500/30'
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                      }`}
                    >
                      <Flag size={18} weight="bold" />
                      <span>{t('reviewer.btn_flag')}</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-[11px] font-mono">F</kbd>
                    </button>
                  </div>
                </div>

                {/* Bottom Navigation (Prev / Next) */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-white/10">
                  <button
                    type="button"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all shadow-xs active:scale-[0.98]"
                  >
                    <ArrowLeft size={14} />
                    <span>{t('reviewer.btn_prev')}</span>
                  </button>

                  <button
                    type="button"
                    disabled={currentIndex >= filteredCandidates.length - 1}
                    onClick={() => setCurrentIndex((i) => Math.min(filteredCandidates.length - 1, i + 1))}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all shadow-xs active:scale-[0.98]"
                  >
                    <span>{t('reviewer.btn_next')}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Modal 1: Correct Label from QCVN 41 Catalog ───────────────────── */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fadeIn">
          <div
            className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${
              isDark ? 'bg-[#071317] border-white/15 text-white' : 'bg-white border-[#E8E4E3] text-gray-900'
            }`}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
              <div className="space-y-0.5 text-left">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#007b8b]/15 text-[#007b8b] dark:text-[#00c4de]">
                    QCVN 41:2019
                  </span>
                  <h3 className="font-extrabold text-base sm:text-lg">
                    {t('reviewer.modal_catalog_title')}
                  </h3>
                </div>
                {currentCandidate && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {currentCandidate.suggestedName} ({currentCandidate.code})
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Search and Category Filters */}
            <div className="p-4 border-b border-gray-200 dark:border-white/10 space-y-3">
              <div className="relative">
                <MagnifyingGlass
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder={t('reviewer.modal_search_placeholder')}
                  className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm border font-medium focus:outline-none ${
                    isDark
                      ? 'bg-black/50 border-white/15 text-white focus:border-[#00c4de]'
                      : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-[#007b8b]'
                  }`}
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                {(['all', 'prohibitory', 'warning', 'mandatory', 'guide', 'speed_limit'] as CatalogCategoryFilter[]).map((cat) => {
                  let catLabel = t('reviewer.catalog_cat_all')
                  if (cat === 'prohibitory') {
                    catLabel = t('reviewer.catalog_cat_p')
                  } else if (cat === 'warning') {
                    catLabel = t('reviewer.catalog_cat_w')
                  } else if (cat === 'mandatory') {
                    catLabel = t('reviewer.catalog_cat_r')
                  } else if (cat === 'guide') {
                    catLabel = t('reviewer.catalog_cat_i')
                  } else if (cat === 'speed_limit') {
                    catLabel = t('reviewer.catalog_cat_s')
                  }

                  let catBtnClass = 'bg-gray-100 text-gray-700'
                  if (catalogCat === cat) {
                    if (isDark) {
                      catBtnClass = 'bg-[#00c4de] text-black'
                    } else {
                      catBtnClass = 'bg-[#007b8b] text-white'
                    }
                  } else if (isDark) {
                    catBtnClass = 'bg-white/5 text-gray-300'
                  }

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCatalogCat(cat)}
                      className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition-colors ${catBtnClass}`}
                    >
                      {catLabel}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Catalog Signs List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 text-left">
              {filteredCatalogSigns.map((sign) => (
                <div
                  key={sign.code}
                  onClick={() => handleSelectCatalogSign(sign)}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    isDark
                      ? 'bg-white/[0.02] border-white/10 hover:border-[#00c4de] hover:bg-white/5'
                      : 'bg-gray-50/80 border-gray-200 hover:border-[#007b8b] hover:bg-white shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 shrink-0 flex items-center justify-center">
                      <TrafficSignGraphic sign={sign} className="w-9 h-9" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white">
                          {sign.code}
                        </span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {sign.nameVi}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {sign.nameEn}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#007b8b] dark:bg-[#00c4de] text-white dark:text-black"
                  >
                    {t('reviewer.btn_select_approve')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal 2: Flag Candidate ────────────────────────────────────────── */}
      {currentCandidate && (
        <FlagCandidateModal
          isOpen={showFlagModal}
          onClose={() => setShowFlagModal(false)}
          candidateId={currentCandidate.id}
          signCode={currentCandidate.code}
          onConfirmFlag={handleConfirmFlagModal}
        />
      )}
    </div>
  )
}

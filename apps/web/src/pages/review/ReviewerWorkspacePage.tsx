import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  CheckCircle,
  XCircle,
  PencilSimple,
  Flag,
  MapPin,
  Sparkle,
  Coins,
  ShieldCheck,
  Eye,
  MagnifyingGlass,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  PlusCircle,
  ClockCounterClockwise,
  SlidersHorizontal,
  Warning,
  Check,
  TrafficSignal,
} from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { useTranslation } from 'react-i18next'
import {
  mockReviewCandidates,
  mockRevalidationCandidates,
  mockReviewerMetrics,
  mockTrafficCatalog,
  type CandidateToReview,
  type RevalidationCandidate,
  type ReviewHistoryItem,
  type FlagReasonCode,
  type TrafficCatalogSign,
} from '@/data'
import { Modal } from '@/components/common/Modal'
import { NewSignTypeModal } from '@/components/survey/NewSignTypeModal'
import {
  FlagCandidateModal,
  ReviewerMiniMap,
  RevalidationWorkspacePanel,
  ReviewHistoryDrawer,
} from '@/components/review'

type QueueFilterType = 'all' | 'uncertain' | 'confident' | 'P' | 'W' | 'R'
type CatalogCategoryFilter = 'all' | 'prohibitory' | 'warning' | 'mandatory' | 'guide' | 'additional'

export default function ReviewerWorkspacePage() {
  const { isDark } = useTheme()
  const { t } = useTranslation('common')
  const toast = useToast()

  // Workspace Mode: 'candidate' (Flow 4) | 'revalidation' (Flow 8)
  const [activeMode, setActiveMode] = useState<'candidate' | 'revalidation'>('candidate')

  // Candidate Review State
  const [candidates, setCandidates] = useState<CandidateToReview[]>(mockReviewCandidates)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [activeView, setActiveView] = useState<'crop' | 'context'>('crop')
  const [filterMode, setFilterMode] = useState<QueueFilterType>('all')

  const getCandidateBadgeLabel = (view: 'crop' | 'context') => {
    if (view === 'crop') {
      return t('reviewer.badge_crop')
    }
    return t('reviewer.badge_context')
  }

  const getCandidateImageUrl = (cand: CandidateToReview, view: 'crop' | 'context') => {
    if (view === 'crop') {
      return cand.cropImageUrl
    }
    return cand.contextImageUrl
  }

  // Revalidation Review State
  const [revalCandidates, setRevalCandidates] = useState<RevalidationCandidate[]>(mockRevalidationCandidates)
  const [revalIndex, setRevalIndex] = useState(0)

  // Modals & Drawers
  const [showCatalogModal, setShowCatalogModal] = useState(false)
  const [catalogSearch, setCatalogSearch] = useState('')
  const [catalogCat, setCatalogCat] = useState<CatalogCategoryFilter>('all')
  const [showFlagModal, setShowFlagModal] = useState(false)
  const [showNewSignModal, setShowNewSignModal] = useState(false)
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false)

  // Metrics & History State
  const [stats, setStats] = useState(mockReviewerMetrics)
  const [historyItems, setHistoryItems] = useState<ReviewHistoryItem[]>([])

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
  const currentReval = revalCandidates[revalIndex] || null

  // Candidate Decision Handler
  const handleCandidateDecision = useCallback(
    (action: 'approve' | 'reject' | 'flag', correctedCode?: string, flagNotes?: string) => {
      if (!currentCandidate) return

      const candidateId = currentCandidate.id
      const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

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

      let actionRecord: 'Approved' | 'Rejected' | 'Flagged' | 'Corrected' = 'Flagged'
      if (correctedCode) {
        actionRecord = 'Corrected'
      } else if (action === 'approve') {
        actionRecord = 'Approved'
      } else if (action === 'reject') {
        actionRecord = 'Rejected'
      }

      let historyDetails: string | undefined = undefined
      if (flagNotes) {
        historyDetails = flagNotes
      } else if (correctedCode) {
        historyDetails = `${t('reviewer.history_corrected_prefix')}${correctedCode}`
      }

      // Add to Session History
      const historyEntry: ReviewHistoryItem = {
        id: `HIST-${Date.now()}`,
        candidateId,
        signCode: correctedCode || currentCandidate.code,
        signName: currentCandidate.suggestedName,
        action: actionRecord,
        timestamp: now,
        details: historyDetails,
        mode: 'candidate',
      }
      setHistoryItems((prev) => [historyEntry, ...prev])

      if (action === 'approve') {
        toast.success(
          correctedCode
            ? `${t('reviewer.toast_corrected')} ${correctedCode}`
            : `${t('reviewer.toast_approved')} ${currentCandidate.code}`
        )
        setStats((s) => ({
          ...s,
          totalReviewed: s.totalReviewed + 1,
          approvedCount: s.approvedCount + 1,
          creditsEarned: s.creditsEarned + 5,
        }))
      } else if (action === 'reject') {
        toast.error(`${t('reviewer.toast_rejected')} ${candidateId}`)
        setStats((s) => ({
          ...s,
          totalReviewed: s.totalReviewed + 1,
          rejectedCount: s.rejectedCount + 1,
          creditsEarned: s.creditsEarned + 5,
        }))
      } else {
        toast.warning(`${t('reviewer.toast_flagged')} ${candidateId}`)
        setStats((s) => ({
          ...s,
          totalReviewed: s.totalReviewed + 1,
        }))
      }

      if (currentIndex < filteredCandidates.length - 1) {
        setCurrentIndex((i) => i + 1)
      }
    },
    [currentCandidate, currentIndex, filteredCandidates.length, t, toast]
  )

  // Revalidation Decision Handler
  const handleRevalidationDecision = useCallback(
    (action: 'confirm' | 'update' | 'retire' | 'unclear' | 'invalid') => {
      if (!currentReval) return

      const revalId = currentReval.id
      const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

      const statusMap = {
        confirm: 'Confirmed',
        update: 'Updated',
        retire: 'Retired',
        unclear: 'Unclear',
        invalid: 'Invalid',
      } as const

      setRevalCandidates((prev) =>
        prev.map((r) =>
          r.id === revalId
            ? {
                ...r,
                status: statusMap[action],
              }
            : r
        )
      )

      let revalActionRecord: 'Confirmed' | 'Updated' | 'Retired' = 'Retired'
      if (action === 'confirm') {
        revalActionRecord = 'Confirmed'
      } else if (action === 'update') {
        revalActionRecord = 'Updated'
      }

      const historyEntry: ReviewHistoryItem = {
        id: `HIST-${Date.now()}`,
        candidateId: currentReval.signId,
        signCode: currentReval.code,
        signName: currentReval.name,
        action: revalActionRecord,
        timestamp: now,
        details: `${t('reviewer.history_reval_prefix')}: ${action.toUpperCase()} (${currentReval.roadName})`,
        mode: 'revalidation',
      }
      setHistoryItems((prev) => [historyEntry, ...prev])

      setStats((s) => ({
        ...s,
        totalReviewed: s.totalReviewed + 1,
        creditsEarned: s.creditsEarned + 8,
      }))

      if (action === 'confirm') {
        toast.success(`${t('reviewer.toast_reval_confirm')} ${currentReval.code}`)
      } else if (action === 'update') {
        toast.info(`${t('reviewer.toast_reval_update')} ${currentReval.code}`)
      } else if (action === 'retire') {
        toast.warning(`${t('reviewer.toast_reval_retire')} ${currentReval.code}`)
      } else if (action === 'unclear') {
        toast.info(`${t('reviewer.toast_reval_unclear')} ${currentReval.code}`)
      } else {
        toast.error(`${t('reviewer.toast_reval_invalid')} ${currentReval.code}`)
      }

      if (revalIndex < revalCandidates.length - 1) {
        setRevalIndex((i) => i + 1)
      }
    },
    [currentReval, revalIndex, revalCandidates.length, t, toast]
  )

  // Undo Handler
  const handleUndo = useCallback(
    (item: ReviewHistoryItem) => {
      if (item.mode === 'candidate') {
        setCandidates((prev) =>
          prev.map((c) => (c.id === item.candidateId ? { ...c, status: 'Pending' } : c))
        )
        setStats((s) => ({
          ...s,
          totalReviewed: Math.max(0, s.totalReviewed - 1),
          creditsEarned: Math.max(0, s.creditsEarned - 5),
        }))
        setCurrentIndex((i) => Math.max(0, i - 1))
      } else {
        setRevalCandidates((prev) =>
          prev.map((r) => (r.signId === item.candidateId ? { ...r, status: 'Pending' } : r))
        )
        setStats((s) => ({
          ...s,
          totalReviewed: Math.max(0, s.totalReviewed - 1),
          creditsEarned: Math.max(0, s.creditsEarned - 8),
        }))
        setRevalIndex((i) => Math.max(0, i - 1))
      }

      setHistoryItems((prev) => prev.filter((h) => h.id !== item.id))
      toast.info(`${t('reviewer.toast_undone')} ${item.candidateId}`)
    },
    [t, toast]
  )

  // Keyboard Shortcuts for Candidate Review
  useEffect(() => {
    if (activeMode !== 'candidate') return
    if (showCatalogModal || showFlagModal || showNewSignModal || showHistoryDrawer || !currentCandidate) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.key === 'a' || e.key === 'A') {
        handleCandidateDecision('approve')
      } else if (e.key === 'r' || e.key === 'R') {
        handleCandidateDecision('reject')
      } else if (e.key === 'c' || e.key === 'C') {
        setShowCatalogModal(true)
      } else if (e.key === 'f' || e.key === 'F') {
        setShowFlagModal(true)
      } else if (e.key === 'Tab') {
        e.preventDefault()
        setActiveView((v) => (v === 'crop' ? 'context' : 'crop'))
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex((i) => i - 1)
      } else if (e.key === 'ArrowRight' && currentIndex < filteredCandidates.length - 1) {
        setCurrentIndex((i) => i + 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    activeMode,
    currentCandidate,
    currentIndex,
    filteredCandidates.length,
    handleCandidateDecision,
    showCatalogModal,
    showFlagModal,
    showNewSignModal,
    showHistoryDrawer,
  ])

  // Filter catalog by search query & category tab
  const filteredCatalog = useMemo(() => {
    return mockTrafficCatalog.filter((sign) => {
      const matchesCategory =
        catalogCat === 'all'
          ? true
          : catalogCat === 'prohibitory'
          ? sign.category === 'prohibitory' || sign.category === 'speed_limit'
          : sign.category === catalogCat

      const matchesSearch =
        sign.code.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        sign.nameVi.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        sign.nameEn.toLowerCase().includes(catalogSearch.toLowerCase())

      return matchesCategory && matchesSearch
    })
  }, [catalogSearch, catalogCat])

  return (
    <div
      className={`w-full min-h-[calc(100vh-80px)] py-8 sm:py-10 transition-colors ${
        isDark ? 'bg-[#030708] text-gray-100' : 'bg-[#F8F7F7] text-gray-900'
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* ─── 1. Page Header (Consistent with ProfilePage) ────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#007b8b]/15 dark:bg-[#00c4de]/15 text-[#007b8b] dark:text-[#00c4de] border border-[#007b8b]/30 dark:border-[#00c4de]/30">
                SignTrustMap Reviewer
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                QCVN 41:2019/BGTVT
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {t('reviewer.title')}
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-2xl leading-relaxed">
              {t('reviewer.subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
            {/* Report New Sign Button */}
            <button
              type="button"
              onClick={() => setShowNewSignModal(true)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/10 text-cyan-300'
                  : 'bg-white hover:bg-gray-100 border-gray-200 text-[#007b8b] shadow-xs'
              }`}
            >
              <PlusCircle size={17} weight="bold" />
              <span>{t('reviewer.btn_report_new')}</span>
            </button>

            {/* Session History Drawer Trigger */}
            <button
              type="button"
              onClick={() => setShowHistoryDrawer(true)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300'
                  : 'bg-white hover:bg-gray-100 border-gray-200 text-gray-700 shadow-xs'
              }`}
            >
              <ClockCounterClockwise size={17} />
              <span>{t('reviewer.btn_open_history')}</span>
              {historyItems.length > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#007b8b] dark:bg-[#00c4de] text-white dark:text-black font-black">
                  {historyItems.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ─── 2. Top Stats Bar (High Contrast Cards) ────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className={`p-5 rounded-2xl border ${
            isDark ? 'bg-[#071317] border-white/10 shadow-lg shadow-black/40' : 'bg-white border-[#E8E4E3] shadow-xs'
          }`}>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 block mb-1.5 flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-emerald-500" weight="bold" />
              <span>{t('reviewer.stats_reliability')}</span>
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {stats.reliabilityScore} / 1.00
            </span>
          </div>

          <div className={`p-5 rounded-2xl border ${
            isDark ? 'bg-[#071317] border-white/10 shadow-lg shadow-black/40' : 'bg-white border-[#E8E4E3] shadow-xs'
          }`}>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 block mb-1.5 flex items-center gap-1.5">
              <Sparkle size={16} className="text-[#007b8b] dark:text-[#00c4de]" weight="bold" />
              <span>{t('reviewer.stats_accuracy')}</span>
            </span>
            <span className="text-2xl sm:text-3xl font-black text-[#007b8b] dark:text-cyan-400">
              {stats.accuracyPercent}%
            </span>
          </div>

          <div className={`p-5 rounded-2xl border ${
            isDark ? 'bg-[#071317] border-white/10 shadow-lg shadow-black/40' : 'bg-white border-[#E8E4E3] shadow-xs'
          }`}>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 block mb-1.5 flex items-center gap-1.5">
              <TrafficSignal size={16} className="text-purple-500" weight="bold" />
              <span>{t('reviewer.stats_total')}</span>
            </span>
            <span className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
              {stats.totalReviewed}
            </span>
          </div>

          <div className={`p-5 rounded-2xl border ${
            isDark ? 'bg-[#071317] border-white/10 shadow-lg shadow-black/40' : 'bg-white border-[#E8E4E3] shadow-xs'
          }`}>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 block mb-1.5 flex items-center gap-1.5">
              <Coins size={16} className="text-amber-500" weight="bold" />
              <span>{t('reviewer.stats_rewards')}</span>
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
              +{stats.creditsEarned} Credits
            </span>
          </div>
        </div>

        {/* ─── 3. Mode Switcher Tabs (Consistent with Profile Tabs) ───────────────── */}
        <div className={`rounded-2xl border overflow-hidden ${
          isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-[#E8E4E3] shadow-xs'
        }`}>
          <div className="flex items-center border-b border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-black/20 px-4 pt-2 gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveMode('candidate')}
              className={`py-3 px-4 text-xs sm:text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeMode === 'candidate'
                  ? isDark
                    ? 'border-[#00c4de] text-[#00c4de]'
                    : 'border-[#007b8b] text-[#007b8b]'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Sparkle size={16} weight={activeMode === 'candidate' ? 'fill' : 'regular'} />
              <span>{t('reviewer.tab_candidate')}</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                activeMode === 'candidate'
                  ? isDark ? 'bg-[#00c4de]/20 text-[#00c4de]' : 'bg-[#007b8b]/15 text-[#007b8b]'
                  : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300'
              }`}>
                {candidates.filter((c) => c.status === 'Pending').length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('revalidation')}
              className={`py-3 px-4 text-xs sm:text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeMode === 'revalidation'
                  ? isDark
                    ? 'border-purple-400 text-purple-400'
                    : 'border-purple-600 text-purple-700'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <ClockCounterClockwise size={16} weight={activeMode === 'revalidation' ? 'bold' : 'regular'} />
              <span>{t('reviewer.tab_reval')}</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                activeMode === 'revalidation'
                  ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300'
                  : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300'
              }`}>
                {revalCandidates.filter((r) => r.status === 'Pending').length}
              </span>
            </button>
          </div>

          {/* ─── 4. Main Tab Body ─────────────────────────────────────────────────── */}
          <div className="p-4 sm:p-6 space-y-5">
            {activeMode === 'candidate' ? (
              <div className="space-y-4">
                {/* Queue Filter Bar */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                  <span className="text-gray-600 dark:text-gray-400 font-bold flex items-center gap-1 shrink-0 uppercase tracking-wider text-[11px]">
                    <SlidersHorizontal size={14} />
                    <span>{t('reviewer.queue_filter_lbl')}</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setFilterMode('all')
                      setCurrentIndex(0)
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                      filterMode === 'all'
                        ? isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'
                        : isDark ? 'bg-white/5 text-gray-300 hover:text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {t('reviewer.filter_all')} ({candidates.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFilterMode('uncertain')
                      setCurrentIndex(0)
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                      filterMode === 'uncertain'
                        ? 'bg-amber-500 text-black shadow-xs font-extrabold'
                        : isDark ? 'bg-white/5 text-amber-300 hover:bg-white/10' : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                    }`}
                  >
                    <Warning size={14} weight="bold" />
                    <span>{t('reviewer.filter_uncertain')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFilterMode('confident')
                      setCurrentIndex(0)
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                      filterMode === 'confident'
                        ? 'bg-emerald-600 text-white shadow-xs font-extrabold'
                        : isDark ? 'bg-white/5 text-emerald-400 hover:bg-white/10' : 'bg-emerald-100 text-emerald-950 hover:bg-emerald-200'
                    }`}
                  >
                    <Check size={14} weight="bold" />
                    <span>{t('reviewer.filter_confident')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFilterMode('P')
                      setCurrentIndex(0)
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                      filterMode === 'P'
                        ? 'bg-red-500 text-white shadow-xs'
                        : isDark ? 'bg-white/5 text-red-400 hover:bg-white/10' : 'bg-red-100 text-red-900 hover:bg-red-200'
                    }`}
                  >
                    {t('reviewer.filter_p')}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFilterMode('W')
                      setCurrentIndex(0)
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                      filterMode === 'W'
                        ? 'bg-amber-500 text-black shadow-xs'
                        : isDark ? 'bg-white/5 text-amber-400 hover:bg-white/10' : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                    }`}
                  >
                    {t('reviewer.filter_w')}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFilterMode('R')
                      setCurrentIndex(0)
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                      filterMode === 'R'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : isDark ? 'bg-white/5 text-cyan-400 hover:bg-white/10' : 'bg-blue-100 text-blue-900 hover:bg-blue-200'
                    }`}
                  >
                    {t('reviewer.filter_r')}
                  </button>
                </div>

                {/* Candidate Workspace Card */}
                {currentCandidate ? (
                  <div className={`rounded-2xl border shadow-sm overflow-hidden ${
                    isDark ? 'bg-black/30 border-white/10' : 'bg-white border-gray-200'
                  }`}>
                    {/* Candidate Top Meta Bar */}
                    <div className={`px-6 py-4 border-b flex items-center justify-between flex-wrap gap-3 ${
                      isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-100 bg-gray-50/70'
                    }`}>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-xl text-xs sm:text-sm font-mono font-bold bg-[#007b8b]/15 dark:bg-[#00c4de]/15 text-[#007b8b] dark:text-[#00c4de] border border-[#007b8b]/30 dark:border-[#00c4de]/30">
                          {currentCandidate.id}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                          {t('reviewer.trip_ref')}: <strong className="text-gray-900 dark:text-white font-bold">{currentCandidate.sourceTripId}</strong> (YOLO Track #{currentCandidate.yoloTrackId})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs sm:text-sm font-mono font-bold">
                        <span className="text-gray-600 dark:text-gray-400">{t('reviewer.candidate_counter')}</span>
                        <span className="text-[#007b8b] dark:text-[#00c4de] font-black">{currentIndex + 1}</span>
                        <span className="text-gray-500">/ {filteredCandidates.length}</span>
                      </div>
                    </div>

                    {/* Candidate Content 2-Column Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-5 sm:p-8 items-start">
                      {/* Left: Images & Mini-Map */}
                      <div className="lg:col-span-7 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className={`flex rounded-xl p-1 border text-xs sm:text-sm font-bold ${
                            isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'
                          }`}>
                            <button
                              type="button"
                              onClick={() => setActiveView('crop')}
                              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                                activeView === 'crop'
                                  ? isDark ? 'bg-[#00c4de] text-black shadow-xs font-bold' : 'bg-[#007b8b] text-white shadow-xs font-bold'
                                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                              }`}
                            >
                              {t('reviewer.btn_view_crop')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveView('context')}
                              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                                activeView === 'context'
                                  ? isDark ? 'bg-[#00c4de] text-black shadow-xs font-bold' : 'bg-[#007b8b] text-white shadow-xs font-bold'
                                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                              }`}
                            >
                              {t('reviewer.btn_view_context')}
                            </button>
                          </div>

                          <span className="text-xs sm:text-sm font-mono text-gray-600 dark:text-gray-400 font-medium">
                            {t('reviewer.est_distance')}: <strong className="text-[#007b8b] dark:text-cyan-400 font-bold">{currentCandidate.estimatedDistanceMeters}m</strong>
                          </span>
                        </div>

                        {/* Image Viewer */}
                        <div className={`relative h-[280px] sm:h-[320px] rounded-2xl overflow-hidden border flex items-center justify-center ${
                          isDark ? 'bg-black/60 border-white/10' : 'bg-gray-100 border-gray-200'
                        }`}>
                          <img
                            src={getCandidateImageUrl(currentCandidate, activeView)}
                            alt={currentCandidate.suggestedName}
                            className="w-full h-full object-contain"
                          />

                          <div className="absolute top-3 left-3 px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-md text-white text-xs font-mono flex items-center gap-2 border border-white/20">
                            <Eye size={15} className="text-cyan-400" />
                            <span>{getCandidateBadgeLabel(activeView)}</span>
                          </div>
                        </div>

                        {/* Integrated Mini-Map */}
                        <ReviewerMiniMap
                          lat={currentCandidate.lat}
                          lng={currentCandidate.lng}
                          heading={currentCandidate.directionHeading}
                          roadName={currentCandidate.roadName}
                          signCode={currentCandidate.code}
                          trafficFlowDirection={currentCandidate.trafficFlowDirection}
                        />
                      </div>

                      {/* Right: AI Prediction & Decision Form */}
                      <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
                        <div className={`p-5 sm:p-6 rounded-2xl border space-y-4 ${
                          isDark ? 'bg-white/[0.02] border-white/10' : 'bg-gray-50/80 border-gray-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                              <Sparkle size={15} className="text-amber-500" weight="bold" />
                              <span>{t('reviewer.ai_prediction')}</span>
                            </span>

                            <div className="flex items-center gap-1.5">
                              {currentCandidate.confidence < 0.75 && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40">
                                  {t('reviewer.uncertainty_badge')}
                                </span>
                              )}
                              <span className={`text-xs sm:text-sm font-mono font-black ${
                                currentCandidate.confidence >= 0.85
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : 'text-amber-700 dark:text-amber-400'
                              }`}>
                                {(currentCandidate.confidence * 100).toFixed(1)}% {t('reviewer.confidence')}
                              </span>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-snug">
                              {currentCandidate.suggestedName}
                            </h3>
                            <span className="inline-block mt-2 px-3 py-1 rounded-lg text-xs sm:text-sm font-mono font-extrabold bg-[#007b8b]/15 dark:bg-[#00c4de]/15 text-[#007b8b] dark:text-[#00c4de] border border-[#007b8b]/30 dark:border-[#00c4de]/30">
                              {currentCandidate.code}
                            </span>
                          </div>

                          <div className="pt-4 border-t border-gray-200 dark:border-white/10 space-y-3 text-xs sm:text-sm">
                            <div className="flex items-start justify-between gap-3 text-gray-600 dark:text-gray-400">
                              <span className="flex items-center gap-1.5 font-medium shrink-0">
                                <MapPin size={16} className="text-red-500" weight="fill" />
                                {t('reviewer.lbl_road')}
                              </span>
                              <span className="font-bold text-gray-900 dark:text-gray-100 text-right leading-relaxed">
                                {currentCandidate.roadName}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                              <span className="font-medium">{t('reviewer.lbl_coords')}</span>
                              <span className="font-mono text-gray-900 dark:text-gray-100 font-bold">
                                {currentCandidate.lat.toFixed(5)}, {currentCandidate.lng.toFixed(5)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                              <span className="font-medium">{t('reviewer.lbl_heading')}</span>
                              <span className="font-mono text-gray-900 dark:text-gray-100 font-bold">
                                {currentCandidate.directionHeading}° ({currentCandidate.trafficFlowDirection})
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons with High Contrast */}
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => handleCandidateDecision('approve')}
                              className="py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
                            >
                              <CheckCircle size={19} weight="bold" />
                              <span>{t('reviewer.btn_approve')}</span>
                              <kbd className="px-2 py-0.5 rounded bg-black/20 text-xs font-mono">A</kbd>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCandidateDecision('reject')}
                              className="py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-rose-600/20 active:scale-95 transition-all cursor-pointer"
                            >
                              <XCircle size={19} weight="bold" />
                              <span>{t('reviewer.btn_reject')}</span>
                              <kbd className="px-2 py-0.5 rounded bg-black/20 text-xs font-mono">R</kbd>
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setShowCatalogModal(true)}
                              className={`py-3 px-4 rounded-xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                                isDark
                                  ? 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-200'
                                  : 'bg-white hover:bg-gray-100 border-gray-200 text-gray-800'
                              }`}
                            >
                              <PencilSimple size={18} className="text-[#007b8b] dark:text-cyan-400" weight="bold" />
                              <span>{t('reviewer.btn_correct')}</span>
                              <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-black/20 text-[10px] font-mono">C</kbd>
                            </button>

                            <button
                              type="button"
                              onClick={() => setShowFlagModal(true)}
                              className={`py-3 px-4 rounded-xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                                isDark
                                  ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300'
                                  : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-900'
                              }`}
                            >
                              <Flag size={18} weight="bold" />
                              <span>{t('reviewer.btn_flag')}</span>
                              <kbd className="px-1.5 py-0.5 rounded bg-amber-200 dark:bg-black/20 text-[10px] font-mono">F</kbd>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Candidate Footer Navigation */}
                    <div className={`px-6 sm:px-8 py-3.5 border-t flex items-center justify-between text-xs sm:text-sm ${
                      isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-100 bg-gray-50/70'
                    }`}>
                      <button
                        type="button"
                        disabled={currentIndex === 0}
                        onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
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
                        disabled={currentIndex === filteredCandidates.length - 1}
                        onClick={() => setCurrentIndex((i) => Math.min(filteredCandidates.length - 1, i + 1))}
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
                ) : (
                  <div className="text-center py-20">
                    <CheckCircle size={56} className="text-emerald-500 mx-auto mb-4" weight="fill" />
                    <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">{t('reviewer.queue_clear_title')}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{t('reviewer.queue_clear_desc')}</p>
                  </div>
                )}
              </div>
            ) : (
              /* Revalidation Mode Panel */
              <RevalidationWorkspacePanel
                candidate={currentReval}
                currentIndex={revalIndex}
                totalCount={revalCandidates.length}
                onDecision={handleRevalidationDecision}
                onPrev={() => setRevalIndex((i) => Math.max(0, i - 1))}
                onNext={() => setRevalIndex((i) => Math.min(revalCandidates.length - 1, i + 1))}
                canPrev={revalIndex > 0}
                canNext={revalIndex < revalCandidates.length - 1}
              />
            )}
          </div>
        </div>

        {/* ─── 5. Upgraded QCVN 41 Visual Catalog Modal ─────────────────────────── */}
        {showCatalogModal && (
          <Modal
            isOpen={showCatalogModal}
            onClose={() => setShowCatalogModal(false)}
            maxWidth="max-w-3xl"
          >
            <div className={`w-full rounded-2xl border shadow-2xl overflow-hidden ${
              isDark ? 'bg-[#071317] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'
            }`}>
              <div className="p-5 sm:p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <BookOpen size={22} className="text-[#007b8b] dark:text-[#00c4de]" weight="bold" />
                  <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white">
                    {t('reviewer.modal_catalog_title')}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCatalogModal(false)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Category Filter Pills & Search Input */}
              <div className="p-5 border-b border-gray-200 dark:border-white/10 space-y-3 bg-gray-50/50 dark:bg-black/20">
                <div className="relative">
                  <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder={t('reviewer.modal_search_placeholder')}
                    className={`w-full pl-11 pr-4 py-2.5 text-xs sm:text-sm font-medium rounded-xl border outline-none transition-all ${
                      isDark
                        ? 'bg-black/40 border-white/15 text-white placeholder:text-gray-500 focus:border-[#00c4de]'
                        : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#007b8b]'
                    }`}
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setCatalogCat('all')}
                    className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer shrink-0 ${
                      catalogCat === 'all'
                        ? 'bg-[#007b8b] dark:bg-[#00c4de] text-white dark:text-black font-extrabold'
                        : isDark ? 'bg-white/5 text-gray-300 hover:text-white' : 'bg-white border border-gray-200 text-gray-700'
                    }`}
                  >
                    {t('reviewer.catalog_cat_all')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogCat('prohibitory')}
                    className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer shrink-0 ${
                      catalogCat === 'prohibitory'
                        ? 'bg-red-600 text-white font-extrabold'
                        : isDark ? 'bg-white/5 text-red-300 hover:text-white' : 'bg-white border border-gray-200 text-red-700'
                    }`}
                  >
                    {t('reviewer.catalog_cat_p')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogCat('warning')}
                    className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer shrink-0 ${
                      catalogCat === 'warning'
                        ? 'bg-amber-500 text-black font-extrabold'
                        : isDark ? 'bg-white/5 text-amber-300 hover:text-white' : 'bg-white border border-gray-200 text-amber-800'
                    }`}
                  >
                    {t('reviewer.catalog_cat_w')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogCat('mandatory')}
                    className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer shrink-0 ${
                      catalogCat === 'mandatory'
                        ? 'bg-blue-600 text-white font-extrabold'
                        : isDark ? 'bg-white/5 text-blue-300 hover:text-white' : 'bg-white border border-gray-200 text-blue-700'
                    }`}
                  >
                    {t('reviewer.catalog_cat_r')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogCat('guide')}
                    className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer shrink-0 ${
                      catalogCat === 'guide'
                        ? 'bg-[#007b8b] dark:bg-cyan-500 text-white dark:text-black font-extrabold'
                        : isDark ? 'bg-white/5 text-cyan-300 hover:text-white' : 'bg-white border border-gray-200 text-teal-700'
                    }`}
                  >
                    {t('reviewer.catalog_cat_i')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogCat('additional')}
                    className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer shrink-0 ${
                      catalogCat === 'additional'
                        ? 'bg-gray-700 text-white font-extrabold'
                        : isDark ? 'bg-white/5 text-gray-300 hover:text-white' : 'bg-white border border-gray-200 text-gray-700'
                    }`}
                  >
                    {t('reviewer.catalog_cat_s')}
                  </button>
                </div>
              </div>

              {/* Signs List */}
              <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100 dark:divide-white/5 p-3">
                {filteredCatalog.map((sign: TrafficCatalogSign) => (
                  <button
                    key={sign.code}
                    type="button"
                    onClick={() => {
                      handleCandidateDecision('approve', sign.code)
                      setShowCatalogModal(false)
                    }}
                    className={`w-full p-3.5 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer ${
                      isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="min-w-0 pr-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#007b8b]/10 dark:bg-[#00c4de]/15 text-[#007b8b] dark:text-[#00c4de] border border-[#007b8b]/30 dark:border-[#00c4de]/30">
                          {sign.code}
                        </span>
                        <span className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">{sign.nameVi}</span>
                        <span className="text-[10px] font-mono text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/5">
                          {sign.shape} • {sign.color}
                        </span>
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400 block mt-1">{sign.nameEn}</span>
                      <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400 block mt-0.5">{sign.standardRef}</span>
                    </div>

                    <span className="text-xs font-bold text-[#007b8b] dark:text-[#00c4de] shrink-0">
                      {t('reviewer.btn_select_approve')}
                    </span>
                  </button>
                ))}
              </div>

              {/* Bottom Propose New Sign Type Link */}
              <div className="p-4 border-t border-gray-200 dark:border-white/10 text-center bg-gray-50/70 dark:bg-white/[0.01]">
                <span className="text-xs text-gray-600 dark:text-gray-400">{t('reviewer.catalog_not_found')} </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowCatalogModal(false)
                    setShowNewSignModal(true)
                  }}
                  className="text-xs font-bold text-[#007b8b] dark:text-[#00c4de] hover:underline cursor-pointer ml-1"
                >
                  {t('reviewer.catalog_report_prompt')} ➔
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* ─── 6. Flag Candidate Modal ─────────────────────────────────────────── */}
        {currentCandidate && (
          <FlagCandidateModal
            isOpen={showFlagModal}
            onClose={() => setShowFlagModal(false)}
            candidateId={currentCandidate.id}
            signCode={currentCandidate.code}
            onConfirmFlag={(reason: FlagReasonCode, notes: string) => {
              handleCandidateDecision('flag', undefined, `${reason}: ${notes}`)
            }}
          />
        )}

        {/* ─── 7. New Sign Type Modal Integration ──────────────────────────────── */}
        <NewSignTypeModal
          isOpen={showNewSignModal}
          onClose={() => setShowNewSignModal(false)}
          initialLat={currentCandidate?.lat.toString() || '10.7769'}
          initialLng={currentCandidate?.lng.toString() || '106.7009'}
        />

        {/* ─── 8. Session History Drawer ───────────────────────────────────────── */}
        <ReviewHistoryDrawer
          isOpen={showHistoryDrawer}
          onClose={() => setShowHistoryDrawer(false)}
          historyItems={historyItems}
          onUndo={handleUndo}
        />
      </div>
    </div>
  )
}

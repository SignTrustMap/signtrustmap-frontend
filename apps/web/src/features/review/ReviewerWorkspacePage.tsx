import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  PlusCircle,
  ClockCounterClockwise,
  Sparkle,
} from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { useTranslation } from 'react-i18next'
import {
  mockTrafficCatalog,
  type CandidateToReview,
  type RevalidationCandidate,
  type ReviewHistoryItem,
  type FlagReasonCode,
  type ReviewerMetrics,
} from '@/data'
import { reviewsService } from '@/api/services/reviews.service'
import { resolveMediaUrl } from './utils/resolveMediaUrl'
import { PageHeader } from '@/components/common/PageHeader'
import { NewSignTypeModal } from '@/features/survey/components/NewSignTypeModal'
import { useReviewHotkeys } from './hooks/useReviewHotkeys'
import {
  FlagCandidateModal,
  RevalidationWorkspacePanel,
  ReviewHistoryDrawer,
  ReviewerStatsCards,
  ReviewerQueueFilterBar,
  CandidateWorkspaceCard,
  ReviewerCatalogModal,
  DeclineCandidateModal,
  SubmissionSummaryView,
  type QueueFilterType,
  type CatalogCategoryFilter,
} from './components'

const defaultReviewerMetrics: ReviewerMetrics = {
  reliabilityScore: 1.0,
  consensusAccuracy: 100,
  accuracyPercent: 100,
  totalReviewed: 0,
  approvedCount: 0,
  rejectedCount: 0,
  creditsEarned: 0,
}

export default function ReviewerWorkspacePage() {
  const { isDark } = useTheme()
  const { t } = useTranslation('common')
  const toast = useToast()

  // Workspace Mode: 'candidate' (Flow 4) | 'revalidation' (Flow 8)
  const [activeMode, setActiveMode] = useState<'candidate' | 'revalidation'>('candidate')

  // Candidate Review State (Clean Live API Queue)
  const [candidates, setCandidates] = useState<CandidateToReview[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [activeView, setActiveView] = useState<'crop' | 'context'>('crop')
  const [filterMode, setFilterMode] = useState<QueueFilterType>('all')
  const [isLoading, setIsLoading] = useState(true)

  // Revalidation Review State (Live API Queue)
  const [revalCandidates, setRevalCandidates] = useState<RevalidationCandidate[]>([])
  const [revalIndex, setRevalIndex] = useState(0)

  // Modals & Drawers
  const [showCatalogModal, setShowCatalogModal] = useState(false)
  const [catalogSearch, setCatalogSearch] = useState('')
  const [catalogCat, setCatalogCat] = useState<CatalogCategoryFilter>('all')
  const [showFlagModal, setShowFlagModal] = useState(false)
  const [showDeclineModal, setShowDeclineModal] = useState(false)
  const [showNewSignModal, setShowNewSignModal] = useState(false)
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false)

  // Metrics & History State
  const [stats, setStats] = useState<ReviewerMetrics>(defaultReviewerMetrics)
  const [historyItems, setHistoryItems] = useState<ReviewHistoryItem[]>([])

  // Load live queue and stats from API
  useEffect(() => {
    let active = true
    setIsLoading(true)

    reviewsService
      .getReviewQueue({ page: 1, pageSize: 50 })
      .then((res) => {
        if (!active) return
        if (res?.items && res.items.length > 0) {
          const mapped: CandidateToReview[] = res.items.map((item, idx) => {
            const type = item.predictedSignType
            const crop = resolveMediaUrl(item.signCropUrl)
            const frame = resolveMediaUrl(item.bestFrameUrl)
            return {
              id: item.id,
              sourceTripId: item.submissionId ? `TRIP-${item.submissionId.slice(0, 8)}` : 'TRIP-SURVEY',
              yoloTrackId: idx + 1,
              code: type?.signCode || 'P.102',
              suggestedName: type?.nameVi || type?.nameEn || 'Biển báo giao thông',
              category: (type?.signCode?.charAt(0) || 'P') as any,
              confidence: 0.88,
              lat: item.submission?.latitude ?? 10.7769,
              lng: item.submission?.longitude ?? 106.7009,
              roadName: 'Đường khảo sát (Camera GPS)',
              directionHeading: 45,
              trafficFlowDirection: 'Northbound',
              estimatedDistanceMeters: 12.5,
              cropImageUrl: crop || '',
              contextImageUrl: frame || '',
              status: 'Pending',
            }
          })
          setCandidates(mapped)
        } else {
          setCandidates([])
        }
      })
      .catch((err) => {
        console.warn('[ReviewerWorkspacePage] Failed to fetch live review queue:', err)
        if (active) setCandidates([])
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    reviewsService
      .getMyStats()
      .then((res) => {
        if (active && res) {
          const accuracy = res.accuracyRate != null ? Math.round(res.accuracyRate * 100) : 100
          setStats((prev) => ({
            ...prev,
            reliabilityScore: res.reliabilityScore ?? prev.reliabilityScore,
            consensusAccuracy: accuracy,
            accuracyPercent: accuracy,
            totalReviewed: res.totalReviews ?? prev.totalReviewed,
            approvedCount: res.approved ?? prev.approvedCount,
            rejectedCount: res.rejected ?? prev.rejectedCount,
          }))
        }
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [])

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

      // Asynchronously record vote in backend API
      if (action === 'flag') {
        reviewsService
          .reportCandidate(candidateId, { reason: flagNotes || 'Flagged candidate' })
          .catch(() => {})
      } else {
        reviewsService
          .castVote(candidateId, {
            vote: action === 'approve' ? 1 : -1,
            suggestedSignTypeId: correctedCode ? Number(correctedCode) || undefined : undefined,
          })
          .catch(() => {})
      }

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

      if (item.candidateId) {
        reviewsService.undoVote(item.candidateId).catch(() => {})
      }

      setHistoryItems((prev) => prev.filter((h) => h.id !== item.id))
      toast.info(`${t('reviewer.toast_undone')} ${item.candidateId}`)
    },
    [t, toast]
  )

  // Quick Undo Last Action
  const handleUndoLast = useCallback(() => {
    if (historyItems.length === 0) return
    handleUndo(historyItems[0])
  }, [historyItems, handleUndo])

  // Skip Candidate (Mobile Parity: Skip current sign)
  const handleSkip = useCallback(() => {
    if (!currentCandidate) return
    const candidateId = currentCandidate.id
    const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

    const historyEntry: ReviewHistoryItem = {
      id: `HIST-${Date.now()}`,
      candidateId,
      signCode: currentCandidate.code,
      signName: currentCandidate.suggestedName,
      action: 'Skipped',
      timestamp: now,
      mode: 'candidate',
    }
    setHistoryItems((prev) => [historyEntry, ...prev])
    reviewsService.skipCandidate(candidateId).catch(() => {})
    toast.info(t('reviewer.toast_skipped'))

    if (currentIndex < filteredCandidates.length - 1) {
      setCurrentIndex((i) => i + 1)
    } else {
      setCurrentIndex(filteredCandidates.length)
    }
  }, [currentCandidate, currentIndex, filteredCandidates.length, t, toast])

  // Confirm Decline from DeclineCandidateModal
  const handleConfirmDecline = useCallback(
    (reason: string, detail?: string) => {
      setShowDeclineModal(false)
      handleCandidateDecision('reject', undefined, detail ? `${reason}: ${detail}` : reason)
    },
    [handleCandidateDecision]
  )

  // Keyboard Shortcuts (Hotkeys 1/A, 2/R, 3/C, 4/S, F, Space, Ctrl+Z)
  useReviewHotkeys(
    {
      onApprove: () => handleCandidateDecision('approve'),
      onReject: () => setShowDeclineModal(true),
      onSuggest: () => setShowCatalogModal(true),
      onSkip: handleSkip,
      onFlag: () => setShowFlagModal(true),
      onToggleView: () => setActiveView((v) => (v === 'crop' ? 'context' : 'crop')),
      onUndo: handleUndoLast,
    },
    activeMode === 'candidate' &&
      !showCatalogModal &&
      !showFlagModal &&
      !showDeclineModal &&
      !showNewSignModal &&
      !showHistoryDrawer &&
      Boolean(currentCandidate)
  )

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
        {/* ─── 1. Page Header ────────────────────────────────────────── */}
        <PageHeader
          title={t('reviewer.title')}
          subtitle={t('reviewer.subtitle')}
          bordered
          actions={
            <div className="flex items-center gap-2.5 shrink-0">
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
          }
        />

        {/* ─── 2. Top Stats Bar ──────────────────────────────────────── */}
        <ReviewerStatsCards stats={stats} isDark={isDark} />

        {/* ─── 3. Mode Switcher Tabs ─────────────────────────────────── */}
        <div
          className={`rounded-2xl border overflow-hidden ${
            isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-[#E8E4E3] shadow-xs'
          }`}
        >
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
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                  activeMode === 'candidate'
                    ? isDark
                      ? 'bg-[#00c4de]/20 text-[#00c4de]'
                      : 'bg-[#007b8b]/15 text-[#007b8b]'
                    : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300'
                }`}
              >
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
              <ClockCounterClockwise
                size={16}
                weight={activeMode === 'revalidation' ? 'bold' : 'regular'}
              />
              <span>{t('reviewer.tab_reval')}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                  activeMode === 'revalidation'
                    ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300'
                    : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300'
                }`}
              >
                {revalCandidates.filter((r) => r.status === 'Pending').length}
              </span>
            </button>
          </div>

          {/* ─── 4. Main Tab Body ───────────────────────────────────── */}
          <div className="p-4 sm:p-6 space-y-5">
            {activeMode === 'candidate' ? (
              <div className="space-y-4">
                {candidates.length > 0 && (
                  <ReviewerQueueFilterBar
                    filterMode={filterMode}
                    totalCandidates={candidates.length}
                    isDark={isDark}
                    onFilterChange={(mode) => {
                      setFilterMode(mode)
                      setCurrentIndex(0)
                    }}
                  />
                )}

                {isLoading ? (
                  <div className="h-96 flex flex-col items-center justify-center gap-3">
                    <div className="w-9 h-9 border-4 border-[#00c4de] border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-gray-500 font-medium">Đang tải danh sách biển báo chờ duyệt...</p>
                  </div>
                ) : currentCandidate ? (
                  <CandidateWorkspaceCard
                    candidate={currentCandidate}
                    currentIndex={currentIndex}
                    totalCandidates={filteredCandidates.length}
                    activeView={activeView}
                    isDark={isDark}
                    onViewChange={setActiveView}
                    onDecision={(action) =>
                      action === 'approve' ? handleCandidateDecision('approve') : setShowDeclineModal(true)
                    }
                    onOpenDecline={() => setShowDeclineModal(true)}
                    onSkip={handleSkip}
                    onOpenCatalog={() => setShowCatalogModal(true)}
                    onOpenFlag={() => setShowFlagModal(true)}
                    onUndo={handleUndoLast}
                    canUndo={historyItems.length > 0}
                    onPrev={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                    onNext={() =>
                      setCurrentIndex((i) => Math.min(filteredCandidates.length - 1, i + 1))
                    }
                    canPrev={currentIndex > 0}
                    canNext={currentIndex < filteredCandidates.length - 1}
                  />
                ) : historyItems.length > 0 ? (
                  <SubmissionSummaryView
                    historyItems={historyItems}
                    isDark={isDark}
                    onRecheckSubmission={() => setCurrentIndex(0)}
                  />
                ) : (
                  <div
                    className={`py-16 px-6 text-center rounded-2xl border space-y-4 ${
                      isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-[#007b8b]/10 dark:bg-[#00c4de]/10 text-[#007b8b] dark:text-[#00c4de] flex items-center justify-center">
                      <Sparkle size={30} weight="duotone" />
                    </div>
                    <div className="max-w-md mx-auto space-y-1">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">
                        Hàng đợi thẩm định đang trống
                      </h3>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Hiện tại không có biển báo nào đang chờ bạn thẩm định. Biển báo trích xuất từ camera khảo sát và livestream sẽ tự động xuất hiện tại đây khi AI phân tích xong.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsLoading(true)
                        reviewsService
                          .getReviewQueue({ page: 1, pageSize: 50 })
                          .then((res) => {
                            if (res?.items && res.items.length > 0) {
                              const mapped: CandidateToReview[] = res.items.map((item, idx) => {
                                const type = item.predictedSignType
                                const crop = resolveMediaUrl(item.signCropUrl)
                                const frame = resolveMediaUrl(item.bestFrameUrl)
                                return {
                                  id: item.id,
                                  sourceTripId: item.submissionId ? `TRIP-${item.submissionId.slice(0, 8)}` : 'TRIP-SURVEY',
                                  yoloTrackId: idx + 1,
                                  code: type?.signCode || 'P.102',
                                  suggestedName: type?.nameVi || type?.nameEn || 'Biển báo giao thông',
                                  category: (type?.signCode?.charAt(0) || 'P') as any,
                                  confidence: 0.88,
                                  lat: item.submission?.latitude ?? 10.7769,
                                  lng: item.submission?.longitude ?? 106.7009,
                                  roadName: 'Đường khảo sát (Camera GPS)',
                                  directionHeading: 45,
                                  trafficFlowDirection: 'Northbound',
                                  estimatedDistanceMeters: 12.5,
                                  cropImageUrl: crop || '',
                                  contextImageUrl: frame || '',
                                  status: 'Pending',
                                }
                              })
                              setCandidates(mapped)
                            }
                          })
                          .finally(() => setIsLoading(false))
                      }}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        isDark
                          ? 'bg-white/5 hover:bg-white/10 border-white/10 text-[#00c4de]'
                          : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-[#007b8b]'
                      }`}
                    >
                      <ClockCounterClockwise size={15} />
                      <span>Kiểm tra lại hàng đợi</span>
                    </button>
                  </div>
                )}
              </div>
            ) : revalCandidates.length > 0 ? (
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
            ) : (
              <div
                className={`py-16 px-6 text-center rounded-2xl border space-y-4 ${
                  isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-gray-200'
                }`}
              >
                <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                  <ClockCounterClockwise size={30} weight="duotone" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Chưa có nhiệm vụ tái thẩm định
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Hiện tại chưa có biển báo nào cần xác minh thay đổi thực địa hoặc kiểm tra định kỳ.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── 5. Visual Catalog Modal ───────────────────────────────── */}
        <ReviewerCatalogModal
          isOpen={showCatalogModal}
          catalogSearch={catalogSearch}
          catalogCat={catalogCat}
          filteredCatalog={filteredCatalog}
          isDark={isDark}
          onClose={() => setShowCatalogModal(false)}
          onSearchChange={setCatalogSearch}
          onCategoryChange={setCatalogCat}
          onSelectSign={(signCode) => handleCandidateDecision('approve', signCode)}
          onOpenNewSignModal={() => setShowNewSignModal(true)}
        />

        {/* ─── 5.1 Decline Candidate Modal (Mobile Parity) ──────────── */}
        {currentCandidate && (
          <DeclineCandidateModal
            isOpen={showDeclineModal}
            onClose={() => setShowDeclineModal(false)}
            candidateId={currentCandidate.id}
            signCode={currentCandidate.code}
            isDark={isDark}
            onConfirmDecline={handleConfirmDecline}
            onOpenCatalog={() => setShowCatalogModal(true)}
          />
        )}

        {/* ─── 6. Flag Candidate Modal ───────────────────────────────── */}
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

        {/* ─── 7. New Sign Type Modal ────────────────────────────────── */}
        <NewSignTypeModal
          isOpen={showNewSignModal}
          onClose={() => setShowNewSignModal(false)}
          initialLat={currentCandidate?.lat.toString() || '10.7769'}
          initialLng={currentCandidate?.lng.toString() || '106.7009'}
        />

        {/* ─── 8. Session History Drawer ─────────────────────────────── */}
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

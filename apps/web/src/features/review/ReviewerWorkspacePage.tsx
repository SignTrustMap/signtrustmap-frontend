import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  CheckCircle,
  PlusCircle,
  ClockCounterClockwise,
  Sparkle,
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
} from '@/data'
import { PageHeader } from '@/components/common/PageHeader'
import { NewSignTypeModal } from '@/features/survey/components/NewSignTypeModal'
import {
  FlagCandidateModal,
  RevalidationWorkspacePanel,
  ReviewHistoryDrawer,
  ReviewerStatsCards,
  ReviewerQueueFilterBar,
  CandidateWorkspaceCard,
  ReviewerCatalogModal,
  type QueueFilterType,
  type CatalogCategoryFilter,
} from './components'

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
                <ReviewerQueueFilterBar
                  filterMode={filterMode}
                  totalCandidates={candidates.length}
                  isDark={isDark}
                  onFilterChange={(mode) => {
                    setFilterMode(mode)
                    setCurrentIndex(0)
                  }}
                />

                {currentCandidate ? (
                  <CandidateWorkspaceCard
                    candidate={currentCandidate}
                    currentIndex={currentIndex}
                    totalCandidates={filteredCandidates.length}
                    activeView={activeView}
                    isDark={isDark}
                    onViewChange={setActiveView}
                    onDecision={(action) => handleCandidateDecision(action)}
                    onOpenCatalog={() => setShowCatalogModal(true)}
                    onOpenFlag={() => setShowFlagModal(true)}
                    onPrev={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                    onNext={() =>
                      setCurrentIndex((i) => Math.min(filteredCandidates.length - 1, i + 1))
                    }
                    canPrev={currentIndex > 0}
                    canNext={currentIndex < filteredCandidates.length - 1}
                  />
                ) : (
                  <div className="text-center py-20">
                    <CheckCircle
                      size={56}
                      className="text-emerald-500 mx-auto mb-4"
                      weight="fill"
                    />
                    <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                      {t('reviewer.queue_clear_title')}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {t('reviewer.queue_clear_desc')}
                    </p>
                  </div>
                )}
              </div>
            ) : (
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

import { useState, useEffect, useCallback, useMemo } from 'react'
import { PageHeader } from '@shared/ui'
import { ClockCounterClockwise } from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { useTranslation } from 'react-i18next'
import {
  mockTrafficCatalog,
  type CandidateToReview,
  type FlagReasonCode,
  type ReviewHistoryItem,
} from '@/data'
import { reviewsService } from '@/api/services/reviews.service'
import { resolveMediaUrl } from './utils/resolveMediaUrl'
import { useReviewHotkeys } from './hooks/useReviewHotkeys'
import {
  CandidateWorkspaceCard,
  ReviewerCatalogModal,
  FlagCandidateModal,
  DeclineCandidateModal,
  SubmissionSummaryView,
  type CatalogCategoryFilter,
} from './components'

/**
 * CandidateReviewPage orchestrates the Community Peer Review workflow for unverified traffic signs.
 * Implements exact mobile parity: 4 core actions (Approve, Decline modal with 5 reasons, Skip, Report),
 * sleek progress indicator, Keyboard Hotkeys (1/A, 2/R, 3/C, 4/S, F, Space, Ctrl+Z), and Submission Summary at queue completion.
 */
export function CandidateReviewPage() {
  const { t } = useTranslation('common')
  const { isDark } = useTheme()
  const toast = useToast()

  const [candidates, setCandidates] = useState<CandidateToReview[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [activeView, setActiveView] = useState<'crop' | 'context'>('crop')
  const [isLoading, setIsLoading] = useState(true)

  // Session History for Submission Summary
  const [sessionHistory, setSessionHistory] = useState<ReviewHistoryItem[]>([])

  // Modals
  const [showCatalogModal, setShowCatalogModal] = useState(false)
  const [catalogSearch, setCatalogSearch] = useState('')
  const [catalogCat, setCatalogCat] = useState<CatalogCategoryFilter>('all')
  const [showFlagModal, setShowFlagModal] = useState(false)
  const [showDeclineModal, setShowDeclineModal] = useState(false)

  // 1. Fetch review queue from backend API directly
  useEffect(() => {
    let active = true
    setIsLoading(true)
    reviewsService
      .getReviewQueue({ page: 1, pageSize: 50 })
      .then((res) => {
        if (!active) return
        if (res?.items && res.items.length > 0) {
          const mapped: CandidateToReview[] = res.items.map((item, index) => {
            const type = item.predictedSignType
            const crop = resolveMediaUrl(item.signCropUrl)
            const frame = resolveMediaUrl(item.bestFrameUrl)
            return {
              id: item.id,
              sourceTripId: item.submissionId ? `TRIP-${item.submissionId.slice(0, 8)}` : 'TRIP-SURVEY',
              yoloTrackId: index + 1,
              code: type?.signCode || 'P.102',
              suggestedName: type?.nameVi || type?.nameEn || 'Biển báo giao thông',
              category: (type?.signCode?.charAt(0) || 'P') as any,
              confidence: (item as any).confidenceScore ?? (item as any).confidence ?? 0.88,
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
        console.warn('[CandidateReviewPage] Failed to fetch queue from API:', err)
        if (active) setCandidates([])
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const currentCandidate = candidates[currentIndex] || null

  const handleRefreshQueue = useCallback(() => {
    setIsLoading(true)
    reviewsService
      .getReviewQueue({ page: 1, pageSize: 50 })
      .then((res) => {
        if (res?.items && res.items.length > 0) {
          const mapped: CandidateToReview[] = res.items.map((item, index) => {
            const type = item.predictedSignType
            const crop = resolveMediaUrl(item.signCropUrl)
            const frame = resolveMediaUrl(item.bestFrameUrl)
            return {
              id: item.id,
              sourceTripId: item.submissionId ? `TRIP-${item.submissionId.slice(0, 8)}` : 'TRIP-SURVEY',
              yoloTrackId: index + 1,
              code: type?.signCode || 'P.102',
              suggestedName: type?.nameVi || type?.nameEn || 'Biển báo giao thông',
              category: (type?.signCode?.charAt(0) || 'P') as any,
              confidence: (item as any).confidenceScore ?? (item as any).confidence ?? 0.88,
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
          setCurrentIndex(0)
        } else {
          setCandidates([])
        }
      })
      .catch((err) => {
        console.warn('[CandidateReviewPage] Failed to fetch queue:', err)
        setCandidates([])
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  // Filter Catalog Modal Signs
  const filteredCatalog = useMemo(() => {
    return mockTrafficCatalog.filter((sign) => {
      const matchSearch =
        sign.code.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        sign.nameVi.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        sign.nameEn.toLowerCase().includes(catalogSearch.toLowerCase())

      if (!matchSearch) return false
      if (catalogCat === 'all') return true
      return sign.category === catalogCat
    })
  }, [catalogCat, catalogSearch])

  // 1. Approve Handler
  const handleApprove = useCallback(async () => {
    if (!currentCandidate) return
    const candidateId = currentCandidate.id

    try {
      await reviewsService.castVote(candidateId, { vote: 1 })
      toast.success(`${t('reviewer.toast_approved')} ${currentCandidate.code}`)
    } catch (err) {
      console.warn('[CandidateReviewPage] API vote failed:', err)
    }

    setSessionHistory((prev) => [
      {
        id: candidateId,
        candidateId,
        signCode: currentCandidate.code,
        signName: currentCandidate.suggestedName,
        action: 'Approved',
        timestamp: new Date().toLocaleTimeString('vi-VN'),
        mode: 'candidate',
      },
      ...prev,
    ])

    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, status: 'Approved' } : c))
    )

    setCurrentIndex((i) => i + 1)
  }, [currentCandidate, t, toast])

  // 2. Decline Handler (triggers DeclineCandidateModal or confirmed reason)
  const handleConfirmDecline = useCallback(
    async (reason: string, detail?: string) => {
      if (!currentCandidate) return
      const candidateId = currentCandidate.id

      try {
        await reviewsService.castVote(candidateId, {
          vote: -1,
          declineReason: reason,
          declineNote: detail,
        })
        toast.error(`${t('reviewer.toast_rejected')} ${candidateId}`)
      } catch (err) {
        console.warn('[CandidateReviewPage] API decline failed:', err)
      }

      setSessionHistory((prev) => [
        {
          id: candidateId,
          candidateId,
          signCode: currentCandidate.code,
          signName: currentCandidate.suggestedName,
          action: 'Rejected',
          timestamp: new Date().toLocaleTimeString('vi-VN'),
          details: detail ? `${reason}: ${detail}` : reason,
          mode: 'candidate',
        },
        ...prev,
      ])

      setCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, status: 'Rejected' } : c))
      )

      setCurrentIndex((i) => i + 1)
    },
    [currentCandidate, t, toast]
  )

  // 3. Skip Handler (mobile parity: Skip current sign)
  const handleSkip = useCallback(async () => {
    if (!currentCandidate) return
    const candidateId = currentCandidate.id

    try {
      await reviewsService.skipCandidate(candidateId)
      toast.info(t('reviewer.toast_skipped', 'Đã bỏ qua biển báo (Sign skipped)'))
    } catch (err) {
      console.warn('[CandidateReviewPage] API skip failed:', err)
    }

    setSessionHistory((prev) => [
      {
        id: candidateId,
        candidateId,
        signCode: currentCandidate.code,
        signName: currentCandidate.suggestedName,
        action: 'Skipped',
        timestamp: new Date().toLocaleTimeString('vi-VN'),
        mode: 'candidate',
      },
      ...prev,
    ])

    setCurrentIndex((i) => i + 1)
  }, [currentCandidate, t, toast])

  // 4. Suggest Corrected Sign from Catalog Picker Modal
  const handleSelectCorrectedSign = useCallback(
    async (signCode: string) => {
      if (!currentCandidate) return
      setShowCatalogModal(false)

      const foundSign = mockTrafficCatalog.find((s) => s.code === signCode)
      const signTypeId = foundSign ? Number(foundSign.code.replace(/\D/g, '')) || 102 : 102

      try {
        await reviewsService.castVote(currentCandidate.id, {
          vote: -1,
          suggestedSignTypeId: signTypeId,
          declineReason: 'Incorrect Sign Type',
          declineNote: `Corrected to ${signCode}`,
        })
        toast.success(`${t('reviewer.toast_corrected')} ${signCode}`)
      } catch (err) {
        console.warn('[CandidateReviewPage] API suggest vote failed:', err)
      }

      setSessionHistory((prev) => [
        {
          id: currentCandidate.id,
          candidateId: currentCandidate.id,
          signCode,
          signName: foundSign?.nameVi || currentCandidate.suggestedName,
          action: 'Corrected',
          timestamp: new Date().toLocaleTimeString('vi-VN'),
          details: `Corrected to ${signCode}`,
          mode: 'candidate',
        },
        ...prev,
      ])

      setCandidates((prev) =>
        prev.map((c) =>
          c.id === currentCandidate.id
            ? { ...c, status: 'Approved', code: signCode, suggestedName: foundSign?.nameVi || c.suggestedName }
            : c
        )
      )

      setCurrentIndex((i) => i + 1)
    },
    [currentCandidate, t, toast]
  )

  // 5. Flag / Report Submission
  const handleConfirmFlag = useCallback(
    async (reason: FlagReasonCode, notes: string) => {
      if (!currentCandidate) return
      setShowFlagModal(false)

      try {
        await reviewsService.reportCandidate(currentCandidate.id, {
          reason: `${reason}: ${notes || 'Flagged by reviewer'}`,
        })
        toast.warning(`${t('reviewer.toast_flagged')} ${currentCandidate.id}`)
      } catch (err) {
        console.warn('[CandidateReviewPage] API report failed:', err)
      }

      setSessionHistory((prev) => [
        {
          id: currentCandidate.id,
          candidateId: currentCandidate.id,
          signCode: currentCandidate.code,
          signName: currentCandidate.suggestedName,
          action: 'Flagged',
          timestamp: new Date().toLocaleTimeString('vi-VN'),
          details: `${reason}: ${notes}`,
          mode: 'candidate',
        },
        ...prev,
      ])

      setCandidates((prev) =>
        prev.map((c) => (c.id === currentCandidate.id ? { ...c, status: 'Flagged' } : c))
      )

      setCurrentIndex((i) => i + 1)
    },
    [currentCandidate, t, toast]
  )

  // 6. Undo Last Review
  const handleUndo = useCallback(async () => {
    if (sessionHistory.length === 0) return
    const lastItem = sessionHistory[0]

    try {
      await reviewsService.undoVote(lastItem.candidateId)
    } catch {
      // Offline fallback
    }

    setSessionHistory((prev) => prev.slice(1))
    setCandidates((prev) =>
      prev.map((c) => (c.id === lastItem.candidateId ? { ...c, status: 'Pending' } : c))
    )
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1)
    }
    toast.info(`${t('reviewer.toast_undone')} ${lastItem.signCode}`)
  }, [currentIndex, sessionHistory, t, toast])

  // Keyboard Hotkeys Engine (FR 2.2)
  const isModalOpen = showCatalogModal || showFlagModal || showDeclineModal
  useReviewHotkeys(
    {
      onApprove: handleApprove,
      onReject: () => setShowDeclineModal(true),
      onSuggest: () => setShowCatalogModal(true),
      onSkip: handleSkip,
      onFlag: () => setShowFlagModal(true),
      onToggleView: () => setActiveView((v) => (v === 'crop' ? 'context' : 'crop')),
      onUndo: handleUndo,
    },
    !isModalOpen && Boolean(currentCandidate)
  )

  return (
    <div className={`min-h-screen pb-12 transition-colors ${isDark ? 'bg-[#030708]' : 'bg-[#F8F7F7]'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <PageHeader
          title={t('reviewer.title_page', 'Thẩm định Biển báo')}
          subtitle={t('reviewer.subtitle_page', 'Xác thực các biển báo do AI nhận diện từ video/ảnh khảo sát')}
          actions={
            <button
              type="button"
              onClick={handleRefreshQueue}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300'
                  : 'bg-white hover:bg-gray-100 border-gray-200 text-gray-700 shadow-xs'
              }`}
            >
              <ClockCounterClockwise size={15} />
              <span>Làm mới</span>
            </button>
          }
        />

        {/* Sleek Mobile-like Queue Progress Bar */}
        {candidates.length > 0 && currentCandidate && (
          <div
            className={`space-y-2 p-3.5 sm:p-4 rounded-2xl border transition-colors ${
              isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-gray-200 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-gray-600 dark:text-gray-400">
                Tiến trình thẩm định:{' '}
                <strong className="text-gray-900 dark:text-white">{currentIndex + 1}</strong> / {candidates.length} biển báo
              </span>
              <span className="text-[#007b8b] dark:text-[#00c4de] font-black">
                {Math.round(((currentIndex + 1) / candidates.length) * 100)}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-[#007b8b] to-[#00c4de] transition-all duration-300 rounded-full"
                style={{ width: `${Math.round(((currentIndex + 1) / candidates.length) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-[#00c4de] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-500 font-medium">Đang tải danh sách biển báo chờ duyệt...</p>
          </div>
        ) : currentCandidate ? (
          <CandidateWorkspaceCard
            candidate={currentCandidate}
            currentIndex={currentIndex}
            totalCandidates={candidates.length}
            activeView={activeView}
            isDark={isDark}
            onViewChange={setActiveView}
            onDecision={(act) => (act === 'approve' ? handleApprove() : setShowDeclineModal(true))}
            onOpenDecline={() => setShowDeclineModal(true)}
            onSkip={handleSkip}
            onOpenFlag={() => setShowFlagModal(true)}
            onUndo={handleUndo}
            canUndo={sessionHistory.length > 0}
          />
        ) : sessionHistory.length > 0 ? (
          <SubmissionSummaryView
            historyItems={sessionHistory}
            isDark={isDark}
            onRecheckSubmission={() => setCurrentIndex(0)}
          />
        ) : (
          <div
            className={`py-16 px-6 text-center rounded-2xl border space-y-4 ${
              isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-gray-200'
            }`}
          >
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Hàng đợi thẩm định đang trống
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Hiện tại không có biển báo nào cần thẩm định. Khi có dữ liệu khảo sát mới được tải lên và phân tích bởi AI, các biển báo sẽ hiển thị tại đây.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRefreshQueue}
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

        {/* Modal: Decline with mobile reasons */}
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

        {/* Modal: QCVN 41 Catalog Picker */}
        <ReviewerCatalogModal
          isOpen={showCatalogModal}
          catalogSearch={catalogSearch}
          catalogCat={catalogCat}
          filteredCatalog={filteredCatalog}
          isDark={isDark}
          onClose={() => setShowCatalogModal(false)}
          onSearchChange={setCatalogSearch}
          onCategoryChange={setCatalogCat}
          onSelectSign={handleSelectCorrectedSign}
          onOpenNewSignModal={() => {}}
        />

        {/* Modal: Flag / Report */}
        {currentCandidate && (
          <FlagCandidateModal
            isOpen={showFlagModal}
            onClose={() => setShowFlagModal(false)}
            candidateId={currentCandidate.id}
            signCode={currentCandidate.code}
            onConfirmFlag={handleConfirmFlag}
          />
        )}
      </div>
    </div>
  )
}

export default CandidateReviewPage

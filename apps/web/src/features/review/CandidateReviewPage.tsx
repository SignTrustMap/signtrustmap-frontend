import { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '@shared/ui'
import { ClockCounterClockwise, Sparkle } from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { useToast } from '@/context/ToastContext'
import { useTranslation } from 'react-i18next'
import {
  type CandidateToReview,
  type FlagReasonCode,
  type ReviewHistoryItem,
} from '@/data'
import { reviewsService } from '@/api/services/reviews.service'
import type { BackendCatalogSignType } from '@/api/services/catalog.service'
import { resolveMediaUrl } from './utils/resolveMediaUrl'
import { useReviewHotkeys } from './hooks/useReviewHotkeys'
import {
  CandidateWorkspaceCard,
  ReviewerCatalogModal,
  FlagCandidateModal,
  DeclineCandidateModal,
  SubmissionSummaryView,
  ReviewGuideModal,
} from './components'
import { ProposeSignModal } from '@/features/catalog/components/ProposeSignModal'

/**
 * CandidateReviewPage orchestrates the Community Peer Review workflow for unverified traffic signs.
 * Implements exact mobile parity: 4 core actions (Approve, Decline modal with reasons, Skip, Report),
 * sleek progress indicator, Quick Suggest chips, Keyboard Hotkeys (1/A, 2/R, 4/S, F, Space, Ctrl+Z),
 * and an interactive Submission Summary at queue completion with batch reload and inline undo.
 */
export function CandidateReviewPage() {
  const { t } = useTranslation('common')
  const { isDark } = useTheme()
  const toast = useToast()

  const [candidates, setCandidates] = useState<CandidateToReview[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [activeView, setActiveView] = useState<'crop' | 'context'>('crop')
  const [isLoading, setIsLoading] = useState(true)
  const [isAssigning, setIsAssigning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittingAction, setSubmittingAction] = useState<'approve' | 'reject' | 'skip' | 'flag' | null>(null)

  // Session History for Submission Summary
  const [sessionHistory, setSessionHistory] = useState<ReviewHistoryItem[]>([])

  // Modals
  const [showCatalogModal, setShowCatalogModal] = useState(false)
  const [showProposeModal, setShowProposeModal] = useState(false)
  const [showFlagModal, setShowFlagModal] = useState(false)
  const [showDeclineModal, setShowDeclineModal] = useState(false)
  const [showGuideModal, setShowGuideModal] = useState(false)

  // Robust GPS coordinate extractor from any backend model schema or nested payload
  const extractCandidateCoordinates = (item: any): { lat: number; lng: number } | null => {
    if (!item) return null
    const payload = item?.data || item?.candidate || item
    const target = payload?.candidate || payload

    // 1. Direct latitude/longitude or lat/lng on target or payload
    const rawLat = target?.latitude ?? target?.lat ?? item?.latitude ?? item?.lat
    const rawLng = target?.longitude ?? target?.lng ?? item?.longitude ?? item?.lng

    if (rawLat !== undefined && rawLat !== null && rawLng !== undefined && rawLng !== null) {
      const lat = typeof rawLat === 'number' ? rawLat : parseFloat(String(rawLat))
      const lng = typeof rawLng === 'number' ? rawLng : parseFloat(String(rawLng))
      if (!Number.isNaN(lat) && !Number.isNaN(lng) && (lat !== 0 || lng !== 0) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        return { lat, lng }
      }
    }

    // 2. locationContext.coordinates
    const loc = target?.locationContext || payload?.locationContext || item?.locationContext
    if (loc?.coordinates) {
      const c = loc.coordinates
      const lat = typeof c.latitude === 'number' ? c.latitude : parseFloat(String(c.latitude ?? c.lat))
      const lng = typeof c.longitude === 'number' ? c.longitude : parseFloat(String(c.longitude ?? c.lng))
      if (!Number.isNaN(lat) && !Number.isNaN(lng) && (lat !== 0 || lng !== 0)) {
        return { lat, lng }
      }
    }

    // 3. locationContext direct latitude/longitude
    if (loc?.latitude !== undefined && loc?.longitude !== undefined) {
      const lat = parseFloat(String(loc.latitude))
      const lng = parseFloat(String(loc.longitude))
      if (!Number.isNaN(lat) && !Number.isNaN(lng) && (lat !== 0 || lng !== 0)) {
        return { lat, lng }
      }
    }

    // 4. submission.latitude / submission.longitude
    const sub = target?.submission || payload?.submission || item?.submission
    if (sub?.latitude !== undefined && sub?.longitude !== undefined) {
      const lat = parseFloat(String(sub.latitude))
      const lng = parseFloat(String(sub.longitude))
      if (!Number.isNaN(lat) && !Number.isNaN(lng) && (lat !== 0 || lng !== 0)) {
        return { lat, lng }
      }
    }

    // 5. submission.note containing "GPS: lat, lon"
    const noteStr = sub?.note || target?.note || payload?.note || item?.note
    if (noteStr && typeof noteStr === 'string') {
      const match = noteStr.match(/GPS:\s*([+-]?\d+(?:\.\d+)?),\s*([+-]?\d+(?:\.\d+)?)/i)
      if (match) {
        const lat = parseFloat(match[1])
        const lng = parseFloat(match[2])
        if (!Number.isNaN(lat) && !Number.isNaN(lng) && (lat !== 0 || lng !== 0)) {
          return { lat, lng }
        }
      }
    }

    return null
  }

  // 1. Fetch review queue from backend API directly (includes own submissions for testing)
  useEffect(() => {
    let active = true
    setIsLoading(true)
    reviewsService
      .getReviewQueue({ page: 1, pageSize: 50, includeOwnSubmissions: true })
      .then((res) => {
        if (!active) return
        if (res?.items && res.items.length > 0) {
          // Identify survey baseline GPS from the first item with valid coordinates
          let surveyBaseCoords: { lat: number; lng: number } = { lat: 10.7769, lng: 106.7009 }
          for (const it of res.items) {
            const found = extractCandidateCoordinates(it)
            if (found) {
              surveyBaseCoords = found
              break
            }
          }

          const mapped: CandidateToReview[] = res.items.map((item, index) => {
            const type = item.predictedSignType
            const crop = resolveMediaUrl(item.signCropUrl)
            const frame = resolveMediaUrl(item.bestFrameUrl)
            const parsedCoords = extractCandidateCoordinates(item)
            if (parsedCoords) {
              surveyBaseCoords = parsedCoords
            }
            const coords = parsedCoords || surveyBaseCoords

            return {
              id: item.id,
              sourceTripId: item.submissionId ? `TRIP-${item.submissionId.slice(0, 8)}` : 'TRIP-SURVEY',
              yoloTrackId: index + 1,
              code: type?.signCode || 'P.102',
              suggestedName: type?.nameVi || type?.nameEn || 'Biển báo giao thông',
              category: (type?.signCode?.charAt(0) || 'P') as any,
              confidence: item.confidenceScore ?? 0.88,
              lat: coords.lat,
              lng: coords.lng,
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

  // 2. Fetch full spatial context & precise GPS coordinates for current candidate
  useEffect(() => {
    if (!currentCandidate?.id) return
    let active = true

    reviewsService
      .getCandidateDetail(currentCandidate.id)
      .then((detail: any) => {
        if (!active || !detail) return
        const parsedCoords = extractCandidateCoordinates(detail)
        const payload = detail?.data || detail?.candidate || detail
        const loc = payload?.locationContext || detail?.locationContext
        const road = loc?.displayLocation || loc?.nearbyRoad
        const direction = loc?.direction

        if (parsedCoords) {
          setCandidates((prev) =>
            prev.map((c) => {
              if (c.id !== currentCandidate.id) return c
              return {
                ...c,
                lat: parsedCoords.lat,
                lng: parsedCoords.lng,
                roadName: road || c.roadName,
                directionHeading: typeof direction === 'number' ? direction : c.directionHeading,
              }
            })
          )
        } else if (road) {
          setCandidates((prev) =>
            prev.map((c) => (c.id === currentCandidate.id ? { ...c, roadName: road } : c))
          )
        }
      })
      .catch((err) => {
        console.warn('[CandidateReviewPage] Failed to fetch candidate detail:', err)
      })

    return () => {
      active = false
    }
  }, [currentCandidate?.id])

  const handleRefreshQueue = useCallback(() => {
    setIsLoading(true)
    reviewsService
      .getReviewQueue({ page: 1, pageSize: 50, includeOwnSubmissions: true })
      .then((res) => {
        if (res?.items && res.items.length > 0) {
          let surveyBaseCoords: { lat: number; lng: number } = { lat: 10.7769, lng: 106.7009 }
          for (const it of res.items) {
            const found = extractCandidateCoordinates(it)
            if (found) {
              surveyBaseCoords = found
              break
            }
          }

          const mapped: CandidateToReview[] = res.items.map((item, index) => {
            const type = item.predictedSignType
            const crop = resolveMediaUrl(item.signCropUrl)
            const frame = resolveMediaUrl(item.bestFrameUrl)
            const parsedCoords = extractCandidateCoordinates(item)
            if (parsedCoords) {
              surveyBaseCoords = parsedCoords
            }
            const coords = parsedCoords || surveyBaseCoords

            return {
              id: item.id,
              sourceTripId: item.submissionId ? `TRIP-${item.submissionId.slice(0, 8)}` : 'TRIP-SURVEY',
              yoloTrackId: index + 1,
              code: type?.signCode || 'P.102',
              suggestedName: type?.nameVi || type?.nameEn || 'Biển báo giao thông',
              category: (type?.signCode?.charAt(0) || 'P') as any,
              confidence: (item as any).confidenceScore ?? (item as any).confidence ?? 0.88,
              lat: coords.lat,
              lng: coords.lng,
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

  // Quick Action: Test Assign / Reset queue with test candidates
  const handleTestAssign = useCallback(async () => {
    setIsAssigning(true)
    try {
      const res = await reviewsService.testAssign()
      toast.success(res?.message || t('reviewer.toast_batch_loaded', 'Đã nạp đợt thẩm định mới!'))
      handleRefreshQueue()
    } catch (err: any) {
      console.warn('[CandidateReviewPage] Test assign failed:', err)
      toast.error(err?.message || 'Không thể nạp ứng viên test')
    } finally {
      setIsAssigning(false)
    }
  }, [handleRefreshQueue, t, toast])


  // 1. Approve Handler (uses testReview with fallback to castVote)
  const handleApprove = useCallback(async () => {
    if (!currentCandidate || isSubmitting) return
    const candidateId = currentCandidate.id
    setIsSubmitting(true)
    setSubmittingAction('approve')

    try {
      await reviewsService.testReview({
        candidateId,
        vote: 1,
      })
      toast.success(`${t('reviewer.toast_approved', 'Đã duyệt biển báo')} ${currentCandidate.code}`)
    } catch (err) {
      console.warn('[CandidateReviewPage] testReview failed, trying fallback vote:', err)
      try {
        await reviewsService.castVote(candidateId, { vote: 1 })
        toast.success(`${t('reviewer.toast_approved', 'Đã duyệt biển báo')} ${currentCandidate.code}`)
      } catch (err2) {
        console.warn('[CandidateReviewPage] API vote failed:', err2)
      }
    } finally {
      setIsSubmitting(false)
      setSubmittingAction(null)
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
  }, [currentCandidate, isSubmitting, t, toast])

  // 2. Decline Handler (uses testReview with fallback to castVote)
  const handleConfirmDecline = useCallback(
    async (reason: string, detail?: string) => {
      if (!currentCandidate || isSubmitting) return
      const candidateId = currentCandidate.id
      setIsSubmitting(true)
      setSubmittingAction('reject')

      try {
        await reviewsService.testReview({
          candidateId,
          vote: -1,
          declineReason: reason,
          declineNote: detail,
        })
        toast.error(`${t('reviewer.toast_rejected', 'Đã từ chối')} ${candidateId.slice(0, 8)}`)
      } catch (err) {
        console.warn('[CandidateReviewPage] testReview decline failed, trying fallback:', err)
        try {
          await reviewsService.castVote(candidateId, {
            vote: -1,
            declineReason: reason,
            declineNote: detail,
          })
          toast.error(`${t('reviewer.toast_rejected', 'Đã từ chối')} ${candidateId.slice(0, 8)}`)
        } catch (err2) {
          console.warn('[CandidateReviewPage] API decline failed:', err2)
        }
      } finally {
        setIsSubmitting(false)
        setSubmittingAction(null)
        setShowDeclineModal(false)
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
    [currentCandidate, isSubmitting, t, toast]
  )

  // 3. Skip Handler (Skip current sign)
  const handleSkip = useCallback(async () => {
    if (!currentCandidate || isSubmitting) return
    const candidateId = currentCandidate.id
    setIsSubmitting(true)
    setSubmittingAction('skip')

    try {
      await reviewsService.skipCandidate(candidateId)
      toast.info(t('reviewer.toast_skipped', 'Đã bỏ qua biển báo'))
    } catch (err) {
      console.warn('[CandidateReviewPage] API skip failed:', err)
    } finally {
      setIsSubmitting(false)
      setSubmittingAction(null)
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
  }, [currentCandidate, isSubmitting, t, toast])

  // 4. Suggest Corrected Sign from Catalog Picker or Quick Chips
  const handleSelectCorrectedSign = useCallback(
    async (signCode: string, signTypeId?: number, signObj?: BackendCatalogSignType) => {
      if (!currentCandidate || isSubmitting) return
      setShowCatalogModal(false)
      setIsSubmitting(true)
      setSubmittingAction('approve')

      const resolvedSignTypeId = signTypeId ?? (signObj?.id || 102)
      const resolvedName = signObj?.nameVi || currentCandidate.suggestedName

      try {
        await reviewsService.testReview({
          candidateId: currentCandidate.id,
          vote: -1,
          suggestedSignTypeId: resolvedSignTypeId,
          declineReason: 'Incorrect Sign Type',
          declineNote: `Corrected to ${signCode} (${resolvedName})`,
        })
        toast.success(`${t('reviewer.toast_corrected', 'Đã sửa loại biển báo và duyệt')} ${signCode}`)
      } catch (err) {
        console.warn('[CandidateReviewPage] testReview suggest failed, trying fallback:', err)
        try {
          await reviewsService.castVote(currentCandidate.id, {
            vote: -1,
            suggestedSignTypeId: resolvedSignTypeId,
            declineReason: 'Incorrect Sign Type',
            declineNote: `Corrected to ${signCode} (${resolvedName})`,
          })
          toast.success(`${t('reviewer.toast_corrected', 'Đã sửa loại biển báo và duyệt')} ${signCode}`)
        } catch (err2) {
          console.warn('[CandidateReviewPage] API suggest vote failed:', err2)
        }
      } finally {
        setIsSubmitting(false)
        setSubmittingAction(null)
      }

      setSessionHistory((prev) => [
        {
          id: currentCandidate.id,
          candidateId: currentCandidate.id,
          signCode,
          signName: resolvedName,
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
            ? { ...c, status: 'Approved', code: signCode, suggestedName: resolvedName }
            : c
        )
      )

      setCurrentIndex((i) => i + 1)
    },
    [currentCandidate, isSubmitting, t, toast]
  )

  // 5. Flag / Report Submission
  const handleConfirmFlag = useCallback(
    async (reason: FlagReasonCode, notes: string) => {
      if (!currentCandidate || isSubmitting) return
      const candidateId = currentCandidate.id
      setIsSubmitting(true)
      setSubmittingAction('flag')

      try {
        await reviewsService.reportCandidate(candidateId, {
          reason: `${reason}: ${notes || 'Flagged by reviewer'}`,
        })
        toast.warning(`${t('reviewer.toast_flagged', 'Đã gắn cờ báo lỗi biển báo')} ${currentCandidate.code}`)
      } catch (err) {
        console.warn('[CandidateReviewPage] API report failed:', err)
      } finally {
        setIsSubmitting(false)
        setSubmittingAction(null)
        setShowFlagModal(false)
      }

      setSessionHistory((prev) => [
        {
          id: candidateId,
          candidateId,
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
        prev.map((c) => (c.id === candidateId ? { ...c, status: 'Flagged' } : c))
      )

      setCurrentIndex((i) => i + 1)
    },
    [currentCandidate, isSubmitting, t, toast]
  )

  // 6. Undo Last Review (Workspace view)
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
    toast.info(`${t('reviewer.toast_undone', 'Đã hoàn tác đánh giá cho ca')} ${lastItem.signCode}`)
  }, [currentIndex, sessionHistory, t, toast])

  // 7. Undo item directly from Submission Summary View list
  const handleUndoSummaryItem = useCallback(
    async (candidateId: string) => {
      try {
        await reviewsService.undoVote(candidateId)
      } catch (err) {
        console.warn('[CandidateReviewPage] Undo summary item failed:', err)
      }

      setSessionHistory((prev) => prev.filter((item) => item.candidateId !== candidateId))
      setCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, status: 'Pending' } : c))
      )
      toast.info(t('reviewer.toast_undone', 'Đã hoàn tác đánh giá cho ca'))
    },
    [t, toast]
  )

  // 8. Next Batch Handler (from Submission Summary View)
  const handleNextBatch = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await reviewsService.testAssign()
      if (res?.assignedCount) {
        toast.success(t('reviewer.toast_batch_loaded', 'Đã nạp đợt thẩm định mới!'))
      }
    } catch {
      // fallback
    }
    setSessionHistory([])
    setCurrentIndex(0)
    handleRefreshQueue()
  }, [handleRefreshQueue, t, toast])

  // Keyboard Hotkeys Engine
  const isModalOpen = showCatalogModal || showFlagModal || showDeclineModal || showGuideModal
  useReviewHotkeys(
    {
      onApprove: handleApprove,
      onReject: () => !isSubmitting && setShowDeclineModal(true),
      onSuggest: () => !isSubmitting && setShowCatalogModal(true),
      onSkip: handleSkip,
      onFlag: () => !isSubmitting && setShowFlagModal(true),
      onToggleView: () => setActiveView((v) => (v === 'crop' ? 'context' : 'crop')),
      onUndo: handleUndo,
      onOpenGuide: () => setShowGuideModal(true),
    },
    !isModalOpen && Boolean(currentCandidate) && !isSubmitting
  )

  return (
    <div className={`min-h-screen pb-12 transition-colors ${isDark ? 'bg-[#030708]' : 'bg-[#F8F7F7]'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <PageHeader
          title={t('reviewer.title_page', 'Thẩm định Biển báo')}
          subtitle={t('reviewer.subtitle_page', 'Xác thực các biển báo do AI nhận diện từ video/ảnh khảo sát')}
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestAssign}
                disabled={isAssigning}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300'
                    : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800 shadow-xs'
                }`}
                title={t('reviewer.btn_test_assign', 'Nạp test')}
              >
                <Sparkle size={15} className={isAssigning ? 'animate-spin' : ''} />
                <span>{isAssigning ? t('reviewer.btn_test_assigning', 'Đang nạp...') : t('reviewer.btn_test_assign', 'Nạp test')}</span>
              </button>
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
                <span>{t('reviewer.btn_refresh_queue', 'Làm mới')}</span>
              </button>
            </div>
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
                {t('reviewer.queue_progress_label', 'Tiến trình thẩm định:')}{' '}
                <strong className="text-gray-900 dark:text-white">{currentIndex + 1}</strong> / {candidates.length} {t('reviewer.queue_progress_unit', 'biển báo')}
              </span>
              <span className="text-[#007b8b] dark:text-[#00c4de] font-black">
                {Math.round(((currentIndex + 1) / candidates.length) * 100)}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full bg-[#007b8b] dark:bg-[#00c4de] transition-all duration-300 rounded-full"
                style={{ width: `${Math.round(((currentIndex + 1) / candidates.length) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-[#00c4de] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-500 font-medium">
              {t('reviewer.queue_loading', 'Đang tải danh sách biển báo chờ duyệt...')}
            </p>
          </div>
        ) : currentCandidate ? (
          <CandidateWorkspaceCard
            key={currentCandidate.id}
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
            onOpenCatalog={() => setShowCatalogModal(true)}
            onQuickCorrect={handleSelectCorrectedSign}
            onUndo={handleUndo}
            canUndo={sessionHistory.length > 0 && !isSubmitting}
            onOpenGuide={() => setShowGuideModal(true)}
            isSubmitting={isSubmitting}
            submittingAction={submittingAction}
          />
        ) : sessionHistory.length > 0 ? (
          <SubmissionSummaryView
            historyItems={sessionHistory}
            isDark={isDark}
            onNextBatch={handleNextBatch}
            onRecheckSubmission={() => setCurrentIndex(0)}
            onUndoItem={handleUndoSummaryItem}
          />
        ) : (
          <div
            className={`py-16 px-6 text-center rounded-2xl border space-y-4 ${
              isDark ? 'bg-[#071317] border-white/10' : 'bg-white border-gray-200'
            }`}
          >
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {t('reviewer.queue_empty_title', 'Hàng đợi thẩm định đang trống')}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                {t('reviewer.queue_empty_desc', 'Hiện tại không có biển báo nào cần thẩm định. Khi có dữ liệu khảo sát mới được tải lên và phân tích bởi AI, các biển báo sẽ hiển thị tại đây.')}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={handleTestAssign}
                disabled={isAssigning}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300'
                    : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800 shadow-xs'
                }`}
              >
                <Sparkle size={15} className={isAssigning ? 'animate-spin' : ''} />
                <span>{isAssigning ? t('reviewer.btn_test_assigning', 'Đang nạp...') : t('reviewer.btn_test_assign', 'Nạp test')}</span>
              </button>
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
                <span>{t('reviewer.btn_check_queue_again', 'Kiểm tra lại hàng đợi')}</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal: Decline with mobile reasons */}
        {currentCandidate && (
          <DeclineCandidateModal
            isOpen={showDeclineModal}
            onClose={() => !isSubmitting && setShowDeclineModal(false)}
            candidateId={currentCandidate.id}
            signCode={currentCandidate.code}
            isDark={isDark}
            onConfirmDecline={handleConfirmDecline}
            onOpenCatalog={() => setShowCatalogModal(true)}
            isSubmitting={isSubmitting && submittingAction === 'reject'}
          />
        )}

        {/* Modal: QCVN 41 Catalog Picker (Live Backend API) */}
        <ReviewerCatalogModal
          isOpen={showCatalogModal}
          isDark={isDark}
          onClose={() => setShowCatalogModal(false)}
          onSelectSign={handleSelectCorrectedSign}
          onOpenNewSignModal={() => setShowProposeModal(true)}
        />

        {/* Modal: Propose Missing Sign */}
        <ProposeSignModal
          isOpen={showProposeModal}
          onClose={() => setShowProposeModal(false)}
          isDark={isDark}
        />

        {/* Modal: Flag / Report */}
        {currentCandidate && (
          <FlagCandidateModal
            isOpen={showFlagModal}
            onClose={() => !isSubmitting && setShowFlagModal(false)}
            candidateId={currentCandidate.id}
            signCode={currentCandidate.code}
            onConfirmFlag={handleConfirmFlag}
            isSubmitting={isSubmitting && submittingAction === 'flag'}
          />
        )}

        {/* Modal: Review Guide & Hotkeys */}
        <ReviewGuideModal
          isOpen={showGuideModal}
          onClose={() => setShowGuideModal(false)}
          isDark={isDark}
        />
      </div>
    </div>
  )
}

export default CandidateReviewPage

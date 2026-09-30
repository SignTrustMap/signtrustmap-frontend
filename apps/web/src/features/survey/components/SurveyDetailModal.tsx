import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  X,
  MapPin,
  WarningCircle,
  Coins,
  Compass,
  ArrowCounterClockwise,
} from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/common/Modal'
import { SurveyRouteMap } from './SurveyRouteMap'
import { SurveyCandidatesList } from './SurveyCandidatesList'
import { SurveyLivePipelineStepper } from './SurveyLivePipelineStepper'
import { submissionsService } from '@/api/services/submissions.service'
import type { SurveySubmissionItem, ExtractedCandidateItem } from '@/data'
import type { SubmissionStatus } from '@shared/types'

interface SurveyDetailModalProps {
  isOpen: boolean
  onClose: () => void
  submission: SurveySubmissionItem | null
  getStatusBadge: (status: SurveySubmissionItem['status']) => {
    label: string
    bg: string
    icon?: React.ReactNode
  }
}

export function SurveyDetailModal({
  isOpen,
  onClose,
  submission,
  getStatusBadge,
}: SurveyDetailModalProps) {
  const { isDark } = useTheme()
  const { t } = useTranslation('common')
  const [selectedCandidate, setSelectedCandidate] = useState<ExtractedCandidateItem | null>(null)
  const [liveStatus, setLiveStatus] = useState<SubmissionStatus | null>(null)
  const [liveFailureReason, setLiveFailureReason] = useState<string | null>(null)

  // Determine pipeline status
  const currentPipelineStatus: SubmissionStatus =
    liveStatus ||
    (submission?.stage?.toUpperCase() as SubmissionStatus) ||
    (submission?.status === 'Completed'
      ? 'COMPLETED'
      : submission?.status === 'Failed'
      ? 'FAILED'
      : 'DETECTING')

  // Real-time polling when submission is in an active processing state
  useEffect(() => {
    if (!isOpen || !submission?.id) return

    let isMounted = true

    const fetchStatus = async () => {
      try {
        const res = await submissionsService.getSubmissionStatus(submission.id)
        if (isMounted && res?.submission) {
          setLiveStatus(res.submission.status)
          if (res.submission.failureReason) setLiveFailureReason(res.submission.failureReason)
        }
      } catch {
        // Fallback to static props if offline or mock id
      }
    }

    fetchStatus()

    const isProcessing =
      submission.status === 'Processing' ||
      !['COMPLETED', 'FAILED', 'REJECTED'].includes(currentPipelineStatus)

    let interval: ReturnType<typeof setInterval> | null = null
    if (isProcessing) {
      interval = setInterval(fetchStatus, 5000)
    }

    return () => {
      isMounted = false
      if (interval) clearInterval(interval)
    }
  }, [isOpen, submission?.id, submission?.status, currentPipelineStatus])

  if (!submission) return null

  const badge = getStatusBadge(submission.status)

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl" topSpacing="pt-6 sm:pt-10 pb-8 sm:pb-12">
      <div
        className={`rounded-2xl border p-6 sm:p-8 space-y-6 shadow-2xl transition-colors ${
          isDark
            ? 'bg-[#071317] border-white/10 text-gray-100'
            : 'bg-white border-[#E8E4E3] text-gray-900'
        }`}
      >
        {/* ─── Modal Header ────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-200 dark:border-white/10">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                #{submission.id}
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                {submission.uploadDate}
              </span>
              {submission.distanceKm && (
                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  • {submission.distanceKm} km
                </span>
              )}
              {submission.durationSec && (
                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  • {Math.round(submission.durationSec / 60)} {t('survey.unit_minutes')}
                </span>
              )}
              {submission.fileSizeMb && (
                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  • {submission.fileSizeMb} MB
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
              {submission.tripName}
            </h2>

            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1.5 font-medium">
              <MapPin size={15} className="text-[#007b8b] dark:text-[#00c4de] shrink-0" />
              <span>{submission.route}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span
              className={`text-xs font-bold px-3 py-1.5 rounded-full border flex items-center gap-1.5 ${badge.bg}`}
            >
              {badge.icon && <span>{badge.icon}</span>}
              <span>{badge.label}</span>
            </span>

            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isDark
                  ? 'border-white/10 hover:bg-white/10 text-gray-400 hover:text-white'
                  : 'border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-gray-900'
              }`}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ─── Failure Alert Box (if failed) ───────────────────────────── */}
        {submission.status === 'Failed' && (submission.failureReason || liveFailureReason) && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/40 text-red-900 dark:text-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <WarningCircle size={20} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" weight="fill" />
              <div>
                <h5 className="font-bold text-xs sm:text-sm text-red-800 dark:text-red-300">
                  {t('survey.failure_notice_title')}
                </h5>
                <p className="text-xs mt-0.5 leading-relaxed">
                  {liveFailureReason || submission.failureReason}
                </p>
              </div>
            </div>
            <Link
              to="/survey"
              className="px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors"
            >
              <ArrowCounterClockwise size={13} />
              <span>{t('survey.btn_retry_submission')}</span>
            </Link>
          </div>
        )}

        {/* ─── AI Pipeline Monitor ────────────────────────────────────── */}
        <SurveyLivePipelineStepper
          status={currentPipelineStatus}
          isDark={isDark}
          failureReason={liveFailureReason || submission.failureReason}
        />

        {/* ─── Route Trajectory Map ────────────────────────────────────── */}
        {submission.routePoints && submission.routePoints.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400 tracking-wider flex items-center gap-1.5">
                <Compass size={15} className="text-[#007b8b] dark:text-[#00c4de]" />
                <span>{t('survey.map_route_title')}</span>
              </h4>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                {t('survey.map_instruction')}
              </span>
            </div>

            <SurveyRouteMap
              routePoints={submission.routePoints}
              candidates={submission.candidates || []}
              selectedCandidateId={selectedCandidate?.id}
              onSelectCandidate={(cand) => setSelectedCandidate(cand)}
              height="280px"
            />
          </div>
        )}

        {/* ─── Extracted Sign Candidates List ─────────────────────────── */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <span>{t('survey.candidates_title')}</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/60 text-cyan-900 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/40">
                  {submission.candidates?.length || 0} {t('survey.lbl_signs_stat')}
                </span>
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                {t('survey.candidates_subtitle')}
              </p>
            </div>
          </div>

          <SurveyCandidatesList
            candidates={submission.candidates || []}
            selectedCandidateId={selectedCandidate?.id}
            onSelectCandidate={(cand) => setSelectedCandidate(cand)}
            isDark={isDark}
          />
        </div>

        {/* ─── Bottom Summary Row ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-white/10 text-xs">
          <div>
            <span className="text-gray-600 dark:text-gray-400 block mb-0.5 font-medium">
              {t('survey.detected_count')}
            </span>
            <span className="font-extrabold text-base text-[#007b8b] dark:text-[#00c4de]">
              {submission.detectedSignsCount}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400 block mb-0.5 font-medium">
              {t('survey.validated_count')}
            </span>
            <span className="font-extrabold text-base text-emerald-700 dark:text-emerald-400">
              {submission.validatedSignsCount}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400 block mb-0.5 font-medium">
              {t('survey.reward_earned')}
            </span>
            <span className="font-extrabold text-base text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Coins size={16} weight="fill" />
              +{submission.rewardCredits}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400 block mb-0.5 font-medium">
              {t('survey.upload_time')}
            </span>
            <span className="font-bold text-gray-800 dark:text-gray-200">
              {submission.uploadDate}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  )
}

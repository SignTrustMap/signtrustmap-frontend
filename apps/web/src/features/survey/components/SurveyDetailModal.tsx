import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  X,
  MapPin,
  Clock,
  CheckCircle,
  WarningCircle,
  Coins,
  Compass,
  Check,
  CircleNotch,
  ArrowCounterClockwise,
} from '@phosphor-icons/react'
import { useTheme } from '@/context/ThemeContext'
import { useTranslation } from 'react-i18next'
import { Modal } from '@/components/common/Modal'
import { SurveyRouteMap } from './SurveyRouteMap'
import type { SurveySubmissionItem, ExtractedCandidateItem } from '@/data'

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
        {submission.status === 'Failed' && submission.failureReason && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/40 text-red-900 dark:text-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <WarningCircle size={20} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" weight="fill" />
              <div>
                <h5 className="font-bold text-xs sm:text-sm text-red-800 dark:text-red-300">
                  {t('survey.failure_notice_title')}
                </h5>
                <p className="text-xs mt-0.5 leading-relaxed">
                  {submission.failureReason}
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

        {/* ─── 5 Pipeline Stages ───────────────────────────────────────── */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400 tracking-wider">
            {t('survey.pipeline_title')}
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { name: t('survey.pipeline_gps_sync'), done: submission.status !== 'Failed', active: false },
              { name: t('survey.pipeline_yolo'), done: submission.progressPercent >= 40, active: submission.progressPercent < 40 && submission.status === 'Processing' },
              { name: t('survey.pipeline_botsort'), done: submission.progressPercent >= 60, active: submission.progressPercent >= 40 && submission.progressPercent < 60 },
              { name: t('survey.pipeline_gps_pin'), done: submission.progressPercent >= 80, active: submission.progressPercent >= 60 && submission.progressPercent < 80 },
              { name: t('survey.pipeline_clip'), done: submission.status === 'Completed', active: submission.progressPercent >= 80 && submission.status === 'Processing' },
            ].map((step, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                  submission.status === 'Failed' && idx === 0
                    ? isDark ? 'bg-red-900/30 border-red-500/40 text-red-300' : 'bg-red-50 border-red-200 text-red-800'
                    : step.done
                    ? isDark ? 'bg-emerald-900/30 border-emerald-500/40 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : step.active
                    ? isDark ? 'bg-[#00c4de]/20 border-[#00c4de] text-[#00c4de] animate-pulse' : 'bg-[#007b8b]/15 border-[#007b8b] text-[#007b8b]'
                    : isDark ? 'bg-white/5 border-white/10 text-gray-500' : 'bg-gray-100 border-gray-200 text-gray-500'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  {step.done ? (
                    <Check size={13} weight="bold" />
                  ) : step.active ? (
                    <CircleNotch size={13} className="animate-spin" />
                  ) : null}
                  <span className="truncate">{step.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

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

          {submission.candidates && submission.candidates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
              {submission.candidates.map((cand) => {
                const isSelected = selectedCandidate?.id === cand.id

                let catBadgeClass = isDark
                  ? 'bg-red-900/40 text-red-200 border-red-500/50'
                  : 'bg-red-100 text-red-900 border-red-300'
                if (cand.category === 'W') {
                  catBadgeClass = isDark
                    ? 'bg-amber-900/40 text-amber-200 border-amber-500/50'
                    : 'bg-amber-100 text-amber-950 border-amber-300'
                }
                if (cand.category === 'R') {
                  catBadgeClass = isDark
                    ? 'bg-blue-900/40 text-blue-200 border-blue-500/50'
                    : 'bg-blue-100 text-blue-900 border-blue-300'
                }
                if (cand.category === 'I') {
                  catBadgeClass = isDark
                    ? 'bg-cyan-900/40 text-cyan-200 border-cyan-500/50'
                    : 'bg-cyan-100 text-cyan-950 border-cyan-300'
                }

                return (
                  <div
                    key={cand.id}
                    onClick={() => setSelectedCandidate(cand)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? isDark
                          ? 'bg-[#00c4de]/10 border-[#00c4de] ring-1 ring-[#00c4de]'
                          : 'bg-[#007b8b]/10 border-[#007b8b] ring-1 ring-[#007b8b]'
                        : isDark
                        ? 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]'
                        : 'bg-gray-50/70 border-gray-200 hover:bg-gray-100/80'
                    }`}
                  >
                    {/* Header: Code & Review Status */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold border ${catBadgeClass}`}>
                          {cand.signCode}
                        </span>
                        <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
                          #{cand.id}
                        </span>
                      </div>

                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                          cand.reviewStatus === 'Approved'
                            ? isDark
                              ? 'bg-emerald-900/40 text-emerald-200 border-emerald-500/50'
                              : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : cand.reviewStatus === 'Pending'
                            ? isDark
                              ? 'bg-amber-900/40 text-amber-200 border-amber-500/50'
                              : 'bg-amber-100 text-amber-950 border-amber-300'
                            : isDark
                            ? 'bg-red-900/40 text-red-200 border-red-500/50'
                            : 'bg-red-100 text-red-900 border-red-300'
                        }`}
                      >
                        {cand.reviewStatus === 'Approved' ? (
                          <CheckCircle size={12} weight="bold" />
                        ) : cand.reviewStatus === 'Pending' ? (
                          <Clock size={12} />
                        ) : (
                          <WarningCircle size={12} />
                        )}
                        <span>
                          {cand.reviewStatus === 'Approved'
                            ? t('survey.candidate_status_approved')
                            : cand.reviewStatus === 'Pending'
                            ? t('survey.candidate_status_pending')
                            : t('survey.candidate_status_rejected')}
                        </span>
                      </span>
                    </div>

                    {/* Sign Name */}
                    <h5 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1 mb-2">
                      {cand.signName}
                    </h5>

                    {/* Confidence bar */}
                    <div className="space-y-1 mb-2.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">
                          {t('survey.candidate_confidence')}
                        </span>
                        <span className="font-mono font-bold text-[#007b8b] dark:text-[#00c4de]">
                          {Math.round(cand.confidence * 100)}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden bg-gray-200 dark:bg-white/10">
                        <div
                          className="h-full bg-[#007b8b] dark:bg-[#00c4de] rounded-full"
                          style={{ width: `${Math.round(cand.confidence * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-white/10 font-medium">
                      <div>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 block uppercase">
                          {t('survey.candidate_frame')}
                        </span>
                        <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                          {cand.timestampStr}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 block uppercase">
                          {t('survey.candidate_distance')}
                        </span>
                        <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                          {cand.distanceMeters}m
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 block uppercase">
                          {t('survey.candidate_direction')}
                        </span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {cand.trafficDirection}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-8 rounded-xl border border-dashed border-gray-300 dark:border-white/15 text-center text-gray-500 dark:text-gray-400 text-xs">
              {t('survey.candidates_empty')}
            </div>
          )}
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

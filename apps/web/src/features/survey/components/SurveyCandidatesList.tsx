import { CheckCircle, Clock, WarningCircle } from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import type { ExtractedCandidateItem } from '@/data'

interface SurveyCandidatesListProps {
  candidates: ExtractedCandidateItem[]
  selectedCandidateId?: string
  onSelectCandidate: (candidate: ExtractedCandidateItem) => void
  isDark: boolean
}

export function SurveyCandidatesList({
  candidates,
  selectedCandidateId,
  onSelectCandidate,
  isDark,
}: SurveyCandidatesListProps) {
  const { t } = useTranslation('common')

  const getCategoryBadgeClass = (category?: string) => {
    if (category === 'W') {
      return isDark
        ? 'bg-amber-900/40 text-amber-200 border-amber-500/50'
        : 'bg-amber-100 text-amber-950 border-amber-300'
    }
    if (category === 'R') {
      return isDark
        ? 'bg-blue-900/40 text-blue-200 border-blue-500/50'
        : 'bg-blue-100 text-blue-900 border-blue-300'
    }
    if (category === 'I') {
      return isDark
        ? 'bg-cyan-900/40 text-cyan-200 border-cyan-500/50'
        : 'bg-cyan-100 text-cyan-950 border-cyan-300'
    }
    return isDark
      ? 'bg-red-900/40 text-red-200 border-red-500/50'
      : 'bg-red-100 text-red-900 border-red-300'
  }

  const getReviewStatusBadge = (status: ExtractedCandidateItem['reviewStatus']) => {
    if (status === 'Approved') {
      return {
        icon: <CheckCircle size={12} weight="bold" />,
        text: t('survey.candidate_status_approved'),
        cls: isDark
          ? 'bg-emerald-900/40 text-emerald-200 border-emerald-500/50'
          : 'bg-emerald-100 text-emerald-900 border-emerald-300',
      }
    }
    if (status === 'Pending') {
      return {
        icon: <Clock size={12} />,
        text: t('survey.candidate_status_pending'),
        cls: isDark
          ? 'bg-amber-900/40 text-amber-200 border-amber-500/50'
          : 'bg-amber-100 text-amber-950 border-amber-300',
      }
    }
    return {
      icon: <WarningCircle size={12} />,
      text: t('survey.candidate_status_rejected'),
      cls: isDark
        ? 'bg-red-900/40 text-red-200 border-red-500/50'
        : 'bg-red-100 text-red-900 border-red-300',
    }
  }

  if (candidates.length === 0) {
    return (
      <div className="p-8 rounded-xl border border-dashed border-gray-300 dark:border-white/15 text-center text-gray-500 dark:text-gray-400 text-xs">
        {t('survey.candidates_empty')}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
      {candidates.map((cand) => {
        const isSelected = selectedCandidateId === cand.id
        const catBadgeClass = getCategoryBadgeClass(cand.category)
        const reviewBadge = getReviewStatusBadge(cand.reviewStatus)

        return (
          <div
            key={cand.id}
            onClick={() => onSelectCandidate(cand)}
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
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${reviewBadge.cls}`}
              >
                {reviewBadge.icon}
                <span>{reviewBadge.text}</span>
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
                  className="h-full bg-[#007b8b] dark:bg-[#00c4de] rounded-full transition-all"
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
  )
}

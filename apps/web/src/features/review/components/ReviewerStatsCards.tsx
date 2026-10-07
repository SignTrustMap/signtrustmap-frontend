import { useTranslation } from 'react-i18next'
import { ShieldCheck, Sparkle, TrafficSignal, Coins } from '@phosphor-icons/react'
import type { ReviewerMetrics } from '@/data'

interface ReviewerStatsCardsProps {
  stats: ReviewerMetrics
  isDark: boolean
}

export function ReviewerStatsCards({ stats, isDark }: ReviewerStatsCardsProps) {
  const { t } = useTranslation('common')

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div
        className={`p-5 rounded-2xl border ${
          isDark
            ? 'bg-[#071317] border-white/10 shadow-lg shadow-black/40'
            : 'bg-white border-[#E8E4E3] shadow-xs'
        }`}
      >
        <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
          <ShieldCheck size={16} className="text-emerald-500" weight="bold" />
          <span>{t('reviewer.stats_reliability')}</span>
        </span>
        <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
          {stats.reliabilityScore} / 1.00
        </span>
      </div>

      <div
        className={`p-5 rounded-2xl border ${
          isDark
            ? 'bg-[#071317] border-white/10 shadow-lg shadow-black/40'
            : 'bg-white border-[#E8E4E3] shadow-xs'
        }`}
      >
        <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
          <Sparkle size={16} className="text-[#007b8b] dark:text-[#00c4de]" weight="bold" />
          <span>{t('reviewer.stats_accuracy')}</span>
        </span>
        <span className="text-2xl sm:text-3xl font-black text-[#007b8b] dark:text-cyan-400">
          {stats.accuracyPercent}%
        </span>
      </div>

      <div
        className={`p-5 rounded-2xl border ${
          isDark
            ? 'bg-[#071317] border-white/10 shadow-lg shadow-black/40'
            : 'bg-white border-[#E8E4E3] shadow-xs'
        }`}
      >
        <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
          <TrafficSignal size={16} className="text-purple-500" weight="bold" />
          <span>{t('reviewer.stats_total')}</span>
        </span>
        <span className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
          {stats.totalReviewed}
        </span>
      </div>

      <div
        className={`p-5 rounded-2xl border ${
          isDark
            ? 'bg-[#071317] border-white/10 shadow-lg shadow-black/40'
            : 'bg-white border-[#E8E4E3] shadow-xs'
        }`}
      >
        <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
          <Coins size={16} className="text-amber-500" weight="bold" />
          <span>{t('reviewer.stats_rewards')}</span>
        </span>
        <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
          +{stats.creditsEarned} Credits
        </span>
      </div>
    </div>
  )
}
export default ReviewerStatsCards

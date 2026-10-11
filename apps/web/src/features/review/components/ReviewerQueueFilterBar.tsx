import { useTranslation } from 'react-i18next'
import { SlidersHorizontal, Warning, Check } from '@phosphor-icons/react'

export type QueueFilterType = 'all' | 'uncertain' | 'confident' | 'P' | 'W' | 'R'

interface ReviewerQueueFilterBarProps {
  filterMode: QueueFilterType
  totalCandidates: number
  isDark: boolean
  onFilterChange: (mode: QueueFilterType) => void
}

export function ReviewerQueueFilterBar({
  filterMode,
  totalCandidates,
  isDark,
  onFilterChange,
}: ReviewerQueueFilterBarProps) {
  const { t } = useTranslation('common')

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
      <span className="text-gray-600 dark:text-gray-400 font-bold flex items-center gap-1 shrink-0 uppercase tracking-wider text-[11px]">
        <SlidersHorizontal size={14} />
        <span>{t('reviewer.queue_filter_lbl')}</span>
      </span>

      <button
        type="button"
        onClick={() => onFilterChange('all')}
        className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
          filterMode === 'all'
            ? isDark
              ? 'bg-white text-black'
              : 'bg-gray-900 text-white'
            : isDark
            ? 'bg-white/5 text-gray-300 hover:text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        {t('reviewer.filter_all')} ({totalCandidates})
      </button>

      <button
        type="button"
        onClick={() => onFilterChange('uncertain')}
        className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
          filterMode === 'uncertain'
            ? 'bg-amber-500 text-black shadow-xs font-extrabold'
            : isDark
            ? 'bg-white/5 text-amber-300 hover:bg-white/10'
            : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
        }`}
      >
        <Warning size={14} weight="bold" />
        <span>{t('reviewer.filter_uncertain')}</span>
      </button>

      <button
        type="button"
        onClick={() => onFilterChange('confident')}
        className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
          filterMode === 'confident'
            ? 'bg-emerald-600 text-white shadow-xs font-extrabold'
            : isDark
            ? 'bg-white/5 text-emerald-400 hover:bg-white/10'
            : 'bg-emerald-100 text-emerald-950 hover:bg-emerald-200'
        }`}
      >
        <Check size={14} weight="bold" />
        <span>{t('reviewer.filter_confident')}</span>
      </button>

      <button
        type="button"
        onClick={() => onFilterChange('P')}
        className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
          filterMode === 'P'
            ? 'bg-red-500 text-white shadow-xs'
            : isDark
            ? 'bg-white/5 text-red-400 hover:bg-white/10'
            : 'bg-red-100 text-red-900 hover:bg-red-200'
        }`}
      >
        {t('reviewer.filter_p')}
      </button>

      <button
        type="button"
        onClick={() => onFilterChange('W')}
        className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
          filterMode === 'W'
            ? 'bg-amber-500 text-black shadow-xs'
            : isDark
            ? 'bg-white/5 text-amber-400 hover:bg-white/10'
            : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
        }`}
      >
        {t('reviewer.filter_w')}
      </button>

      <button
        type="button"
        onClick={() => onFilterChange('R')}
        className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
          filterMode === 'R'
            ? 'bg-blue-600 text-white shadow-xs'
            : isDark
            ? 'bg-white/5 text-cyan-400 hover:bg-white/10'
            : 'bg-blue-100 text-blue-900 hover:bg-blue-200'
        }`}
      >
        {t('reviewer.filter_r')}
      </button>
    </div>
  )
}
export default ReviewerQueueFilterBar
